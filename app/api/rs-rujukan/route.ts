import { NextRequest, NextResponse } from 'next/server';
import { mySqlDb } from '@/lib/mysql-db';
import { INDONESIA_PROVINCES, ReferralHospital } from '@/lib/indonesia-hospitals';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q') || '';
    const provinsi = req.nextUrl.searchParams.get('provinsi') || 'ALL';

    const result = await mySqlDb.getReferralHospitals(q, provinsi);

    return NextResponse.json({
      success: !result.error,
      source: result.source,
      total: result.hospitals.length,
      hospitals: result.hospitals,
      provinces: INDONESIA_PROVINCES,
      ...(result.error ? { message: result.error } : {}),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Gagal memuat daftar RS Rujukan' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    if (body.action === 'seed') {
      const seedRes = await mySqlDb.seedAllReferralHospitals();
      return NextResponse.json(seedRes, { status: seedRes.success ? 200 : 500 });
    }

    const { kodeFaskes, nama, kelas, jenis, kota, provinsi, alamat, telepon, isBpjs } = body;

    if (!kodeFaskes || !nama || !kota || !provinsi) {
      return NextResponse.json(
        {
          success: false,
          message: 'Kode Faskes, Nama Rumah Sakit, Kota/Kabupaten, dan Provinsi wajib diisi.',
        },
        { status: 400 }
      );
    }

    const validKelas: ReferralHospital['kelas'][] = ['A', 'B', 'C', 'D', 'Khusus'];
    const resolvedKelas = validKelas.includes(kelas) ? kelas : 'B';

    const result = await mySqlDb.addReferralHospital({
      kodeFaskes,
      nama,
      kelas: resolvedKelas,
      jenis: jenis || 'RSUD',
      kota,
      provinsi,
      alamat: alamat || '',
      telepon: telepon || '',
      isBpjs: isBpjs !== false,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Gagal menyimpan RS Rujukan' },
      { status: 500 }
    );
  }
}
