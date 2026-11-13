import { NextResponse } from 'next/server';
import { mySqlDb } from '@/lib/mysql-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await mySqlDb.getPcareVisits();
  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        source: result.source,
        visits: [],
        message: result.error || 'Gagal memuat riwayat kunjungan PCare dari database MySQL',
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    source: result.source,
    visits: result.visits,
  });
}
