import { NextRequest, NextResponse } from 'next/server';
import { getMySqlPool } from '@/lib/mysql-db';

export async function GET(req: NextRequest) {
  const username = req.headers.get('x-username');
  const password = req.headers.get('x-password');

  if (!username || !password) {
    return NextResponse.json(
      {
        metadata: {
          code: 401,
          message: 'Header x-username dan x-password wajib disertakan',
        },
      },
      { status: 401 }
    );
  }

  try {
    const pool = getMySqlPool();
    const [rows]: [any, any] = await pool.query(
      'SELECT id, username, password_hash, is_active FROM users WHERE username = ? LIMIT 1',
      [username.trim()]
    );

    if (!rows || rows.length === 0 || rows[0].password_hash !== password.trim()) {
      return NextResponse.json(
        {
          metadata: {
            code: 401,
            message: 'Username atau Password Web Service Salah di Database MySQL',
          },
        },
        { status: 401 }
      );
    }

    if (!rows[0].is_active) {
      return NextResponse.json(
        {
          metadata: {
            code: 403,
            message: 'Akun user faskes berstatus non-aktif di MySQL',
          },
        },
        { status: 403 }
      );
    }

    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sombanmedika_${Date.now()}`;

    return NextResponse.json({
      response: {
        token,
      },
      metadata: {
        code: 200,
        message: 'OK',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        metadata: {
          code: 500,
          message: 'Gagal verifikasi kredensial di database MySQL: ' + err.message,
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
