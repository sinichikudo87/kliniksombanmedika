'use client';

import React, { useState } from 'react';
import { useQueue } from '@/lib/queue-context';
import { getBpjsHeaders } from '@/lib/bpjs-bridging';
import { showSwalSuccess, showSwalError } from '@/lib/swal';
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
  FileSpreadsheet,
  Download,
  ExternalLink,
  Check,
  Globe,
  FileCode,
  AlertTriangle,
} from 'lucide-react';
import { WS_FKTP_ENDPOINTS } from '@/types/queue';
import { exportWsFktpExcel } from '@/lib/client-excel-export';

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
  const [isOnline, setIsOnline] = useState<boolean>(bpjsConfig.isOnline !== false);

  const [activeTab, setActiveTab] = useState<'CREDENTIALS' | 'WS_FKTP' | 'SANDBOX' | 'LOGS'>('CREDENTIALS');
  const [customWsDomain, setCustomWsDomain] = useState('https://kliniksombanmedika.id');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedEndpointDetail, setSelectedEndpointDetail] = useState<number | null>(null);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
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
      isOnline,
    });
    showSwalSuccess('Konfigurasi Bridging BPJS dan status koneksi berhasil diperbarui.');
  };

  const handleDownloadExcel = () => {
    setIsDownloadingExcel(true);
    try {
      const ok = exportWsFktpExcel({
        customBaseUrl: customWsDomain,
        namaFaskes,
        kdFaskes,
      });
      if (ok) {
        showSwalSuccess('File Excel resmi WS FKTP BPJS Kesehatan berhasil diunduh ke komputer Anda.', 'Download Berhasil');
      } else {
        showSwalError('Gagal memproses file Excel di browser.', 'Download Gagal');
      }
    } catch (err: any) {
      showSwalError('Terjadi kendala saat download Excel: ' + (err?.message || ''), 'Download Gagal');
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const handlePing = async () => {
    setIsTestingPing(true);
    setPingResult(null);
    try {
      const res = await testBridgingPing();
      setPingResult(res);
      if (res && res.success) {
        showSwalSuccess(`Koneksi Web Service BPJS terhubung normal (${res.latencyMs} ms)!`, 'Ping Berhasil');
      } else {
        showSwalError('Gagal terhubung ke Web Service BPJS.', 'Ping Gagal');
      }
    } catch (e: any) {
      setPingResult({ success: false, error: e.message });
      showSwalError('Error: ' + e.message, 'Koneksi BPJS Gagal');
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
      <div className="bg-white rounded-2xl max-w-3xl lg:max-w-5xl w-full p-5 sm:p-6 shadow-xl border border-slate-200/90 relative max-h-[92vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
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
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 mb-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('CREDENTIALS')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'CREDENTIALS'
                ? 'bg-white text-emerald-900 shadow-xs ring-1 ring-slate-900/5'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kredensial Faskes
          </button>
          <button
            onClick={() => setActiveTab('WS_FKTP')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'WS_FKTP'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-700 hover:text-slate-900 bg-emerald-50/60 border border-emerald-200/60'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>WS FKTP Production & Excel</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'WS_FKTP' ? 'bg-white text-emerald-800' : 'bg-emerald-200 text-emerald-900'}`}>
              V2 (.xlsx)
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab('SANDBOX');
              handleGenerateSandboxSignature();
            }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'SANDBOX'
                ? 'bg-white text-emerald-900 shadow-xs ring-1 ring-slate-900/5'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Generator Header HMAC
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
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

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">Status Whitelist Domain & Koneksi BPJS</label>
                <select
                  value={isOnline ? 'online' : 'pending'}
                  onChange={(e) => {
                    const val = e.target.value === 'online';
                    setIsOnline(val);
                    updateBpjsConfig({ isOnline: val });
                  }}
                  className={`w-full py-2 px-3 border rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                    isOnline
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-amber-50 border-amber-300 text-amber-800'
                  }`}
                >
                  <option value="online">🟢 Sudah Di-Whitelist (Domain https://kliniksombanmedika.id/)</option>
                  <option value="pending">🟡 Menunggu Whitelist Domain BPJS (Belum Terhubung)</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  {isOnline
                    ? 'Domain resmi https://kliniksombanmedika.id/ telah terdaftar dan disetujui di BPJS Kesehatan. Sistem aktif terhubung dan 9 endpoint siap melayani transaksi.'
                    : 'Pilih "Sudah Di-Whitelist" jika BPJS Kesehatan telah membuka izin akses untuk domain faskes Anda.'}
                </p>
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
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingPing ? 'animate-spin' : ''}`} />
                  <span>Test Ping Bridging</span>
                </button>
              </div>

              {pingResult && (
                <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700">
                  {pingResult.isWhitelisted ? (
                    <div>
                      <div className="flex items-center justify-between font-bold text-emerald-700 mb-1">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Status: 200 OK (Terhubung Live)
                        </span>
                        <span>Latensi: {pingResult.latencyMs} ms</span>
                      </div>
                      <p className="text-slate-500">
                        Kredensial valid dan Domain https://kliniksombanmedika.id/ telah di-whitelist BPJS. Web Service siap menerima transaksi antrean.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between font-bold text-amber-700 mb-1">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Status: Belum Terhubung (Menunggu Whitelist IP)
                        </span>
                        <span>{pingResult.latencyMs ? `${pingResult.latencyMs} ms` : ''}</span>
                      </div>
                      <p className="text-amber-800 text-xs font-sans mt-1">
                        {pingResult.message || 'Koneksi ke endpoint BPJS Kesehatan ditolak atau timeout karena IP server faskes belum di-whitelist oleh tim TI BPJS Kesehatan.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: WS FKTP PRODUCTION & EXCEL SPREADSHEET */}
        {activeTab === 'WS_FKTP' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
            {/* Top Summary Banner */}
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-700/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold text-[10px] uppercase tracking-wider">
                      Format Resmi BPJS
                    </span>
                    <span className="text-emerald-300 text-xs font-mono">Antrean Online Versi 2</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white mt-1">
                    URL WS FKTP Production Bridging Antrean Online Versi 2
                  </h3>
                  <p className="text-xs text-emerald-100/80 mt-0.5">
                    Data 9 endpoint dan metode web service resmi BPJS Kesehatan (Antrean Online Versi 2)
                  </p>
                </div>

                {/* Direct Excel Download Action */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleDownloadExcel}
                    disabled={isDownloadingExcel}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-slate-950" />
                    <span>{isDownloadingExcel ? 'Menyiapkan...' : 'Download File Excel (.xlsx)'}</span>
                    <Download className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                </div>
              </div>

              {/* Faskes Production Metadata Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-[11px]">
                <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                  <span className="text-emerald-200 block text-[10px]">Faskes:</span>
                  <strong className="text-white block font-semibold truncate">{namaFaskes || 'TPMD DR MACHMUJUR'}</strong>
                  <span className="font-mono text-emerald-300">{kdFaskes || '019U901'}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                  <span className="text-emerald-200 block text-[10px]">Mode Server:</span>
                  <strong className="text-white block font-semibold">{environment === 'production' ? 'Production' : 'Tester / Dev'}</strong>
                  <span className="text-emerald-300">Live API</span>
                </div>
                <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                  <span className="text-emerald-200 block text-[10px]">Penyimpanan Data:</span>
                  <strong className="text-white block font-semibold">Server Terpusat</strong>
                  <span className="text-emerald-300">Terhubung</span>
                </div>
                <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                  <span className="text-emerald-200 block text-[10px]">User Bridging:</span>
                  <div className="flex items-center gap-2 font-mono text-emerald-300">
                    <span>User: <strong className="text-white">{userPcareDev || '0195U091-dev'}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Domain Configuration & Switcher */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-800 text-xs">
                    URL Base / Domain Aplikasi Web Service:
                  </label>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    Sesuai URL aplikasi yang sedang berjalan
                  </span>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <div className="relative flex-1 min-w-[220px]">
                    <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={customWsDomain}
                      onChange={(e) => setCustomWsDomain(e.target.value)}
                      placeholder="https://kliniksombanmedika.id"
                      className="w-full pl-8 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomWsDomain('https://kliniksombanmedika.id')}
                    className="px-3 py-2 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-emerald-900 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors"
                  >
                    kliniksombanmedika.id
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomWsDomain(typeof window !== 'undefined' ? window.location.origin : 'https://kliniksombanmedika.id')}
                    className="px-3 py-2 border border-slate-300 bg-white hover:bg-slate-100 rounded-xl text-slate-700 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors"
                    title="Gunakan origin / domain tempat aplikasi berjalan sekarang"
                  >
                    Gunakan URL Aplikasi
                  </button>
                </div>
              </div>

              {/* Direct Excel Download Button */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  className="text-emerald-700 hover:text-emerald-800 font-bold underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh File Excel (.xlsx)
                </button>
              </div>
            </div>

            {/* Excel Table Visual Representation (Matching BPJS Image 2 exactly) */}
            <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-2xs bg-white">
              <div className="p-3 bg-slate-100 border-b border-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-slate-800 text-xs">
                    Pratinjau Format Dokumen BPJS (9 Metode Resmi)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Total: {WS_FKTP_ENDPOINTS.length} Endpoint
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-300">
                      <th className="py-2.5 px-3 border-r border-slate-300 w-10 text-center">No</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 w-24">Kode FKTP</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 min-w-[140px]">Nama FKTP</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 min-w-[140px]">Nama PIC FKTP</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 min-w-[110px]">No HP PIC</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 min-w-[140px]">Vendor Pengembang</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 w-24">Kepwil</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 w-28">Kantor Cabang</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 min-w-[140px] bg-emerald-50/80 text-emerald-900 font-extrabold">
                        Jenis Method
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-300 min-w-[280px] bg-emerald-50/80 text-emerald-900 font-extrabold">
                        URL WS FKTP Production
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-300 w-28">User Production</th>
                      <th className="py-2.5 px-3 w-32">Password Production</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {WS_FKTP_ENDPOINTS.map((endpoint, index) => {
                      const fullUrl = `${customWsDomain.replace(/\/$/, '')}${endpoint.path}`;
                      const isFirst = index === 0;

                      return (
                        <tr
                          key={endpoint.no}
                          className="hover:bg-emerald-50/40 transition-colors group cursor-pointer"
                          onClick={() => setSelectedEndpointDetail(selectedEndpointDetail === endpoint.no ? null : endpoint.no)}
                        >
                          {/* Merged Columns Representation */}
                          {isFirst && (
                            <>
                              <td
                                rowSpan={WS_FKTP_ENDPOINTS.length}
                                className="py-3 px-2 border-r border-slate-300 text-center font-bold text-slate-800 bg-slate-50/50 align-top"
                              >
                                1
                              </td>
                              <td
                                rowSpan={WS_FKTP_ENDPOINTS.length}
                                className="py-3 px-3 border-r border-slate-300 font-mono font-bold text-slate-800 bg-slate-50/50 align-top"
                              >
                                {kdFaskes || '019U901'}
                              </td>
                              <td
                                rowSpan={WS_FKTP_ENDPOINTS.length}
                                className="py-3 px-3 border-r border-slate-300 font-bold text-slate-900 bg-slate-50/50 align-top"
                              >
                                {namaFaskes || 'TPMD DR MACHMUJUR'}
                              </td>
                              <td
                                rowSpan={WS_FKTP_ENDPOINTS.length}
                                className="py-3 px-3 border-r border-slate-300 font-medium text-slate-800 bg-slate-50/50 align-top"
                              >
                                -
                              </td>
                              <td
                                rowSpan={WS_FKTP_ENDPOINTS.length}
                                className="py-3 px-3 border-r border-slate-300 font-mono text-slate-800 bg-slate-50/50 align-top"
                              >
                                -
                              </td>
                              <td
                                rowSpan={WS_FKTP_ENDPOINTS.length}
                                className="py-3 px-3 border-r border-slate-300 font-medium text-slate-800 bg-slate-50/50 align-top"
                              >
                                {namaFaskes || 'TPMD DR MACHMUJUR'}
                              </td>
                              <td
                                rowSpan={WS_FKTP_ENDPOINTS.length}
                                className="py-3 px-3 border-r border-slate-300 text-slate-800 bg-slate-50/50 align-top"
                              >
                                -
                              </td>
                              <td
                                rowSpan={WS_FKTP_ENDPOINTS.length}
                                className="py-3 px-3 border-r border-slate-300 font-semibold text-slate-800 bg-slate-50/50 align-top"
                              >
                                -
                              </td>
                            </>
                          )}

                          {/* Dynamic Row Columns */}
                          <td className="py-2.5 px-3 border-r border-slate-300 font-bold text-slate-900 bg-white">
                            <div className="flex items-center justify-between gap-1">
                              <span>{endpoint.jenisMethod}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                  endpoint.httpMethod === 'GET'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {endpoint.httpMethod}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-300 font-mono text-[11px] text-emerald-800 bg-white">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate select-all">{fullUrl}</span>
                              <button
                                type="button"
                                title="Salin URL"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(fullUrl);
                                  setCopiedIndex(endpoint.no);
                                  setTimeout(() => setCopiedIndex(null), 1800);
                                }}
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 shrink-0 cursor-pointer"
                              >
                                {copiedIndex === endpoint.no ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Merged Credentials Columns Representation */}
                          {isFirst && (
                            <>
                              <td
                                rowSpan={WS_FKTP_ENDPOINTS.length}
                                className="py-3 px-3 border-r border-slate-300 font-mono font-bold text-slate-800 bg-slate-50/50 align-top"
                              >
                                {userPcareDev || '0195U091-dev'}
                              </td>
                              <td
                                rowSpan={WS_FKTP_ENDPOINTS.length}
                                className="py-3 px-3 font-mono font-bold text-slate-800 bg-slate-50/50 align-top"
                              >
                                ******
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Technical Guide for Selected Endpoint */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-emerald-700" />
                <span>Rincian Teknis Endpoint Web Service BPJS</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {WS_FKTP_ENDPOINTS.map((endpoint) => {
                  const fullUrl = `${customWsDomain.replace(/\/$/, '')}${endpoint.path}`;

                  return (
                    <div
                      key={endpoint.no}
                      className="p-3.5 rounded-2xl border bg-white border-slate-200"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] flex items-center justify-center font-bold">
                            {endpoint.no}
                          </span>
                          {endpoint.jenisMethod}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                            endpoint.httpMethod === 'GET'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {endpoint.httpMethod}
                        </span>
                      </div>

                      <p className="font-mono text-[10px] text-emerald-800 truncate mb-2">
                        {fullUrl}
                      </p>

                      <p className="text-[11px] text-slate-600 mb-2">
                        {endpoint.description}
                      </p>

                      <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                        <strong className="text-slate-700 block">Header Autentikasi:</strong>
                        <span className="font-mono text-slate-600">
                          X-cons-id, X-timestamp, X-signature, user_key
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: SANDBOX HEADER GENERATOR */}
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
