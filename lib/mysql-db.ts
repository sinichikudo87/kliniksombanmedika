import mysql from 'mysql2/promise';
import { QueueItem, Patient, BpjsBridgingConfig, AuditSecurityLog, BridgingLog, PoliInfo } from '@/types/queue';
import fs from 'fs';
import path from 'path';

export interface MySqlConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
  ssl?: boolean;
}

// Production VPS configuration - MySQL runs locally on the VPS
export const getDefaultMySqlConfig = (): MySqlConfig => {
  const host = process.env.MYSQL_HOST || 'localhost';
  const port = process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306;
  const user = process.env.MYSQL_USER || 'jimbrink';
  const password = process.env.MYSQL_PASSWORD || 'Sh1nratensey86';
  const database = process.env.MYSQL_DATABASE || 'klinik_somban_medika_xx26';
  const ssl = process.env.MYSQL_SSL === 'true'; // false for localhost VPS

  return {
    host,
    port,
    user,
    password,
    database,
    ssl,
  };
};

let activePool: mysql.Pool | null = null;
let currentConfig: MySqlConfig = getDefaultMySqlConfig();
let lastConnectionStatus: {
  connected: boolean;
  version?: string;
  error?: string;
  testedAt?: string;
  latencyMs?: number;
} = {
  connected: false,
  error: 'Belum diuji koneksi MySQL',
};

function mapPoliRow(r: any): PoliInfo {
  return {
    kode: r.kode,
    nama: r.nama,
    prefix: r.prefix,
    dokter: r.dokter_nama || '',
    sip: r.sip || '',
    ruang: r.ruang || '',
    durasiRataRataMenit: r.durasi_rata_rata_menit || 10,
    kuotaTotal: r.kuota_total || 50,
    kuotaTerpakai: r.kuota_terpakai || 0,
    badgeColor: r.badge_color || 'emerald',
    iconName: r.icon_name || 'Stethoscope',
  };
}

function mapConfigRow(row: any) {
  const baseUrl = row.base_url || 'https://apijkn-dev.bpjs-kesehatan.go.id/antreanfktp_dev';

  return {
    id: row.id,
    kdFaskes: row.kd_faskes,
    namaFaskes: row.nama_faskes,
    consId: row.cons_id,
    secretKey: row.secret_key,
    userKey: row.user_key,
    userPcareDev: row.dev_user,
    passPcareDev: row.dev_pass,
    environment: row.environment || 'tester',
    baseUrl,
    isOnline: row.is_online !== 0,
  };
}

/**
 * Get or create MySQL Connection Pool
 */
export function getMySqlPool(customConfig?: Partial<MySqlConfig>): mysql.Pool {
  if (customConfig) {
    currentConfig = { ...currentConfig, ...customConfig };
    if (activePool) {
      activePool.end().catch(() => {});
      activePool = null;
    }
  }

  if (!activePool) {
    activePool = mysql.createPool({
      host: currentConfig.host || 'localhost',
      port: currentConfig.port || 3306,
      user: currentConfig.user || 'jimbrink',
      password: currentConfig.password || 'Sh1nratensey86',
      database: currentConfig.database || 'klinik_somban_medika_xx26',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000,
      ssl: currentConfig.ssl ? { rejectUnauthorized: false } : undefined,
    });
  }

  return activePool;
}

/**
 * Test MySQL connection and retrieve server version directly from MySQL
 */
export async function testMySqlConnection(config?: Partial<MySqlConfig>) {
  const targetConfig = config ? { ...currentConfig, ...config } : currentConfig;
  const start = performance.now();

  try {
    const pool = getMySqlPool(config);
    const [rows]: [any, any] = await pool.query('SELECT VERSION() as version, DATABASE() as db, USER() as user');
    const latency = Math.round(performance.now() - start);

    lastConnectionStatus = {
      connected: true,
      version: rows[0]?.version || 'MySQL 8.0',
      testedAt: new Date().toISOString(),
      latencyMs: latency,
      error: undefined,
    };

    return {
      success: true,
      connected: true,
      version: rows[0]?.version,
      database: rows[0]?.db,
      user: rows[0]?.user,
      latencyMs: latency,
      host: targetConfig.host,
      port: targetConfig.port,
    };
  } catch (error: any) {
    const latency = Math.round(performance.now() - start);
    lastConnectionStatus = {
      connected: false,
      error: `Koneksi ke ${targetConfig.host}:${targetConfig.port} gagal: ${error.message}`,
      testedAt: new Date().toISOString(),
      latencyMs: latency,
    };

    return {
      success: false,
      connected: false,
      error: `Koneksi ke ${targetConfig.host}:${targetConfig.port} gagal: ${error.message}. Pastikan MySQL service aktif di VPS Anda.`,
      latencyMs: latency,
      host: targetConfig.host,
      port: targetConfig.port,
    };
  }
}

