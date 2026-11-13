import { NextRequest, NextResponse } from 'next/server';
import { getMySqlPool } from '@/lib/mysql-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { nik, nomorkartu, nama, nohp, alamat, jeniskelamin = 'L', tgllahir = null } = body;

    if (!nik && !nomorkartu) {
      return NextResponse.json(
        { metadata: { code: 400, message: 'Nomor NIK atau No. Kartu BPJS wajib diisi' } },
        { status: 400 }
      );
    }

    if (!nama || !nama.trim()) {
      return NextResponse.json(
        { metadata: { code: 400, message: 'Nama pasien wajib diisi' } },
        { status: 400 }
      );
    }

    const pool = getMySqlPool();

    // Cek apakah sudah terdaftar
    const [existing]: [any, any] = await pool.query(
      'SELECT id, nik, no_bpjs, nama FROM patients WHERE nik = ? OR (no_bpjs = ? AND no_bpjs != "") LIMIT 1',
      [nik || '', nomorkartu || '']
    );

    if (existing && existing.length > 0) {
      return NextResponse.json({
        response: {
          norm: existing[0].id,
          nama: existing[0].nama,
          nik: existing[0].nik,
          nomorkartu: existing[0].no_bpjs,
        },
        metadata: {
          code: 200,
          message: 'Pasien sudah terdaftar di sistem faskes',
        },
      });
    }

    const patientId = `RM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const [cfgRows]: [any, any] = await pool.query('SELECT nama_faskes FROM faskes_config LIMIT 1').catch(() => [[], []]);
    const faskesName = cfgRows?.[0]?.nama_faskes || '';

    await pool.query(
      `INSERT INTO patients (
        id, nik, no_bpjs, nama, tgl_lahir, jenis_kelamin, no_hp, alamat,
        status_bpjs, jenis_peserta, faskes_tingkat_1, kelas_rawat
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'AKTIF', ?, ?, '')`,
      [
        patientId,
        nik || `NIK-${Date.now()}`,
        nomorkartu || null,
        nama.trim(),
        tgllahir || null,
        jeniskelamin,
        nohp || '',
        alamat || '',
        nomorkartu ? 'Peserta BPJS' : 'Pasien Umum',
        faskesName,
      ]
    );

    return NextResponse.json({
      response: {
        norm: patientId,
        nama: nama.trim(),
        nik: nik || '',
        nomorkartu: nomorkartu || '',
      },
      metadata: {
        code: 200,
        message: 'Data Pasien Baru Berhasil Disimpan',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ metadata: { code: 500, message: 'Server Error: ' + err.message } }, { status: 500 });
  }
}
