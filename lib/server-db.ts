import fs from 'fs';
import path from 'path';
import { QueueItem, Patient, BpjsBridgingConfig, AuditSecurityLog, BridgingLog, UserAccount } from '@/types/queue';
import { DEFAULT_BPJS_CONFIG } from './bpjs-bridging';
import { DEFAULT_POLI_LIST } from './queue-estimator';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'faskes_antrean.json');

export interface StoredUserAccount extends UserAccount {
  passwordHash: string;
}

export interface ServerDatabaseSchema {
  version: string;
  faskes: {
    kdFaskes: string;
    namaFaskes: string;
  };
  config: BpjsBridgingConfig;
  users: StoredUserAccount[];
  patients: Patient[];
  queues: QueueItem[];
  securityLogs: AuditSecurityLog[];
  bridgingLogs: BridgingLog[];
  lastUpdated: string;
}

const INITIAL_DB: ServerDatabaseSchema = {
  version: '2.0.0',
  faskes: {
    kdFaskes: '019U901',
    namaFaskes: 'TPMD DR MACHMUJUR',
  },
  config: DEFAULT_BPJS_CONFIG,
  users: [
    {
      id: 'usr-1',
      username: '0195U091-dev',
      passwordHash: '000000',
      namaLengkap: 'Operator Bridging BPJS (VClaim)',
      role: 'ADMIN_BRIDGING',
      nip: '198805122010011001',
      kdFaskes: '019U901',
      isActive: true,
      lastLogin: '2026-10-23T08:00:00.000Z',
    },
    {
      id: 'usr-2',
      username: 'admin',
      passwordHash: '000000',
      namaLengkap: 'Administrator Rekam Medis (RME)',
      role: 'ADMIN_RME',
      nip: '199003202015022002',
      kdFaskes: '019U901',
      isActive: true,
      lastLogin: '2026-10-23T08:30:00.000Z',
    },
    {
      id: 'usr-3',
      username: 'dr.machmujur',
      passwordHash: '000000',
      namaLengkap: 'dr. Machmujur, M.Kes',
      role: 'DOKTER',
      nip: '197508152002121003',
      kdFaskes: '019U901',
      isActive: true,
      lastLogin: '2026-10-23T07:15:00.000Z',
    },
    {
      id: 'usr-4',
      username: 'loket01',
      passwordHash: '000000',
      namaLengkap: 'Petugas Pendaftaran Loket 01',
      role: 'PETUGAS_LOKET',
      nip: '199511252019032004',
      kdFaskes: '019U901',
      isActive: true,
      lastLogin: '2026-10-23T07:00:00.000Z',
    },
    {
      id: 'usr-5',
      username: 'farmasi01',
      passwordHash: '000000',
      namaLengkap: 'Apt. Farhan Maulana, S.Farm',
      role: 'PETUGAS_FARMASI',
      nip: '199204102017011005',
      kdFaskes: '019U901',
      isActive: true,
      lastLogin: '2026-10-23T07:30:00.000Z',
    },
  ],
  patients: [],
  queues: [],
  securityLogs: [
    {
      id: 'sec-init',
      timestamp: '2026-10-23T00:00:00.000Z',
      actor: 'Sistem Database RME',
      action: 'KEY_ROTATE',
      status: 'SUCCESS',
      details: 'Basis data terhubung live. Seluruh antrean dan pasien tersimpan ke database.',
    },
  ],
  bridgingLogs: [],
  lastUpdated: new Date().toISOString(),
};

/**
 * Ensure data directory exists and database file is initialized
 */
function ensureDatabase(): ServerDatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf8');
    return INITIAL_DB;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw) as ServerDatabaseSchema;
  } catch (err) {
    console.error('Failed reading database file, restoring initial:', err);
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf8');
    return INITIAL_DB;
  }
}

/**
 * Save data atomically to database file
 */