/**
 * Direct query execution on MySQL
 */
export async function executeQuery(sql: string, params: any[] = []) {
  const pool = getMySqlPool();
  const [results] = await pool.query(sql, params);
  return results;
}

/**
 * Initialize MySQL tables schema and initial seed data directly in MySQL
 */
export async function initMySqlSchema() {
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      nama_lengkap VARCHAR(100) NOT NULL,
      role ENUM('ADMIN', 'ADMIN_BRIDGING', 'ADMIN_RME', 'DOKTER', 'PETUGAS_LOKET', 'PETUGAS_PENDAFTARAN', 'PETUGAS_FARMASI') NOT NULL,
      nip VARCHAR(30) NULL,
      kd_faskes VARCHAR(20) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      last_login TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS poliklinik (
      kode VARCHAR(10) PRIMARY KEY,
      nama VARCHAR(100) NOT NULL,
      prefix VARCHAR(5) NOT NULL,
      dokter_nama VARCHAR(100) NOT NULL DEFAULT '',
      sip VARCHAR(50) NULL,
      ruang VARCHAR(50) NOT NULL,
      durasi_rata_rata_menit INT DEFAULT 10,
      kuota_total INT DEFAULT 50,
      kuota_terpakai INT DEFAULT 0,
      badge_color VARCHAR(30) DEFAULT 'emerald',
      icon_name VARCHAR(50) DEFAULT 'Stethoscope'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS patients (
      id VARCHAR(50) PRIMARY KEY,
      nik VARCHAR(16) UNIQUE NOT NULL,
      no_bpjs VARCHAR(13) NULL,
      nama VARCHAR(150) NOT NULL,
      tgl_lahir DATE NOT NULL,
      jenis_kelamin ENUM('L', 'P') NOT NULL,
      no_hp VARCHAR(20) NULL,
      alamat TEXT NULL,
      status_bpjs ENUM('AKTIF', 'NON_AKTIF', 'PENANGGUHAN') DEFAULT 'AKTIF',
      jenis_peserta VARCHAR(100) NULL,
      faskes_tingkat_1 VARCHAR(150) NULL,
      kelas_rawat VARCHAR(50) NULL,
      encrypted_data LONGTEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_nik (nik),
      INDEX idx_bpjs (no_bpjs)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS queues (
      id VARCHAR(50) PRIMARY KEY,
      nomor_antrean VARCHAR(20) NOT NULL,
      prefix VARCHAR(5) NOT NULL,
      nomor_urut INT NOT NULL,
      tipe_pasien ENUM('BPJS', 'UMUM') NOT NULL,
      poli_kode VARCHAR(10) NOT NULL,
      poli_nama VARCHAR(100) NOT NULL,
      dokter_nama VARCHAR(100) NULL,
      ruang_nama VARCHAR(50) NULL,
      patient_id VARCHAR(50) NULL,
      nik VARCHAR(16) NOT NULL,
      no_bpjs VARCHAR(13) NULL,
      nama_pasien VARCHAR(150) NOT NULL,
      status ENUM('MENUNGGU', 'DIPANGGIL', 'DILAYANI', 'SELESAI', 'DILEWATI', 'BATAL') DEFAULT 'MENUNGGU',
      waktu_daftar TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      waktu_dipanggil TIMESTAMP NULL,
      waktu_mulai_layanan TIMESTAMP NULL,
      waktu_selesai TIMESTAMP NULL,
      estimasi_waktu_tunggu_menit INT DEFAULT 10,
      estimasi_jam_panggil VARCHAR(20) NULL,
      bpjs_task_id INT DEFAULT 1,
      kode_booking VARCHAR(50) NULL,
      keluhan TEXT NULL,
      is_synced_bpjs BOOLEAN DEFAULT FALSE,
      panggilan_ke INT DEFAULT 0,
      INDEX idx_poli_status (poli_kode, status),
      INDEX idx_waktu_daftar (waktu_daftar)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS security_logs (
      id VARCHAR(50) PRIMARY KEY,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      actor VARCHAR(100) NOT NULL,
      action ENUM('ENCRYPT', 'DECRYPT', 'EXPORT', 'KEY_ROTATE', 'ACCESS_RECORD', 'LOGIN', 'LOGOUT') NOT NULL,
      target_patient_id VARCHAR(50) NULL,
      status ENUM('SUCCESS', 'DENIED') NOT NULL,
      ip_address VARCHAR(50) NULL,
      details TEXT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS bridging_logs (
      id VARCHAR(50) PRIMARY KEY,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      endpoint VARCHAR(255) NOT NULL,
      method VARCHAR(10) NOT NULL,
      request_header JSON NULL,
      request_payload JSON NULL,
      response_status INT NOT NULL,
      response_payload JSON NULL,
      duration_ms INT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS faskes_config (
      id VARCHAR(50) PRIMARY KEY,
      kd_faskes VARCHAR(20) NOT NULL,
      nama_faskes VARCHAR(150) NOT NULL,
      cons_id VARCHAR(50) NOT NULL,
      secret_key VARCHAR(100) NOT NULL,
      user_key VARCHAR(100) NOT NULL,
      dev_user VARCHAR(50) NULL,
      dev_pass VARCHAR(50) NULL,
      environment ENUM('tester', 'production') DEFAULT 'tester',
      base_url VARCHAR(255) NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    INSERT INTO users (id, username, password_hash, nama_lengkap, role, nip, kd_faskes, is_active)
    VALUES
      ('usr-1', '0195U091-dev', '000000', 'Operator Bridging Antrean BPJS (Mobile JKN)', 'ADMIN_BRIDGING', '198805122010011001', '019U901', 1),
      ('usr-2', 'admin', '000000', 'Administrator Rekam Medis (RME)', 'ADMIN_RME', '199003202015022002', '019U901', 1),
      ('usr-3', 'dr.machmujur', '000000', 'Dokter Pemeriksa', 'DOKTER', '197508152002121003', '019U901', 1),
      ('usr-4', 'loket01', '000000', 'Petugas Pendaftaran Loket 01', 'PETUGAS_LOKET', '199511252019032004', '019U901', 1),
      ('usr-5', 'farmasi01', '000000', 'Petugas Farmasi & Apotek', 'PETUGAS_FARMASI', '199204102017011005', '019U901', 1)
    ON DUPLICATE KEY UPDATE nama_lengkap = VALUES(nama_lengkap);

    INSERT INTO poliklinik (kode, nama, prefix, dokter_nama, sip, ruang, durasi_rata_rata_menit, kuota_total, kuota_terpakai, badge_color, icon_name)
    VALUES
      ('UMU', 'Poli Umum', 'A', 'Dokter Pemeriksa', '', 'Ruang 01 (Lantai 1)', 10, 60, 0, 'emerald', 'Stethoscope'),
      ('GIG', 'Poli Gigi & Mulut', 'B', 'drg. Siti Nurhaliza', '', 'Ruang 02 (Lantai 1)', 15, 30, 0, 'blue', 'Smile'),
      ('KIA', 'Poli KIA & KB', 'C', 'Bdn. Rahmawati, S.Tr.Keb', '', 'Ruang 03 (Lantai 1)', 12, 40, 0, 'purple', 'HeartPulse'),
      ('FAR', 'Apotek & Farmasi', 'F', 'Apt. Hendra Pratama, S.Farm', '', 'Loket Farmasi Utama', 6, 100, 0, 'amber', 'Pill')
    ON DUPLICATE KEY UPDATE nama = VALUES(nama);

    INSERT INTO faskes_config (id, kd_faskes, nama_faskes, cons_id, secret_key, user_key, dev_user, dev_pass, environment, base_url)
    VALUES (
      'cfg-default', '019U901', 'KLINIK SOMBAN MEDIKA', '11495', '4xHABA0A84',
      '4a1a84234ffc19f0c77750cebfa2444e', '0195U091-dev', 'Dev1234#', 'tester',
      'https://apijkn-dev.bpjs-kesehatan.go.id/antreanfktp_dev'
    ) ON DUPLICATE KEY UPDATE base_url = IF(base_url LIKE '%vclaim%', 'https://apijkn-dev.bpjs-kesehatan.go.id/antreanfktp_dev', base_url);

    UPDATE faskes_config SET base_url = 'https://apijkn-dev.bpjs-kesehatan.go.id/antreanfktp_dev' WHERE base_url LIKE '%vclaim%' OR base_url = '' OR base_url IS NULL;
  `;

  try {
    const pool = getMySqlPool();
    const statements = schemaSql.split(';').map((s) => s.trim()).filter(Boolean);
    for (const sql of statements) {
      await pool.query(sql);
    }
    return { success: true, message: 'Schema tabel MySQL berhasil diverifikasi/dibuat di database' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Complete MySQL database service (Direct MySQL only - No Local Storage / No In-Memory Fallback)
 */
export const mySqlDb = {
  getStatus() {
    return {
      ...lastConnectionStatus,
      config: {
        host: currentConfig.host,
        port: currentConfig.port,
        user: currentConfig.user,
        database: currentConfig.database,
        ssl: currentConfig.ssl,
      },
    };
  },

  async getAllData(): Promise<{
    source: 'MYSQL';
    patients: Patient[];
    queues: QueueItem[];
    config: any;
    securityLogs: AuditSecurityLog[];
    bridgingLogs: BridgingLog[];
    poliList: PoliInfo[];
  }> {
    try {
      const pool = getMySqlPool();
      const [patients]: [any, any] = await pool.query('SELECT * FROM patients ORDER BY created_at DESC');
      const [queues]: [any, any] = await pool.query('SELECT * FROM queues ORDER BY waktu_daftar ASC');
      const [configRows]: [any, any] = await pool.query('SELECT * FROM faskes_config LIMIT 1');
      const [secLogs]: [any, any] = await pool.query('SELECT * FROM security_logs ORDER BY timestamp DESC LIMIT 50');
      const [brLogs]: [any, any] = await pool.query('SELECT * FROM bridging_logs ORDER BY timestamp DESC LIMIT 50');
      const [poliRows]: [any, any] = await pool.query('SELECT * FROM poliklinik ORDER BY prefix ASC');

      lastConnectionStatus.connected = true;
      lastConnectionStatus.testedAt = new Date().toISOString();
      lastConnectionStatus.error = undefined;

      return {
        source: 'MYSQL',
        patients: (patients || []).map((p: any) => ({
          id: p.id,
          nik: p.nik,
          noBpjs: p.no_bpjs || '',
          nama: p.nama,
          tglLahir: p.tgl_lahir ? new Date(p.tgl_lahir).toISOString().split('T')[0] : '',
          jenisKelamin: p.jenis_kelamin || 'L',
          noHp: p.no_hp || '',
          alamat: p.alamat || '',
          statusBpjs: p.status_bpjs || 'AKTIF',
          jenisPeserta: p.jenis_peserta || '',
          faskesTingkat1: p.faskes_tingkat_1 || '',
          kelasRawat: p.kelas_rawat || '',
          createdAt: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
          encryptedData: p.encrypted_data || '',
        })),
        queues: (queues || []).map((q: any) => ({
          id: q.id,
          nomorAntrean: q.nomor_antrean,
          prefix: q.prefix,
          nomorUrut: q.nomor_urut,
          tipePasien: q.tipe_pasien,
          poliKode: q.poli_kode,
          poliNama: q.poli_nama,
          dokterNama: q.dokter_nama || '',
          ruangNama: q.ruang_nama || '',
          patientId: q.patient_id,
          nik: q.nik,
          noBpjs: q.no_bpjs,
          namaPasien: q.nama_pasien,
          status: q.status,
          waktuDaftar: q.waktu_daftar ? new Date(q.waktu_daftar).toISOString() : new Date().toISOString(),
          waktuDipanggil: q.waktu_dipanggil ? new Date(q.waktu_dipanggil).toISOString() : undefined,
          waktuMulaiLayanan: q.waktu_mulai_layanan ? new Date(q.waktu_mulai_layanan).toISOString() : undefined,
          waktuSelesai: q.waktu_selesai ? new Date(q.waktu_selesai).toISOString() : undefined,
          estimasiWaktuTungguMenit: q.estimasi_waktu_tunggu_menit || 10,
          estimasiJamPanggil: q.estimasi_jam_panggil || '',
          bpjsTaskId: q.bpjs_task_id || 1,
          kodeBooking: q.kode_booking || '',
          keluhan: q.keluhan || '',
          isSyncedBpjs: q.is_synced_bpjs === 1,
          panggilanKe: q.panggilan_ke || 0,
        })),
        config: configRows && configRows.length > 0 ? mapConfigRow(configRows[0]) : null,
        securityLogs: secLogs || [],
        bridgingLogs: brLogs || [],
        poliList: (poliRows || []).map(mapPoliRow),
      };
    } catch (e: any) {
      lastConnectionStatus.connected = false;
      lastConnectionStatus.error = e?.message;
      return {
        source: 'MYSQL',
        patients: [],
        queues: [],
        config: null,
        securityLogs: [],
        bridgingLogs: [],
        poliList: [],
      };
    }
  },

  async addQueue(queueItem: QueueItem) {
    const pool = getMySqlPool();
    const sql = `
      INSERT INTO queues (
        id, nomor_antrean, prefix, nomor_urut, tipe_pasien, poli_kode, poli_nama,
        dokter_nama, ruang_nama, patient_id, nik, no_bpjs, nama_pasien, status,
        waktu_daftar, estimasi_waktu_tunggu_menit, estimasi_jam_panggil,
        bpjs_task_id, kode_booking, keluhan, is_synced_bpjs, panggilan_ke
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE status = VALUES(status), bpjs_task_id = VALUES(bpjs_task_id)
    `;
    await pool.query(sql, [
      queueItem.id,
      queueItem.nomorAntrean,
      queueItem.prefix,
      queueItem.nomorUrut,
      queueItem.tipePasien,
      queueItem.poliKode,
      queueItem.poliNama,
      queueItem.dokterNama || '',
      queueItem.ruangNama || '',
      queueItem.patientId || null,
      queueItem.nik,
      queueItem.noBpjs || null,
      queueItem.namaPasien,
      queueItem.status,
      queueItem.waktuDaftar ? new Date(queueItem.waktuDaftar) : new Date(),
      queueItem.estimasiWaktuTungguMenit || 10,
      queueItem.estimasiJamPanggil || '',
      queueItem.bpjsTaskId || 1,
      queueItem.kodeBooking || '',
      queueItem.keluhan || '',
      queueItem.isSyncedBpjs ? 1 : 0,
      queueItem.panggilanKe || 0,
    ]);
    lastConnectionStatus.connected = true;
    return queueItem;
  },

  async updateQueue(id: string, updates: Partial<QueueItem>) {
    const pool = getMySqlPool();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.status) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.waktuDipanggil) { fields.push('waktu_dipanggil = ?'); values.push(new Date(updates.waktuDipanggil)); }
    if (updates.waktuMulaiLayanan) { fields.push('waktu_mulai_layanan = ?'); values.push(new Date(updates.waktuMulaiLayanan)); }
    if (updates.waktuSelesai) { fields.push('waktu_selesai = ?'); values.push(new Date(updates.waktuSelesai)); }
    if (updates.panggilanKe !== undefined) { fields.push('panggilan_ke = ?'); values.push(updates.panggilanKe); }
    if (updates.bpjsTaskId !== undefined) { fields.push('bpjs_task_id = ?'); values.push(updates.bpjsTaskId); }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE queues SET ${fields.join(', ')} WHERE id = ?`, values);
      lastConnectionStatus.connected = true;
    }
  },

  async addPatient(patient: Patient) {
    const pool = getMySqlPool();
    const sql = `
      INSERT INTO patients (
        id, nik, no_bpjs, nama, tgl_lahir, jenis_kelamin, no_hp, alamat,
        status_bpjs, jenis_peserta, faskes_tingkat_1, kelas_rawat, encrypted_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE nama = VALUES(nama), no_hp = VALUES(no_hp)
    `;
    await pool.query(sql, [
      patient.id,
      patient.nik,
      patient.noBpjs || '',
      patient.nama,
      patient.tglLahir || '1990-01-01',
      patient.jenisKelamin,
      patient.noHp || '',
      patient.alamat || '',
      patient.statusBpjs || 'AKTIF',
      patient.jenisPeserta || 'Umum',
      patient.faskesTingkat1 || '',
      patient.kelasRawat || 'Kelas 3',
      patient.encryptedData || '',
      patient.createdAt ? new Date(patient.createdAt) : new Date(),
    ]);
    lastConnectionStatus.connected = true;
    return patient;
  },

  async addSecurityLog(log: AuditSecurityLog) {
    try {
      const pool = getMySqlPool();
      await pool.query(
        'INSERT INTO security_logs (id, timestamp, actor, action, target_patient_id, status, ip_address, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          log.id,
          log.timestamp ? new Date(log.timestamp) : new Date(),
          log.actor,
          log.action,
          log.targetPatientId || null,
          log.status,
          log.ipAddress || null,
          log.details,
        ]
      );
      lastConnectionStatus.connected = true;
    } catch {
      // Ignored
    }
  },

  async addBridgingLog(log: BridgingLog) {
    try {
      const pool = getMySqlPool();
      await pool.query(
        'INSERT INTO bridging_logs (id, timestamp, endpoint, method, request_header, request_payload, response_status, response_payload, duration_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          log.id,
          log.timestamp ? new Date(log.timestamp) : new Date(),
          log.endpoint,
          log.method,
          JSON.stringify(log.requestHeader || {}),
          log.requestPayload ? JSON.stringify(log.requestPayload) : null,
          log.responseStatus,
          JSON.stringify(log.responsePayload || {}),
          log.durationMs || 0,
        ]
      );
      lastConnectionStatus.connected = true;
    } catch {
      // Ignored
    }
  },

  async updateConfig(config: Partial<BpjsBridgingConfig>) {
    const pool = getMySqlPool();
    const fields: string[] = [];
    const vals: any[] = [];
    if (config.consId) { fields.push('cons_id = ?'); vals.push(config.consId); }
    if (config.secretKey) { fields.push('secret_key = ?'); vals.push(config.secretKey); }
    if (config.userKey) { fields.push('user_key = ?'); vals.push(config.userKey); }
    if (config.kdFaskes) { fields.push('kd_faskes = ?'); vals.push(config.kdFaskes); }
    if (config.namaFaskes) { fields.push('nama_faskes = ?'); vals.push(config.namaFaskes); }
    if (config.environment) { fields.push('environment = ?'); vals.push(config.environment); }
    if (config.userPcareDev) { fields.push('dev_user = ?'); vals.push(config.userPcareDev); }
    if (config.passPcareDev) { fields.push('dev_pass = ?'); vals.push(config.passPcareDev); }
    if (config.baseUrl) {
      fields.push('base_url = ?');
      vals.push(config.baseUrl.trim());
    }

    if (fields.length > 0) {
      vals.push('cfg-default');
      await pool.query(`UPDATE faskes_config SET ${fields.join(', ')} WHERE id = ?`, vals);
      lastConnectionStatus.connected = true;
    }
  },

  async authenticateUser(username: string, password: string): Promise<{
    success: boolean;
    message: string;
    user?: any;
    source: string;
  }> {
    try {
      const pool = getMySqlPool();
      const [rows]: [any, any] = await pool.query(
        'SELECT id, username, password_hash, nama_lengkap, role, nip, kd_faskes, is_active FROM users WHERE username = ? LIMIT 1',
        [username.trim()]
      );

      if (rows && rows.length > 0) {
        lastConnectionStatus.connected = true;
        const user = rows[0];
        if (!user.is_active) {
          return {
            success: false,
            message: 'Akun petugas berstatus non-aktif di database MySQL',
            source: 'MYSQL',
          };
        }

        if (user.password_hash === password || (password === '000000' && user.password_hash === '000000')) {
          await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]).catch(() => {});

          await this.addSecurityLog({
            id: `sec-auth-${Date.now()}`,
            timestamp: new Date().toISOString(),
            actor: `${user.nama_lengkap} (${user.role})`,
            action: 'LOGIN',
            status: 'SUCCESS',
            details: `Otentikasi petugas berhasil diverifikasi langsung di MySQL untuk user: ${username}`,
          });

          const safeUser = {
            id: user.id,
            username: user.username,
            namaLengkap: user.nama_lengkap || user.username || 'Petugas Faskes',
            nama_lengkap: user.nama_lengkap,
            role: user.role,
            nip: user.nip || '',
            kdFaskes: user.kd_faskes || '019U901',
            isActive: Boolean(user.is_active),
            lastLogin: user.last_login || new Date().toISOString(),
            mustChangePassword: Boolean(user.password_hash === '000000' || password === '000000'),
          };

          return {
            success: true,
            message: safeUser.mustChangePassword
              ? 'Login berhasil. Password Anda masih default (000000). Harap ganti password demi keamanan.'
              : 'Otentikasi berhasil via MySQL Server',
            user: safeUser,
            source: 'MYSQL',
          };
        } else {
          return {
            success: false,
            message: 'Password yang dimasukkan tidak sesuai di database MySQL',
            source: 'MYSQL',
          };
        }
      }

      return {
        success: false,
        message: 'Username petugas tidak ditemukan di tabel users MySQL',
        source: 'MYSQL',
      };
    } catch (err: any) {
      lastConnectionStatus.connected = false;
      lastConnectionStatus.error = err?.message;
      return {
        success: false,
        message: `Koneksi MySQL gagal: ${err?.message || 'Database tidak dapat dihubungi'}`,
        source: 'MYSQL',
      };
    }
  },

  async changePassword(username: string, oldPassword: string, newPassword: string): Promise<{
    success: boolean;
    message: string;
    user?: any;
  }> {
    if (!newPassword || newPassword.trim().length < 6) {
      return { success: false, message: 'Password baru minimal 6 karakter' };
    }
    if (newPassword.trim() === '000000') {
      return { success: false, message: 'Password baru tidak boleh menggunakan password default (000000)' };
    }

    const pool = getMySqlPool();
    const [rows]: [any, any] = await pool.query(
      'SELECT id, username, password_hash, nama_lengkap, role, nip, kd_faskes, is_active FROM users WHERE username = ? LIMIT 1',
      [username.trim()]
    );

    if (!rows || rows.length === 0) {
      return { success: false, message: 'Akun user tidak ditemukan di database MySQL' };
    }

    const u = rows[0];
    if (u.password_hash !== oldPassword && oldPassword !== '000000') {
      return { success: false, message: 'Password lama tidak sesuai di database MySQL' };
    }

    const [res]: [any, any] = await pool.query(
      'UPDATE users SET password_hash = ? WHERE username = ?',
      [newPassword.trim(), username.trim()]
    );

    if (res.affectedRows > 0) {
      lastConnectionStatus.connected = true;

      await this.addSecurityLog({
        id: `sec-pwd-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: `${u.nama_lengkap} (${username})`,
        action: 'KEY_ROTATE',
        status: 'SUCCESS',
        details: `Password akun '${username}' berhasil diperbarui langsung ke database MySQL`,
      });

      const safeUser = {
        id: u.id,
        username: u.username,
        namaLengkap: u.nama_lengkap || username,
        nama_lengkap: u.nama_lengkap,
        role: u.role,
        nip: u.nip || '',
        kdFaskes: u.kd_faskes || '019U901',
        isActive: Boolean(u.is_active ?? true),
        mustChangePassword: false,
      };

      return {
        success: true,
        message: 'Password baru berhasil disimpan ke database MySQL.',
        user: safeUser,
      };
    }

    return { success: false, message: 'Gagal memperbarui password di database MySQL' };
  },

  async resetPassword(username: string, resetBy: string = 'Administrator RME', targetPassword?: string): Promise<{
    success: boolean;
    message: string;
    newPassword?: string;
  }> {
    const newPassword = targetPassword || '000000';
    const pool = getMySqlPool();
    const [res]: [any, any] = await pool.query(
      'UPDATE users SET password_hash = ? WHERE username = ?',
      [newPassword, username.trim()]
    );

    if (res.affectedRows > 0) {
      lastConnectionStatus.connected = true;

      await this.addSecurityLog({
        id: `sec-reset-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: resetBy,
        action: 'KEY_ROTATE',
        status: 'SUCCESS',
        details: `Reset password akun '${username}' ke '${newPassword}' di MySQL`,
      });

      return {
        success: true,
        message: `Password akun '${username}' berhasil di-reset langsung di database MySQL`,
        newPassword,
      };
    }

    return { success: false, message: 'User tidak ditemukan di MySQL' };
  },

  async getUsers() {
    try {
      const pool = getMySqlPool();
      const [rows]: [any, any] = await pool.query(
        'SELECT id, username, nama_lengkap, role, nip, kd_faskes, is_active, last_login, created_at FROM users ORDER BY id ASC'
      );
      if (rows && rows.length > 0) {
        lastConnectionStatus.connected = true;
        return rows;
      }
    } catch (err: any) {
      lastConnectionStatus.connected = false;
      lastConnectionStatus.error = err?.message;
    }
    return [];
  },

  async updateUser(id: string, updates: { namaLengkap?: string; nip?: string; role?: any; isActive?: boolean }) {
    const pool = getMySqlPool();
    const fields: string[] = [];
    const params: any[] = [];
    if (updates.namaLengkap !== undefined) {
      fields.push('`nama_lengkap` = ?');
      params.push(updates.namaLengkap.trim());
    }
    if (updates.nip !== undefined) {
      fields.push('`nip` = ?');
      params.push(updates.nip.trim());
    }
    if (updates.role !== undefined) {
      fields.push('`role` = ?');
      params.push(updates.role);
    }
    if (updates.isActive !== undefined) {
      fields.push('`is_active` = ?');
      params.push(updates.isActive ? 1 : 0);
    }

    if (fields.length > 0) {
      params.push(id);
      params.push(id);
      await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ? OR username = ?`, params);
      lastConnectionStatus.connected = true;
    }

    return { success: true, message: 'Data petugas berhasil diperbarui di database MySQL' };
  },

  async getPoliList(): Promise<PoliInfo[]> {
    try {
      const pool = getMySqlPool();
      const [rows]: [any, any] = await pool.query('SELECT * FROM poliklinik ORDER BY prefix ASC');
      if (rows && rows.length > 0) {
        lastConnectionStatus.connected = true;
        return rows.map(mapPoliRow);
      }
    } catch (err: any) {
      lastConnectionStatus.connected = false;
      lastConnectionStatus.error = err?.message;
    }
    return [];
  },

  async updatePoli(kode: string, updates: Partial<PoliInfo>) {
    const pool = getMySqlPool();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.nama) { fields.push('nama = ?'); values.push(updates.nama); }
    if (updates.prefix) { fields.push('prefix = ?'); values.push(updates.prefix); }
    if (updates.dokter !== undefined) { fields.push('dokter_nama = ?'); values.push(updates.dokter); }
    if (updates.sip !== undefined) { fields.push('sip = ?'); values.push(updates.sip); }
    if (updates.ruang) { fields.push('ruang = ?'); values.push(updates.ruang); }
    if (updates.durasiRataRataMenit) { fields.push('durasi_rata_rata_menit = ?'); values.push(updates.durasiRataRataMenit); }
    if (updates.kuotaTotal) { fields.push('kuota_total = ?'); values.push(updates.kuotaTotal); }
    if (updates.kuotaTerpakai !== undefined) { fields.push('kuota_terpakai = ?'); values.push(updates.kuotaTerpakai); }

    if (fields.length > 0) {
      values.push(kode);
      await pool.query(`UPDATE poliklinik SET ${fields.join(', ')} WHERE kode = ?`, values);
      lastConnectionStatus.connected = true;
    }

    return { success: true, message: 'Poliklinik berhasil diupdate di database MySQL' };
  },

  getSchemaSql(): string {
    const schemaPath = path.join(process.cwd(), 'data', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      return fs.readFileSync(schemaPath, 'utf8');
    }
    return '-- Schema file not found';
  },

  getProceduresSql(): string {
    const procPath = path.join(process.cwd(), 'data', 'procedures.sql');
    if (fs.existsSync(procPath)) {
      return fs.readFileSync(procPath, 'utf8');
    }
    return '-- Stored procedures not found';
  },

  async exportTableSql(tableName: string): Promise<string> {
    try {
      const pool = getMySqlPool();
      const [rows]: [any, any] = await pool.query(`SELECT * FROM \`${tableName}\``);
      const timestamp = new Date().toISOString();
      let sql = `-- ========================================================\n-- DUMP TABEL: \`${tableName}\` (LIVE MYSQL)\n-- Dibuat pada: ${timestamp}\n-- ========================================================\n\n`;

      if (rows && rows.length > 0) {
        sql += `LOCK TABLES \`${tableName}\` WRITE;\n`;
        for (const row of rows) {
          const keys = Object.keys(row).map((k) => `\`${k}\``).join(', ');
          const values = Object.values(row).map((v) => {
            if (v === null || v === undefined) return 'NULL';
            if (typeof v === 'number') return v;
            if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
            return `'${String(v).replace(/'/g, "\\'")}'`;
          }).join(', ');
          sql += `INSERT INTO \`${tableName}\` (${keys}) VALUES (${values});\n`;
        }
        sql += `UNLOCK TABLES;\n`;
      }
      return sql;
    } catch (err: any) {
      return `-- Dump tabel ${tableName} dari MySQL: ${err?.message}\n`;
    }
  },
};
