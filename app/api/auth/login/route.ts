import { NextRequest, NextResponse } from 'next/server';
import { mySqlDb } from '@/lib/mysql-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    const authResult = await mySqlDb.authenticateUser(username, password);

    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: authResult.message,
          source: authResult.source,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: authResult.message,
      user: authResult.user,
      source: authResult.source,
      loginTime: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Terjadi kesalahan sistem autentikasi' },
      { status: 500 }
    );
  }
}