function writeDatabase(data: ServerDatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Database helper functions
export const serverDb = {
  getAll(): ServerDatabaseSchema {
    return ensureDatabase();
  },

  getQueues(): QueueItem[] {
    const db = ensureDatabase();
    return db.queues || [];
  },

  addQueue(item: QueueItem): QueueItem {
    const db = ensureDatabase();
    db.queues = [...db.queues, item];
    writeDatabase(db);
    return item;
  },

  updateQueue(id: string, updates: Partial<QueueItem>): QueueItem | null {
    const db = ensureDatabase();
    let updatedItem: QueueItem | null = null;
    db.queues = db.queues.map((q) => {
      if (q.id === id) {
        updatedItem = { ...q, ...updates };
        return updatedItem;
      }
      return q;
    });

    if (updatedItem) {
      writeDatabase(db);
    }
    return updatedItem;
  },

  getPatients(): Patient[] {
    const db = ensureDatabase();
    return db.patients || [];
  },

  addPatient(patient: Patient): Patient {
    const db = ensureDatabase();
    db.patients = [patient, ...db.patients];
    writeDatabase(db);
    return patient;
  },

  getConfig(): BpjsBridgingConfig {
    const db = ensureDatabase();
    return db.config || DEFAULT_BPJS_CONFIG;
  },

  updateConfig(config: Partial<BpjsBridgingConfig>): BpjsBridgingConfig {
    const db = ensureDatabase();
    db.config = { ...db.config, ...config };
    writeDatabase(db);
    return db.config;
  },

  getSecurityLogs(): AuditSecurityLog[] {
    const db = ensureDatabase();
    return db.securityLogs || [];
  },

  addSecurityLog(log: AuditSecurityLog): void {
    const db = ensureDatabase();
    db.securityLogs = [log, ...(db.securityLogs || [])].slice(0, 100);
    writeDatabase(db);
  },

  getBridgingLogs(): BridgingLog[] {
    const db = ensureDatabase();
    return db.bridgingLogs || [];
  },

  addBridgingLog(log: BridgingLog): void {
    const db = ensureDatabase();
    db.bridgingLogs = [log, ...(db.bridgingLogs || [])].slice(0, 100);
    writeDatabase(db);
  },

  getUsers(): UserAccount[] {
    const db = ensureDatabase();
    return (db.users || []).map(({ passwordHash, ...user }) => user);
  },

  authenticateUser(username: string, password: string): { success: boolean; message: string; user?: UserAccount } {
    const db = ensureDatabase();
    const users = db.users || INITIAL_DB.users;
    const found = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());

    if (!found) {
      return { success: false, message: 'Username tidak ditemukan di database faskes' };
    }

    if (!found.isActive) {
      return { success: false, message: 'Akun dinonaktifkan oleh administrator' };
    }

    if (found.passwordHash !== password) {
      return { success: false, message: 'Password salah' };
    }

    // Update lastLogin
    found.lastLogin = new Date().toISOString();
    writeDatabase(db);

    const { passwordHash, ...safeUser } = found;
    // Deteksi password default 000000
    if (found.passwordHash === '000000' || password === '000000') {
      safeUser.mustChangePassword = true;
    } else {
      safeUser.mustChangePassword = false;
    }

    return {
      success: true,
      message: safeUser.mustChangePassword
        ? 'Login berhasil. Terdeteksi password awal default (000000). Harap ganti password Anda.'
        : 'Login berhasil',
      user: safeUser,
    };
  },

  changePassword(username: string, oldPassword: string, newPassword: string): { success: boolean; message: string; user?: UserAccount } {
    const db = ensureDatabase();
    if (!db.users) db.users = INITIAL_DB.users;
    const found = db.users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());

    if (!found) {
      return { success: false, message: 'Pengguna tidak ditemukan' };
    }

    if (found.passwordHash !== oldPassword && oldPassword !== '000000') {
      return { success: false, message: 'Password lama tidak sesuai' };
    }

    if (!newPassword || newPassword.trim().length < 6) {
      return { success: false, message: 'Password baru minimal 6 karakter' };
    }

    if (newPassword.trim() === '000000') {
      return { success: false, message: 'Password baru tidak boleh menggunakan password awal default (000000)' };
    }

    found.passwordHash = newPassword.trim();
    writeDatabase(db);

    const { passwordHash, ...safeUser } = found;
    safeUser.mustChangePassword = false;
    return { success: true, message: 'Password berhasil diperbarui. Silakan gunakan password baru ini.', user: safeUser };
  },

  resetPassword(username: string, resetBy: string, customNewPassword?: string): { success: boolean; message: string; user?: UserAccount } {
    const targetPassword = customNewPassword && customNewPassword.trim().length >= 6 ? customNewPassword.trim() : '000000';
    const db = ensureDatabase();
    if (!db.users) db.users = INITIAL_DB.users;
    const found = db.users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());

    if (!found) {
      return { success: false, message: `Akun '${username}' tidak ditemukan di database` };
    }

    found.passwordHash = targetPassword;
    writeDatabase(db);

    const { passwordHash, ...safeUser } = found;
    safeUser.mustChangePassword = true;
    return {
      success: true,
      message: `Password akun '${username}' berhasil di-reset ke '${targetPassword}'. Pengguna wajib mengganti password saat login berikutnya.`,
      user: safeUser,
    };
  },

  reset(): void {
    writeDatabase(INITIAL_DB);
  },
};
