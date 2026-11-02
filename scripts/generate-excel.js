const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Ensure downloads directory exists
const downloadsDir = path.join(__dirname, '../public/downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// 1. Data sesuai format BPJS Kesehatan (Image 2)
const wsData = [
  ['URL WS FKTP Production Bridging Antrean Online Versi 2'],
  [],
  [
    'No',
    'Kode FKTP',
    'Nama FKTP',
    'Nama PIC FKTP',
    'No HP PIC',
    'Nama Vendor /Pengembang sistem informasi',
    'Kepwil',
    'Kantor Cabang',
    'Jenis Method',
    'URL WS FKTP Production',
    'User Production',
    'Password Production',
  ],
  [
    1,
    '019U901',
    'KLINIK SOMBAN MEDIKA',
    'Dedy Angga Kurniawan',
    '881036959865',
    'Dedy Angga Kurniawan',
    'Jawa Timur',
    'Sidoarjo',
    'Token',
    'https://kliniksombanmedika.id/api/auth',
    'admin',
    'admin123',
  ],
  [
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Status Antrean',
    'https://kliniksombanmedika.id/api/antrean/status',
    '',
    '',
  ],
  [
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Ambil Antrean',
    'https://kliniksombanmedika.id/api/antrean/ambil',
    '',
    '',
  ],
  [
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Sisa Antrean',
    'https://kliniksombanmedika.id/api/antrean/sisa',
    '',
    '',
  ],
  [
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Pasien Baru',
    'https://kliniksombanmedika.id/api/pasien/baru',
    '',
    '',
  ],
  [
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Batal Antrean',
    'https://kliniksombanmedika.id/api/antrean/batal',
    '',
    '',
  ],
  [
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Ambil Antrean V2',
    'https://kliniksombanmedika.id/api/v2/antrean/ambil',
    '',
    '',
  ],
  [
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Status Antrean V2',
    'https://kliniksombanmedika.id/api/v2/antrean/status',
    '',
    '',
  ],
  [
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Batal Antrean V2',
    'https://kliniksombanmedika.id/api/v2/antrean/batal',
    '',
    '',
  ],
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(wsData);

// Set merges (A4:A12, B4:B12, etc.)
// Row indices are 0-indexed: Row 4 is index 3, Row 12 is index 11
ws['!merges'] = [
  // Title A1:L1
  { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
  // No (A4:A12)
  { s: { r: 3, c: 0 }, e: { r: 11, c: 0 } },
  // Kode FKTP (B4:B12)
  { s: { r: 3, c: 1 }, e: { r: 11, c: 1 } },
  // Nama FKTP (C4:C12)
  { s: { r: 3, c: 2 }, e: { r: 11, c: 2 } },
  // Nama PIC (D4:D12)
  { s: { r: 3, c: 3 }, e: { r: 11, c: 3 } },
  // No HP PIC (E4:E12)
  { s: { r: 3, c: 4 }, e: { r: 11, c: 4 } },
  // Nama Vendor (F4:F12)
  { s: { r: 3, c: 5 }, e: { r: 11, c: 5 } },
  // Kepwil (G4:G12)
  { s: { r: 3, c: 6 }, e: { r: 11, c: 6 } },
  // Kantor Cabang (H4:H12)
  { s: { r: 3, c: 7 }, e: { r: 11, c: 7 } },
  // User Production (K4:K12)
  { s: { r: 3, c: 10 }, e: { r: 11, c: 10 } },
  // Password Production (L4:L12)
  { s: { r: 3, c: 11 }, e: { r: 11, c: 11 } },
];

// Set column widths
ws['!cols'] = [
  { wch: 6 },  // No
  { wch: 14 }, // Kode FKTP
  { wch: 26 }, // Nama FKTP
  { wch: 25 }, // Nama PIC FKTP
  { wch: 16 }, // No HP PIC
  { wch: 26 }, // Nama Vendor
  { wch: 15 }, // Kepwil
  { wch: 18 }, // Kantor Cabang
  { wch: 22 }, // Jenis Method
  { wch: 60 }, // URL WS FKTP Production
  { wch: 18 }, // User Production
  { wch: 22 }, // Password Production
];

XLSX.utils.book_append_sheet(wb, ws, 'Formulir WS FKTP BPJS');

// Sheet 2: Rincian Teknis Endpoint & HTTP Method
const detailData = [
  ['DOKUMENTASI RINCIAN TEKNIS ENDPOINT WS FKTP BPJS KESEHATAN (ANTREAN ONLINE V2)'],
  ['Faskes: KLINIK SOMBAN MEDIKA | Kode: 019U901 | KC: Sidoarjo'],
  [],
  [
    'No',
    'Jenis Method BPJS',
    'HTTP Method',
    'Endpoint URL Production',
    'Header Autentikasi',
    'Format Request / Body',
    'Format Response',
    'Keterangan Fungsi',
  ],
  [
    1,
    'Token',
    'GET / POST',
    'https://kliniksombanmedika.id/api/auth',
    'x-username, x-password',
    'None (via Header)',
    '{"response": {"token": "eyJhbGci..."}, "metadata": {"code": 200, "message": "OK"}}',
    'Menghasilkan token otorisasi sementara untuk pemanggilan web service berikutnya oleh server BPJS.',
  ],
  [
    2,
    'Status Antrean',
    'POST',
    'https://kliniksombanmedika.id/api/antrean/status',
    'x-token, x-username',
    '{"kodepoli": "001", "tanggalperiksa": "2026-10-27"}',
    '{"response": {"namapoli": "POLI UMUM", "totalantrean": 25, "sisaantrean": 8, "antreanpanggil": "A-17"}, "metadata": {"code": 200, "message": "OK"}}',
    'Mengecek status dan rekapitulasi antrean di poli pada tanggal tertentu.',
  ],
  [
    3,
    'Ambil Antrean',
    'POST',
    'https://kliniksombanmedika.id/api/antrean/ambil',
    'x-token, x-username',
    '{"nomorkartu": "0001234567890", "nik": "351508...", "kodepoli": "001", "tanggalperiksa": "2026-10-27", "keluhan": "Demam"}',
    '{"response": {"nomorantrean": "A-18", "angkaantrean": 18, "kodebooking": "BK202610270018", "estimasidilayani": 1729990000000}, "metadata": {"code": 200, "message": "OK"}}',
    'Pendaftaran antrean dari Mobile JKN ke SIM FKTP versi 1.',
  ],
  [
    4,
    'Sisa Antrean',
    'POST',
    'https://kliniksombanmedika.id/api/antrean/sisa',
    'x-token, x-username',
    '{"kodebooking": "BK202610270018"}',
    '{"response": {"nomorantrean": "A-18", "namapoli": "POLI UMUM", "sisaantrean": 3, "antreanpanggil": "A-15", "waktutunggu": 45}, "metadata": {"code": 200, "message": "OK"}}',
    'Melihat sisa antrean di depan pasien dan estimasi waktu tunggu.',
  ],
  [
    5,
    'Pasien Baru',
    'POST',
    'https://kliniksombanmedika.id/api/pasien/baru',
    'x-token, x-username',
    '{"nik": "351508...", "nomorkartu": "0001234567890", "nama": "BUDI SANTOSO", "nohp": "08123456789", "alamat": "Sidoarjo"}',
    '{"response": {"norm": "RM-2026-0982"}, "metadata": {"code": 200, "message": "Data Pasien Berhasil Ditambahkan"}}',
    'Mendaftarkan rekam medis pasien baru yang belum pernah terdaftar di FKTP.',
  ],
  [
    6,
    'Batal Antrean',
    'POST',
    'https://kliniksombanmedika.id/api/antrean/batal',
    'x-token, x-username',
    '{"kodebooking": "BK202610270018", "keterangan": "Terjadi halangan mendadak"}',
    '{"metadata": {"code": 200, "message": "Antrean Berhasil Dibatalkan"}}',
    'Membatalkan nomor antrean pasien versi 1 dan melepaskan kuota.',
  ],
  [
    7,
    'Ambil Antrean V2',
    'POST',
    'https://kliniksombanmedika.id/api/v2/antrean/ambil',
    'x-token, x-username',
    '{"nomorkartu": "0001234567890", "nik": "351508...", "nohp": "08123456789", "kodepoli": "001", "norm": "RM-0123", "tanggalperiksa": "2026-10-27", "kodedokter": "D-01", "jampraktek": "08:00-12:00", "jeniskunjungan": 1, "nomorreferensi": ""}',
    '{"response": {"nomorantrean": "A-18", "angkaantrean": 18, "kodebooking": "BK202610270018", "norm": "RM-0123", "namapoli": "POLI UMUM", "namadokter": "dr. Machmujur", "estimasidilayani": 1729990000000, "sisakuotajkn": 12, "kuotajkn": 30, "sisakuotanonjkn": 10, "kuotanonjkn": 20, "keterangan": "Peserta harap hadir 15 menit sebelum estimasi"}, "metadata": {"code": 200, "message": "OK"}}',
    'Ambil antrean spesifikasi Versi 2 (dilengkapi kode dokter HFIS, jam praktek, kuota JKN & non-JKN).',
  ],
  [
    8,
    'Status Antrean V2',
    'POST',
    'https://kliniksombanmedika.id/api/v2/antrean/status',
    'x-token, x-username',
    '{"kodepoli": "001", "kodedokter": "D-01", "tanggalperiksa": "2026-10-27", "jampraktek": "08:00-12:00"}',
    '{"response": {"namapoli": "POLI UMUM", "namadokter": "dr. Machmujur", "totalantrean": 25, "sisaantrean": 8, "antreanpanggil": "A-17", "sisakuotajkn": 12, "kuotajkn": 30, "sisakuotanonjkn": 10, "kuotanonjkn": 20, "keterangan": "Pelayanan sedang berlangsung"}, "metadata": {"code": 200, "message": "OK"}}',
    'Cek status antrean spesifikasi Versi 2 per dokter & jam praktik.',
  ],
  [
    9,
    'Batal Antrean V2',
    'POST',
    'https://kliniksombanmedika.id/api/v2/antrean/batal',
    'x-token, x-username',
    '{"kodebooking": "BK202610270018", "keterangan": "Pasien batal hadir"}',
    '{"metadata": {"code": 200, "message": "Antrean Versi 2 Berhasil Dibatalkan"}}',
    'Pembatalan antrean spesifikasi Versi 2 terintegrasi pengembalian kuota HFIS & Task ID.',
  ],
];

const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
wsDetail['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
  { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
];
wsDetail['!cols'] = [
  { wch: 6 },  // No
  { wch: 22 }, // Jenis Method
  { wch: 14 }, // HTTP Method
  { wch: 55 }, // Endpoint URL
  { wch: 24 }, // Header
  { wch: 50 }, // Request
  { wch: 55 }, // Response
  { wch: 50 }, // Keterangan
];

XLSX.utils.book_append_sheet(wb, wsDetail, 'Rincian Teknis API & Method');

const outputPath = path.join(downloadsDir, 'URL_WS_FKTP_Production_Bridging_Antrean_Online_V2.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('Excel file created successfully at:', outputPath);
