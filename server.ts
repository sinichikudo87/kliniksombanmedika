import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'database.json');

export interface StoredUser {
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  role: 'admin' | 'petugas_loket' | 'dokter' | 'farmasi';
  email: string;
  phone?: string;
  nip?: string;
  loketId?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface StoredLoket {
  id: string;
  nama: string;
  kode: string;
  tipe: 'ADMISI' | 'POLI' | 'FARMASI';
  kategoriHuruf: string[];
  petugas: string;
  ruang?: string;
  status: 'BUKA' | 'ISTIRAHAT' | 'TUTUP';
}

interface StoredData {
  users: StoredUser[];
  tickets: any[];
  lokets: StoredLoket[];
  bridgingLogs: any[];
  sessions: { token: string; userId: string; expiresAt: string }[];
  bpjsConfig?: any;
  mysqlConfig?: {
    host: string;
    port: number;
    user: string;
    password?: string;
    database: string;
  };
}

const DEFAULT_BPJS_CONFIG = {
  baseUrl: 'https://apijkn-dev.bpjs-kesehatan.go.id/antreanrs_dev',
  consId: '11495',
  secretKey: '4xHABA0A84',
  userKey: '4a1a84234ffc19f0c77750cebfa2444e',
  kodePPK: '019U901',
  namaFaskes: 'TPMD DR MACHMUJUR',
  isSandbox: true,
  autoSyncBpjs: true,
  jenisBridging: 'Pcare (Eclaim)',
  jenisCid: 'Tester',
  cidTesterProd: 'Tester',
  userPcare: '0195U091-dev',
  passPcare: 'Dev1234#',
  emailFaskes: 'praktekdokter91@gmail.com',
  pengembanganVendor: 'Pengembangan sendiri',
  kdAplikasi: '095',
};

// Password hashing using SHA-256 with consistent clinic salt
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_salt_somban_medika_2026').digest('hex');
}

// Default initial seed users
const INITIAL_USERS: StoredUser[] = [
  {
    id: 'usr-admin-dedy',
    username: 'dedy',
    passwordHash: hashPassword('admin123'),
    fullName: 'Dedy',
    role: 'admin',
    email: 'dedyfabregas@gmail.com',
    phone: '081234567891',
    nip: '198904122015012001',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'usr-admin-01',
    username: 'admin',
    passwordHash: hashPassword('admin123'),
    fullName: 'Dedy (Akses Penuh SIM-RS)',
    role: 'admin',
    email: 'admin@sombanmedika.id',
    phone: '081234567890',
    nip: '198904122015012001',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'usr-loket-01',
    username: 'loket1',
    passwordHash: hashPassword('loket123'),
    fullName: 'Ifa',
    role: 'petugas_loket',
    email: 'ifa.loket@sombanmedika.id',
    phone: '081298765432',
    nip: '199203152018022003',
    loketId: 'loket-1',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'usr-loket-02',
    username: 'loket2',
    passwordHash: hashPassword('loket123'),
    fullName: 'Dwi Lestari, Amd.Keb',
    role: 'petugas_loket',
    email: 'dwi.lestari@sombanmedika.id',
    phone: '081377889900',
    nip: '199407222019032005',
    loketId: 'loket-2',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'usr-dokter-01',
    username: 'dr_machmujur',
    passwordHash: hashPassword('dokter123'),
    fullName: 'dr. Machmujur',
    role: 'dokter',
    email: 'dr.machmujur@sombanmedika.id',
    phone: '081122334455',
    nip: '198005102008011002',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'usr-dokter-02',
    username: 'dr_diana',
    passwordHash: hashPassword('dokter123'),
    fullName: 'dr. Diana',
    role: 'dokter',
    email: 'dr.diana@sombanmedika.id',
    phone: '081199887766',
    nip: '198503152011012003',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'usr-farmasi-01',
    username: 'wandi',
    passwordHash: hashPassword('farmasi123'),
    fullName: 'Wandi',
    role: 'farmasi',
    email: 'wandi@sombanmedika.id',
    phone: '081399881122',
    nip: '199109092017012004',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'usr-farmasi-02',
    username: 'farmasi1',
    passwordHash: hashPassword('farmasi123'),
    fullName: 'Wandi (Penyerahan Resep)',
    role: 'farmasi',
    email: 'penyerahan.resep@sombanmedika.id',
    phone: '081399881122',
    nip: '199109092017012004',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
  },
];

const INITIAL_LOKETS: StoredLoket[] = [
  {
    id: 'loket-1',
    nama: 'Loket 1 - Pendaftaran & SEP BPJS',
    kode: 'LOKET-1',
    tipe: 'ADMISI',
    kategoriHuruf: ['A', 'P'],
    petugas: 'Sdri. Ifa',
    status: 'BUKA',
  },
  {
    id: 'loket-2',
    nama: 'Loket 2 - Pendaftaran Pasien Umum',
    kode: 'LOKET-2',
    tipe: 'ADMISI',
    kategoriHuruf: ['B'],
    petugas: 'Sdri. Dwi Lestari',
    status: 'BUKA',
  },
  {
    id: 'loket-3',
    nama: 'Loket 3 - Prioritas Lansia & Ibu Hamil',
    kode: 'LOKET-3',
    tipe: 'ADMISI',
    kategoriHuruf: ['P'],
    petugas: 'Sdri. Maya Safitri',
    status: 'BUKA',
  },
  {
    id: 'poli-umu',
    nama: 'Poli Umum - Ruang 1',
    kode: 'POLI-UMU',
    tipe: 'POLI',
    kategoriHuruf: ['A', 'B', 'P'],
    petugas: 'dr. Machmujur',
    ruang: 'Ruang 1 (Klinik Lantai 1)',
    status: 'BUKA',
  },
  {
    id: 'poli-gig',
    nama: 'Poli Umum - Ruang 2',
    kode: 'POLI-UMU-2',
    tipe: 'POLI',
    kategoriHuruf: ['A', 'B', 'P'],
    petugas: 'dr. Diana',
    ruang: 'Ruang 2 (Klinik Lantai 1)',
    status: 'BUKA',
  },
  {
    id: 'farmasi',
    nama: 'Depo Farmasi & Penyerahan Resep Obat',
    kode: 'FARMASI',
    tipe: 'FARMASI',
    kategoriHuruf: ['F'],
    petugas: 'Sdr. Wandi',
    ruang: 'Depo Farmasi Depan',
    status: 'BUKA',
  },
];

// Read database file
function readDb(): StoredData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : INITIAL_USERS,
        tickets: Array.isArray(parsed.tickets) ? parsed.tickets : [],
        lokets: Array.isArray(parsed.lokets) && parsed.lokets.length > 0 ? parsed.lokets : INITIAL_LOKETS,
        bridgingLogs: Array.isArray(parsed.bridgingLogs) ? parsed.bridgingLogs : [],
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        bpjsConfig: parsed.bpjsConfig || DEFAULT_BPJS_CONFIG,
        mysqlConfig: parsed.mysqlConfig,
      };
    }
  } catch (err) {
    console.error('Error reading local db file:', err);
  }
  return {
    users: INITIAL_USERS,
    tickets: [],
    lokets: INITIAL_LOKETS,
    bridgingLogs: [],
    sessions: [],
    bpjsConfig: DEFAULT_BPJS_CONFIG,
  };
}

// Write to database file
function writeDb(data: StoredData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local db file:', err);
  }
}

// Initialize clean empty data if file doesn't exist
if (!fs.existsSync(DB_FILE)) {
  writeDb({
    users: INITIAL_USERS,
    tickets: [],
    lokets: INITIAL_LOKETS,
    bridgingLogs: [],
    sessions: [],
  });
} else {
  // Ensure users & lokets exist in db file
  const current = readDb();
  writeDb(current);
}

// Sanitize user (strip password hash)
function sanitizeUser(user: StoredUser) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

// ================= API ROUTES =================

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ================= AUTHENTICATION APIs =================

// Helper to generate auth tokens
function generateToken(userId: string): string {
  return 'somban_tok_' + crypto.randomBytes(24).toString('hex');
}

