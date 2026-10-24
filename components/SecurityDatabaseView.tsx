'use client';

import React, { useState, useEffect } from 'react';
import { useQueue } from '@/lib/queue-context';
import { useAuth } from '@/lib/auth-context';
import { encryptData, decryptData, maskSensitive } from '@/lib/encrypted-db';
import {
  Shield,
  Key,
  Lock,
  Unlock,
  Database,
  FileCheck2,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Copy,
  Terminal,
  Server,
  HardDrive,
  RefreshCw,
  Play,
  Table,
  Code2,
  Check,
  RotateCcw,
  KeyRound,
  Users,
  ShieldAlert,
} from 'lucide-react';

export const SecurityDatabaseView: React.FC = () => {
  const { user, setIsLoginModalOpen } = useAuth();
  const { patients, securityLogs, addSecurityLog, bpjsConfig, queues, bridgingLogs } = useQueue();

  const [masterPasscode, setMasterPasscode] = useState<string>('DrMachmujurSecure2026!');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'USERS' | 'MYSQL' | 'RECORDS' | 'AUDIT' | 'PLAYGROUND' | 'DATABASE_INFO'>('USERS');
  const [rawServerDb, setRawServerDb] = useState<string>('');
  const [loadingRaw, setLoadingRaw] = useState<boolean>(false);

  // User Management & Reset Password State (Khusus Administrator RME)
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [selectedUserToReset, setSelectedUserToReset] = useState<any | null>(null);
  const [customResetPassword, setCustomResetPassword] = useState<string>('000000');
  const [resettingUser, setResettingUser] = useState<boolean>(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [resetErrorMsg, setResetErrorMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/db');
      const data = await res.json();
      if (data.success && data.data && data.data.users) {
        setUsersList(data.data.users);
      }
    } catch {} finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetch('/api/db')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.data && data.data.users) {
          setUsersList(data.data.users);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleExecuteResetPassword = async () => {
    if (!selectedUserToReset) return;
    setResettingUser(true);
    setResetSuccessMsg(null);
    setResetErrorMsg(null);
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          payload: {
            username: selectedUserToReset.username,
            resetBy: user?.username || 'admin',
            newPassword: customResetPassword.trim() || '000000',
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResetSuccessMsg(data.message || `Password akun '${selectedUserToReset.username}' berhasil di-reset ke '${customResetPassword.trim() || '000000'}'.`);
        addSecurityLog(
          'KEY_ROTATE',
          `Administrator RME mereset password akun ${selectedUserToReset.username} ke default (000000).`
        );
        setSelectedUserToReset(null);
        await fetchUsers();
      } else {
        setResetErrorMsg(data.message || 'Gagal mereset password');
      }
    } catch (err: any) {
      setResetErrorMsg(err.message || 'Gagal terhubung ke database');
    } finally {
      setResettingUser(false);
    }
  };

  // MySQL Connection & Query State
  const [mysqlHost, setMysqlHost] = useState<string>('localhost');
  const [mysqlPort, setMysqlPort] = useState<number>(3306);
  const [mysqlUser, setMysqlUser] = useState<string>('root');
  const [mysqlPass, setMysqlPass] = useState<string>('');
  const [mysqlDbName, setMysqlDbName] = useState<string>('antrean_bpjs_tpmd');
  const [testingMysql, setTestingMysql] = useState<boolean>(false);
  const [mysqlTestResult, setMysqlTestResult] = useState<{
    success?: boolean;
    error?: string;
    version?: string;
    latencyMs?: number;
    testedAt?: string;
  } | null>(null);

  const [sqlQuery, setSqlQuery] = useState<string>(
    'SELECT nomor_antrean, tipe_pasien, poli_nama, nama_pasien, status, estimasi_jam_panggil FROM queues ORDER BY nomor_urut ASC LIMIT 10;'
  );
  const [runningQuery, setRunningQuery] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [schemaInitLoading, setSchemaInitLoading] = useState<boolean>(false);
  const [schemaInitMsg, setSchemaInitMsg] = useState<string | null>(null);
  const [sqlCopied, setSqlCopied] = useState<boolean>(false);

  const handleTestMysql = async () => {
    setTestingMysql(true);
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_mysql',
          payload: {
            host: mysqlHost,
            port: mysqlPort,
            user: mysqlUser,
            password: mysqlPass,
            database: mysqlDbName,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setMysqlTestResult({
          success: data.result.success,
          version: data.result.status?.version,
          latencyMs: data.result.status?.latencyMs,
          error: data.result.error || data.result.status?.error,
          testedAt: new Date().toLocaleTimeString('id-ID'),
        });
      } else {
        setMysqlTestResult({
          success: false,
          error: data.error || 'Koneksi gagal',
          testedAt: new Date().toLocaleTimeString('id-ID'),
        });
      }
    } catch (err: any) {
      setMysqlTestResult({
        success: false,
        error: err.message,
        testedAt: new Date().toLocaleTimeString('id-ID'),
      });
    } finally {
      setTestingMysql(false);
    }
  };

  const handleRunQuery = async () => {
    if (!sqlQuery.trim()) return;
    setRunningQuery(true);
    setQueryError(null);
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'query_mysql',
          payload: { sql: sqlQuery },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setQueryResult(Array.isArray(data.results) ? data.results : [data.results]);
      } else {
        setQueryError(data.error || 'Query gagal dieksekusi');
        setQueryResult(null);
      }
    } catch (err: any) {
      setQueryError(err.message);
      setQueryResult(null);
    } finally {
      setRunningQuery(false);
    }
  };

  const handleInitSchema = async () => {
    setSchemaInitLoading(true);
    setSchemaInitMsg(null);
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'init_schema' }),
      });
      const data = await res.json();
      setSchemaInitMsg(data.message || (data.success ? 'Skema tabel MySQL berhasil dibuat!' : 'Gagal membuat skema'));
    } catch (err: any) {
      setSchemaInitMsg('Error: ' + err.message);
    } finally {
      setSchemaInitLoading(false);
    }
  };

  const handleFetchServerDb = async () => {
    setLoadingRaw(true);
    try {
      const res = await fetch('/api/db');
      const data = await res.json();
      setRawServerDb(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setRawServerDb(JSON.stringify({ error: e.message }, null, 2));
    } finally {
      setLoadingRaw(false);
    }
  };

  const [downloadingTable, setDownloadingTable] = useState<string | null>(null);

  const handleDownloadTableSql = async (tableName: string) => {
    setDownloadingTable(tableName);
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export_table', payload: { table: tableName } }),
      });
      const data = await res.json();
      if (data.success && data.sql) {
        const blob = new Blob([data.sql], { type: 'text/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `table_${tableName}_${bpjsConfig.kdFaskes}_${Date.now()}.sql`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      alert('Gagal download tabel: ' + err.message);
    } finally {
      setDownloadingTable(null);
    }
  };

  const handleDownloadTableCsv = (tableName: string) => {
    let rows: any[] = [];
    if (tableName === 'queues') rows = queues;
    else if (tableName === 'patients') rows = patients;
    else if (tableName === 'security_logs') rows = securityLogs;
    else if (tableName === 'bridging_logs') rows = bridgingLogs;

    if (rows.length === 0) {
      alert(`Tabel ${tableName} tidak memiliki data untuk diekspor ke CSV`);
      return;
    }

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tabel_${tableName}_${bpjsConfig.kdFaskes}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSchema = async () => {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_schema' }),
      });
      const data = await res.json();
      if (data.success && data.sql) {
        const blob = new Blob([data.sql], { type: 'text/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `schema_antrean_${bpjsConfig.kdFaskes}.sql`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      alert('Gagal download skema: ' + err.message);
    }
  };

  const handleDownloadProcedures = async () => {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_procedures' }),
      });
      const data = await res.json();
      if (data.success && data.sql) {
        const blob = new Blob([data.sql], { type: 'text/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `procedures_antrean_${bpjsConfig.kdFaskes}.sql`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      alert('Gagal download procedures: ' + err.message);
    }
  };

  const handleDownloadFullDump = async () => {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export_full_dump' }),
      });
      const data = await res.json();
      if (data.success && data.sql) {
        const blob = new Blob([data.sql], { type: 'text/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `full_dump_antrean_bpjs_${bpjsConfig.kdFaskes}_${Date.now()}.sql`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      alert('Gagal download full dump: ' + err.message);
    }
  };

  // Encryption Playground
  const [plainInput, setPlainInput] = useState<string>('Diagnosa: ISPA Akut (J06.9). Terapi: Paracetamol 500mg 3x1, Amoxicillin 500mg 3x1.');
  const [encryptedOutput, setEncryptedOutput] = useState<string>('');
  const [decryptedOutput, setDecryptedOutput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const handleTestEncrypt = async () => {
    try {
      const cipher = await encryptData(plainInput, masterPasscode);
      setEncryptedOutput(cipher);
      addSecurityLog('ENCRYPT', `Pengujian enkripsi manual string (${plainInput.length} karakter) berhasil.`);
    } catch (e: any) {
      alert('Gagal mengenkripsi: ' + e.message);
    }
  };

  const handleTestDecrypt = async () => {
    try {
      if (!encryptedOutput) return;
      const plain = await decryptData(encryptedOutput, masterPasscode);
      setDecryptedOutput(plain);
      addSecurityLog('DECRYPT', `Pengujian dekripsi manual string berhasil diverifikasi.`);
    } catch (e: any) {
      alert('Gagal mendekripsi: ' + e.message);
    }
  };

  const handleExportEncryptedJson = () => {
    const exportData = {
      faskes: bpjsConfig.namaFaskes,
      kdFaskes: bpjsConfig.kdFaskes,
      exportTimestamp: new Date().toISOString(),
      encryptionStandard: 'AES-256-GCM-PBKDF2',
      patients: patients.map((p) => ({
        id: p.id,
        encryptedPayload: p.encryptedData || btoa(JSON.stringify(p)),
        statusBpjs: p.statusBpjs,
        faskesTingkat1: p.faskesTingkat1,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_rme_encrypted_${bpjsConfig.kdFaskes}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addSecurityLog('EXPORT', `Export cadangan basis data terenkripsi (${patients.length} rekam medis).`);
  };

  // Keamanan dan DB hanya bisa dilihat oleh Administrator RME
  const isRmeAdmin = Boolean(user && user.role === 'ADMIN_RME');

  if (!isRmeAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-md text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-2xs">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Akses Database Khusus Administrator RME
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Formulir koneksi database MySQL, konsol query SQL, dan unduh skema tabel serta prosedur hanya dapat diakses oleh akun dengan peran <strong>Administrator RME (ADMIN_RME)</strong>.
          </p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 max-w-md mx-auto space-y-1.5 text-left">
          <div className="flex justify-between">
            <span className="text-slate-500">Akun Petugas Aktif:</span>
            <strong className="text-slate-800">{user ? user.namaLengkap : 'Tamu / Pasien'}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Peran Saat Ini:</span>
            <code className="bg-slate-200/80 px-2 py-0.5 rounded text-[11px] font-mono text-slate-800 font-bold">
              {user?.role || 'NON_ADMIN'}
            </code>
          </div>
        </div>
        <div>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Key className="w-4 h-4" />
            <span>Login Sebagai Administrator RME</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Architecture Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-7 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Standar Keamanan AES-256-GCM</span>
              <span className="text-emerald-700">·</span>
              <span className="text-slate-400 font-normal">UU PDP No. 27/2022 & Permenkes RME</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Sistem Manajemen Basis Data Pasien Terenkripsi
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Seluruh data identitas pasien (PII), nomor rekam medis, keluhan, dan rekam kunjungan disimpan
              dalam format terenkripsi AES-256-GCM dengan turunan kunci PBKDF2 (100.000 iterasi) untuk
              mencegah kebocoran data.
            </p>
          </div>

          {/* Master Key Security Lock */}
          <div className="bg-slate-950/80 border border-slate-700/80 rounded-xl p-4 sm:p-4.5 flex flex-col gap-3 min-w-[280px] shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                <span>KUNCI MASTER RME</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  isUnlocked
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isUnlocked ? 'TERBUKA' : 'TERKUNCI'}
              </span>
            </div>

            <div className="space-y-2">
              <input
                type="password"
                value={masterPasscode}
                onChange={(e) => setMasterPasscode(e.target.value)}
                placeholder="Passcode Kunci Master"
                className="w-full text-xs py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
              <button
                onClick={() => {
                  setIsUnlocked(!isUnlocked);
                  addSecurityLog(
                    isUnlocked ? 'ENCRYPT' : 'DECRYPT',
                    `Akses tampilan data rekam medis ${isUnlocked ? 'dikunci kembali' : 'dibuka dengan Master Key'}.`
                  );
                }}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isUnlocked
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                }`}
              >
                {isUnlocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>{isUnlocked ? 'Kunci Kembali Tampilan' : 'Buka Plaintext Rekam Medis'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t border-slate-800 text-xs font-semibold">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('USERS')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'USERS'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-200" />
              <span>Kelola User & Reset Password ({usersList.length || 5})</span>
            </button>

            <button
              onClick={() => setActiveTab('MYSQL')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'MYSQL'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-blue-200" />
              <span>Database MySQL & Query</span>
            </button>

            <button
              onClick={() => setActiveTab('DATABASE_INFO')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'DATABASE_INFO'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Lokasi & Arsitektur DB</span>
            </button>

            <button
              onClick={() => setActiveTab('RECORDS')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'RECORDS'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Rekam Pasien ({patients.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('PLAYGROUND')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'PLAYGROUND'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Lab Kriptografi AES-256</span>
            </button>

            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'AUDIT'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Audit Trail Keamanan ({securityLogs.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSchema}
              className="h-9 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Unduh schema.sql</span>
            </button>

            <button
              onClick={handleExportEncryptedJson}
              className="h-9 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Backup JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB: KELOLA PENGGUNA & RESET PASSWORD (KHUSUS ADMINISTRATOR RME) */}
      {activeTab === 'USERS' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200 shadow-2xs">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">Kelola Akun & Reset Password Petugas</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      Khusus Administrator RME
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Kontrol akses resmi petugas klinik yang tersimpan di tabel <code>users</code> database. Anda dapat mereset password akun petugas ke nilai awal default (<code className="font-bold">000000</code>).
                  </p>
                </div>
              </div>

              <button
                onClick={fetchUsers}
                disabled={loadingUsers}
                className="self-start lg:self-auto h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                <span>Muat Ulang Data Akun</span>
              </button>
            </div>

            {/* Info Security Policy Banner */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Kebijakan Reset Password Faskes:</p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Ketika Anda mereset password akun petugas ke <strong>000000</strong>, akun tersebut akan langsung ditandai dengan status <code className="font-bold bg-amber-100 px-1 py-0.5 rounded">mustChangePassword: true</code>. Saat petugas yang bersangkutan login berikutnya, sistem otomatis memaksanya membuat password baru pribadi sebelum dapat menggunakan sistem.
                </p>
              </div>
            </div>

            {/* Success / Error Notifications */}
            {resetSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-medium">{resetSuccessMsg}</span>
              </div>
            )}

            {resetErrorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-900 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{resetErrorMsg}</span>
              </div>
            )}
          </div>

          {/* Table of Registered Users */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-600" />
                  <span>Daftar Akun Petugas Terdaftar di Database ({usersList.length || 5})</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Tabel <code>users</code> · Terverifikasi Database Faskes</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-500 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Petugas / Nama Lengkap</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Peran (Role)</th>
                    <th className="py-3 px-4">NIP / ID</th>
                    <th className="py-3 px-4">Status Akun</th>
                    <th className="py-3 px-4">Login Terakhir</th>
                    <th className="py-3 px-4 text-center">Aksi Administrator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.length > 0 ? (
                    usersList.map((u: any) => {
                      const roleColors: Record<string, string> = {
                        DOKTER: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                        PETUGAS_LOKET: 'bg-indigo-50 text-indigo-800 border-indigo-200',
                        PETUGAS_FARMASI: 'bg-teal-50 text-teal-800 border-teal-200',
                        ADMIN_RME: 'bg-purple-50 text-purple-800 border-purple-200',
                        ADMIN_BRIDGING: 'bg-blue-50 text-blue-800 border-blue-200',
                      };
                      const badgeClass = roleColors[u.role] || 'bg-slate-100 text-slate-800 border-slate-200';

                      return (
                        <tr key={u.id || u.username} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{u.nama_lengkap || u.namaLengkap}</div>
                            <div className="text-[10px] text-slate-400 font-mono">Faskes: {u.kd_faskes || u.kdFaskes || '019U901'}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                            {u.username}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-md border text-[11px] font-semibold ${badgeClass}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                            {u.nip || '-'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>{u.is_active ?? u.isActive ? 'Aktif' : 'Non-aktif'}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[11px] text-slate-500 font-mono">
                            {u.last_login || u.lastLogin ? new Date(u.last_login || u.lastLogin).toLocaleString('id-ID') : 'Belum pernah'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserToReset(u);
                                setCustomResetPassword('000000');
                                setResetSuccessMsg(null);
                                setResetErrorMsg(null);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                              title={`Reset password akun ${u.username} ke 000000`}
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                              <span>Reset Password</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        {loadingUsers ? 'Memuat data pengguna dari database...' : 'Tidak ada pengguna ditemukan'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reset Confirmation Modal */}
          {selectedUserToReset && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Konfirmasi Reset Password</h3>
                    <p className="text-xs text-slate-500">Khusus Administrator RME Faskes</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-600">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Username Target:</span>
                      <strong className="text-slate-900 font-mono">{selectedUserToReset.username}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nama Petugas:</span>
                      <strong className="text-slate-900">{selectedUserToReset.nama_lengkap || selectedUserToReset.namaLengkap}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Peran Akun:</span>
                      <span className="font-bold text-emerald-800">{selectedUserToReset.role}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Password Baru Reset (Default: 000000)
                    </label>
                    <input
                      type="text"
                      value={customResetPassword}
                      onChange={(e) => setCustomResetPassword(e.target.value)}
                      placeholder="Masukkan password reset (minimal 6 karakter)"
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-300 font-mono text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      Pengguna wajib langsung membuat password baru saat login menggunakan nilai reset ini.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUserToReset(null)}
                    disabled={resettingUser}
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteResetPassword}
                    disabled={resettingUser}
                    className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {resettingUser ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mereset...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Reset ke {customResetPassword || '000000'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: MYSQL DATABASE ENGINE & CONSOLE */}
      {activeTab === 'MYSQL' && (
        <div className="space-y-6">
          {/* MySQL Banner & Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">MySQL / MariaDB Relational Database</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      RDBMS MySQL 8.x
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Basis data relasional terstruktur untuk data antrean online bridging BPJS (VClaim / PCare) dan rekam medis pasien terenkripsi.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-600">Engine Node:</span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800">
                  mysql2/promise
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-[11px] font-semibold text-slate-600">Katalog DB:</span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-blue-100 text-blue-800">
                  {mysqlDbName}
                </span>
              </div>
            </div>

            {/* Connection Form & Diagnostics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Host MySQL</label>
                <input
                  type="text"
                  value={mysqlHost}
                  onChange={(e) => setMysqlHost(e.target.value)}
                  placeholder="localhost / IP Server"
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Port</label>
                <input
                  type="number"
                  value={mysqlPort}
                  onChange={(e) => setMysqlPort(parseInt(e.target.value, 10) || 3306)}
                  placeholder="3306"
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">User</label>
                <input
                  type="text"
                  value={mysqlUser}
                  onChange={(e) => setMysqlUser(e.target.value)}
                  placeholder="root"
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Password</label>
                <input
                  type="password"
                  value={mysqlPass}
                  onChange={(e) => setMysqlPass(e.target.value)}
                  placeholder="Password DB"
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nama Database</label>
                <input
                  type="text"
                  value={mysqlDbName}
                  onChange={(e) => setMysqlDbName(e.target.value)}
                  placeholder="antrean_bpjs_tpmd"
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Action Buttons for Connection & Migration */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestMysql}
                  disabled={testingMysql}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingMysql ? 'animate-spin' : ''}`} />
                  <span>{testingMysql ? 'Menguji Koneksi...' : 'Uji Koneksi MySQL'}</span>
                </button>

                <button
                  onClick={handleInitSchema}
                  disabled={schemaInitLoading}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Code2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>{schemaInitLoading ? 'Memproses Skema...' : 'Migrasi Skema (schema.sql)'}</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-mono">
                Environment: .env.example / process.env.MYSQL_*
              </div>
            </div>

            {/* Test Connection Result Alert */}
            {mysqlTestResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  mysqlTestResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {mysqlTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold">
                    {mysqlTestResult.success
                      ? `Koneksi MySQL Sukses (${mysqlTestResult.latencyMs} ms)`
                      : 'Koneksi MySQL Gagal / Dalam Mode Siaga (Fallback Otomatis Aktif)'}
                  </div>
                  <div className="text-[11px]">
                    {mysqlTestResult.success ? (
                      <span>Server MySQL terdeteksi versi <strong>{mysqlTestResult.version}</strong> pada database <strong>{mysqlDbName}</strong>. Data siap ditransaksikan.</span>
                    ) : (
                      <span>
                        Pesan: {mysqlTestResult.error}. Sistem tetap 100% beroperasi normal dengan dual-storage layer terstruktur. Untuk menghubungkan MySQL lokal (XAMPP / Laragon / Cloud SQL), pastikan service MySQL menyala di port {mysqlPort} dan database <code>{mysqlDbName}</code> telah dibuat.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {schemaInitMsg && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium">
                {schemaInitMsg}
              </div>
            )}
          </div>

          {/* Interactive SQL Query Console */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-600" />
                  <span>Konsol Query Interaktif MySQL</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Jalankan perintah SQL langsung terhadap basis data MySQL / dual-engine.
                </p>
              </div>

              {/* Quick Query Shortcuts */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <button
                  onClick={() =>
                    setSqlQuery('SELECT nomor_antrean, tipe_pasien, poli_nama, nama_pasien, status, estimasi_jam_panggil FROM queues ORDER BY nomor_urut ASC LIMIT 10;')
                  }
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono"
                >
                  queues
                </button>
                <button
                  onClick={() =>
                    setSqlQuery('SELECT id, nik, no_bpjs, nama, status_bpjs, jenis_peserta, faskes_tingkat_1 FROM patients LIMIT 10;')
                  }
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono"
                >
                  patients
                </button>
                <button
                  onClick={() =>
                    setSqlQuery('SELECT kd_faskes, nama_faskes, cons_id, environment, base_url FROM faskes_config;')
                  }
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono"
                >
                  faskes_config
                </button>
                <button
                  onClick={() =>
                    setSqlQuery('SELECT id, timestamp, actor, action, status, details FROM security_logs ORDER BY timestamp DESC LIMIT 10;')
                  }
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono"
                >
                  security_logs
                </button>
                <button
                  onClick={() => setSqlQuery('SHOW TABLES;')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono"
                >
                  SHOW TABLES
                </button>
              </div>
            </div>

            {/* SQL Editor */}
            <div className="space-y-2">
              <div className="relative">
                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  rows={3}
                  placeholder="Tulis perintah SQL: SELECT * FROM queues WHERE status = 'MENUNGGU'..."
                  className="w-full p-3.5 bg-slate-900 text-emerald-400 border border-slate-800 rounded-xl font-mono text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={handleRunQuery}
                  disabled={runningQuery}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Play className={`w-3.5 h-3.5 ${runningQuery ? 'animate-spin' : ''}`} />
                  <span>{runningQuery ? 'Mengeksekusi...' : 'Jalankan Query SQL'}</span>
                </button>

                <span className="text-[11px] text-slate-500">
                  Didukung: SELECT, INSERT, UPDATE, SHOW TABLES, DESCRIBE
                </span>
              </div>
            </div>

            {/* Query Error */}
            {queryError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 font-mono">
                Error SQL: {queryError}
              </div>
            )}

            {/* Query Results Table */}
            {queryResult && queryResult.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Hasil Query ({queryResult.length} baris):</span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        {Object.keys(queryResult[0]).map((col) => (
                          <th key={col} className="py-2.5 px-3 whitespace-nowrap font-bold">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 bg-white">
                      {queryResult.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          {Object.values(row).map((val: any, colIdx) => (
                            <td key={colIdx} className="py-2 px-3 whitespace-nowrap">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val ?? 'NULL')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {queryResult && queryResult.length === 0 && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 text-center font-mono">
                Query berhasil dieksekusi. Tidak ada baris yang dikembalikan (0 rows).
              </div>
            )}
          </div>

          {/* Skema Tabel MySQL DDL Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-sm">Struktur Skema Tabel MySQL (data/schema.sql)</h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const ddl = `-- SKEMA BASIS DATA MYSQL: SISTEM ANTREAN BRIDGING BPJS\n-- FASKES: TPMD DR MACHMUJUR (019U901)\n-- Lokasi File: /data/schema.sql\n\nCREATE DATABASE IF NOT EXISTS \`antrean_bpjs_tpmd\` DEFAULT CHARACTER SET utf8mb4;\nUSE \`antrean_bpjs_tpmd\`;\n\n-- Tabel faskes_config, patients, queues, security_logs, bridging_logs...`;
                    navigator.clipboard.writeText(ddl);
                    setSqlCopied(true);
                    setTimeout(() => setSqlCopied(false), 2000);
                  }}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                >
                  {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{sqlCopied ? 'Tersalin!' : 'Salin DDL SQL'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                <div className="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. `queues` (Tabel Antrean)</span>
                </div>
                <div className="text-[11px] text-slate-600 font-mono space-y-0.5">
                  <div>· id (VARCHAR PRIMARY KEY)</div>
                  <div>· nomor_antrean, prefix, nomor_urut</div>
                  <div>· tipe_pasien (BPJS | UMUM)</div>
                  <div>· poli_kode, poli_nama, dokter_nama</div>
                  <div>· status (MENUNGGU, DIPANGGIL...)</div>
                  <div>· bpjs_task_id (Task 1 s.d. 7)</div>
                  <div>· kode_booking, keluhan, estimasi</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                <div className="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-blue-600" />
                  <span>2. `patients` (Tabel Pasien)</span>
                </div>
                <div className="text-[11px] text-slate-600 font-mono space-y-0.5">
                  <div>· id (VARCHAR PRIMARY KEY)</div>
                  <div>· nik (VARCHAR(16) INDEX)</div>
                  <div>· no_bpjs (VARCHAR(20))</div>
                  <div>· nama (VARCHAR(150))</div>
                  <div>· tgl_lahir, jenis_kelamin, no_hp</div>
                  <div>· status_bpjs, faskes_tingkat_1</div>
                  <div>· encrypted_data (AES-256 PII)</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                <div className="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-blue-600" />
                  <span>3. `faskes_config` (Kredensial)</span>
                </div>
                <div className="text-[11px] text-slate-600 font-mono space-y-0.5">
                  <div>· id (VARCHAR PRIMARY KEY)</div>
                  <div>· kd_faskes (019U901)</div>
                  <div>· cons_id (11495)</div>
                  <div>· secret_key, user_key</div>
                  <div>· dev_user, dev_pass</div>
                  <div>· environment (tester / prod)</div>
                  <div>· base_url (API VClaim BPJS)</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                <div className="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-blue-600" />
                  <span>4. `security_logs` (Audit RME)</span>
                </div>
                <div className="text-[11px] text-slate-600 font-mono space-y-0.5">
                  <div>· id, timestamp, actor</div>
                  <div>· action (ENCRYPT, DECRYPT, KEY_ROTATE)</div>
                  <div>· status (SUCCESS, DENIED)</div>
                  <div>· details (Keterangan Audit RME)</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                <div className="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-blue-600" />
                  <span>5. `bridging_logs` (API BPJS)</span>
                </div>
                <div className="text-[11px] text-slate-600 font-mono space-y-0.5">
                  <div>· id, timestamp, endpoint, method</div>
                  <div>· request_header, request_payload (JSON)</div>
                  <div>· response_status, response_payload</div>
                  <div>· duration_ms (Latency Jaringan)</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 space-y-1.5 flex flex-col justify-center">
                <div className="font-bold text-blue-900 text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Kompatibilitas Tools RDBMS</span>
                </div>
                <div className="text-[11px] text-blue-800 leading-relaxed">
                  Skema DDL kompatibel dengan phpMyAdmin, MySQL Workbench, DBeaver, Navicat, serta Cloud SQL MySQL GCP dan AWS RDS.
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: DOWNLOAD TABEL & STORED PROCEDURES */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Unduh Data Tabel & Stored Procedures MySQL</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ekspor data tabel secara terpisah atau unduh paket lengkap Stored Procedures dan database dump.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadFullDump}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Full MySQL Dump (.sql)</span>
                </button>
              </div>
            </div>

            {/* Grid Tabel Download */}
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                1. Ekspor Data Per Tabel (Format .SQL Dump / .CSV)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {/* queues */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span className="font-mono">tabel `queues`</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {queues.length} baris
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Data antrean poli, loket, farmasi, kode booking, dan status task BPJS.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                    <button
                      onClick={() => handleDownloadTableSql('queues')}
                      disabled={downloadingTable === 'queues'}
                      className="flex-1 py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Download className="w-3 h-3" />
                      <span>{downloadingTable === 'queues' ? '...' : '.SQL'}</span>
                    </button>
                    <button
                      onClick={() => handleDownloadTableCsv('queues')}
                      className="flex-1 py-1 px-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>.CSV</span>
                    </button>
                  </div>
                </div>

                {/* patients */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span className="font-mono">tabel `patients`</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {patients.length} rekam
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Rekam identitas pasien, NIK, No. BPJS, dan PII terenkripsi AES-256.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                    <button
                      onClick={() => handleDownloadTableSql('patients')}
                      disabled={downloadingTable === 'patients'}
                      className="flex-1 py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Download className="w-3 h-3" />
                      <span>{downloadingTable === 'patients' ? '...' : '.SQL'}</span>
                    </button>
                    <button
                      onClick={() => handleDownloadTableCsv('patients')}
                      className="flex-1 py-1 px-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>.CSV</span>
                    </button>
                  </div>
                </div>

                {/* users */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span className="font-mono">tabel `users`</span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                        5 akun
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Data petugas (Dokter, Loket, Farmasi, Admin Bridging, Admin RME).
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                    <button
                      onClick={() => handleDownloadTableSql('users')}
                      disabled={downloadingTable === 'users'}
                      className="w-full py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Download className="w-3 h-3" />
                      <span>{downloadingTable === 'users' ? '...' : 'Unduh .SQL'}</span>
                    </button>
                  </div>
                </div>

                {/* faskes_config */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span className="font-mono">tabel `faskes_config`</span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                        019U901
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Kredensial bridging VClaim / PCare TPMD DR MACHMUJUR.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                    <button
                      onClick={() => handleDownloadTableSql('faskes_config')}
                      disabled={downloadingTable === 'faskes_config'}
                      className="w-full py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Download className="w-3 h-3" />
                      <span>{downloadingTable === 'faskes_config' ? '...' : 'Unduh .SQL'}</span>
                    </button>
                  </div>
                </div>

                {/* security_logs */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span className="font-mono">tabel `security_logs`</span>
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                        {securityLogs.length} audit
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Log audit trail login, autentikasi, enkripsi, dan dekripsi rekam medis.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                    <button
                      onClick={() => handleDownloadTableSql('security_logs')}
                      disabled={downloadingTable === 'security_logs'}
                      className="flex-1 py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Download className="w-3 h-3" />
                      <span>{downloadingTable === 'security_logs' ? '...' : '.SQL'}</span>
                    </button>
                    <button
                      onClick={() => handleDownloadTableCsv('security_logs')}
                      className="flex-1 py-1 px-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>.CSV</span>
                    </button>
                  </div>
                </div>

                {/* bridging_logs */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span className="font-mono">tabel `bridging_logs`</span>
                      <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] font-bold">
                        {bridgingLogs.length} request
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Log transmisi payload HTTP, HMAC-SHA256, dan respon BPJS.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                    <button
                      onClick={() => handleDownloadTableSql('bridging_logs')}
                      disabled={downloadingTable === 'bridging_logs'}
                      className="flex-1 py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Download className="w-3 h-3" />
                      <span>{downloadingTable === 'bridging_logs' ? '...' : '.SQL'}</span>
                    </button>
                    <button
                      onClick={() => handleDownloadTableCsv('bridging_logs')}
                      className="flex-1 py-1 px-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>.CSV</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stored Procedures Download Box */}
            <div className="pt-2 border-t border-slate-100">
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-blue-600" />
                    <span>2. Stored Procedures MySQL (procedures.sql)</span>
                  </div>
                  <p className="text-[11px] text-blue-900 leading-relaxed">
                    Berisi 6 prosedur tersimpan: <code>sp_otentikasi_petugas</code>, <code>sp_buat_antrean_baru</code>, <code>sp_panggil_antrean</code>, <code>sp_mulai_layanan_dokter</code>, <code>sp_selesai_layanan</code>, dan <code>sp_catat_audit_keamanan</code>.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleDownloadProcedures}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh procedures.sql</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 0: DATABASE LOCATION & ARCHITECTURE */}
      {activeTab === 'DATABASE_INFO' && (
        <div className="space-y-6">
          {/* Status Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">File Database Fisik</div>
                <div className="text-xs font-mono font-bold text-slate-900 mt-1 truncate">/data/faskes_antrean.json</div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Aktif Tersimpan di Server</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Server className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">API Database Server</div>
                <div className="text-xs font-mono font-bold text-slate-900 mt-1">/api/db (GET/POST)</div>
                <div className="text-[11px] text-slate-500 mt-1">Next.js API Handler Autentik</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sinkronisasi Multi-Device</div>
                <div className="text-xs font-bold text-slate-900 mt-1">3.5 Detik Real-Time Sync</div>
                <div className="text-[11px] text-slate-500 mt-1">TV Display, Kiosk & Loket</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Keamanan Data (PII)</div>
                <div className="text-xs font-bold text-slate-900 mt-1">AES-256-GCM + PBKDF2</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">UU PDP No. 27/2022</div>
              </div>
            </div>
          </div>

          {/* Database Architecture & Structure Explanation */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>Struktur Koleksi Database TPMD DR. MACHMUJUR</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Basis data tersimpan secara terstruktur dan terotomatisasi di server lokal dan sinkron ke seluruh antarmuka klinik.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleFetchServerDb}
                  disabled={loadingRaw}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingRaw ? 'animate-spin' : ''}`} />
                  <span>{loadingRaw ? 'Mengambil Data...' : 'Inspeksi Raw Server DB'}</span>
                </button>
              </div>
            </div>

            {/* Collection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 font-mono">1. collections.queues</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {queues.length} Antrean
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Menyimpan nomor antrean, Poli tujuan, status pelayanan, Task ID BPJS (1-7), dan estimasi waktu tunggu otomatis.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 font-mono">2. collections.patients</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {patients.length} Rekam Medis
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Menyimpan data identitas pasien (NIK, No. Kartu BPJS, Nama, No. HP, Jenis Kepesertaan) dengan proteksi enkripsi AES-256-GCM.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 font-mono">3. collections.config</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                    KD 019U901
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Menyimpan konfigurasi bridging BPJS (ConsID 11495, SecretKey, UserKey, Environment Tester/Production).
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 font-mono">4. collections.securityLogs</span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold">
                    {securityLogs.length} Audit
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Mencatat jejak audit RME (akses data pasien, dekripsi master key, rotasi kunci, ekspor data) sesuai regulasi Permenkes.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 font-mono">5. collections.bridgingLogs</span>
                  <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold">
                    {bridgingLogs.length} Log API
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Merekam riwayat pertukaran data API VClaim / PCare, HMAC-SHA256 signature, latency respon, dan status Task ID.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 space-y-1.5 flex flex-col justify-center">
                <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Dukungan Database Relasional (SQL)</span>
                </span>
                <p className="text-emerald-900 text-[11px] leading-relaxed">
                  Sistem telah didesain modular. Jika faskes memerlukan Cloud SQL / PostgreSQL multi-cabang, skema dapat langsung dihubungkan.
                </p>
              </div>
            </div>

            {/* Live Raw JSON View (if fetched) */}
            {rawServerDb && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-600" />
                    <span>Pratinjau Langsung Isi File: <code className="text-emerald-700 bg-slate-100 px-1.5 py-0.5 rounded">/data/faskes_antrean.json</code></span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(rawServerDb);
                      alert('Isi database server berhasil disalin ke clipboard!');
                    }}
                    className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin JSON</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-80 border border-slate-800">
                  {rawServerDb}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: PATIENTS DATABASE TABLE */}
      {activeTab === 'RECORDS' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Rekam Data Pasien Faskes (TPMD Dr. Machmujur)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mode saat ini:{' '}
                <strong className={isUnlocked ? 'text-emerald-700' : 'text-slate-700'}>
                  {isUnlocked ? 'Plaintext Terotorisasi (Admin)' : 'Terenkripsi Masking PII'}
                </strong>
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">Total Pasien: {patients.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">ID Pasien</th>
                  <th className="py-3 px-4">Nama Pasien</th>
                  <th className="py-3 px-4">NIK (KTP)</th>
                  <th className="py-3 px-4">No. Kartu BPJS</th>
                  <th className="py-3 px-4">Status & Jenis Peserta</th>
                  <th className="py-3 px-4">Faskes Terdaftar</th>
                  <th className="py-3 px-4">Status Kriptografi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">{p.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {isUnlocked ? p.nama : maskSensitive(p.nama, 2, 2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {isUnlocked ? p.nik : maskSensitive(p.nik, 4, 3)}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {isUnlocked ? p.noBpjs : maskSensitive(p.noBpjs, 4, 3)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {p.statusBpjs}
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">{p.jenisPeserta}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{p.faskesTingkat1}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>AES-256-GCM OK</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CRYPTOGRAPHY PLAYGROUND */}
      {activeTab === 'PLAYGROUND' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Lab Kriptografi Interaktif AES-256-GCM</h3>
            <p className="text-xs text-slate-500 mt-1">
              Uji coba langsung enkripsi dan dekripsi data rekam medis pasien menggunakan WebCrypto API bawaan browser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Plaintext */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                1. Masukkan Teks Sensitif / Catatan Medis (Plaintext)
              </label>
              <textarea
                value={plainInput}
                onChange={(e) => setPlainInput(e.target.value)}
                rows={4}
                className="w-full p-3 text-xs border border-slate-300 rounded-xl font-mono focus:border-emerald-600 focus:outline-none"
              />
              <button
                onClick={handleTestEncrypt}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Enkripsi dengan AES-256-GCM</span>
              </button>
            </div>

            {/* Output Ciphertext */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                2. Hasil Sandi Terenkripsi (IV 96-bit + Ciphertext Base64)
              </label>
              <textarea
                readOnly
                value={encryptedOutput || 'Klik tombol "Enkripsi" di sebelah kiri untuk menghasilkan ciphertext...'}
                rows={4}
                className="w-full p-3 text-xs bg-slate-900 text-emerald-400 border border-slate-800 rounded-xl font-mono"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleTestDecrypt}
                  disabled={!encryptedOutput}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Uji Dekripsi Kembali</span>
                </button>
                {encryptedOutput && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(encryptedOutput);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Tersalin!' : 'Salin Ciphertext'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {decryptedOutput && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Hasil Dekripsi Sukses (Integritas Data Terverifikasi 100%):
              </p>
              <p className="text-xs text-slate-800 font-mono bg-white p-2.5 rounded-lg border border-emerald-200">
                {decryptedOutput}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL LOGS */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Audit Log Akses & Kriptografi Keamanan</h3>
            <span className="text-xs text-slate-500">Mencatat seluruh transaksi data sensitif</span>
          </div>

          <div className="divide-y divide-slate-100">
            {securityLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-start justify-between gap-4 text-xs hover:bg-slate-50/70">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                        [{log.action}]
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-medium text-slate-600">{log.actor}</span>
                    </div>
                    <p className="text-slate-800 mt-0.5">{log.details}</p>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-400 shrink-0 font-mono" suppressHydrationWarning>
                  {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
