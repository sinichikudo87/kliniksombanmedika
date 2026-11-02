import { NextRequest, NextResponse } from 'next/server';
import { getMySqlPool } from '@/lib/mysql-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { kodebooking } = body;

    if (!kodebooking) {
      return NextResponse.json(
        { metadata: { code: 400, message: 'Parameter kodebooking wajib disertakan' } },
        { status: 400 }
      );
    }

    const pool = getMySqlPool();
    const [queueRows]: [any, any] = await pool.query(
      'SELECT * FROM queues WHERE kode_booking = ? OR nomor_antrean = ? LIMIT 1',
      [kodebooking.trim(), kodebooking.trim()]
    );

    if (!queueRows || queueRows.length === 0) {
      return NextResponse.json(
        { metadata: { code: 404, message: `Data antrean dengan kode ${kodebooking} tidak ditemukan di database MySQL` } },
        { status: 404 }
      );
    }

    const q = queueRows[0];

    // Hitung sisa antrean sebelum nomor ini
    const [sisaRows]: [any, any] = await pool.query(
      'SELECT COUNT(*) as sisa FROM queues WHERE poli_kode = ? AND status = "MENUNGGU" AND nomor_urut < ? AND DATE(waktu_daftar) = DATE(?)',
      [q.poli_kode, q.nomor_urut, q.waktu_daftar]
    );

    const [calledRows]: [any, any] = await pool.query(
      'SELECT nomor_antrean FROM queues WHERE poli_kode = ? AND status = "DIPANGGIL" AND DATE(waktu_daftar) = DATE(?) ORDER BY waktu_dipanggil DESC LIMIT 1',
      [q.poli_kode, q.waktu_daftar]
    );

    const sisa = sisaRows[0]?.sisa || 0;
    const panggil = calledRows[0]?.nomor_antrean || '-';

    return NextResponse.json({
      response: {
        nomorantrean: q.nomor_antrean,
        namapoli: q.poli_nama,
        sisaantrean: sisa,
        antreanpanggil: panggil,
        waktutunggu: q.estimasi_waktu_tunggu_menit || (sisa * 10),
        keterangan: q.status === 'SELESAI' ? 'Pelayanan selesai' : (q.status === 'DIPANGGIL' ? 'Sedang dipanggil' : 'Antrean menunggu pelayanan'),
      },
      metadata: {
        code: 200,
        message: 'OK',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ metadata: { code: 500, message: 'MySQL Error: ' + err.message } }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
