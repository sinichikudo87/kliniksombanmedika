import { NextRequest, NextResponse } from 'next/server';
import { getMySqlPool } from '@/lib/mysql-db';

async function handleStatus(kodepoli?: string | null, tanggalperiksa?: string | null) {
  try {
    const tgl = tanggalperiksa || new Date().toISOString().split('T')[0];
    const pool = getMySqlPool();

    // Query poli dari MySQL
    let namaPoli = '';
    if (kodepoli) {
      const [poliRows]: [any, any] = await pool.query(
        'SELECT nama FROM poliklinik WHERE kode = ? OR prefix = ? LIMIT 1',
        [kodepoli, kodepoli]
      );
      if (poliRows && poliRows.length > 0) {
        namaPoli = poliRows[0].nama;
      }
    }

    // Query total dan sisa antrean hari ini dari tabel queues MySQL
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
        totalantrean: totalAntrean,
        sisaantrean: sisaAntrean,
        antreanpanggil: antreanPanggil,
        tanggalperiksa: tgl,
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
  return handleStatus(body.kodepoli, body.tanggalperiksa);
}

export async function GET(req: NextRequest) {
  const kodepoli = req.nextUrl.searchParams.get('kodepoli');
  const tanggalperiksa = req.nextUrl.searchParams.get('tanggalperiksa');
  return handleStatus(kodepoli, tanggalperiksa);
}
