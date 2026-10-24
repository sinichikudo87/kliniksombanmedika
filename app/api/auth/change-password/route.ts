import { NextRequest, NextResponse } from 'next/server';
import { mySqlDb } from '@/lib/mysql-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, oldPassword, newPassword } = body;

    if (!username || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Username dan password baru wajib diisi' },
        { status: 400 }
      );
    }

    if (newPassword.trim().length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password baru minimal 6 karakter' },
        { status: 400 }
      );
    }

    if (newPassword.trim() === '000000') {
      return NextResponse.json(
        { success: false, message: 'Password baru tidak boleh menggunakan password default (000000)' },
        { status: 400 }
      );
    }

    const result = await mySqlDb.changePassword(
      username.trim(),
      oldPassword ? oldPassword.trim() : '000000',
      newPassword.trim()
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      user: result.user,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengubah password' },
      { status: 500 }
    );
  }
}
