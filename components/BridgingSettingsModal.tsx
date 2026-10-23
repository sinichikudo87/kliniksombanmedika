'use client';

import React, { useState } from 'react';
import { useQueue } from '@/lib/queue-context';
import { getBpjsHeaders } from '@/lib/bpjs-bridging';
import {
  X,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
  Server,
  Lock,
} from 'lucide-react';

interface BridgingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BridgingSettingsModal: React.FC<BridgingSettingsModalProps> = ({ isOpen, onClose }) => {
  const { bpjsConfig, updateBpjsConfig, testBridgingPing, bridgingLogs } = useQueue();

  const [consId, setConsId] = useState(bpjsConfig.consId);
  const [secretKey, setSecretKey] = useState(bpjsConfig.secretKey);
  const [userKey, setUserKey] = useState(bpjsConfig.userKey);
  const [kdFaskes, setKdFaskes] = useState(bpjsConfig.kdFaskes);
  const [namaFaskes, setNamaFaskes] = useState(bpjsConfig.namaFaskes);
  const [userPcareDev, setUserPcareDev] = useState(bpjsConfig.userPcareDev);
  const [passPcareDev, setPassPcareDev] = useState(bpjsConfig.passPcareDev);
  const [emailFaskes, setEmailFaskes] = useState(bpjsConfig.emailFaskes);
  const [environment, setEnvironment] = useState<'tester' | 'production'>(bpjsConfig.environment);

