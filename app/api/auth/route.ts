import { NextRequest, NextResponse } from 'next/server';
import { mySqlDb } from '@/lib/mysql-db';

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
    const authResult = await mySqlDb.authenticateUser(username, password);

    if (!authResult.success) {
      return NextResponse.json(
        {
          metadata: {
            code: 401,
            message: authResult.message || 'Username atau Password Web Service Salah',
          },
        },
        { status: 401 }
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
