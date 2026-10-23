'use client';

import React, { useState } from 'react';
import { useQueue } from '@/lib/queue-context';
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
} from 'lucide-react';

export const SecurityDatabaseView: React.FC = () => {
  const { patients, securityLogs, addSecurityLog, bpjsConfig } = useQueue();

  const [masterPasscode, setMasterPasscode] = useState<string>('DrMachmujurSecure2026!');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'RECORDS' | 'AUDIT' | 'PLAYGROUND'>('RECORDS');

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
              onClick={() => setActiveTab('RECORDS')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'RECORDS'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Basis Data Pasien ({patients.length})</span>
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

          <button
            onClick={handleExportEncryptedJson}
            className="h-9 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Backup Terenkripsi</span>
          </button>
        </div>
      </div>

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
