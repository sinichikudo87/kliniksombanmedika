export type PatientType = 'BPJS' | 'UMUM';

export type QueueStatus = 
  | 'MENUNGGU' 
  | 'DIPANGGIL' 
  | 'DILAYANI' 
  | 'SELESAI' 
  | 'DILEWATI' 
  | 'BATAL';

export interface Patient {
  id: string;
  nik: string;
  noBpjs: string;
  nama: string;
  tglLahir: string;
  jenisKelamin: 'L' | 'P';
  noHp: string;
  alamat: string;
  statusBpjs: 'AKTIF' | 'NON_AKTIF' | 'PENANGGUHAN';
  jenisPeserta: string;
  faskesTingkat1: string;
  kelasRawat: string;
  createdAt: string;
  encryptedData?: string;
}

export interface PoliInfo {
  kode: string;
  nama: string;
  prefix: string;
  dokter: string;
  sip: string;
  ruang: string;
  durasiRataRataMenit: number;
  kuotaTotal: number;
  kuotaTerpakai: number;
  badgeColor: string;
  iconName: string;
}

export interface QueueItem {
  id: string;
  nomorAntrean: string; // e.g. "A-012"
  prefix: string;
  nomorUrut: number;
  tipePasien: PatientType;
  poliKode: string;
  poliNama: string;
  dokterNama: string;
  ruangNama: string;
  patientId: string;
  nik: string;
  noBpjs: string;
  namaPasien: string;
  status: QueueStatus;
  waktuDaftar: string;
  waktuDipanggil?: string;
  waktuMulaiLayanan?: string;
  waktuSelesai?: string;
  estimasiWaktuTungguMenit: number;
  estimasiJamPanggil: string;
  bpjsTaskId: number; // 1=Registrasi/Checkin, 2=Panggil Admisi, 3=Selesai Admisi, 4=Panggil Poli, 5=Mulai Poli, 6=Selesai Poli, 7=Selesai Farmasi
  kodeBooking: string;
  keluhan?: string;
  isSyncedBpjs: boolean;
  panggilanKe: number;
}

export interface BpjsBridgingConfig {
  kdFaskes: string;
  namaFaskes: string;
  jenisBridging: string;
  consId: string;
  secretKey: string;
  userKey: string;
  userPcareDev?: string;
  passPcareDev?: string;
  emailFaskes: string;
  environment: 'tester' | 'production';
  baseUrl: string;
  isOnline: boolean;
  lastSyncTimestamp?: string | null;
}

export interface BridgingLog {
  id: string;
  timestamp: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  requestHeader: Record<string, string>;
  requestPayload?: any;
  responseStatus: number;
  responsePayload: any;
  durationMs: number;
}

export interface AuditSecurityLog {
  id: string;
  timestamp: string;
  actor: string;
  action: 'ENCRYPT' | 'DECRYPT' | 'EXPORT' | 'KEY_ROTATE' | 'ACCESS_RECORD' | 'LOGIN' | 'LOGOUT';
  targetPatientId?: string;
  status: 'SUCCESS' | 'DENIED';
  ipAddress?: string;
  details: string;
}

export type UserRole =
  | 'ADMIN'
  | 'ADMIN_BRIDGING'
  | 'ADMIN_RME'
  | 'DOKTER'
  | 'PETUGAS_LOKET'
  | 'PETUGAS_PENDAFTARAN'
  | 'PETUGAS_FARMASI';

export interface UserAccount {
  id: string;
  username: string;
  namaLengkap: string;
  role: UserRole;
  nip?: string;
  kdFaskes: string;
  isActive: boolean;
  lastLogin?: string;
  mustChangePassword?: boolean;
}

export interface WsFktpEndpoint {
  no: number;
  jenisMethod: string;
  httpMethod: 'GET' | 'POST' | 'PUT';
  path: string;
  description: string;
}

export const WS_FKTP_ENDPOINTS: WsFktpEndpoint[] = [
  { no: 1, jenisMethod: 'Token', httpMethod: 'GET', path: '/api/auth', description: 'Menghasilkan token otorisasi sementara web service BPJS' },
  { no: 2, jenisMethod: 'Status Antrean', httpMethod: 'POST', path: '/api/antrean/status', description: 'Mengecek status dan rekapitulasi antrean di poliklinik faskes' },
  { no: 3, jenisMethod: 'Ambil Antrean', httpMethod: 'POST', path: '/api/antrean/ambil', description: 'Pendaftaran antrean dari Mobile JKN ke SIM FKTP' },
  { no: 4, jenisMethod: 'Sisa Antrean', httpMethod: 'POST', path: '/api/antrean/sisa', description: 'Melihat sisa antrean dan estimasi waktu tunggu' },
  { no: 5, jenisMethod: 'Pasien Baru', httpMethod: 'POST', path: '/api/pasien/baru', description: 'Mendaftarkan rekam medis pasien baru di database' },
  { no: 6, jenisMethod: 'Batal Antrean', httpMethod: 'POST', path: '/api/antrean/batal', description: 'Membatalkan nomor antrean pasien dan melepaskan kuota' },
  { no: 7, jenisMethod: 'Ambil Antrean V2', httpMethod: 'POST', path: '/api/v2/antrean/ambil', description: 'Ambil antrean spesifikasi Versi 2 HFIS BPJS' },
  { no: 8, jenisMethod: 'Status Antrean V2', httpMethod: 'POST', path: '/api/v2/antrean/status', description: 'Status antrean spesifikasi Versi 2 per dokter & jam praktek' },
  { no: 9, jenisMethod: 'Batal Antrean V2', httpMethod: 'POST', path: '/api/v2/antrean/batal', description: 'Pembatalan antrean spesifikasi Versi 2' },
];
