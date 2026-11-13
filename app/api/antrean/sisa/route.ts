import { NextRequest, NextResponse } from 'next/server';
import { getMySqlPool } from '@/lib/mysql-db';

async function handleSisa(kodebooking?: string | null) {
  try {
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
        { metadata: { code: 404, message: `Data antrean dengan kode ${kodebooking} tidak ditemukan` } },
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
        id: q.id,
        nomorantrean: q.nomor_antrean,
        prefix: q.prefix,
        nomorurut: q.nomor_urut,
        tipepasien: q.tipe_pasien,
        kodepoli: q.poli_kode,
        namapoli: q.poli_nama,
        namadokter: q.dokter_nama || '',
        ruang: q.ruang_nama || '',
        patientid: q.patient_id || '',
        nik: q.nik || '',
        nomorkartu: q.no_bpjs || '',
        namapasien: q.nama_pasien || '',
        status: q.status,
        waktudaftar: q.waktu_daftar,
        estimasi_jam_panggil: q.estimasi_jam_panggil || '',
        bpjs_task_id: q.bpjs_task_id || 1,
        kodebooking: q.kode_booking || '',
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
    return NextResponse.json({ metadata: { code: 500, message: 'Server Error: ' + err.message } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return handleSisa(body.kodebooking);
}

export async function GET(req: NextRequest) {
  const kodebooking = req.nextUrl.searchParams.get('kodebooking');
  return handleSisa(kodebooking);
}
