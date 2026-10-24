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
  encryptedData?: string; // Stored encrypted representation
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
  userPcareDev: string;
  passPcareDev: string;
  emailFaskes: string;
  environment: 'tester' | 'production';
  baseUrl: string;
  isOnline: boolean;
  lastSyncTimestamp?: string;
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
  | 'ADMIN_BRIDGING'
  | 'ADMIN_RME'
  | 'DOKTER'
  | 'PETUGAS_LOKET'
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
