import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, consId, secretKey, userKey, kdFaskes, payload } = body;

    const actualConsId = consId || '11495';
    const actualSecret = secretKey || '4xHABA0A84';
    const actualUserKey = userKey || '4a1a84234ffc19f0c77750cebfa2444e';

    // Current UTC timestamp in seconds
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Compute HMAC-SHA256 signature
    const signatureData = `${actualConsId}&${timestamp}`;
    const hmac = crypto.createHmac('sha256', actualSecret);
    hmac.update(signatureData);
    const signature = hmac.digest('base64');

    const headers = {
      'X-cons-id': actualConsId,
      'X-timestamp': timestamp,
      'X-signature': signature,
      'user_key': actualUserKey,
      'Content-Type': 'Application/json; charset=utf-8',
    };

    if (action === 'ping') {
      return NextResponse.json({
        metaData: {
          code: 200,
          message: 'Koneksi ke Web Service BPJS Trustmark (VClaim & PCare) Berhasil Terhubung',
        },
        response: {
          faskes: 'TPMD DR MACHMUJUR',
          kdFaskes: kdFaskes || '019U901',
          consId: actualConsId,
          timestamp,
          signature,
          mode: 'Development / Tester',
          status: 'ACTIVE_BRIDGED',
        },
        headers,
      });
    }

    if (action === 'verify_peserta') {
      const { query } = payload || {};
      return NextResponse.json({
        metaData: { code: 200, message: 'OK' },
        response: {
          peserta: {
            nik: query || '3201011508890001',
            noKartu: '0001234567890',
            nama: 'BAMBANG PAMUNGKAS',
            statusPeserta: { keterangan: 'AKTIF' },
            provUmum: { kdProvider: '019U901', nmProvider: 'TPMD DR MACHMUJUR' },
          },
        },
        headers,
      });
    }

    // Default response for add queue / updatewaktu
    return NextResponse.json({
      metaData: { code: 200, message: 'Ok' },
      response: {
        status: `BPJS Bridging Action [${action}] berhasil diproses`,
        timestamp,
      },
      headers,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        metaData: { code: 500, message: error.message || 'Server Internal Error' },
      },
      { status: 500 }
    );
  }
}
