import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { mySqlDb } from '@/lib/mysql-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('tpmd_session_username');
    const username = sessionCookie?.value;

    if (!username) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const users = await mySqlDb.getUsers();
    const user = users?.find(
      (u: any) => u.username.toLowerCase() === username.toLowerCase()
    );

    if (!user || user.is_active === false || user.isActive === false) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        namaLengkap: user.nama_lengkap || user.namaLengkap,
        role: user.role,
        nip: user.nip,
        kdFaskes: user.kd_faskes || user.kdFaskes,
        isActive: user.is_active ?? user.isActive ?? true,
        mustChangePassword: user.must_change_password ?? user.mustChangePassword ?? false,
      },
      source: 'MYSQL',
    });
  } catch (error: any) {
    return NextResponse.json(
      { authenticated: false, error: error.message || 'Error checking session' },
      { status: 500 }
    );
  }
}
