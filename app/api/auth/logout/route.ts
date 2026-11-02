import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('tpmd_session_username');
    return NextResponse.json({ success: true, message: 'Logout berhasil' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal logout' },
      { status: 500 }
    );
  }
}
