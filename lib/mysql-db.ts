import mysql from 'mysql2/promise';
import { QueueItem, Patient, BpjsBridgingConfig, AuditSecurityLog, BridgingLog } from '@/types/queue';
import { serverDb } from './server-db';
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

// Default configuration from environment variables or sensible local defaults
export const getDefaultMySqlConfig = (): MySqlConfig => {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.startsWith('mysql://')) {
    try {
      const parsed = new URL(dbUrl);
      return {
        host: parsed.hostname || 'localhost',
        port: parsed.port ? parseInt(parsed.port, 10) : 3306,
        user: parsed.username || 'root',
        password: parsed.password || '',
        database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'antrean_bpjs_tpmd',
        ssl: parsed.searchParams.get('ssl') === 'true',
      };
    } catch {}
  }

  return {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'antrean_bpjs_tpmd',
    ssl: process.env.MYSQL_SSL === 'true',
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
      host: currentConfig.host,
      port: currentConfig.port,
      user: currentConfig.user,
      password: currentConfig.password,
      database: currentConfig.database,
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
 * Test MySQL connection and retrieve server version
 */
export async function testMySqlConnection(config?: Partial<MySqlConfig>) {
  const targetConfig = config ? { ...currentConfig, ...config } : currentConfig;
  const start = performance.now();

  try {
    const connection = await mysql.createConnection({
      host: targetConfig.host,
      port: targetConfig.port,
      user: targetConfig.user,
      password: targetConfig.password,
      database: targetConfig.database,
      connectTimeout: 4000,
      ssl: targetConfig.ssl ? { rejectUnauthorized: false } : undefined,
    });

    const [rows]: [any, any] = await connection.query('SELECT VERSION() as version, DATABASE() as db, NOW() as server_time');
    await connection.end();

    const latencyMs = Math.round(performance.now() - start);
    lastConnectionStatus = {
      connected: true,
      version: rows[0]?.version || 'MySQL 8.x',
      latencyMs,
      testedAt: new Date().toISOString(),
    };

    if (config) {
      currentConfig = targetConfig;
    }

    return {
      success: true,
      status: lastConnectionStatus,
      database: rows[0]?.db || targetConfig.database,
      serverTime: rows[0]?.server_time,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    lastConnectionStatus = {
      connected: false,
      error: err.message || 'Koneksi MySQL gagal',
      latencyMs,
      testedAt: new Date().toISOString(),
    };

    return {
      success: false,
      status: lastConnectionStatus,
      error: err.message || 'Gagal terhubung ke host MySQL',
    };
  }
}

/**
 * Execute raw SQL query safely
 */
export async function executeQuery(sql: string, params: any[] = []): Promise<any> {
  const pool = getMySqlPool();
  try {
    const [results] = await pool.query(sql, params);
    return results;
  } catch (err: any) {
    // If table doesn't exist or database unreachable, throw so caller can fallback
    throw err;
  }
}

/**
 * Initialize / run schema creation on MySQL
 */
export async function initMySqlSchema(): Promise<{ success: boolean; message: string }> {
  try {
    const schemaPath = path.join(process.cwd(), 'data', 'schema.sql');
    let sqlScript = '';
    if (fs.existsSync(schemaPath)) {
      sqlScript = fs.readFileSync(schemaPath, 'utf8');
    }

    const statements = sqlScript
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    const pool = getMySqlPool();
    for (const stmt of statements) {
      try {
        await pool.query(stmt);
      } catch (e: any) {
        console.warn('Notice on statement execution:', e.message);
      }
    }

    return { success: true, message: 'Skema tabel MySQL berhasil diinisialisasi!' };
  } catch (err: any) {
    return { success: false, message: 'Gagal inisialisasi skema MySQL: ' + err.message };
  }
}

/**
 * Hybrid MySQL DB Controller
 * Attempts to read/write from MySQL if connected, otherwise writes to local persistent store & logs
 */
export const mySqlDb = {
  getStatus() {
    return {
      config: {
        host: currentConfig.host,
        port: currentConfig.port,
        user: currentConfig.user,
        database: currentConfig.database,
        ssl: !!currentConfig.ssl,
      },
      status: lastConnectionStatus,
    };
  },

  async getAllData() {
    // Check if MySQL connection is active
    if (lastConnectionStatus.connected) {
      try {
        const pool = getMySqlPool();
        const [patients]: [any, any] = await pool.query('SELECT * FROM patients ORDER BY created_at DESC');
        const [queues]: [any, any] = await pool.query('SELECT * FROM queues ORDER BY waktu_daftar ASC');
        const [configRows]: [any, any] = await pool.query('SELECT * FROM faskes_config LIMIT 1');
        const [secLogs]: [any, any] = await pool.query('SELECT * FROM security_logs ORDER BY timestamp DESC LIMIT 50');
        const [brLogs]: [any, any] = await pool.query('SELECT * FROM bridging_logs ORDER BY timestamp DESC LIMIT 50');

        return {
          source: 'MYSQL' as const,
          patients: patients || [],
          queues: queues || [],
          config: configRows[0] || serverDb.getConfig(),
          securityLogs: secLogs || [],
          bridgingLogs: brLogs || [],
        };
      } catch (e) {
        console.warn('MySQL read failed, using server persistent store:', e);
      }
    }

    // Default persistent server DB fallback
    const local = serverDb.getAll();
    return {
      source: 'LOCAL_SERVER_STORE' as const,
      ...local,
    };
  },

  async addQueue(queueItem: QueueItem) {
    // Always persist to local server database first for zero downtime
    serverDb.addQueue(queueItem);

    if (lastConnectionStatus.connected) {
      try {
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
          queueItem.dokterNama,
          queueItem.ruangNama,
          queueItem.patientId || null,
          queueItem.nik,
          queueItem.noBpjs || null,
          queueItem.namaPasien,
          queueItem.status,
          queueItem.waktuDaftar,
          queueItem.estimasiWaktuTungguMenit,
          queueItem.estimasiJamPanggil,
          queueItem.bpjsTaskId,
          queueItem.kodeBooking,
          queueItem.keluhan || '',
          queueItem.isSyncedBpjs ? 1 : 0,
          queueItem.panggilanKe || 0,
        ]);
      } catch (err) {
        console.warn('Gagal sinkron antrean ke MySQL:', err);
      }
    }

    return queueItem;
  },

  async updateQueue(id: string, updates: Partial<QueueItem>) {
    serverDb.updateQueue(id, updates);

    if (lastConnectionStatus.connected) {
      try {
        const pool = getMySqlPool();
        const fields: string[] = [];
        const values: any[] = [];

        if (updates.status) {
          fields.push('status = ?');
          values.push(updates.status);
        }
        if (updates.waktuDipanggil) {
          fields.push('waktu_dipanggil = ?');
          values.push(updates.waktuDipanggil);
        }
        if (updates.waktuMulaiLayanan) {
          fields.push('waktu_mulai_layanan = ?');
          values.push(updates.waktuMulaiLayanan);
        }
        if (updates.waktuSelesai) {
          fields.push('waktu_selesai = ?');
          values.push(updates.waktuSelesai);
        }
        if (updates.panggilanKe !== undefined) {
          fields.push('panggilan_ke = ?');
          values.push(updates.panggilanKe);
        }
        if (updates.bpjsTaskId !== undefined) {
          fields.push('bpjs_task_id = ?');
          values.push(updates.bpjsTaskId);
        }

        if (fields.length > 0) {
          values.push(id);
          await pool.query(`UPDATE queues SET ${fields.join(', ')} WHERE id = ?`, values);
        }
      } catch (err) {
        console.warn('Gagal update antrean di MySQL:', err);
      }
    }
  },

  async addPatient(patient: Patient) {
    serverDb.addPatient(patient);

    if (lastConnectionStatus.connected) {
      try {
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
          patient.jenisKelamin || 'L',
          patient.noHp || '',
          patient.alamat || '',
          patient.statusBpjs || 'AKTIF',
          patient.jenisPeserta || 'PBI APBN',
          patient.faskesTingkat1 || '019U901 - TPMD DR MACHMUJUR',
          patient.kelasRawat || 'Kelas 3',
          patient.encryptedData || null,
          patient.createdAt || new Date().toISOString(),
        ]);
      } catch (err) {
        console.warn('Gagal sinkron pasien ke MySQL:', err);
      }
    }

    return patient;
  },

  async addSecurityLog(log: AuditSecurityLog) {
    serverDb.addSecurityLog(log);

    if (lastConnectionStatus.connected) {
      try {
        const pool = getMySqlPool();
        await pool.query(
          'INSERT INTO security_logs (id, timestamp, actor, action, status, details) VALUES (?, ?, ?, ?, ?, ?)',
          [log.id, log.timestamp, log.actor, log.action, log.status, log.details]
        );
      } catch {}
    }
  },

  async authenticateUser(username: string, password: string): Promise<{
    success: boolean;
    message: string;
    user?: any;
    source: 'MYSQL' | 'LOCAL_SERVER_STORE';
  }> {
    // 1. Try MySQL database directly if connected
    if (lastConnectionStatus.connected) {
      try {
        const pool = getMySqlPool();
        // Check if procedure exists or query table
        const [rows]: [any, any] = await pool.query(
          'SELECT id, username, password_hash, nama_lengkap, role, nip, kd_faskes, is_active FROM users WHERE username = ? LIMIT 1',
          [username.trim()]
        );

        if (rows && rows.length > 0) {
          const user = rows[0];
          if (!user.is_active) {
            return {
              success: false,
              message: 'Akun petugas berstatus non-aktif di MySQL',
              source: 'MYSQL',
            };
          }

          if (user.password_hash === password) {
            // Update last_login
            await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]).catch(() => {});
            
            // Record audit log
            await this.addSecurityLog({
              id: `sec-auth-${Date.now()}`,
              timestamp: new Date().toISOString(),
              actor: `${user.nama_lengkap} (${user.role})`,
              action: 'LOGIN',
              status: 'SUCCESS',
              details: `Otentikasi petugas faskes berhasil diverifikasi di MySQL untuk user: ${username}`,
            });

            const { password_hash, ...safeUser } = user;
            if (user.password_hash === '000000' || password === '000000') {
              safeUser.mustChangePassword = true;
            } else {
              safeUser.mustChangePassword = false;
            }

            return {
              success: true,
              message: safeUser.mustChangePassword
                ? 'Login berhasil. Terdeteksi password awal default (000000). Harap ganti password Anda.'
                : 'Otentikasi berhasil via MySQL Server',
              user: safeUser,
              source: 'MYSQL',
            };
          } else {
            return {
              success: false,
              message: 'Password yang dimasukkan salah (MySQL)',
              source: 'MYSQL',
            };
          }
        }
      } catch (err) {
        console.warn('MySQL auth query failed, falling back to serverDb:', err);
      }
    }

    // 2. Fallback to server persistent store (dual-mode)
    const result = serverDb.authenticateUser(username, password);
    if (result.success && result.user) {
      serverDb.addSecurityLog({
        id: `sec-auth-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: `${result.user.namaLengkap} (${result.user.role})`,
        action: 'LOGIN',
        status: 'SUCCESS',
        details: `Otentikasi petugas faskes berhasil diverifikasi di server faskes untuk user: ${username}`,
      });
    }

    return {
      ...result,
      source: 'LOCAL_SERVER_STORE',
    };
  },

  async changePassword(username: string, oldPassword: string, newPassword: string): Promise<{
    success: boolean;
    message: string;
    user?: any;
  }> {
    // 1. Update in local serverDb persistent storage first
    const localResult = serverDb.changePassword(username, oldPassword, newPassword);
    if (!localResult.success) {
      return localResult;
    }

    // 2. If MySQL connected, update table users
    if (lastConnectionStatus.connected) {
      try {
        const pool = getMySqlPool();
        await pool.query(
          'UPDATE users SET password_hash = ? WHERE username = ?',
          [newPassword.trim(), username.trim()]
        );
      } catch (err) {
        console.warn('MySQL update password failed:', err);
      }
    }

    // Add security audit log
    await this.addSecurityLog({
      id: `sec-pwd-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: `${username}`,
      action: 'KEY_ROTATE',
      status: 'SUCCESS',
      details: `Password akun petugas ${username} berhasil diperbarui dari default 000000.`,
    });

    return {
      success: true,
      message: 'Password baru berhasil disimpan di database.',
      user: localResult.user,
    };
  },

  async resetPassword(username: string, resetBy: string, customNewPassword?: string): Promise<{
    success: boolean;
    message: string;
    user?: any;
  }> {
    const targetPassword = customNewPassword && customNewPassword.trim().length >= 6 ? customNewPassword.trim() : '000000';
    
    // 1. Update in serverDb local persistent storage
    const localResult = serverDb.resetPassword(username, resetBy, targetPassword);
    if (!localResult.success) {
      return localResult;
    }

    // 2. Update in MySQL if connected
    if (lastConnectionStatus.connected) {
      try {
        const pool = getMySqlPool();
        await pool.query(
          'UPDATE users SET password_hash = ? WHERE username = ?',
          [targetPassword, username.trim()]
        );
      } catch (err) {
        console.warn('MySQL reset password failed:', err);
      }
    }

    // Add security audit log
    await this.addSecurityLog({
      id: `sec-reset-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: `${resetBy} (Administrator RME)`,
      action: 'KEY_ROTATE',
      status: 'SUCCESS',
      details: `Reset password akun '${username}' ke default (${targetPassword}) oleh Administrator RME.`,
    });

    return {
      success: true,
      message: `Password akun '${username}' berhasil di-reset ke '${targetPassword}'. Pengguna wajib mengganti password saat login berikutnya.`,
      user: localResult.user,
    };
  },

  async getUsers() {
    if (lastConnectionStatus.connected) {
      try {
        const pool = getMySqlPool();
        const [rows]: [any, any] = await pool.query(
          'SELECT id, username, nama_lengkap, role, nip, kd_faskes, is_active, last_login FROM users'
        );
        return rows || [];
      } catch {}
    }
    return serverDb.getUsers();
  },

  getSchemaSql(): string {
    const schemaPath = path.join(process.cwd(), 'data', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      return fs.readFileSync(schemaPath, 'utf8');
    }
    return '-- Schema not found';
  },

  getProceduresSql(): string {
    const procPath = path.join(process.cwd(), 'data', 'procedures.sql');
    if (fs.existsSync(procPath)) {
      return fs.readFileSync(procPath, 'utf8');
    }
    return '-- Stored procedures not found';
  },

  exportTableSql(tableName: string): string {
    const data = serverDb.getAll();
    const timestamp = new Date().toISOString();
    let sql = `-- ========================================================\n-- DUMP TABEL: \`${tableName}\`\n-- Dibuat pada: ${timestamp}\n-- Faskes: TPMD DR MACHMUJUR (019U901)\n-- ========================================================\n\n`;

    switch (tableName) {
      case 'queues': {
        const items = data.queues || [];
        sql += `LOCK TABLES \`queues\` WRITE;\n`;
        for (const q of items) {
          sql += `INSERT INTO \`queues\` (\`id\`, \`nomor_antrean\`, \`prefix\`, \`nomor_urut\`, \`tipe_pasien\`, \`poli_kode\`, \`poli_nama\`, \`dokter_nama\`, \`ruang_nama\`, \`patient_id\`, \`nik\`, \`no_bpjs\`, \`nama_pasien\`, \`status\`, \`waktu_daftar\`, \`estimasi_waktu_tunggu_menit\`, \`estimasi_jam_panggil\`, \`bpjs_task_id\`, \`kode_booking\`, \`is_synced_bpjs\`, \`panggilan_ke\`) VALUES ('${q.id}', '${q.nomorAntrean}', '${q.prefix}', ${q.nomorUrut}, '${q.tipePasien}', '${q.poliKode}', '${q.poliNama}', '${q.dokterNama}', '${q.ruangNama}', '${q.patientId || ''}', '${q.nik}', '${q.noBpjs || ''}', '${q.namaPasien.replace(/'/g, "\\'")}', '${q.status}', '${q.waktuDaftar}', ${q.estimasiWaktuTungguMenit}, '${q.estimasiJamPanggil}', ${q.bpjsTaskId}, '${q.kodeBooking}', ${q.isSyncedBpjs ? 1 : 0}, ${q.panggilanKe || 0});\n`;
        }
        sql += `UNLOCK TABLES;\n`;
        break;
      }
      case 'patients': {
        const patients = data.patients || [];
        sql += `LOCK TABLES \`patients\` WRITE;\n`;
        for (const p of patients) {
          sql += `INSERT INTO \`patients\` (\`id\`, \`nik\`, \`no_bpjs\`, \`nama\`, \`tgl_lahir\`, \`jenis_kelamin\`, \`no_hp\`, \`status_bpjs\`, \`jenis_peserta\`, \`faskes_tingkat_1\`, \`kelas_rawat\`) VALUES ('${p.id}', '${p.nik}', '${p.noBpjs || ''}', '${p.nama.replace(/'/g, "\\'")}', '${p.tglLahir}', '${p.jenisKelamin}', '${p.noHp}', '${p.statusBpjs}', '${p.jenisPeserta}', '${p.faskesTingkat1}', '${p.kelasRawat}');\n`;
        }
        sql += `UNLOCK TABLES;\n`;
        break;
      }
      case 'users': {
        const users = data.users || [];
        sql += `LOCK TABLES \`users\` WRITE;\n`;
        for (const u of users) {
          sql += `INSERT INTO \`users\` (\`id\`, \`username\`, \`password_hash\`, \`nama_lengkap\`, \`role\`, \`nip\`, \`kd_faskes\`, \`is_active\`) VALUES ('${u.id}', '${u.username}', '${u.passwordHash}', '${u.namaLengkap.replace(/'/g, "\\'")}', '${u.role}', '${u.nip || ''}', '${u.kdFaskes}', ${u.isActive ? 1 : 0});\n`;
        }
        sql += `UNLOCK TABLES;\n`;
        break;
      }
      case 'faskes_config': {
        const cfg = data.config;
        sql += `LOCK TABLES \`faskes_config\` WRITE;\n`;
        sql += `INSERT INTO \`faskes_config\` (\`id\`, \`kd_faskes\`, \`nama_faskes\`, \`cons_id\`, \`secret_key\`, \`user_key\`, \`dev_user\`, \`dev_pass\`, \`environment\`, \`base_url\`) VALUES ('cfg-default', '${cfg.kdFaskes}', '${cfg.namaFaskes}', '${cfg.consId}', '${cfg.secretKey}', '${cfg.userKey}', '${cfg.userPcareDev}', '${cfg.passPcareDev}', '${cfg.environment}', '${cfg.baseUrl}');\n`;
        sql += `UNLOCK TABLES;\n`;
        break;
      }
      case 'security_logs': {
        const logs = data.securityLogs || [];
        sql += `LOCK TABLES \`security_logs\` WRITE;\n`;
        for (const l of logs) {
          sql += `INSERT INTO \`security_logs\` (\`id\`, \`timestamp\`, \`actor\`, \`action\`, \`status\`, \`details\`) VALUES ('${l.id}', '${l.timestamp}', '${l.actor.replace(/'/g, "\\'")}', '${l.action}', '${l.status}', '${l.details.replace(/'/g, "\\'")}');\n`;
        }
        sql += `UNLOCK TABLES;\n`;
        break;
      }
      default:
        sql += `-- Tabel tidak dikenali: ${tableName}\n`;
    }

    return sql;
  },

  exportFullDumpSql(): string {
    const schemaPath = path.join(process.cwd(), 'data', 'schema.sql');
    let fullSql = '';
    if (fs.existsSync(schemaPath)) {
      fullSql = fs.readFileSync(schemaPath, 'utf8') + '\n\n';
    }

    fullSql += `-- ========================================================\n-- DATA DUMP (INSERT STATEMENTS)\n-- ========================================================\n\n`;
    fullSql += this.exportTableSql('users') + '\n';
    fullSql += this.exportTableSql('faskes_config') + '\n';
    fullSql += this.exportTableSql('patients') + '\n';
    fullSql += this.exportTableSql('queues') + '\n';
    fullSql += this.exportTableSql('security_logs') + '\n\n';

    fullSql += `-- ========================================================\n-- STORED PROCEDURES\n-- ========================================================\n\n`;
    fullSql += this.getProceduresSql() + '\n';

    return fullSql;
  },
};
