import { BridgingLog } from '@/types/queue';

export interface BpjsBridgingConfig {
  kdFaskes: string;
  namaFaskes: string;
  jenisBridging: string;
  consId: string;
  secretKey: string;
  userKey: string;
  userPcareDev: string;
  passPcareDev: string;
  emailFaskes: string;
  environment: 'tester' | 'production';
  baseUrl: string;
  isOnline: boolean;
  lastSyncTimestamp: string | null | undefined; // Tambahkan undefined di sini
}

export const DEFAULT_BPJS_CONFIG: BpjsBridgingConfig = {
  kdFaskes: "019U901",
  namaFaskes: "KLINIK SOMBAN MEDIKA",
  jenisBridging: "Antrean Online FKTP (Mobile JKN) & PCare",
  consId: "11495",
  secretKey: "4xHABA0A84",
  userKey: "4a1a84234ffc19f0c77750cebfa2444e",
  userPcareDev: "0195U091-dev",
  passPcareDev: "Dev1234#",
  emailFaskes: "sombanmedika@gmail.com",
  environment: "tester",
  baseUrl: "https://apijkn-dev.bpjs-kesehatan.go.id/antreanfktp_dev",
  isOnline: false,
  lastSyncTimestamp: null,
};

/**
 * Generate HMAC-SHA256 signature as required by BPJS Kesehatan Trustmark specs
 * Signature = Base64(HMAC-SHA256(ConsID + "&" + Timestamp, SecretKey))
 */
export async function generateBpjsSignature(consId: string, secretKey: string, timestamp: string): Promise<string> {
  const message = `${consId}&${timestamp}`;
  const enc = new TextEncoder();

  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    const key = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(secretKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await window.crypto.subtle.sign("HMAC", key, enc.encode(message));
    let binary = "";
    const bytes = new Uint8Array(signature);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Fallback for SSR or non-subtle crypto
  return btoa(`${message}-${secretKey.slice(0, 4)}`);
}

/**
 * Build standard headers for BPJS Bridging API calls
 */
export async function getBpjsHeaders(config: BpjsBridgingConfig = DEFAULT_BPJS_CONFIG): Promise<Record<string, string>> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = await generateBpjsSignature(config.consId, config.secretKey, timestamp);

  return {
    "X-cons-id": config.consId,
    "X-timestamp": timestamp,
    "X-signature": signature,
    "user_key": config.userKey,
    "Content-Type": "Application/json; charset=utf-8",
  };
}

/**
 * Real-time BPJS Participant Verification (Simulated & Bridged)
 */
export async function verifyBpjsParticipant(query: string, config: BpjsBridgingConfig = DEFAULT_BPJS_CONFIG): Promise<{
  success: boolean;
  message: string;
  data?: any;
  bridgingHeaders?: Record<string, string>;
}> {
  const headers = await getBpjsHeaders(config);
  const cleanQuery = query.trim().replace(/\D/g, "");

  // Validates if it's 16 digits (NIK) or 13 digits (No. Kartu BPJS)
  if (cleanQuery.length !== 16 && cleanQuery.length !== 13) {
    return {
      success: false,
      message: "Format nomor tidak valid. Masukkan 16 digit NIK atau 13 digit No. Kartu BPJS.",
      bridgingHeaders: headers,
    };
  }

  try {
    const res = await fetch('/api/bpjs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify_peserta',
        consId: config.consId,
        secretKey: config.secretKey,
        userKey: config.userKey,
        kdFaskes: config.kdFaskes,
        payload: { query: cleanQuery },
      }),
    });

    const json = await res.json();
    if (json.metaData && (json.metaData.code === 200 || json.metaData.code === '200') && json.response?.peserta) {
      const p = json.response.peserta;
      return {
        success: true,
        message: `Peserta BPJS Ditemukan: ${p.nama} (${p.statusPeserta?.keterangan || 'AKTIF'})`,
        data: {
          nik: p.nik,
          noBpjs: p.noKartu,
          nama: p.nama,
          tglLahir: p.tglLahir || '1990-01-01',
          jenisKelamin: p.jenisKelamin || 'L',
          noHp: p.noHp || '',
          alamat: p.alamat || '',
          statusBpjs: p.statusPeserta?.keterangan || 'AKTIF',
          jenisPeserta: p.jenisPeserta || 'Peserta BPJS',
          faskesTingkat1: p.provUmum?.nmProvider || config.namaFaskes,
          kelasRawat: p.kelasRawat || 'Kelas 3',
        },
        bridgingHeaders: json.headers || headers,
      };
    }

    return {
      success: false,
      message: json.metaData?.message || 'Nomor NIK/BPJS tidak ditemukan di basis data pasien MySQL.',
      bridgingHeaders: json.headers || headers,
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Gagal menghubungi server database: ' + (err?.message || 'Koneksi terputus'),
      bridgingHeaders: headers,
    };
  }
}

/**
 * Task ID status mapping as per BPJS Kesehatan Bridging Antrean specification
 */
export const BPJS_TASK_NAMES: Record<number, { name: string; desc: string }> = {
  1: { name: "Check-in / Registrasi", desc: "Pasien hadir di Kios / Admisi Faskes" },
  2: { name: "Panggil Admisi", desc: "Petugas loket pendaftaran memanggil pasien" },
  3: { name: "Selesai Admisi", desc: "Petugas admisi menyelesaikan pendaftaran berkas" },
  4: { name: "Panggil Poli", desc: "Petugas poli memanggil pasien ke ruang periksa" },
  5: { name: "Mulai Pelayanan Poli", desc: "Dokter mulai memeriksa pasien" },
  6: { name: "Selesai Pelayanan Poli", desc: "Dokter selesai memeriksa pasien / terbit resep" },
  7: { name: "Selesai Farmasi / Pulang", desc: "Pasien menerima obat dari apotek dan pulang" },
};