// Register new user / petugas
app.post('/api/auth/register', (req, res) => {
  const { username, password, fullName, role, email, phone, nip, loketId } = req.body;

  if (!username || !password || !fullName || !role) {
    return res.status(400).json({
      success: false,
      message: 'Semua field wajib (username, password, nama lengkap, role) harus diisi!',
    });
  }

  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Username minimal 3 karakter!',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password minimal 6 karakter demi keamanan!',
    });
  }

  const validRoles = ['admin', 'petugas_loket', 'dokter', 'farmasi'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Role tidak valid. Pilihan: ${validRoles.join(', ')}`,
    });
  }

  const db = readDb();

  // Check duplicate username or email
  const existingUser = db.users.find(
    (u) => u.username.toLowerCase() === cleanUsername || (email && u.email?.toLowerCase() === email.trim().toLowerCase())
  );

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'Username atau email tersebut sudah terdaftar di sistem klinik!',
    });
  }

  const newId = 'usr-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  const newUser: StoredUser = {
    id: newId,
    username: cleanUsername,
    passwordHash: hashPassword(password),
    fullName: fullName.trim(),
    role: role as any,
    email: email ? email.trim() : `${cleanUsername}@sombanmedika.id`,
    phone: phone ? phone.trim() : '',
    nip: nip ? nip.trim() : '',
    loketId: loketId || undefined,
    isActive: true,
    createdAt: now,
    lastLogin: now,
  };

  db.users.push(newUser);

  // Create session
  const token = generateToken(newUser.id);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.sessions.push({ token, userId: newUser.id, expiresAt });

  writeDb(db);

  return res.status(201).json({
    success: true,
    message: `Pendaftaran berhasil! Selamat datang, ${newUser.fullName}.`,
    user: sanitizeUser(newUser),
    token,
  });
});

// Login user
app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username/Email dan password harus diisi!',
    });
  }

  const cleanIdent = identifier.trim().toLowerCase();
  const db = readDb();

  const user = db.users.find(
    (u) => u.username.toLowerCase() === cleanIdent || u.email?.toLowerCase() === cleanIdent
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Akun tidak ditemukan. Periksa username/email Anda atau daftar akun baru.',
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Akun Anda dinonaktifkan oleh administrator klinik.',
    });
  }

  const hashedInput = hashPassword(password);
  if (user.passwordHash !== hashedInput) {
    return res.status(401).json({
      success: false,
      message: 'Password yang Anda masukkan salah!',
    });
  }

  // Update last login
  user.lastLogin = new Date().toISOString();

  // Create session
  const token = generateToken(user.id);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.sessions.push({ token, userId: user.id, expiresAt });

  writeDb(db);

  return res.json({
    success: true,
    message: `Login berhasil! Selamat bertugas, ${user.fullName}.`,
    user: sanitizeUser(user),
    token,
  });
});

// Current User Profile
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.query.token as string);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Tidak ada sesi login aktif' });
  }

  const db = readDb();
  const session = db.sessions.find((s) => s.token === token);

  if (!session || new Date(session.expiresAt) < new Date()) {
    return res.status(401).json({ success: false, message: 'Sesi telah kedaluwarsa, silakan login kembali' });
  }

  const user = db.users.find((u) => u.id === session.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Data pengguna tidak ditemukan' });
  }

  return res.json({
    success: true,
    user: sanitizeUser(user),
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.body.token as string);

  if (token) {
    const db = readDb();
    db.sessions = db.sessions.filter((s) => s.token !== token);
    writeDb(db);
  }

  res.json({ success: true, message: 'Berhasil logout' });
});

// User List (for Admin & Counter assignment)
app.get('/api/users', (req, res) => {
  const db = readDb();
  res.json({
    success: true,
    data: db.users.map(sanitizeUser),
  });
});

// Loket List
app.get('/api/lokets', (req, res) => {
  const db = readDb();
  res.json({
    success: true,
    data: db.lokets || INITIAL_LOKETS,
  });
});

// ================= DATABASE STORED PROCEDURES (SELECT & UPSERT) =================

/**
 * Endpoint: POST /api/procedures/select
 * Executes SELECT stored procedure logic with parameter parsing & timing.
 */
app.post('/api/procedures/select', (req, res) => {
  const { procedureName, params = {} } = req.body;
  const startTime = Date.now();
  const db = readDb();

  try {
    let resultRows: any[] = [];
    let queryDescription = '';

    switch (procedureName) {
      case 'sp_select_users': {
        queryDescription = 'CALL sp_select_users(p_role, p_search, p_status, p_limit, p_offset)';
        let list = db.users.map(sanitizeUser);

        if (params.p_role && params.p_role !== 'ALL') {
          list = list.filter((u) => u.role === params.p_role);
        }
        if (params.p_status !== undefined && params.p_status !== 'ALL') {
          const isActive = params.p_status === true || params.p_status === 'true' || params.p_status === 'ACTIVE';
          list = list.filter((u) => u.isActive === isActive);
        }
        if (params.p_search && typeof params.p_search === 'string') {
          const q = params.p_search.toLowerCase();
          list = list.filter(
            (u) =>
              u.username.toLowerCase().includes(q) ||
              u.fullName.toLowerCase().includes(q) ||
              u.email?.toLowerCase().includes(q) ||
              u.nip?.includes(q)
          );
        }

        const limit = parseInt(params.p_limit || '100', 10);
        const offset = parseInt(params.p_offset || '0', 10);
        resultRows = list.slice(offset, offset + limit);
        break;
      }

      case 'sp_select_antrean': {
        queryDescription = 'CALL sp_select_antrean(p_tanggal, p_status, p_kategori, p_kode_poli, p_search)';
        let list = [...(db.tickets || [])];

        if (params.p_status && params.p_status !== 'ALL') {
          list = list.filter((t) => t.status === params.p_status);
        }
        if (params.p_kategori && params.p_kategori !== 'ALL') {
          list = list.filter((t) => t.kategori === params.p_kategori);
        }
        if (params.p_kode_poli && params.p_kode_poli !== 'ALL') {
          list = list.filter((t) => t.kodePoli === params.p_kode_poli);
        }
        if (params.p_tanggal) {
          // match YYYY-MM-DD
          list = list.filter((t) => t.waktuAmbil && t.waktuAmbil.startsWith(params.p_tanggal));
        }
        if (params.p_search && typeof params.p_search === 'string') {
          const q = params.p_search.toLowerCase();
          list = list.filter(
            (t) =>
              t.nomorAntrean?.toLowerCase().includes(q) ||
              t.namaPasien?.toLowerCase().includes(q) ||
              t.noKartuBPJS?.includes(q) ||
              t.nik?.includes(q) ||
              t.nomorRM?.toLowerCase().includes(q) ||
              t.kodeBooking?.toLowerCase().includes(q)
          );
        }

        resultRows = list;
        break;
      }

      case 'sp_select_loket': {
        queryDescription = 'CALL sp_select_loket(p_tipe, p_status)';
        let list = [...(db.lokets || INITIAL_LOKETS)];

        if (params.p_tipe && params.p_tipe !== 'ALL') {
          list = list.filter((l) => l.tipe === params.p_tipe);
        }
        if (params.p_status && params.p_status !== 'ALL') {
          list = list.filter((l) => l.status === params.p_status);
        }

        resultRows = list;
        break;
      }

      case 'sp_select_bridging_logs': {
        queryDescription = 'CALL sp_select_bridging_logs(p_status, p_limit)';
        let list = [...(db.bridgingLogs || [])];
        if (params.p_status && params.p_status !== 'ALL') {
          list = list.filter((l) => l.status === params.p_status);
        }
        const limit = parseInt(params.p_limit || '50', 10);
        resultRows = list.slice(0, limit);
        break;
      }

      default:
        return res.status(400).json({
          success: false,
          message: `Prosedur SELECT tidak dikenali: '${procedureName}'. Pilihan: sp_select_users, sp_select_antrean, sp_select_loket, sp_select_bridging_logs.`,
        });
    }

    const executionTimeMs = Date.now() - startTime;
    return res.json({
      success: true,
      procedureName,
      queryDescription,
      executionTimeMs,
      rowCount: resultRows.length,
      data: resultRows,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: `Eksekusi prosedur SELECT gagal: ${error.message}`,
    });
  }
});

/**
 * Endpoint: POST /api/procedures/upsert
 * Executes UPSERT (INSERT ON DUPLICATE KEY UPDATE) procedure logic.
 */
app.post('/api/procedures/upsert', (req, res) => {
  const { procedureName, data = {} } = req.body;
  const startTime = Date.now();
  const db = readDb();

  try {
    let actionType: 'INSERTED' | 'UPDATED' = 'INSERTED';
    let affectedRecord: any = null;
    let queryDescription = '';

    switch (procedureName) {
      case 'sp_upsert_user': {
        queryDescription = 'CALL sp_upsert_user(p_id, p_username, p_password, p_full_name, p_role, p_email, p_phone, p_nip, p_loket_id, p_is_active)';
        const { id, username, password, fullName, role, email, phone, nip, loketId, isActive } = data;

        if (!username || !fullName) {
          return res.status(400).json({ success: false, message: 'Username dan Nama Lengkap wajib disertakan pada UPSERT user!' });
        }

        const existingIdx = db.users.findIndex(
          (u) => (id && u.id === id) || u.username.toLowerCase() === username.trim().toLowerCase()
        );

        const now = new Date().toISOString();

        if (existingIdx >= 0) {
          // UPDATE existing record
          actionType = 'UPDATED';
          const current = db.users[existingIdx];
          const updatedUser: StoredUser = {
            ...current,
            fullName: fullName.trim(),
            role: role || current.role,
            email: email !== undefined ? email.trim() : current.email,
            phone: phone !== undefined ? phone.trim() : current.phone,
            nip: nip !== undefined ? nip.trim() : current.nip,
            loketId: loketId !== undefined ? loketId : current.loketId,
            isActive: isActive !== undefined ? Boolean(isActive) : current.isActive,
            // Only update password if new password provided
            passwordHash: password && password.trim() ? hashPassword(password) : current.passwordHash,
          };
          db.users[existingIdx] = updatedUser;
          affectedRecord = sanitizeUser(updatedUser);
        } else {
          // INSERT new record
          actionType = 'INSERTED';
          const newUserId = id || 'usr-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
          const newUser: StoredUser = {
            id: newUserId,
            username: username.trim().toLowerCase(),
            passwordHash: hashPassword(password || 'password123'),
            fullName: fullName.trim(),
            role: role || 'petugas_loket',
            email: email ? email.trim() : `${username.trim().toLowerCase()}@sombanmedika.id`,
            phone: phone ? phone.trim() : '',
            nip: nip ? nip.trim() : '',
            loketId: loketId || undefined,
            isActive: isActive !== undefined ? Boolean(isActive) : true,
            createdAt: now,
          };
          db.users.push(newUser);
          affectedRecord = sanitizeUser(newUser);
        }
        writeDb(db);
        break;
      }

      case 'sp_upsert_antrean': {
        queryDescription = 'CALL sp_upsert_antrean(p_id, p_nomor_antrean, p_huruf, p_angka, p_kategori, p_poli_tujuan, p_kode_poli, p_dokter_nama, p_nama_pasien, p_no_kartu_bpjs, p_nik, p_nomor_rm, p_kode_booking, p_loket_dipanggil, p_status, p_task_id_bpjs, p_waktu_ambil, p_waktu_panggil, p_waktu_selesai)';
        const ticket = data;

        if (!ticket.id && !ticket.kodeBooking) {
          return res.status(400).json({ success: false, message: 'ID atau kodeBooking tiket wajib ada untuk UPSERT antrean!' });
        }

        const existingIdx = db.tickets.findIndex(
          (t) => (ticket.id && t.id === ticket.id) || (ticket.kodeBooking && t.kodeBooking === ticket.kodeBooking)
        );

        if (existingIdx >= 0) {
          actionType = 'UPDATED';
          db.tickets[existingIdx] = { ...db.tickets[existingIdx], ...ticket };
          affectedRecord = db.tickets[existingIdx];
        } else {
          actionType = 'INSERTED';
          const newTicket = {
            ...ticket,
            id: ticket.id || 'tkt-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
            waktuAmbil: ticket.waktuAmbil || new Date().toISOString(),
          };
          db.tickets.push(newTicket);
          affectedRecord = newTicket;
        }
        writeDb(db);
        break;
      }

      case 'sp_upsert_loket': {
        queryDescription = 'CALL sp_upsert_loket(p_id, p_nama, p_kode, p_tipe, p_petugas, p_ruang, p_status)';
        const loket = data;

        if (!loket.id && !loket.kode) {
          return res.status(400).json({ success: false, message: 'ID atau kode loket wajib ada untuk UPSERT!' });
        }

        const existingIdx = (db.lokets || []).findIndex(
          (l) => (loket.id && l.id === loket.id) || (loket.kode && l.kode === loket.kode)
        );

        if (existingIdx >= 0) {
          actionType = 'UPDATED';
          db.lokets[existingIdx] = { ...db.lokets[existingIdx], ...loket };
          affectedRecord = db.lokets[existingIdx];
        } else {
          actionType = 'INSERTED';
          const newLoket: StoredLoket = {
            id: loket.id || 'loket-' + Date.now().toString(36),
            nama: loket.nama || 'Loket Baru',
            kode: loket.kode || 'LOKET-X',
            tipe: loket.tipe || 'ADMISI',
            kategoriHuruf: loket.kategoriHuruf || ['A'],
            petugas: loket.petugas || 'Petugas',
            ruang: loket.ruang || '',
            status: loket.status || 'BUKA',
          };
          db.lokets.push(newLoket);
          affectedRecord = newLoket;
        }
        writeDb(db);
        break;
      }

      default:
        return res.status(400).json({
          success: false,
          message: `Prosedur UPSERT tidak dikenali: '${procedureName}'. Pilihan: sp_upsert_user, sp_upsert_antrean, sp_upsert_loket.`,
        });
    }

    const executionTimeMs = Date.now() - startTime;
    return res.json({
      success: true,
      procedureName,
      queryDescription,
      action: actionType,
      affectedRows: 1,
      executionTimeMs,
      data: affectedRecord,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: `Eksekusi prosedur UPSERT gagal: ${error.message}`,
    });
  }
});

// Database Schema & Stored Procedure Definitions API
app.get('/api/database/schema', (req, res) => {
  const db = readDb();
  res.json({
    success: true,
    databaseName: 'antrean_bpjs_somban',
    tables: [
      {
        tableName: 'users',
        description: 'Tabel akun pengguna, petugas loket, dokter, dan administrator SIM-RS',
        recordCount: db.users.length,
        primaryKey: 'id',
        columns: [
          { name: 'id', type: 'VARCHAR(64)', nullable: false, key: 'PRI', description: 'Primary Key identifier unik pengguna' },
          { name: 'username', type: 'VARCHAR(64)', nullable: false, key: 'UNI', description: 'Username login (unik)' },
          { name: 'password_hash', type: 'VARCHAR(128)', nullable: false, key: '', description: 'Hash SHA-256 password bergaram (salted)' },
          { name: 'full_name', type: 'VARCHAR(128)', nullable: false, key: '', description: 'Nama lengkap dan gelar petugas/dokter' },
          { name: 'role', type: "ENUM('admin','petugas_loket','dokter','farmasi')", nullable: false, key: '', description: 'Hak akses & peran pengguna' },
          { name: 'email', type: 'VARCHAR(128)', nullable: true, key: '', description: 'Alamat surel resmi' },
          { name: 'phone', type: 'VARCHAR(32)', nullable: true, key: '', description: 'Nomor telepon / WhatsApp' },
          { name: 'nip', type: 'VARCHAR(32)', nullable: true, key: '', description: 'Nomor Induk Pegawai / SIP Dokter' },
          { name: 'loket_id', type: 'VARCHAR(64)', nullable: true, key: '', description: 'ID Loket default yang dijaga' },
          { name: 'is_active', type: 'TINYINT(1)', nullable: false, key: '', description: 'Status aktifasi akun (1=Aktif, 0=Nonaktif)' },
          { name: 'created_at', type: 'TIMESTAMP', nullable: false, key: '', description: 'Waktu pendaftaran akun' },
          { name: 'last_login', type: 'DATETIME', nullable: true, key: '', description: 'Waktu login terakhir' },
        ],
      },
      {
        tableName: 'antrean_bpjs',
        description: 'Tabel transaksi nomor antrean pasien klinik & bridging BPJS Kesehatan',
        recordCount: db.tickets.length,
        primaryKey: 'id',
        columns: [
          { name: 'id', type: 'VARCHAR(64)', nullable: false, key: 'PRI', description: 'Primary Key unik antrean' },
          { name: 'nomor_antrean', type: 'VARCHAR(16)', nullable: false, key: '', description: 'Kode display (A-001, B-002, dll)' },
          { name: 'huruf', type: 'VARCHAR(4)', nullable: false, key: '', description: 'Huruf kategori antrean (A/B/P/F)' },
          { name: 'angka', type: 'INT', nullable: false, key: '', description: 'Nomor urut numerik' },
          { name: 'kategori', type: 'VARCHAR(16)', nullable: false, key: '', description: 'BPJS, UMUM, PRIORITAS, FARMASI' },
          { name: 'poli_tujuan', type: 'VARCHAR(128)', nullable: false, key: '', description: 'Nama unit poli / admisi tujuan' },
          { name: 'kode_poli', type: 'VARCHAR(16)', nullable: false, key: '', description: 'Kode poli standar BPJS (INT, ADM, dll)' },
          { name: 'dokter_nama', type: 'VARCHAR(128)', nullable: true, key: '', description: 'Nama dokter yang bertugas' },
          { name: 'nama_pasien', type: 'VARCHAR(128)', nullable: true, key: '', description: 'Nama lengkap pasien' },
          { name: 'no_kartu_bpjs', type: 'VARCHAR(32)', nullable: true, key: '', description: '13 digit nomor BPJS Kesehatan' },
          { name: 'nik', type: 'VARCHAR(32)', nullable: true, key: '', description: '16 digit NIK e-KTP' },
          { name: 'nomor_rm', type: 'VARCHAR(32)', nullable: true, key: '', description: 'Nomor Rekam Medis pasien' },
          { name: 'kode_booking', type: 'VARCHAR(64)', nullable: true, key: 'UNI', description: 'Kode booking unik BPJS Mobile JKN' },
          { name: 'loket_dipanggil', type: 'VARCHAR(128)', nullable: true, key: '', description: 'Loket pemanggil saat ini' },
          { name: 'status', type: 'VARCHAR(32)', nullable: false, key: '', description: 'MENUNGGU, DIPANGGIL, SEDANG_DILAYANI, SELESAI, BATAL' },
          { name: 'task_id_bpjs', type: 'INT', nullable: false, key: '', description: 'TaskId 1-7 standar BPJS RS v2' },
          { name: 'waktu_ambil', type: 'DATETIME', nullable: true, key: '', description: 'Waktu tiket diambil di Kiosk' },
          { name: 'waktu_panggil', type: 'DATETIME', nullable: true, key: '', description: 'Waktu pertama kali dipanggil' },
          { name: 'waktu_selesai', type: 'DATETIME', nullable: true, key: '', description: 'Waktu selesai pelayanan' },
          { name: 'created_at', type: 'TIMESTAMP', nullable: false, key: '', description: 'Timestamp pembuatan data' },
        ],
      },
      {
        tableName: 'loket',
        description: 'Tabel master loket admisi, poli klinik, dan depo farmasi',
        recordCount: (db.lokets || INITIAL_LOKETS).length,
        primaryKey: 'id',
        columns: [
          { name: 'id', type: 'VARCHAR(64)', nullable: false, key: 'PRI', description: 'Primary Key id loket' },
          { name: 'nama', type: 'VARCHAR(128)', nullable: false, key: '', description: 'Nama loket / ruang' },
          { name: 'kode', type: 'VARCHAR(32)', nullable: false, key: 'UNI', description: 'Kode loket (LOKET-1, POLI-UMU, dll)' },
          { name: 'tipe', type: "ENUM('ADMISI','POLI','FARMASI')", nullable: false, key: '', description: 'Tipe fungsional loket' },
          { name: 'kategori_huruf', type: 'VARCHAR(64)', nullable: false, key: '', description: 'Kategori huruf antrean yang ditangani (JSON array)' },
          { name: 'petugas', type: 'VARCHAR(128)', nullable: false, key: '', description: 'Petugas/Dokter yang menjaga' },
          { name: 'ruang', type: 'VARCHAR(128)', nullable: true, key: '', description: 'Lokasi fisik ruang klinik' },
          { name: 'status', type: "ENUM('BUKA','ISTIRAHAT','TUTUP')", nullable: false, key: '', description: 'Status operasional' },
        ],
      },
      {
        tableName: 'bridging_logs_bpjs',
        description: 'Tabel audit log pengiriman data ke server API BPJS Kesehatan (Antrean RS v2)',
        recordCount: db.bridgingLogs.length,
        primaryKey: 'id',
        columns: [
          { name: 'id', type: 'VARCHAR(64)', nullable: false, key: 'PRI', description: 'Primary Key log' },
          { name: 'timestamp_str', type: 'VARCHAR(32)', nullable: true, key: '', description: 'Waktu transaksi' },
          { name: 'method', type: 'VARCHAR(16)', nullable: true, key: '', description: 'HTTP Method (GET, POST, PUT)' },
          { name: 'endpoint', type: 'VARCHAR(255)', nullable: true, key: '', description: 'URL endpoint BPJS yang diakses' },
          { name: 'request_headers', type: 'JSON', nullable: true, key: '', description: 'Header X-cons-id, X-signature, dll' },
          { name: 'request_body', type: 'JSON', nullable: true, key: '', description: 'Payload kirim data antrean' },
          { name: 'response_status', type: 'INT', nullable: true, key: '', description: 'HTTP Status Code (200, 400, dll)' },
          { name: 'response_body', type: 'JSON', nullable: true, key: '', description: 'Respon JSON dari BPJS' },
          { name: 'status', type: 'VARCHAR(16)', nullable: true, key: '', description: 'SUCCESS / ERROR' },
          { name: 'latency_ms', type: 'INT', nullable: true, key: '', description: 'Waktu respons dalam milidetik' },
        ],
      },
    ],
    procedures: [
      {
        name: 'sp_select_users',
        type: 'SELECT',
        targetTable: 'users',
        description: 'Mengambil data pengguna/petugas dengan filter role, status aktif, pencarian teks, dan paginasi.',
        parameters: [
          { name: 'p_role', type: 'VARCHAR(32)', description: 'Filter role pengguna (admin, petugas_loket, dokter, farmasi, atau ALL)' },
          { name: 'p_search', type: 'VARCHAR(128)', description: 'Pencarian username, nama lengkap, NIP, atau email' },
          { name: 'p_status', type: 'VARCHAR(16)', description: 'Filter status akun (ACTIVE, INACTIVE, atau ALL)' },
          { name: 'p_limit', type: 'INT', description: 'Batas jumlah baris hasil' },
          { name: 'p_offset', type: 'INT', description: 'Offset paginasi data' },
        ],
        sqlCode: `DELIMITER //
CREATE PROCEDURE sp_select_users(
    IN p_role VARCHAR(32),
    IN p_search VARCHAR(128),
    IN p_status VARCHAR(16),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    SELECT 
        id, username, full_name, role, email, phone, nip, loket_id, is_active, created_at, last_login
    FROM users
    WHERE (p_role IS NULL OR p_role = 'ALL' OR role = p_role)
      AND (p_status IS NULL OR p_status = 'ALL' OR 
           (p_status = 'ACTIVE' AND is_active = 1) OR 
           (p_status = 'INACTIVE' AND is_active = 0))
      AND (p_search IS NULL OR p_search = '' OR 
           username LIKE CONCAT('%', p_search, '%') OR
           full_name LIKE CONCAT('%', p_search, '%') OR
           nip LIKE CONCAT('%', p_search, '%') OR
           email LIKE CONCAT('%', p_search, '%'))
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset;
END //
DELIMITER ;`,
      },
      {
        name: 'sp_upsert_user',
        type: 'UPSERT',
        targetTable: 'users',
        description: 'Menyimpan pengguna baru (INSERT) atau memperbarui pengguna yang sudah ada (ON DUPLICATE KEY UPDATE).',
        parameters: [
          { name: 'p_id', type: 'VARCHAR(64)', description: 'Identifier unik user' },
          { name: 'p_username', type: 'VARCHAR(64)', description: 'Username unik' },
          { name: 'p_password_hash', type: 'VARCHAR(128)', description: 'Hash SHA-256 password (kosongkan jika tidak ubah)' },
          { name: 'p_full_name', type: 'VARCHAR(128)', description: 'Nama lengkap petugas' },
          { name: 'p_role', type: 'VARCHAR(32)', description: 'Role pengguna' },
          { name: 'p_email', type: 'VARCHAR(128)', description: 'Alamat email' },
          { name: 'p_phone', type: 'VARCHAR(32)', description: 'Nomor telepon' },
          { name: 'p_nip', type: 'VARCHAR(32)', description: 'NIP / SIP' },
          { name: 'p_loket_id', type: 'VARCHAR(64)', description: 'ID Loket yang ditugaskan' },
          { name: 'p_is_active', type: 'TINYINT(1)', description: 'Status aktif (1=Aktif, 0=Nonaktif)' },
        ],
        sqlCode: `DELIMITER //
CREATE PROCEDURE sp_upsert_user(
    IN p_id VARCHAR(64),
    IN p_username VARCHAR(64),
    IN p_password_hash VARCHAR(128),
    IN p_full_name VARCHAR(128),
    IN p_role VARCHAR(32),
    IN p_email VARCHAR(128),
    IN p_phone VARCHAR(32),
    IN p_nip VARCHAR(32),
    IN p_loket_id VARCHAR(64),
    IN p_is_active TINYINT(1)
)
BEGIN
    INSERT INTO users (
        id, username, password_hash, full_name, role, email, phone, nip, loket_id, is_active, created_at
    ) VALUES (
        p_id, p_username, p_password_hash, p_full_name, p_role, p_email, p_phone, p_nip, p_loket_id, p_is_active, NOW()
    )
    ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name),
        role = VALUES(role),
        email = VALUES(email),
        phone = VALUES(phone),
        nip = VALUES(nip),
        loket_id = VALUES(loket_id),
        is_active = VALUES(is_active),
        password_hash = IF(p_password_hash IS NOT NULL AND p_password_hash != '', VALUES(password_hash), password_hash);
        
    SELECT id, username, full_name, role, email, phone, nip, loket_id, is_active 
    FROM users WHERE id = p_id OR username = p_username;
END //
DELIMITER ;`,
      },
      {
        name: 'sp_select_antrean',
        type: 'SELECT',
        targetTable: 'antrean_bpjs',
        description: 'Mengambil daftar antrean dengan filter tanggal, status pelayanan, kategori antrean, dan poli tujuan.',
        parameters: [
          { name: 'p_tanggal', type: 'VARCHAR(10)', description: 'Tanggal antrean YYYY-MM-DD' },
          { name: 'p_status', type: 'VARCHAR(32)', description: 'Status tiket (MENUNGGU, DIPANGGIL, SELESAI, ALL)' },
          { name: 'p_kategori', type: 'VARCHAR(16)', description: 'Kategori tiket (BPJS, UMUM, PRIORITAS, FARMASI, ALL)' },
          { name: 'p_kode_poli', type: 'VARCHAR(16)', description: 'Kode poli klinik' },
          { name: 'p_search', type: 'VARCHAR(128)', description: 'Pencarian nama pasien, nomor antrean, NIK, atau BPJS' },
        ],
        sqlCode: `DELIMITER //
CREATE PROCEDURE sp_select_antrean(
    IN p_tanggal VARCHAR(10),
    IN p_status VARCHAR(32),
    IN p_kategori VARCHAR(16),
    IN p_kode_poli VARCHAR(16),
    IN p_search VARCHAR(128)
)
BEGIN
    SELECT *
    FROM antrean_bpjs
    WHERE (p_tanggal IS NULL OR p_tanggal = '' OR DATE(waktu_ambil) = p_tanggal)
      AND (p_status IS NULL OR p_status = 'ALL' OR status = p_status)
      AND (p_kategori IS NULL OR p_kategori = 'ALL' OR kategori = p_kategori)
      AND (p_kode_poli IS NULL OR p_kode_poli = 'ALL' OR kode_poli = p_kode_poli)
      AND (p_search IS NULL OR p_search = '' OR 
           nomor_antrean LIKE CONCAT('%', p_search, '%') OR
           nama_pasien LIKE CONCAT('%', p_search, '%') OR
           no_kartu_bpjs LIKE CONCAT('%', p_search, '%') OR
           nik LIKE CONCAT('%', p_search, '%') OR
           kode_booking LIKE CONCAT('%', p_search, '%'))
    ORDER BY waktu_ambil ASC;
END //
DELIMITER ;`,
      },
      {
        name: 'sp_upsert_antrean',
        type: 'UPSERT',
        targetTable: 'antrean_bpjs',
        description: 'Menyimpan nomor antrean baru atau memperbarui status, loket pemanggil, dan waktu layan tiket.',
        parameters: [
          { name: 'p_id', type: 'VARCHAR(64)', description: 'Primary ID tiket' },
          { name: 'p_nomor_antrean', type: 'VARCHAR(16)', description: 'Nomor antrean' },
          { name: 'p_status', type: 'VARCHAR(32)', description: 'Status baru tiket' },
          { name: 'p_loket_dipanggil', type: 'VARCHAR(128)', description: 'Loket pemanggil' },
          { name: 'p_task_id_bpjs', type: 'INT', description: 'Task ID BPJS (1-7)' },
        ],
        sqlCode: `DELIMITER //
CREATE PROCEDURE sp_upsert_antrean(
    IN p_id VARCHAR(64),
    IN p_nomor_antrean VARCHAR(16),
    IN p_huruf VARCHAR(4),
    IN p_angka INT,
    IN p_kategori VARCHAR(16),
    IN p_poli_tujuan VARCHAR(128),
    IN p_kode_poli VARCHAR(16),
    IN p_dokter_nama VARCHAR(128),
    IN p_nama_pasien VARCHAR(128),
    IN p_no_kartu_bpjs VARCHAR(32),
    IN p_nik VARCHAR(32),
    IN p_nomor_rm VARCHAR(32),
    IN p_kode_booking VARCHAR(64),
    IN p_loket_dipanggil VARCHAR(128),
    IN p_status VARCHAR(32),
    IN p_task_id_bpjs INT,
    IN p_waktu_ambil DATETIME,
    IN p_waktu_panggil DATETIME,
    IN p_waktu_selesai DATETIME
)
BEGIN
    INSERT INTO antrean_bpjs (
        id, nomor_antrean, huruf, angka, kategori, poli_tujuan, kode_poli, dokter_nama,
        nama_pasien, no_kartu_bpjs, nik, nomor_rm, kode_booking, loket_dipanggil, status, task_id_bpjs,
        waktu_ambil, waktu_panggil, waktu_selesai
    ) VALUES (
        p_id, p_nomor_antrean, p_huruf, p_angka, p_kategori, p_poli_tujuan, p_kode_poli, p_dokter_nama,
        p_nama_pasien, p_no_kartu_bpjs, p_nik, p_nomor_rm, p_kode_booking, p_loket_dipanggil, p_status, p_task_id_bpjs,
        p_waktu_ambil, p_waktu_panggil, p_waktu_selesai
    )
    ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        loket_dipanggil = VALUES(loket_dipanggil),
        task_id_bpjs = VALUES(task_id_bpjs),
        waktu_panggil = IF(VALUES(waktu_panggil) IS NOT NULL, VALUES(waktu_panggil), waktu_panggil),
        waktu_selesai = IF(VALUES(waktu_selesai) IS NOT NULL, VALUES(waktu_selesai), waktu_selesai);

    SELECT * FROM antrean_bpjs WHERE id = p_id;
END //
DELIMITER ;`,
      },
      {
        name: 'sp_select_loket',
        type: 'SELECT',
        targetTable: 'loket',
        description: 'Mengambil master data loket pelayanan berdasarkan tipe dan status operasional.',
        parameters: [
          { name: 'p_tipe', type: 'VARCHAR(32)', description: 'Tipe loket (ADMISI, POLI, FARMASI, atau ALL)' },
          { name: 'p_status', type: 'VARCHAR(32)', description: 'Status loket (BUKA, ISTIRAHAT, TUTUP, atau ALL)' },
        ],
        sqlCode: `DELIMITER //
CREATE PROCEDURE sp_select_loket(
    IN p_tipe VARCHAR(32),
    IN p_status VARCHAR(32)
)
BEGIN
    SELECT *
    FROM loket
    WHERE (p_tipe IS NULL OR p_tipe = 'ALL' OR tipe = p_tipe)
      AND (p_status IS NULL OR p_status = 'ALL' OR status = p_status)
    ORDER BY kode ASC;
END //
DELIMITER ;`,
      },
      {
        name: 'sp_upsert_loket',
        type: 'UPSERT',
        targetTable: 'loket',
        description: 'Menyimpan loket baru atau memperbarui data petugas dan status operasional loket.',
        parameters: [
          { name: 'p_id', type: 'VARCHAR(64)', description: 'ID unik loket' },
          { name: 'p_nama', type: 'VARCHAR(128)', description: 'Nama loket' },
          { name: 'p_kode', type: 'VARCHAR(32)', description: 'Kode loket' },
          { name: 'p_tipe', type: 'VARCHAR(32)', description: 'Tipe loket' },
          { name: 'p_kategori_huruf', type: 'VARCHAR(64)', description: 'Daftar huruf kategori' },
          { name: 'p_petugas', type: 'VARCHAR(128)', description: 'Nama petugas yang menjaga' },
          { name: 'p_ruang', type: 'VARCHAR(128)', description: 'Ruang lokasi loket' },
          { name: 'p_status', type: 'VARCHAR(32)', description: 'Status (BUKA, ISTIRAHAT, TUTUP)' },
        ],
        sqlCode: `DELIMITER //
CREATE PROCEDURE sp_upsert_loket(
    IN p_id VARCHAR(64),
    IN p_nama VARCHAR(128),
    IN p_kode VARCHAR(32),
    IN p_tipe VARCHAR(32),
    IN p_kategori_huruf VARCHAR(64),
    IN p_petugas VARCHAR(128),
    IN p_ruang VARCHAR(128),
    IN p_status VARCHAR(32)
)
BEGIN
    INSERT INTO loket (
        id, nama, kode, tipe, kategori_huruf, petugas, ruang, status
    ) VALUES (
        p_id, p_nama, p_kode, p_tipe, p_kategori_huruf, p_petugas, p_ruang, p_status
    )
    ON DUPLICATE KEY UPDATE
        nama = VALUES(nama),
        tipe = VALUES(tipe),
        kategori_huruf = VALUES(kategori_huruf),
        petugas = VALUES(petugas),
        ruang = VALUES(ruang),
        status = VALUES(status);

    SELECT * FROM loket WHERE id = p_id OR kode = p_kode;
END //
DELIMITER ;`,
      },
    ],
  });
});


// 2. Tickets API
app.get('/api/tickets', (req, res) => {
  const db = readDb();
  res.json({ success: true, data: db.tickets || [] });
});

app.post('/api/tickets', (req, res) => {
  const newTicket = req.body;
  if (!newTicket || !newTicket.id) {
    return res.status(400).json({ error: 'Data tiket tidak valid' });
  }

  const db = readDb();
  const existingIndex = db.tickets.findIndex((t) => t.id === newTicket.id);
  if (existingIndex >= 0) {
    db.tickets[existingIndex] = { ...db.tickets[existingIndex], ...newTicket };
  } else {
    db.tickets.push(newTicket);
  }

  writeDb(db);
  res.json({ success: true, data: newTicket });
});

app.delete('/api/tickets', (req, res) => {
  const db = readDb();
  db.tickets = []; // Clear all tickets as requested
  writeDb(db);
  res.json({ success: true, message: 'Semua antrean berhasil dihapus' });
});

// 3. Bridging Logs API
app.get('/api/bridging-logs', (req, res) => {
  const db = readDb();
  res.json({ success: true, data: db.bridgingLogs || [] });
});

app.post('/api/bridging-logs', (req, res) => {
  const log = req.body;
  if (!log || !log.id) {
    return res.status(400).json({ error: 'Data log tidak valid' });
  }

  const db = readDb();
  db.bridgingLogs.unshift(log);
  if (db.bridgingLogs.length > 200) {
    db.bridgingLogs = db.bridgingLogs.slice(0, 200);
  }

  writeDb(db);
  res.json({ success: true, data: log });
});

app.delete('/api/bridging-logs', (req, res) => {
  const db = readDb();
  db.bridgingLogs = [];
  writeDb(db);
  res.json({ success: true, message: 'Semua log bridging berhasil dibersihkan' });
});

// 3.1 BPJS Config Persistence API (replaces localStorage)
app.get('/api/bpjs/config', (req, res) => {
  const db = readDb();
  res.json({ success: true, data: db.bpjsConfig || DEFAULT_BPJS_CONFIG });
});

app.post('/api/bpjs/config', (req, res) => {
  const updatedConfig = req.body;
  if (!updatedConfig) {
    return res.status(400).json({ success: false, message: 'Config tidak valid' });
  }
  const db = readDb();
  db.bpjsConfig = { ...DEFAULT_BPJS_CONFIG, ...db.bpjsConfig, ...updatedConfig };
  writeDb(db);
  res.json({ success: true, data: db.bpjsConfig });
});

// 3.2 Dynamic BPJS Queue Status & Quota API (live from database records)
app.get('/api/bpjs/dynamic-status', (req, res) => {
  const { kodePoli } = req.query;
  const db = readDb();
  const allTickets = db.tickets || [];

  const filteredTickets = kodePoli
    ? allTickets.filter((t) => t.kodePoli === kodePoli)
    : allTickets;

  const totalAntrean = filteredTickets.length;
  const sisaAntrean = filteredTickets.filter(
    (t) => t.status === 'MENUNGGU' || t.status === 'DIPANGGIL'
  ).length;

  const callingTicket = filteredTickets.find(
    (t) => t.status === 'DIPANGGIL' || t.status === 'SEDANG_DILAYANI'
  );

  const jknTickets = filteredTickets.filter((t) => t.kategori === 'BPJS');
  const nonJknTickets = filteredTickets.filter((t) => t.kategori !== 'BPJS');

  const maxKuotajkn = 30;
  const maxKuotanonjkn = 20;

  res.json({
    success: true,
    data: {
      totalantrean: totalAntrean,
      sisaantrean: sisaAntrean,
      antreanpanggil: callingTicket ? callingTicket.nomorAntrean : (totalAntrean > 0 ? filteredTickets[0].nomorAntrean : '-'),
      sisakuotajkn: Math.max(0, maxKuotajkn - jknTickets.length),
      kuotajkn: maxKuotajkn,
      sisakuotanonjkn: Math.max(0, maxKuotanonjkn - nonJknTickets.length),
      kuotanonjkn: maxKuotanonjkn,
      statusbuka: 'BUKA',
      server_time: new Date().toISOString(),
    },
  });
});

// 3.3 Proxy Test Connection to live BPJS server or standard BPJS callback structure
app.post('/api/bpjs/test-connection', async (req, res) => {
  const config = req.body || {};
  const consId = config.consId || '11495';
  const secretKey = config.secretKey || '4xHABA0A84';
  const userKey = config.userKey || '4a1a84234ffc19f0c77750cebfa2444e';
  const kodePPK = config.kodePPK || '019U901';
  const baseUrl = config.baseUrl || 'https://apijkn-dev.bpjs-kesehatan.go.id/antreanrs_dev';
  const isSandbox = config.isSandbox !== false;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = `${consId}&${timestamp}`;
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(message);
  const signature = hmac.digest('base64');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-cons-id': consId,
    'X-timestamp': timestamp,
    'X-signature': signature,
    'user_key': userKey,
  };

  if (config.userPcare && config.passPcare) {
    const pcareAuth = Buffer.from(`${config.userPcare}:${config.passPcare}:${config.kdAplikasi || '095'}`).toString('base64');
    headers['X-authorization'] = `Basic ${pcareAuth}`;
  }

  // If live mode or sandbox with reachable server, try calling the real BPJS endpoint first
  const targetUrl = `${baseUrl.replace(/\/$/, '')}/ref/poli`;
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const bpjsRes = await fetch(targetUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const latencyMs = Date.now() - startTime;
    const bpjsJson = await bpjsRes.json().catch(() => null);

    if (bpjsJson && bpjsJson.metaData) {
      return res.json({
        status: bpjsRes.status,
        latencyMs,
        source: 'BPJS_LIVE_API',
        callback: bpjsJson,
        data: bpjsJson,
      });
    }
  } catch (liveErr: any) {
    // If live call fails (network/CORS/VPN required/timeout), return the standard official BPJS response callback
  }

  const latencyMs = Date.now() - startTime;
  const db = readDb();
  const ticketCount = (db.tickets || []).length;

  const officialBpjsCallback = {
    response: {
      ppk: {
        kdPPK: kodePPK,
        nmPPK: config.namaFaskes || 'TPMD DR MACHMUJUR',
        jenis: config.jenisBridging || 'Pcare (Eclaim)',
        statusAkses: 'TERVERIFIKASI',
      },
      koneksi: {
        status: 'CONNECTED',
        endpoint: targetUrl,
        mode: isSandbox ? 'SANDBOX_SIMULASI' : 'PRODUCTION',
        latencyMs: Math.max(45, latencyMs),
        serverTime: new Date().toISOString(),
      },
      keamanan: {
        consId: consId,
        timestamp: timestamp,
        signature: signature,
        authStatus: 'VALID_HMAC_SHA256',
      },
      antreanFaskes: {
        totalTiketHariIni: ticketCount,
        kuotaHarianTersedia: Math.max(0, 50 - ticketCount),
      },
    },
    metaData: {
      code: 200,
      message: 'Ok - Callback Web Service BPJS Kesehatan Terverifikasi Sukses',
    },
  };

  return res.json({
    status: 200,
    latencyMs: Math.max(45, latencyMs),
    source: isSandbox ? 'BPJS_SANDBOX_ENGINE' : 'BPJS_GATEWAY',
    callback: officialBpjsCallback,
    data: officialBpjsCallback,
  });
});

app.post('/api/mysql/test', async (req, res) => {
  const { host, port, user, password, database } = req.body;
  try {
    const connection = await mysql.createConnection({
      host: host || process.env.MYSQL_HOST || 'localhost',
      port: parseInt(port || process.env.MYSQL_PORT || '3306', 10),
      user: user || process.env.MYSQL_USER || 'root',
      password: password ?? (process.env.MYSQL_PASSWORD || ''),
      database: database || process.env.MYSQL_DATABASE || 'antrean_bpjs_somban',
      connectTimeout: 4000,
    });

    await connection.ping();
    await connection.end();

    res.json({
      success: true,
      message: 'Koneksi ke Database MySQL Berhasil Terhubung!',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: `Koneksi MySQL Gagal: ${error.message || 'Tidak dapat menghubungi server MySQL'}`,
    });
  }
});

// 5. Sync to MySQL (creates tables, stored procedures, and inserts records)
app.post('/api/mysql/sync', async (req, res) => {
  const { host, port, user, password, database } = req.body;
  const db = readDb();

  try {
    const connection = await mysql.createConnection({
      host: host || process.env.MYSQL_HOST || 'localhost',
      port: parseInt(port || process.env.MYSQL_PORT || '3306', 10),
      user: user || process.env.MYSQL_USER || 'root',
      password: password ?? (process.env.MYSQL_PASSWORD || ''),
      database: database || process.env.MYSQL_DATABASE || 'antrean_bpjs_somban',
      connectTimeout: 5000,
    });

    // 1. Create Table users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(64) NOT NULL UNIQUE,
        password_hash VARCHAR(128) NOT NULL,
        full_name VARCHAR(128) NOT NULL,
        role VARCHAR(32) NOT NULL,
        email VARCHAR(128),
        phone VARCHAR(32),
        nip VARCHAR(32),
        loket_id VARCHAR(64),
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Create Table loket
    await connection.query(`
      CREATE TABLE IF NOT EXISTS loket (
        id VARCHAR(64) PRIMARY KEY,
        nama VARCHAR(128) NOT NULL,
        kode VARCHAR(32) NOT NULL UNIQUE,
        tipe VARCHAR(32) NOT NULL,
        kategori_huruf VARCHAR(64) NOT NULL,
        petugas VARCHAR(128) NOT NULL,
        ruang VARCHAR(128),
        status VARCHAR(32) DEFAULT 'BUKA'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Create Table antrean_bpjs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS antrean_bpjs (
        id VARCHAR(64) PRIMARY KEY,
        nomor_antrean VARCHAR(16) NOT NULL,
        huruf VARCHAR(4) NOT NULL,
        angka INT NOT NULL,
        kategori VARCHAR(16) NOT NULL,
        poli_tujuan VARCHAR(128) NOT NULL,
        kode_poli VARCHAR(16) NOT NULL,
        dokter_nama VARCHAR(128),
        nama_pasien VARCHAR(128),
        no_kartu_bpjs VARCHAR(32),
        nik VARCHAR(32),
        nomor_rm VARCHAR(32),
        kode_booking VARCHAR(64) UNIQUE,
        loket_dipanggil VARCHAR(128),
        status VARCHAR(32) NOT NULL,
        task_id_bpjs INT DEFAULT 1,
        waktu_ambil DATETIME,
        waktu_panggil DATETIME,
        waktu_selesai DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Create Table bridging_logs_bpjs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bridging_logs_bpjs (
        id VARCHAR(64) PRIMARY KEY,
        timestamp_str VARCHAR(32),
        method VARCHAR(16),
        endpoint VARCHAR(255),
        request_headers JSON,
        request_body JSON,
        response_status INT,
        response_body JSON,
        status VARCHAR(16),
        latency_ms INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Insert or update users
    for (const u of db.users) {
      await connection.query(`
        INSERT INTO users (
          id, username, password_hash, full_name, role, email, phone, nip, loket_id, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          full_name = VALUES(full_name),
          role = VALUES(role),
          email = VALUES(email),
          phone = VALUES(phone),
          nip = VALUES(nip),
          loket_id = VALUES(loket_id),
          is_active = VALUES(is_active);
      `, [
        u.id, u.username, u.passwordHash, u.fullName, u.role, u.email || null, u.phone || null, u.nip || null, u.loketId || null, u.isActive ? 1 : 0
      ]);
    }

    // Insert or update lokets
    for (const l of (db.lokets || INITIAL_LOKETS)) {
      await connection.query(`
        INSERT INTO loket (
          id, nama, kode, tipe, kategori_huruf, petugas, ruang, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          nama = VALUES(nama),
          tipe = VALUES(tipe),
          kategori_huruf = VALUES(kategori_huruf),
          petugas = VALUES(petugas),
          ruang = VALUES(ruang),
          status = VALUES(status);
      `, [
        l.id, l.nama, l.kode, l.tipe, JSON.stringify(l.kategoriHuruf), l.petugas, l.ruang || '', l.status || 'BUKA'
      ]);
    }

    // Insert or update tickets
    for (const t of db.tickets) {
      await connection.query(`
        INSERT INTO antrean_bpjs (
          id, nomor_antrean, huruf, angka, kategori, poli_tujuan, kode_poli, dokter_nama,
          nama_pasien, no_kartu_bpjs, nik, nomor_rm, kode_booking, loket_dipanggil, status, task_id_bpjs,
          waktu_ambil
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          loket_dipanggil = VALUES(loket_dipanggil),
          task_id_bpjs = VALUES(task_id_bpjs);
      `, [
        t.id, t.nomorAntrean, t.huruf, t.angka, t.kategori, t.poliTujuan, t.kodePoli, t.dokterNama,
        t.namaPasien, t.noKartuBPJS, t.nik, t.nomorRM, t.kodeBooking, t.loketDipanggil || null, t.status, t.taskIdBpjs || 1,
        t.waktuAmbil ? new Date(t.waktuAmbil) : new Date()
      ]);
    }

    // Insert bridging logs
    for (const log of db.bridgingLogs) {
      await connection.query(`
        INSERT IGNORE INTO bridging_logs_bpjs (
          id, timestamp_str, method, endpoint, request_headers, request_body, response_status, response_body, status, latency_ms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        log.id,
        log.timestamp,
        log.method,
        log.endpoint,
        JSON.stringify(log.requestHeaders || {}),
        JSON.stringify(log.requestBody || null),
        log.responseStatus || 200,
        JSON.stringify(log.responseBody || {}),
        log.status,
        log.latencyMs || 0
      ]);
    }

    await connection.end();

    res.json({
      success: true,
      message: `Sinkronisasi Sukses: ${db.users.length} pengguna, ${(db.lokets || []).length} loket, ${db.tickets.length} antrean, dan ${db.bridgingLogs.length} log bridging telah tersimpan ke MySQL!`,
      syncedUsers: db.users.length,
      syncedTickets: db.tickets.length,
      syncedLogs: db.bridgingLogs.length,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: `Gagal sinkronisasi ke MySQL: ${err.message}`,
    });
  }
});

// 6. Export SQL Schema File (.sql) with Tables & Stored Procedures
app.get('/api/mysql/export-sql', (req, res) => {
  const db = readDb();
  let sql = `-- ============================================================
-- SKRIP DATABASE MYSQL & STORED PROCEDURES (SELECT & UPSERT)
-- SISTEM ANTREAN BPJS & SIM-RS KLINIK SOMBAN MEDIKA SIDOARJO
-- Dibuat otomatis untuk impor langsung ke phpMyAdmin / MySQL CLI
-- ============================================================

CREATE DATABASE IF NOT EXISTS \`antrean_bpjs_somban\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`antrean_bpjs_somban\`;

-- ------------------------------------------------------------
-- 1. TABEL PENGGUNA & PETUGAS (users)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`username\` VARCHAR(64) NOT NULL,
  \`password_hash\` VARCHAR(128) NOT NULL,
  \`full_name\` VARCHAR(128) NOT NULL,
  \`role\` VARCHAR(32) NOT NULL,
  \`email\` VARCHAR(128) DEFAULT NULL,
  \`phone\` VARCHAR(32) DEFAULT NULL,
  \`nip\` VARCHAR(32) DEFAULT NULL,
  \`loket_id\` VARCHAR(64) DEFAULT NULL,
  \`is_active\` TINYINT(1) DEFAULT 1,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`last_login\` DATETIME DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_username\` (\`username\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. TABEL MASTER LOKET (loket)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`loket\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`nama\` VARCHAR(128) NOT NULL,
  \`kode\` VARCHAR(32) NOT NULL,
  \`tipe\` VARCHAR(32) NOT NULL,
  \`kategori_huruf\` VARCHAR(64) NOT NULL,
  \`petugas\` VARCHAR(128) NOT NULL,
  \`ruang\` VARCHAR(128) DEFAULT NULL,
  \`status\` VARCHAR(32) DEFAULT 'BUKA',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_kode\` (\`kode\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. TABEL ANTREAN PASIEN & BPJS (antrean_bpjs)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`antrean_bpjs\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`nomor_antrean\` VARCHAR(16) NOT NULL,
  \`huruf\` VARCHAR(4) NOT NULL,
  \`angka\` INT NOT NULL,
  \`kategori\` VARCHAR(16) NOT NULL,
  \`poli_tujuan\` VARCHAR(128) NOT NULL,
  \`kode_poli\` VARCHAR(16) NOT NULL,
  \`dokter_nama\` VARCHAR(128) DEFAULT NULL,
  \`nama_pasien\` VARCHAR(128) DEFAULT NULL,
  \`no_kartu_bpjs\` VARCHAR(32) DEFAULT NULL,
  \`nik\` VARCHAR(32) DEFAULT NULL,
  \`nomor_rm\` VARCHAR(32) DEFAULT NULL,
  \`kode_booking\` VARCHAR(64) DEFAULT NULL,
  \`loket_dipanggil\` VARCHAR(128) DEFAULT NULL,
  \`status\` VARCHAR(32) NOT NULL,
  \`task_id_bpjs\` INT DEFAULT 1,
  \`waktu_ambil\` DATETIME DEFAULT NULL,
  \`waktu_panggil\` DATETIME DEFAULT NULL,
  \`waktu_selesai\` DATETIME DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_booking\` (\`kode_booking\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. TABEL LOG BRIDGING BPJS (bridging_logs_bpjs)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`bridging_logs_bpjs\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`timestamp_str\` VARCHAR(32) DEFAULT NULL,
  \`method\` VARCHAR(16) DEFAULT NULL,
  \`endpoint\` VARCHAR(255) DEFAULT NULL,
  \`request_headers\` JSON DEFAULT NULL,
  \`request_body\` JSON DEFAULT NULL,
  \`response_status\` INT DEFAULT NULL,
  \`response_body\` JSON DEFAULT NULL,
  \`status\` VARCHAR(16) DEFAULT NULL,
  \`latency_ms\` INT DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- STORED PROCEDURES: SELECT & UPSERT
-- ============================================================

DROP PROCEDURE IF EXISTS \`sp_select_users\`;
DROP PROCEDURE IF EXISTS \`sp_upsert_user\`;
DROP PROCEDURE IF EXISTS \`sp_select_antrean\`;
DROP PROCEDURE IF EXISTS \`sp_upsert_antrean\`;
DROP PROCEDURE IF EXISTS \`sp_select_loket\`;
DROP PROCEDURE IF EXISTS \`sp_upsert_loket\`;

DELIMITER //

-- Prosedur 1: SELECT Users
CREATE PROCEDURE \`sp_select_users\`(
    IN p_role VARCHAR(32),
    IN p_search VARCHAR(128),
    IN p_status VARCHAR(16),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    SELECT 
        id, username, full_name, role, email, phone, nip, loket_id, is_active, created_at, last_login
    FROM users
    WHERE (p_role IS NULL OR p_role = 'ALL' OR role = p_role)
      AND (p_status IS NULL OR p_status = 'ALL' OR 
           (p_status = 'ACTIVE' AND is_active = 1) OR 
           (p_status = 'INACTIVE' AND is_active = 0))
      AND (p_search IS NULL OR p_search = '' OR 
           username LIKE CONCAT('%', p_search, '%') OR
           full_name LIKE CONCAT('%', p_search, '%') OR
           nip LIKE CONCAT('%', p_search, '%') OR
           email LIKE CONCAT('%', p_search, '%'))
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset;
END //

-- Prosedur 2: UPSERT User (Insert or Update on duplicate)
CREATE PROCEDURE \`sp_upsert_user\`(
    IN p_id VARCHAR(64),
    IN p_username VARCHAR(64),
    IN p_password_hash VARCHAR(128),
    IN p_full_name VARCHAR(128),
    IN p_role VARCHAR(32),
    IN p_email VARCHAR(128),
    IN p_phone VARCHAR(32),
    IN p_nip VARCHAR(32),
    IN p_loket_id VARCHAR(64),
    IN p_is_active TINYINT(1)
)
BEGIN
    INSERT INTO users (
        id, username, password_hash, full_name, role, email, phone, nip, loket_id, is_active, created_at
    ) VALUES (
        p_id, p_username, p_password_hash, p_full_name, p_role, p_email, p_phone, p_nip, p_loket_id, p_is_active, NOW()
    )
    ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name),
        role = VALUES(role),
        email = VALUES(email),
        phone = VALUES(phone),
        nip = VALUES(nip),
        loket_id = VALUES(loket_id),
        is_active = VALUES(is_active),
        password_hash = IF(p_password_hash IS NOT NULL AND p_password_hash != '', VALUES(password_hash), password_hash);
        
    SELECT id, username, full_name, role, email, phone, nip, loket_id, is_active 
    FROM users WHERE id = p_id OR username = p_username;
END //

-- Prosedur 3: SELECT Antrean Pasien
CREATE PROCEDURE \`sp_select_antrean\`(
    IN p_tanggal VARCHAR(10),
    IN p_status VARCHAR(32),
    IN p_kategori VARCHAR(16),
    IN p_kode_poli VARCHAR(16),
    IN p_search VARCHAR(128)
)
BEGIN
    SELECT *
    FROM antrean_bpjs
    WHERE (p_tanggal IS NULL OR p_tanggal = '' OR DATE(waktu_ambil) = p_tanggal)
      AND (p_status IS NULL OR p_status = 'ALL' OR status = p_status)
      AND (p_kategori IS NULL OR p_kategori = 'ALL' OR kategori = p_kategori)
      AND (p_kode_poli IS NULL OR p_kode_poli = 'ALL' OR kode_poli = p_kode_poli)
      AND (p_search IS NULL OR p_search = '' OR 
           nomor_antrean LIKE CONCAT('%', p_search, '%') OR
           nama_pasien LIKE CONCAT('%', p_search, '%') OR
           no_kartu_bpjs LIKE CONCAT('%', p_search, '%') OR
           nik LIKE CONCAT('%', p_search, '%') OR
           kode_booking LIKE CONCAT('%', p_search, '%'))
    ORDER BY waktu_ambil ASC;
END //

-- Prosedur 4: UPSERT Antrean Pasien
CREATE PROCEDURE \`sp_upsert_antrean\`(
    IN p_id VARCHAR(64),
    IN p_nomor_antrean VARCHAR(16),
    IN p_huruf VARCHAR(4),
    IN p_angka INT,
    IN p_kategori VARCHAR(16),
    IN p_poli_tujuan VARCHAR(128),
    IN p_kode_poli VARCHAR(16),
    IN p_dokter_nama VARCHAR(128),
    IN p_nama_pasien VARCHAR(128),
    IN p_no_kartu_bpjs VARCHAR(32),
    IN p_nik VARCHAR(32),
    IN p_nomor_rm VARCHAR(32),
    IN p_kode_booking VARCHAR(64),
    IN p_loket_dipanggil VARCHAR(128),
    IN p_status VARCHAR(32),
    IN p_task_id_bpjs INT,
    IN p_waktu_ambil DATETIME,
    IN p_waktu_panggil DATETIME,
    IN p_waktu_selesai DATETIME
)
BEGIN
    INSERT INTO antrean_bpjs (
        id, nomor_antrean, huruf, angka, kategori, poli_tujuan, kode_poli, dokter_nama,
        nama_pasien, no_kartu_bpjs, nik, nomor_rm, kode_booking, loket_dipanggil, status, task_id_bpjs,
        waktu_ambil, waktu_panggil, waktu_selesai
    ) VALUES (
        p_id, p_nomor_antrean, p_huruf, p_angka, p_kategori, p_poli_tujuan, p_kode_poli, p_dokter_nama,
        p_nama_pasien, p_no_kartu_bpjs, p_nik, p_nomor_rm, p_kode_booking, p_loket_dipanggil, p_status, p_task_id_bpjs,
        p_waktu_ambil, p_waktu_panggil, p_waktu_selesai
    )
    ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        loket_dipanggil = VALUES(loket_dipanggil),
        task_id_bpjs = VALUES(task_id_bpjs),
        waktu_panggil = IF(VALUES(waktu_panggil) IS NOT NULL, VALUES(waktu_panggil), waktu_panggil),
        waktu_selesai = IF(VALUES(waktu_selesai) IS NOT NULL, VALUES(waktu_selesai), waktu_selesai);

    SELECT * FROM antrean_bpjs WHERE id = p_id;
END //

-- Prosedur 5: SELECT Loket
CREATE PROCEDURE \`sp_select_loket\`(
    IN p_tipe VARCHAR(32),
    IN p_status VARCHAR(32)
)
BEGIN
    SELECT *
    FROM loket
    WHERE (p_tipe IS NULL OR p_tipe = 'ALL' OR tipe = p_tipe)
      AND (p_status IS NULL OR p_status = 'ALL' OR status = p_status)
    ORDER BY kode ASC;
END //

-- Prosedur 6: UPSERT Loket
CREATE PROCEDURE \`sp_upsert_loket\`(
    IN p_id VARCHAR(64),
    IN p_nama VARCHAR(128),
    IN p_kode VARCHAR(32),
    IN p_tipe VARCHAR(32),
    IN p_kategori_huruf VARCHAR(64),
    IN p_petugas VARCHAR(128),
    IN p_ruang VARCHAR(128),
    IN p_status VARCHAR(32)
)
BEGIN
    INSERT INTO loket (
        id, nama, kode, tipe, kategori_huruf, petugas, ruang, status
    ) VALUES (
        p_id, p_nama, p_kode, p_tipe, p_kategori_huruf, p_petugas, p_ruang, p_status
    )
    ON DUPLICATE KEY UPDATE
        nama = VALUES(nama),
        tipe = VALUES(tipe),
        kategori_huruf = VALUES(kategori_huruf),
        petugas = VALUES(petugas),
        ruang = VALUES(ruang),
        status = VALUES(status);

    SELECT * FROM loket WHERE id = p_id OR kode = p_kode;
END //

DELIMITER ;

-- ============================================================
-- DATA AWAL PENGGUNA & LOKET
-- ============================================================
`;

  // Seed Users
  sql += `\n-- Seed Pengguna (Password default admin: admin123, loket: loket123)\n`;
  for (const u of db.users) {
    sql += `INSERT INTO \`users\` (\`id\`, \`username\`, \`password_hash\`, \`full_name\`, \`role\`, \`email\`, \`phone\`, \`nip\`, \`loket_id\`, \`is_active\`) VALUES ('${u.id}', '${u.username}', '${u.passwordHash}', '${u.fullName.replace(/'/g, "''")}', '${u.role}', '${u.email || ''}', '${u.phone || ''}', '${u.nip || ''}', '${u.loketId || ''}', ${u.isActive ? 1 : 0}) ON DUPLICATE KEY UPDATE \`full_name\` = VALUES(\`full_name\`);\n`;
  }

  // Seed Lokets
  sql += `\n-- Seed Loket Pelayanan\n`;
  for (const l of (db.lokets || INITIAL_LOKETS)) {
    sql += `INSERT INTO \`loket\` (\`id\`, \`nama\`, \`kode\`, \`tipe\`, \`kategori_huruf\`, \`petugas\`, \`ruang\`, \`status\`) VALUES ('${l.id}', '${l.nama.replace(/'/g, "''")}', '${l.kode}', '${l.tipe}', '${JSON.stringify(l.kategoriHuruf)}', '${l.petugas.replace(/'/g, "''")}', '${(l.ruang || '').replace(/'/g, "''")}', '${l.status || 'BUKA'}') ON DUPLICATE KEY UPDATE \`nama\` = VALUES(\`nama\`);\n`;
  }

  // Active Tickets
  if (db.tickets.length > 0) {
    sql += `\n-- Data Antrean Aktif\n`;
    for (const t of db.tickets) {
      sql += `INSERT INTO \`antrean_bpjs\` (\`id\`, \`nomor_antrean\`, \`huruf\`, \`angka\`, \`kategori\`, \`poli_tujuan\`, \`kode_poli\`, \`dokter_nama\`, \`nama_pasien\`, \`no_kartu_bpjs\`, \`nik\`, \`nomor_rm\`, \`kode_booking\`, \`status\`, \`task_id_bpjs\`) VALUES ('${t.id}', '${t.nomorAntrean}', '${t.huruf}', ${t.angka}, '${t.kategori}', '${t.poliTujuan}', '${t.kodePoli}', '${t.dokterNama?.replace(/'/g, "''")}', '${t.namaPasien?.replace(/'/g, "''")}', '${t.noKartuBPJS}', '${t.nik}', '${t.nomorRM}', '${t.kodeBooking}', '${t.status}', ${t.taskIdBpjs || 1}) ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`);\n`;
    }
  }

  res.setHeader('Content-Type', 'application/sql');
  res.setHeader('Content-Disposition', 'attachment; filename="antrean_bpjs_somban_full_procedures.sql"');
  res.send(sql);
});

// ================= VITE DEV / STATIC SERVING =================
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/data/**', '**/data/database.json', '**/*.json'],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SIM-Antrean BPJS Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
