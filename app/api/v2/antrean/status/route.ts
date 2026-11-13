import { NextRequest, NextResponse } from 'next/server';
import { getMySqlPool } from '@/lib/mysql-db';

async function handleStatusV2(kodepoli?: string | null, tanggalperiksa?: string | null) {
  try {
    const tgl = tanggalperiksa || new Date().toISOString().split('T')[0];
    const pool = getMySqlPool();

    // Query data poli dari MySQL
    let namaPoli = 'POLI UMUM';
    let namaDokter = 'dr. Machmujur, M.Kes';
    let kuotaTotal = 50;
    let kuotaTerpakai = 0;

    const [poliRows]: [any, any] = await pool.query(
      'SELECT * FROM poliklinik WHERE kode = ? OR prefix = ? LIMIT 1',
      [kodepoli || 'UMU', kodepoli || 'UMU']
    );

    if (poliRows && poliRows.length > 0) {
      namaPoli = poliRows[0].nama;
      namaDokter = poliRows[0].dokter_nama || namaDokter;
      kuotaTotal = poliRows[0].kuota_total || 50;
      kuotaTerpakai = poliRows[0].kuota_terpakai || 0;
    }

    // Query antrean hari ini di MySQL
    const [totalRows]: [any, any] = await pool.query(
      'SELECT COUNT(*) as total FROM queues WHERE (poli_kode = ? OR ? IS NULL) AND DATE(waktu_daftar) = ?',
      [kodepoli || null, kodepoli || null, tgl]
    );

    const [sisaRows]: [any, any] = await pool.query(
      'SELECT COUNT(*) as sisa FROM queues WHERE (poli_kode = ? OR ? IS NULL) AND DATE(waktu_daftar) = ? AND status = "MENUNGGU"',
      [kodepoli || null, kodepoli || null, tgl]
    );

    const [calledRows]: [any, any] = await pool.query(
      'SELECT nomor_antrean FROM queues WHERE (poli_kode = ? OR ? IS NULL) AND DATE(waktu_daftar) = ? AND status = "DIPANGGIL" ORDER BY waktu_dipanggil DESC LIMIT 1',
      [kodepoli || null, kodepoli || null, tgl]
    );

    const totalAntrean = totalRows[0]?.total || 0;
    const sisaAntrean = sisaRows[0]?.sisa || 0;
    const antreanPanggil = calledRows[0]?.nomor_antrean || '-';

    return NextResponse.json({
      response: {
        namapoli: namaPoli,
        namadokter: namaDokter,
        totalantrean: totalAntrean,
        sisaantrean: sisaAntrean,
        antreanpanggil: antreanPanggil,
        sisakuotajkn: Math.max(0, kuotaTotal - kuotaTerpakai),
        kuotajkn: kuotaTotal,
        sisakuotanonjkn: 20,
        kuotanonjkn: 20,
        keterangan: 'Pelayanan poli terhubung aktif',
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

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return handleStatusV2(body.kodepoli, body.tanggalperiksa);
}

export async function GET(req: NextRequest) {
  const kodepoli = req.nextUrl.searchParams.get('kodepoli');
  const tanggalperiksa = req.nextUrl.searchParams.get('tanggalperiksa');
  return handleStatusV2(kodepoli, tanggalperiksa);
}