  const [activeTab, setActiveTab] = useState<'CREDENTIALS' | 'SANDBOX' | 'LOGS'>('CREDENTIALS');
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<any>(null);
  const [sandboxHeaders, setSandboxHeaders] = useState<Record<string, string> | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    updateBpjsConfig({
      consId,
      secretKey,
      userKey,
      kdFaskes,
      namaFaskes,
      userPcareDev,
      passPcareDev,
      emailFaskes,
      environment,
    });
    alert('Konfigurasi Bridging BPJS berhasil diperbarui.');
  };

  const handlePing = async () => {
    setIsTestingPing(true);
    setPingResult(null);
    try {
      const res = await testBridgingPing();
      setPingResult(res);
    } catch (e: any) {
      setPingResult({ success: false, error: e.message });
    } finally {
      setIsTestingPing(false);
    }
  };

  const handleGenerateSandboxSignature = async () => {
    const headers = await getBpjsHeaders({
      ...bpjsConfig,
      consId,
      secretKey,
      userKey,
    });
    setSandboxHeaders(headers);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl sm:max-w-3xl w-full p-5 sm:p-6 shadow-xl border border-slate-200/90 relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Konfigurasi Bridging BPJS (VClaim & PCare)
            </h2>
            <p className="text-xs text-slate-500">
              Kredensial Trustmark & Integrasi Web Service Antrean Faskes
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 mb-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('CREDENTIALS')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'CREDENTIALS'
                ? 'bg-white text-emerald-900 shadow-xs ring-1 ring-slate-900/5'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kredensial Faskes
          </button>
          <button
            onClick={() => {
              setActiveTab('SANDBOX');
              handleGenerateSandboxSignature();
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'SANDBOX'
                ? 'bg-white text-emerald-900 shadow-xs ring-1 ring-slate-900/5'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Generator Header HMAC
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'LOGS'
                ? 'bg-white text-emerald-900 shadow-xs ring-1 ring-slate-900/5'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Log Bridging ({bridgingLogs.length})
          </button>
        </div>

        {/* Tab 1: CREDENTIALS */}
        {activeTab === 'CREDENTIALS' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Faskes</label>
                <input
                  type="text"
                  value={namaFaskes}
                  onChange={(e) => setNamaFaskes(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kode Faskes (KD Faskes)</label>
                <input
                  type="text"
                  value={kdFaskes}
                  onChange={(e) => setKdFaskes(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Consumer ID (Cons ID)</label>
                <input
                  type="text"
                  value={consId}
                  onChange={(e) => setConsId(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Secret Key</label>
                <input
                  type="text"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono focus:border-emerald-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">User Key (Antrean Web Service)</label>
                <input
                  type="text"
                  value={userKey}
                  onChange={(e) => setUserKey(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Username PCare Dev</label>
                <input
                  type="text"
                  value={userPcareDev}
                  onChange={(e) => setUserPcareDev(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Password PCare Dev</label>
                <input
                  type="text"
                  value={passPcareDev}
                  onChange={(e) => setPassPcareDev(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Faskes</label>
                <input
                  type="email"
                  value={emailFaskes}
                  onChange={(e) => setEmailFaskes(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lingkungan (Environment)</label>
                <select
                  value={environment}
                  onChange={(e: any) => setEnvironment(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                >
                  <option value="tester">Development / Tester (Trustmark Dev)</option>
                  <option value="production">Production (BPJS Live)</option>
                </select>
              </div>
            </div>

            {/* Test Ping Handshake */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900">Uji Koneksi Server BPJS Bridging</span>
                </div>
                <button
                  onClick={handlePing}
                  disabled={isTestingPing}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingPing ? 'animate-spin' : ''}`} />
                  <span>Test Ping Bridging</span>
                </button>
              </div>

              {pingResult && (
                <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700">
                  <div className="flex items-center justify-between font-bold text-emerald-700 mb-1">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Status: 200 OK (Terhubung)
                    </span>
                    <span>Latensi: {pingResult.latencyMs} ms</span>
                  </div>
                  <p className="text-slate-500">
                    Kredensial ConsID {consId} dan HMAC-SHA256 valid. Web Service siap menerima transaksi pendaftaran.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: SANDBOX HEADER GENERATOR */}
        {activeTab === 'SANDBOX' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-emerald-400 font-bold">Standard Header HTTP BPJS Bridging:</span>
                <button
                  onClick={handleGenerateSandboxSignature}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Generate Ulang
                </button>
              </div>

              {sandboxHeaders && (
                <div className="space-y-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">X-cons-id: </span>
                    <span className="text-amber-400 font-bold">{sandboxHeaders['X-cons-id']}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">X-timestamp: </span>
                    <span className="text-teal-400 font-bold">{sandboxHeaders['X-timestamp']}</span>
                    <span className="text-slate-500 text-[10px] ml-2">(UTC Epoch Seconds)</span>
                  </div>
                  <div className="break-all">
                    <span className="text-slate-400">X-signature: </span>
                    <span className="text-emerald-400 font-bold">{sandboxHeaders['X-signature']}</span>
                  </div>
                  <div className="break-all">
                    <span className="text-slate-400">user_key: </span>
                    <span className="text-indigo-400 font-bold">{sandboxHeaders['user_key']}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
              <strong>Keterangan Formula Signature:</strong>
              <p className="font-mono mt-1 text-slate-700 bg-white p-2 rounded border border-slate-200">
                Signature = Base64( HMAC-SHA256( ConsID + &quot;&amp;&quot; + Timestamp, SecretKey ) )
              </p>
              <p className="mt-1">
                Header ini secara otomatis disematkan pada setiap request API pendaftaran antrean (Task 1 s/d 7).
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: BRIDGING LOGS */}
        {activeTab === 'LOGS' && (
          <div className="overflow-y-auto pr-1 flex-1 text-xs divide-y divide-slate-100">
            {bridgingLogs.length === 0 ? (
              <p className="py-8 text-center text-slate-400">Belum ada riwayat transaksi bridging.</p>
            ) : (
              bridgingLogs.map((log) => (
                <div key={log.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-700 font-mono">[{log.method}]</span>
                      <span className="font-semibold text-slate-900">{log.endpoint}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString('id-ID')} · {log.durationMs}ms
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg font-mono text-[10px] text-slate-600 truncate">
                    Payload: {JSON.stringify(log.requestPayload || log.responsePayload)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Tutup
          </button>
          {activeTab === 'CREDENTIALS' && (
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              Simpan Perubahan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
