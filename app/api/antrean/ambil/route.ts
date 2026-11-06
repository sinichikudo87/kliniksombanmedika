import { NextRequest, NextResponse } from 'next/server';
import { getMySqlPool } from '@/lib/mysql-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      nomorkartu,
      nik,
      kodepoli = 'UMU',
      keluhan,
    } = body;

    if (!nik && !nomorkartu) {
      return NextResponse.json(
        { metadata: { code: 400, message: 'Nomor NIK atau No. Kartu BPJS wajib diisi' } },
        { status: 400 }
      );
    }

    const pool = getMySqlPool();

    // 1. Ambil data pasien dari tabel patients MySQL
    const [patientRows]: [any, any] = await pool.query(
      'SELECT * FROM patients WHERE nik = ? OR no_bpjs = ? LIMIT 1',
      [nik || '', nomorkartu || '']
    );

    if (!patientRows || patientRows.length === 0) {
      return NextResponse.json(
        {
          metadata: {
            code: 404,
            message: 'Pasien belum terdaftar di faskes. Silakan lakukan pendaftaran pasien baru terlebih dahulu.',
          },
        },
        { status: 404 }
      );
    }

    const patient = patientRows[0];

    // 2. Ambil data poliklinik dari MySQL
    const [poliRows]: [any, any] = await pool.query(
      'SELECT * FROM poliklinik WHERE kode = ? OR prefix = ? LIMIT 1',
      [kodepoli, kodepoli]
    );

    const poli = poliRows && poliRows.length > 0 ? poliRows[0] : {
      kode: kodepoli,
      nama: 'Poli Umum',
      prefix: 'A',
      dokter_nama: 'Dokter Faskes',
      ruang: 'Ruang 01',
      kuota_total: 50,
      kuota_terpakai: 0,
      durasi_rata_rata_menit: 10,
    };

    // 3. Hitung nomor urut antrean hari ini untuk poli ini
    const todayStr = new Date().toISOString().split('T')[0];
    const [countRows]: [any, any] = await pool.query(
      'SELECT COUNT(*) as total FROM queues WHERE poli_kode = ? AND DATE(waktu_daftar) = ?',
      [poli.kode, todayStr]
    );

    const nomorUrut = (countRows[0]?.total || 0) + 1;
    const prefix = poli.prefix || 'A';
    const ticketNo = `${prefix}-${String(nomorUrut).padStart(3, '0')}`;
    const bookingCode = `BK${todayStr.replace(/-/g, '')}${String(nomorUrut).padStart(4, '0')}`;
    const queueId = `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 4. Masukkan ke tabel queues MySQL
    await pool.query(
      `INSERT INTO queues (
        id, nomor_antrean, prefix, nomor_urut, tipe_pasien, poli_kode, poli_nama,
        dokter_nama, ruang_nama, patient_id, nik, no_bpjs, nama_pasien, status,
        waktu_daftar, estimasi_waktu_tunggu_menit, kode_booking, keluhan, is_synced_bpjs
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'MENUNGGU', NOW(), ?, ?, ?, 1)`,
      [
        queueId,
        ticketNo,
        prefix,
        nomorUrut,
        patient.no_bpjs ? 'BPJS' : 'UMUM',
        poli.kode,
        poli.nama,
        poli.dokter_nama || '',
        poli.ruang || '',
        patient.id,
        patient.nik,
        patient.no_bpjs || '',
        patient.nama,
        (nomorUrut - 1) * (poli.durasi_rata_rata_menit || 10),
        bookingCode,
        keluhan || '',
      ]
    );

    // Update kuota terpakai di tabel poliklinik
    await pool.query(
      'UPDATE poliklinik SET kuota_terpakai = kuota_terpakai + 1 WHERE kode = ?',
      [poli.kode]
    );

    return NextResponse.json({
      response: {
        nomorantrean: ticketNo,
        angkaantrean: nomorUrut,
        kodebooking: bookingCode,
        norm: patient.id,
        namapoli: poli.nama,
        estimasidilayani: Date.now() + ((nomorUrut - 1) * (poli.durasi_rata_rata_menit || 10)) * 60 * 1000,
        sisakuotajkn: Math.max(0, (poli.kuota_total || 50) - (poli.kuota_terpakai || 0) - 1),
        kuotajkn: poli.kuota_total || 50,
        sisakuotanonjkn: 20,
        kuotanonjkn: 20,
        keterangan: 'Nomor antrean berhasil diterbitkan.',
      },
      metadata: {
        code: 200,
        message: 'OK',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ metadata: { code: 500, message: 'Server Error: ' + err.message } }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
