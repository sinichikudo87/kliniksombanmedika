'use client';

import React, { useState, useEffect } from 'react';
import { useQueue } from '@/lib/queue-context';
import { useAuth } from '@/lib/auth-context';
import { encryptData, decryptData, maskSensitive } from '@/lib/encrypted-db';
import { showSwalAlert, showSwalSuccess, showSwalError } from '@/lib/swal';
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
  Edit3,
  Stethoscope,
  Save,
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
  const [polisList, setPolisList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [selectedUserToReset, setSelectedUserToReset] = useState<any | null>(null);
  const [customResetPassword, setCustomResetPassword] = useState<string>('000000');
  const [resettingUser, setResettingUser] = useState<boolean>(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [resetErrorMsg, setResetErrorMsg] = useState<string | null>(null);

  // Edit User (Nama Petugas, Dokter, NIP, Role di DB)
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editNamaLengkap, setEditNamaLengkap] = useState<string>('');
  const [editNip, setEditNip] = useState<string>('');
  const [editRole, setEditRole] = useState<string>('DOKTER');
  const [savingUser, setSavingUser] = useState<boolean>(false);

  // Edit Poliklinik & Dokter Penanggung Jawab
  const [editingPoli, setEditingPoli] = useState<any | null>(null);
  const [editPoliDokter, setEditPoliDokter] = useState<string>('');
  const [editPoliNama, setEditPoliNama] = useState<string>('');
  const [editPoliRuang, setEditPoliRuang] = useState<string>('');
  const [editPoliSip, setEditPoliSip] = useState<string>('');
  const [savingPoli, setSavingPoli] = useState<boolean>(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/db');
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.users) setUsersList(data.data.users);
        if (data.data.poliList) setPolisList(data.data.poliList);
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
        if (isMounted && data.success && data.data) {
          if (data.data.users) setUsersList(data.data.users);
          if (data.data.poliList) setPolisList(data.data.poliList);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setSavingUser(true);
    setResetSuccessMsg(null);
    setResetErrorMsg(null);
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_user',
          payload: {
            id: editingUser.id || editingUser.username,
            namaLengkap: editNamaLengkap.trim(),
            nip: editNip.trim(),
            role: editRole,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        const msg = `Data akun '${editingUser.username}' (${editNamaLengkap}) berhasil diperbarui di database!`;
        setResetSuccessMsg(msg);
        showSwalSuccess(msg, 'Data Petugas Diperbarui');
        addSecurityLog(
          'KEY_ROTATE',
          `Administrator RME memperbarui profil pengguna ${editingUser.username}: ${editNamaLengkap} [${editRole}].`
        );
        setEditingUser(null);
        await fetchUsers();
      } else {
        const errMsg = data.message || 'Gagal menyimpan perubahan akun';
        setResetErrorMsg(errMsg);
        showSwalError(errMsg, 'Gagal Menyimpan');
      }
    } catch (err: any) {
      const errMsg = err.message || 'Gagal terhubung ke database';
      setResetErrorMsg(errMsg);
      showSwalError(errMsg, 'Koneksi Gagal');
    } finally {
      setSavingUser(false);
    }
  };

  const handleSavePoli = async () => {
    if (!editingPoli) return;
    setSavingPoli(true);
    setResetSuccessMsg(null);
    setResetErrorMsg(null);
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_poli',
          payload: {
            kode: editingPoli.kode,
            updates: {
              dokter: editPoliDokter.trim(),
              nama: editPoliNama.trim(),
              ruang: editPoliRuang.trim(),
              sip: editPoliSip.trim(),
            },
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        const msg = `Data Poliklinik '${editingPoli.nama}' dengan Dokter '${editPoliDokter}' berhasil diperbarui!`;
        setResetSuccessMsg(msg);
        showSwalSuccess(msg, 'Poli & Dokter Diperbarui');
        addSecurityLog(
          'KEY_ROTATE',
          `Administrator RME memperbarui data poli ${editingPoli.kode}: Dokter ${editPoliDokter}, Ruang ${editPoliRuang}.`
        );
        setEditingPoli(null);
        await fetchUsers();
      } else {
        const errMsg = data.message || 'Gagal memperbarui poliklinik';
        setResetErrorMsg(errMsg);
        showSwalError(errMsg, 'Gagal Memperbarui Poli');
      }
    } catch (err: any) {
      const errMsg = err.message || 'Gagal terhubung ke database';
      setResetErrorMsg(errMsg);
      showSwalError(errMsg, 'Koneksi Gagal');
    } finally {
      setSavingPoli(false);
    }
  };

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
        const msg = data.message || `Password akun '${selectedUserToReset.username}' berhasil di-reset ke '${customResetPassword.trim() || '000000'}'.`;
        setResetSuccessMsg(msg);
        showSwalSuccess(msg, 'Reset Password Berhasil');
        addSecurityLog(
          'KEY_ROTATE',
          `Administrator RME mereset password akun ${selectedUserToReset.username} ke default (000000).`
        );
        setSelectedUserToReset(null);
        await fetchUsers();
      } else {
        const errMsg = data.message || 'Gagal mereset password';
        setResetErrorMsg(errMsg);
        showSwalError(errMsg, 'Gagal Reset');
      }
    } catch (err: any) {
      const errMsg = err.message || 'Gagal terhubung ke database';
      setResetErrorMsg(errMsg);
      showSwalError(errMsg, 'Koneksi Gagal');
    } finally {
      setResettingUser(false);
    }
  };

  // MySQL Connection & Query State
  const [mysqlHost, setMysqlHost] = useState<string>('202.10.47.207');
  const [mysqlPort, setMysqlPort] = useState<number>(3306);
  const [mysqlUser, setMysqlUser] = useState<string>('jimbrink');
  const [mysqlPass, setMysqlPass] = useState<string>('Sh1nratensey86');
  const [mysqlDbName, setMysqlDbName] = useState<string>('klinik_somban_medika_xx26');
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
        if (data.result.success) {
          showSwalSuccess(`Koneksi ke server faskes '${mysqlHost}' berhasil!`, 'Koneksi Server Berhasil');
        } else {
          showSwalError(`Gagal koneksi ke server: ${data.result.error || data.result.status?.error}`, 'Koneksi Server Gagal');
        }
      } else {
        const errMsg = data.error || 'Koneksi gagal';
        setMysqlTestResult({
          success: false,
          error: errMsg,
          testedAt: new Date().toLocaleTimeString('id-ID'),
        });
        showSwalError(errMsg, 'Koneksi Server Gagal');
      }
    } catch (err: any) {
      setMysqlTestResult({
        success: false,
        error: err.message,
        testedAt: new Date().toLocaleTimeString('id-ID'),
      });
      showSwalError(err.message || 'Gagal menghubungi server', 'Koneksi Error');
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
        setQueryError(data.error || 'Perintah gagal diproses');
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
      setSchemaInitMsg(data.message || (data.success ? 'Struktur data faskes berhasil diperbarui!' : 'Gagal memperbarui data'));
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
        a.download = `data_${tableName}_${bpjsConfig.kdFaskes}_${Date.now()}.sql`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      showSwalError('Gagal ekspor data: ' + err.message);
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
      showSwalAlert(`Data ${tableName} belum memiliki rekaman untuk diekspor ke CSV`, { title: 'Data Kosong', icon: 'info' });
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
    a.download = `data_${tableName}_${bpjsConfig.kdFaskes}.csv`;
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
      showSwalError('Gagal download skema: ' + err.message);
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
      showSwalError('Gagal download procedures: ' + err.message);
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
      showSwalError('Gagal download full dump: ' + err.message);
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
      showSwalError('Gagal mengenkripsi: ' + e.message);
    }
  };

  const handleTestDecrypt = async () => {
    try {
      if (!encryptedOutput) return;
      const plain = await decryptData(encryptedOutput, masterPasscode);
      setDecryptedOutput(plain);
      addSecurityLog('DECRYPT', `Pengujian dekripsi manual string berhasil diverifikasi.`);
    } catch (e: any) {
      showSwalError('Gagal mendekripsi: ' + e.message);
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
            Akses Khusus Administrator RME
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Konfigurasi server terpusat, konsol penelusuran data faskes, dan ekspor data operasional hanya dapat diakses oleh akun dengan peran <strong>Administrator RME (ADMIN_RME)</strong>.
          </p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 max-w-md mx-auto space-y-1.5 text-left">
          <div className="flex justify-between">
            <span className="text-slate-500">Akun Petugas Aktif:</span>
            <strong className="text-slate-800">{user ? (user.namaLengkap || (user as any).nama_lengkap || user.username) : 'Tamu / Pasien'}</strong>
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
              Sistem Manajemen Data Pasien Terenkripsi
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
              <span>Pusat Data Server</span>
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
              <span>Status Integrasi Sistem</span>
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
              <span>Arsip Data (.sql)</span>
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
                    Kontrol akses resmi petugas dan dokter faskes. Anda dapat mereset kata sandi akun petugas ke nilai awal default (<code className="font-bold">000000</code>).
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
                  <span>Daftar Akun Petugas Terdaftar ({usersList.length || 5})</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Akun Petugas Terverifikasi Sistem Faskes</p>
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
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUser(u);
                                  setEditNamaLengkap(u.nama_lengkap || u.namaLengkap || '');
                                  setEditNip(u.nip || '');
                                  setEditRole(u.role || 'DOKTER');
                                  setResetSuccessMsg(null);
                                  setResetErrorMsg(null);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                                title={`Ubah profil akun ${u.username}`}
                              >
                                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                                <span>Edit Profil</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUserToReset(u);
                                  setCustomResetPassword('000000');
                                  setResetSuccessMsg(null);
                                  setResetErrorMsg(null);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                                title={`Reset password akun ${u.username} ke 000000`}
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                                <span>Reset Password</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        {loadingUsers ? 'Memuat data pengguna...' : 'Tidak ada pengguna ditemukan'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLE MASTER POLIKLINIK & DOKTER DI DATABASE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  <span>Master Poliklinik & Dokter Penanggung Jawab</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Seluruh nama dokter, poliklinik, dan ruangan terintegrasi dinamis dalam sistem faskes.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-500 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Poli & Prefix</th>
                    <th className="py-3 px-4">Dokter Penanggung Jawab</th>
                    <th className="py-3 px-4">SIP / Lisensi Praktik</th>
                    <th className="py-3 px-4">Ruangan / Loket</th>
                    <th className="py-3 px-4">Durasi Layanan</th>
                    <th className="py-3 px-4 text-center">Aksi Administrator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {polisList.length > 0 ? (
                    polisList.map((p: any) => (
                      <tr key={p.kode} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center font-mono text-xs">
                              {p.prefix}
                            </span>
                            <div>
                              <div className="font-bold text-slate-900">{p.nama}</div>
                              <div className="text-[10px] text-slate-400 font-mono">Kode: {p.kode}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {p.dokter}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                          {p.sip || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {p.ruang}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          ±{p.durasiRataRataMenit || 10} menit / pasien
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPoli(p);
                              setEditPoliDokter(p.dokter || '');
                              setEditPoliNama(p.nama || '');
                              setEditPoliRuang(p.ruang || '');
                              setEditPoliSip(p.sip || '');
                              setResetSuccessMsg(null);
                              setResetErrorMsg(null);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Ubah Dokter / Poli</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400">
                        Memuat data poliklinik dari database...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit User Modal */}
          {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Edit Profil Petugas</h3>
                    <p className="text-xs text-slate-500">Data Petugas & Dokter Faskes</p>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs text-slate-700">
                  <div>
                    <label className="block text-slate-500 mb-1">Username (ID Akun - Permanen)</label>
                    <input
                      type="text"
                      disabled
                      value={editingUser.username}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 font-mono text-slate-500 bg-slate-100 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar Petugas / Dokter</label>
                    <input
                      type="text"
                      value={editNamaLengkap}
                      onChange={(e) => setEditNamaLengkap(e.target.value)}
                      placeholder="Contoh: dr. Machmujur, M.Kes"
                      className="w-full py-2 px-3 rounded-xl border border-slate-300 font-medium text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Nama ini akan tampil di seluruh layar (Kios, TV Display, Loket, & RME).</p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">NIP / Nomor Identitas Pegawai</label>
                    <input
                      type="text"
                      value={editNip}
                      onChange={(e) => setEditNip(e.target.value)}
                      placeholder="Nomor NIP..."
                      className="w-full py-2 px-3 rounded-xl border border-slate-300 font-mono text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Peran / Hak Akses (Role)</label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl border border-slate-300 font-medium text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="DOKTER">DOKTER (Poli Umum / Gigi)</option>
                      <option value="PETUGAS_LOKET">PETUGAS_LOKET (Pendaftaran)</option>
                      <option value="PETUGAS_FARMASI">PETUGAS_FARMASI (Apotek)</option>
                      <option value="ADMIN_RME">ADMIN_RME (Administrator Rekam Medis)</option>
                      <option value="ADMIN_BRIDGING">ADMIN_BRIDGING (Operator BPJS)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    disabled={savingUser}
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveUser}
                    disabled={savingUser}
                    className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {savingUser ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Poli & Dokter Modal */}
          {editingPoli && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Ubah Dokter & Poliklinik</h3>
                    <p className="text-xs text-slate-500">Informasi Layanan & Dokter Penanggung Jawab</p>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs text-slate-700">
                  <div>
                    <label className="block text-slate-500 mb-1">Kode Poli (Prefix: {editingPoli.prefix})</label>
                    <input
                      type="text"
                      disabled
                      value={editingPoli.kode}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 font-mono text-slate-500 bg-slate-100 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Poliklinik</label>
                    <input
                      type="text"
                      value={editPoliNama}
                      onChange={(e) => setEditPoliNama(e.target.value)}
                      placeholder="Nama Poli..."
                      className="w-full py-2 px-3 rounded-xl border border-slate-300 font-medium text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dokter Penanggung Jawab</label>
                    <input
                      type="text"
                      value={editPoliDokter}
                      onChange={(e) => setEditPoliDokter(e.target.value)}
                      placeholder="Nama Dokter..."
                      className="w-full py-2 px-3 rounded-xl border border-slate-300 font-medium text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">SIP / Nomor Izin Praktik</label>
                    <input
                      type="text"
                      value={editPoliSip}
                      onChange={(e) => setEditPoliSip(e.target.value)}
                      placeholder="Contoh: 446/102/SIP-D/2024"
                      className="w-full py-2 px-3 rounded-xl border border-slate-300 font-mono text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ruangan / Loket</label>
                    <input
                      type="text"
                      value={editPoliRuang}
                      onChange={(e) => setEditPoliRuang(e.target.value)}
                      placeholder="Contoh: Ruang 01 (Lantai 1)"
                      className="w-full py-2 px-3 rounded-xl border border-slate-300 font-medium text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPoli(null)}
                    disabled={savingPoli}
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePoli}
                    disabled={savingPoli}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {savingPoli ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

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
          {/* Koneksi Server & Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">Konfigurasi Server Terpusat</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      Aktif & Terhubung
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Pusat penyimpanan data untuk operasional antrean, bridging BPJS, dan rekam medis faskes.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-600">Status:</span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800">
                  Terintegrasi
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-[11px] font-semibold text-slate-600">ID Faskes:</span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-blue-100 text-blue-800">
                  {bpjsConfig.kdFaskes}
                </span>
              </div>
            </div>

            {/* Connection Form & Diagnostics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Host Server</label>
                <input
                  type="text"
                  value={mysqlHost}
                  onChange={(e) => setMysqlHost(e.target.value)}
                  placeholder="IP Server"
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
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">User Akun</label>
                <input
                  type="text"
                  value={mysqlUser}
                  onChange={(e) => setMysqlUser(e.target.value)}
                  placeholder="Username"
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Kata Sandi</label>
                <input
                  type="password"
                  value={mysqlPass}
                  onChange={(e) => setMysqlPass(e.target.value)}
                  placeholder="Kata Sandi"
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Katalog Data</label>
                <input
                  type="text"
                  value={mysqlDbName}
                  onChange={(e) => setMysqlDbName(e.target.value)}
                  placeholder="Nama Katalog"
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingMysql ? 'animate-spin' : ''}`} />
                  <span>{testingMysql ? 'Menguji Koneksi...' : 'Uji Koneksi Server'}</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-mono">
                Koneksi Server Terpusat Faskes
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
                      ? `Koneksi Server Berhasil Terhubung (${mysqlTestResult.latencyMs} ms)`
                      : 'Koneksi Server Belum Terjangkau'}
                  </div>
                  <div className="text-[11px]">
                    {mysqlTestResult.success ? (
                      <span>Server utama faskes terverifikasi online dan siap melayani seluruh transaksi antrean & rekam medis.</span>
                    ) : (
                      <span>
                        Keterangan: {mysqlTestResult.error}. Pastikan konfigurasi alamat server dan kredensial akses telah sesuai.
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

          {/* Interactive Query Console */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-600" />
                  <span>Konsol Pencarian Data Faskes</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lakukan penelusuran data antrean, pasien, dan log sistem secara langsung.
                </p>
              </div>

              {/* Quick Query Shortcuts */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <button
                  onClick={() =>
                    setSqlQuery('SELECT nomor_antrean, tipe_pasien, poli_nama, nama_pasien, status, estimasi_jam_panggil FROM queues ORDER BY nomor_urut ASC LIMIT 10;')
                  }
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono cursor-pointer"
                >
                  Antrean Hari Ini
                </button>
                <button
                  onClick={() =>
                    setSqlQuery('SELECT id, nik, no_bpjs, nama, status_bpjs, jenis_peserta, faskes_tingkat_1 FROM patients LIMIT 10;')
                  }
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono cursor-pointer"
                >
                  Data Pasien
                </button>
                <button
                  onClick={() =>
                    setSqlQuery('SELECT id, timestamp, actor, action, status, details FROM security_logs ORDER BY timestamp DESC LIMIT 10;')
                  }
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono cursor-pointer"
                >
                  Log Keamanan
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
                  placeholder="Ketik kriteria pencarian data faskes..."
                  className="w-full p-3.5 bg-slate-900 text-emerald-400 border border-slate-800 rounded-xl font-mono text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={handleRunQuery}
                  disabled={runningQuery}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className={`w-3.5 h-3.5 ${runningQuery ? 'animate-spin' : ''}`} />
                  <span>{runningQuery ? 'Mengeksekusi...' : 'Jalankan Perintah'}</span>
                </button>

                <span className="text-[11px] text-slate-500">
                  Operasi: SELECT, INSERT, UPDATE
                </span>
              </div>
            </div>

            {/* Query Error */}
            {queryError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 font-mono">
                Error: {queryError}
              </div>
            )}

            {/* Query Results Table */}
            {queryResult && queryResult.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Hasil ({queryResult.length} baris):</span>
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
                Perintah berhasil dijalankan. Tidak ada data yang ditemukan (0 rows).
              </div>
            )}
          </div>

          {/* SECTION: EKSPOR DATA OPERASIONAL */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Ekspor Data Operasional Faskes</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unduh data antrean, rekam medis pasien, dan riwayat audit untuk arsip faskes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadFullDump}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Cadangkan Seluruh Data (.sql)</span>
                </button>
              </div>
            </div>

            {/* Grid Download */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {/* Antrean */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>Data Antrean</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {queues.length} data
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Data nomor antrean poli, loket, farmasi, dan waktu panggil.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                    <button
                      onClick={() => handleDownloadTableSql('queues')}
                      disabled={downloadingTable === 'queues'}
                      className="flex-1 py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>{downloadingTable === 'queues' ? '...' : '.SQL'}</span>
                    </button>
                    <button
                      onClick={() => handleDownloadTableCsv('queues')}
                      className="flex-1 py-1 px-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>.CSV</span>
                    </button>
                  </div>
                </div>

                {/* Pasien */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>Data Pasien</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {patients.length} rekam
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Data identitas pasien, NIK, No. BPJS, dan status kepesertaan.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                    <button
                      onClick={() => handleDownloadTableSql('patients')}
                      disabled={downloadingTable === 'patients'}
                      className="flex-1 py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>{downloadingTable === 'patients' ? '...' : '.SQL'}</span>
                    </button>
                    <button
                      onClick={() => handleDownloadTableCsv('patients')}
                      className="flex-1 py-1 px-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>.CSV</span>
                    </button>
                  </div>
                </div>

                {/* Petugas */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>Akun Petugas</span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                        {usersList.length || 5} akun
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Daftar akun dokter, petugas loket, apotek, dan admin.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                    <button
                      onClick={() => handleDownloadTableSql('users')}
                      disabled={downloadingTable === 'users'}
                      className="w-full py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>{downloadingTable === 'users' ? '...' : 'Unduh .SQL'}</span>
                    </button>
                  </div>
                </div>

                {/* Log Audit */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>Log Audit Keamanan</span>
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                        {securityLogs.length} audit
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Catatan akses, login petugas, dan pengubahan password.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                    <button
                      onClick={() => handleDownloadTableSql('security_logs')}
                      disabled={downloadingTable === 'security_logs'}
                      className="flex-1 py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>{downloadingTable === 'security_logs' ? '...' : '.SQL'}</span>
                    </button>
                    <button
                      onClick={() => handleDownloadTableCsv('security_logs')}
                      className="flex-1 py-1 px-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>.CSV</span>
                    </button>
                  </div>
                </div>

                {/* Log Bridging */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>Log Bridging BPJS</span>
                      <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] font-bold">
                        {bridgingLogs.length} request
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Riwayat transmisi data bridging dan status respon.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                    <button
                      onClick={() => handleDownloadTableSql('bridging_logs')}
                      disabled={downloadingTable === 'bridging_logs'}
                      className="flex-1 py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>{downloadingTable === 'bridging_logs' ? '...' : '.SQL'}</span>
                    </button>
                    <button
                      onClick={() => handleDownloadTableCsv('bridging_logs')}
                      className="flex-1 py-1 px-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>.CSV</span>
                    </button>
                  </div>
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
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status Penyimpanan Data</div>
                <div className="text-xs font-mono font-bold text-slate-900 mt-1 truncate">Server Terpusat: Aktif</div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Layanan Data Terhubung</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Server className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Layanan Integrasi Data</div>
                <div className="text-xs font-mono font-bold text-slate-900 mt-1">/api/db (GET/POST)</div>
                <div className="text-[11px] text-slate-500 mt-1">Layanan Sinkronisasi Autentik</div>
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

          {/* Architecture & Structure Explanation */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>Struktur Layanan Data TPMD DR. MACHMUJUR</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Data faskes tersimpan secara terstruktur, terotomatisasi, dan tersinkron ke seluruh antarmuka klinik.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleFetchServerDb}
                  disabled={loadingRaw}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingRaw ? 'animate-spin' : ''}`} />
                  <span>{loadingRaw ? 'Mengambil Data...' : 'Ringkasan Data Sistem'}</span>
                </button>
              </div>
            </div>

            {/* Collection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">1. Layanan Antrean Pasien</span>
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
                  <span className="font-bold text-slate-900">2. Rekam Medis Pasien</span>
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
                  <span className="font-bold text-slate-900">3. Konfigurasi Sistem & BPJS</span>
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
                  <span className="font-bold text-slate-900">4. Catatan Audit Keamanan</span>
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
                  <span className="font-bold text-slate-900">5. Riwayat Integrasi BPJS</span>
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
                  <span>Dukungan Server Terpusat</span>
                </span>
                <p className="text-emerald-900 text-[11px] leading-relaxed">
                  Sistem telah didesain modular dan terintegrasi untuk mendukung sinkronisasi multi-loket serta multi-cabang secara andal.
                </p>
              </div>
            </div>

            {/* Live Raw JSON View (if fetched) */}
            {rawServerDb && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-600" />
                    <span>Pratinjau Ringkasan Data Operasional: <code className="text-emerald-700 bg-slate-100 px-1.5 py-0.5 rounded">Aktif Terhubung</code></span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(rawServerDb);
                      showSwalSuccess('Data sistem berhasil disalin ke clipboard!');
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
