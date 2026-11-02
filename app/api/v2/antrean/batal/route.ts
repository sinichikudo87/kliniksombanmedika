import { NextRequest, NextResponse } from 'next/server';
import { getMySqlPool } from '@/lib/mysql-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { kodebooking, keterangan } = body;

    if (!kodebooking) {
      return NextResponse.json(
        { metadata: { code: 400, message: 'Parameter kodebooking wajib diisi' } },
        { status: 400 }
      );
    }

    const pool = getMySqlPool();
    const [result]: [any, any] = await pool.query(
      'UPDATE queues SET status = "BATAL" WHERE kode_booking = ? OR nomor_antrean = ?',
      [kodebooking.trim(), kodebooking.trim()]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { metadata: { code: 404, message: `Antrean ${kodebooking} tidak ditemukan di MySQL` } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      metadata: {
        code: 200,
        message: 'Antrean Versi 2 Berhasil Dibatalkan di Database MySQL',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ metadata: { code: 500, message: 'MySQL Error: ' + err.message } }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}
