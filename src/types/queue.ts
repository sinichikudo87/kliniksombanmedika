export type KategoriAntrean = 'BPJS' | 'UMUM' | 'PRIORITAS' | 'FARMASI';

export type StatusTiket = 'MENUNGGU' | 'DIPANGGIL' | 'SEDANG_DILAYANI' | 'SELESAI' | 'BATAL';

export interface QueueTicket {
  id: string;
  nomorAntrean: string; // e.g. A-001, B-002, P-001, F-003
  huruf: string;        // 'A' | 'B' | 'P' | 'F'
  angka: number;        // 1, 2, 3...
  kategori: KategoriAntrean;
  poliTujuan: string;   // e.g. 'Poli Penyakit Dalam', 'Admisi BPJS'
  kodePoli: string;     // e.g. 'INT', 'ADM', 'GIG', 'FAR'
  dokterNama: string;
  namaPasien: string;
  noKartuBPJS: string;  // 13 digit
  nik: string;          // 16 digit
  nomorRM: string;      // Rekam medis, e.g. 'RM-09281'
  kodeBooking: string;  // e.g. 'BK-20261006-004'
  loketDipanggil?: string; // e.g. 'Loket 1', 'Poli Penyakit Dalam - R.03'
  status: StatusTiket;
  waktuAmbil: string;   // ISO timestamp
  waktuPanggil?: string;
  waktuMulaiLayan?: string;
  waktuSelesai?: string;
  taskIdBpjs: number;   // 1 to 7 according to BPJS Antrean RS v2
  estimasiDilayani?: string;
}

export interface LoketItem {
  id: string;
  nama: string;         // 'Loket 1 - Admisi & SEP', 'Loket 2 - Pendaftaran Umum', 'Poli Penyakit Dalam', etc.
  kode: string;         // 'LOKET-1', 'LOKET-2', 'POLI-INT', 'POLI-GIG', 'FARMASI'
  tipe: 'ADMISI' | 'POLI' | 'FARMASI';
  kategoriHuruf: string[]; // ['A', 'P'] or ['B'] or ['F']
  petugas: string;
  ruang?: string;
  currentTicketId?: string;
}

export interface BPJSConfig {
  baseUrl: string;
  consId: string;
  secretKey: string;
  userKey: string;
  kodePPK: string;
  namaFaskes: string;
  isSandbox: boolean;
  autoSyncBpjs: boolean;
  // PCare FKTP (Eclaim) Credentials & Metadata
  jenisBridging?: string;      // 'Pcare (Eclaim)'
  jenisCid?: string;           // 'Tester'
  cidTesterProd?: string;      // 'Tester'
  userPcare?: string;          // '0195U091-dev'
  passPcare?: string;          // 'Dev1234#'
  emailFaskes?: string;        // 'praktekdokter91@gmail.com'
  pengembanganVendor?: string; // 'Pengembangan sendiri'
  kdAplikasi?: string;         // '095'
}

export interface BridgingLog {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  requestHeaders: Record<string, string>;
  requestBody?: any;
  responseStatus: number;
  responseBody: any;
  status: 'SUCCESS' | 'ERROR';
  latencyMs: number;
}

export interface TTSConfig {
  voiceName: string;
  voiceGender: 'wanita' | 'pria';
  rate: number;         // 0.8 - 1.2
  pitch: number;        // 0.8 - 1.3
  volume: number;       // 0 - 1.0
  chimeType: 'hospital-harmonic' | 'airport-triple' | 'bell-crystal' | 'none';
  repeatCall: number;   // 1 or 2
  speechEngine: 'browser-responsive' | 'indonesian-neural-synth';
}
