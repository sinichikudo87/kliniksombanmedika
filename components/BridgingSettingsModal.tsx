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
  ArrowRight,
  UserCheck,
  Stethoscope,
  Pill,
  Smartphone,
  Layers,
  Info,
  Building2,
  BedDouble,
} from 'lucide-react';
import { WS_FKTP_ENDPOINTS } from '@/types/queue';
import { exportWsFktpExcel } from '@/lib/client-excel-export';

export interface BpjsEndpointOption {
  value: string;
  name: string;
  moduleKey: 'PCARE' | 'VCLAIM' | 'APLICARE' | 'ANTREAN';
  moduleNumber: number;
  moduleName: string;
  env: 'tester' | 'production';
  envLabel: string;
  targetFaskes: string;
  description: string;
}

export const BPJS_BRIDGING_ENDPOINT_OPTIONS: BpjsEndpointOption[] = [
  // 1. PCare (Primary Care)
  {
    value: 'https://apijkn-dev.bpjs-kesehatan.go.id/pcare-rest-dev',
    name: 'PCare Dev / Tester (Primary Care FKTP)',
    moduleKey: 'PCARE',
    moduleNumber: 1,
    moduleName: 'PCare (Primary Care)',
    env: 'tester',
    envLabel: 'Development / Tester',
    targetFaskes: 'FKTP (Puskesmas, Klinik, Praktik Dokter Mandiri)',
    description: 'Digunakan oleh fasilitas kesehatan tingkat pertama (Puskesmas, klinik, praktek dokter) untuk pendaftaran, pemeriksaan, diagnosis, dan rujukan.',
  },
  {
    value: 'https://apijkn.bpjs-kesehatan.go.id/pcare-rest',
    name: 'PCare Production (Primary Care Live)',
    moduleKey: 'PCARE',
    moduleNumber: 1,
    moduleName: 'PCare (Primary Care)',
    env: 'production',
    envLabel: 'Production (Live)',
    targetFaskes: 'FKTP (Puskesmas, Klinik, Praktik Dokter Mandiri)',
    description: 'Digunakan oleh fasilitas kesehatan tingkat pertama (Puskesmas, klinik, praktek dokter) untuk pendaftaran, pemeriksaan, diagnosis, dan rujukan.',
  },

  // 2. VClaim (Virtual Claim)
  {
    value: 'https://apijkn-dev.bpjs-kesehatan.go.id/vclaim-rest-dev',
    name: 'VClaim Dev / Tester (Virtual Claim RS)',
    moduleKey: 'VCLAIM',
    moduleNumber: 2,
    moduleName: 'VClaim (Virtual Claim)',
    env: 'tester',
    envLabel: 'Development / Tester',
    targetFaskes: 'FKRTL (Khusus Rumah Sakit)',
    description: 'Digunakan oleh rumah sakit untuk pembuatan SEP dan pengajuan klaim biaya pelayanan.',
  },
  {
    value: 'https://apijkn.bpjs-kesehatan.go.id/vclaim-rest',
    name: 'VClaim Production (Virtual Claim Live RS)',
    moduleKey: 'VCLAIM',
    moduleNumber: 2,
    moduleName: 'VClaim (Virtual Claim)',
    env: 'production',
    envLabel: 'Production (Live)',
    targetFaskes: 'FKRTL (Khusus Rumah Sakit)',
    description: 'Digunakan oleh rumah sakit untuk pembuatan SEP dan pengajuan klaim biaya pelayanan.',
  },

  // 3. Aplicare
  {
    value: 'https://apijkn-dev.bpjs-kesehatan.go.id/aplicaresws/rest',
    name: 'Aplicare Dev / Tester (Ketersediaan Kamar & Jadwal)',
    moduleKey: 'APLICARE',
    moduleNumber: 3,
    moduleName: 'Aplicare',
    env: 'tester',
    envLabel: 'Development / Tester',
    targetFaskes: 'RS & Klinik Rawat Inap',
    description: 'Sistem keterbukaan informasi ketersediaan kamar dan jadwal layanan faskes.',
  },
  {
    value: 'https://apijkn.bpjs-kesehatan.go.id/aplicaresws/rest',
    name: 'Aplicare Production (Live Kamar & Jadwal)',
    moduleKey: 'APLICARE',
    moduleNumber: 3,
    moduleName: 'Aplicare',
    env: 'production',
    envLabel: 'Production (Live)',
    targetFaskes: 'RS & Klinik Rawat Inap',
    description: 'Sistem keterbukaan informasi ketersediaan kamar dan jadwal layanan faskes.',
  },

  // 4. Antrean Online (MJKN)
  {
    value: 'https://apijkn-dev.bpjs-kesehatan.go.id/antreanfktp_dev',
    name: 'Antrean FKTP Dev / Tester (Klinik Pratama & TPMD)',
    moduleKey: 'ANTREAN',
    moduleNumber: 4,
    moduleName: 'Antrean Online (MJKN)',
    env: 'tester',
    envLabel: 'Development / Tester',
    targetFaskes: 'FKTP (Klinik Pratama & TPMD)',
    description: 'Terintegrasi dengan aplikasi Mobile JKN untuk pendaftaran dan pemantauan antrean pasien di faskes.',
  },
  {
    value: 'https://apijkn.bpjs-kesehatan.go.id/antreanfktp',
    name: 'Antrean FKTP Production (Live FKTP)',
    moduleKey: 'ANTREAN',
    moduleNumber: 4,
    moduleName: 'Antrean Online (MJKN)',
    env: 'production',
    envLabel: 'Production (Live)',
    targetFaskes: 'FKTP (Klinik Pratama & TPMD)',
    description: 'Terintegrasi dengan aplikasi Mobile JKN untuk pendaftaran dan pemantauan antrean pasien di faskes.',
  },
  {
    value: 'https://apijkn-dev.bpjs-kesehatan.go.id/antreanrs_dev',
    name: 'Antrean RS Dev / Tester (Rumah Sakit)',
    moduleKey: 'ANTREAN',
    moduleNumber: 4,
    moduleName: 'Antrean Online (MJKN)',
    env: 'tester',
    envLabel: 'Development / Tester',
    targetFaskes: 'FKRTL (Rumah Sakit)',
    description: 'Terintegrasi dengan aplikasi Mobile JKN untuk pendaftaran dan pemantauan antrean pasien di faskes.',
  },
  {
    value: 'https://apijkn.bpjs-kesehatan.go.id/antreanrs',
    name: 'Antrean RS Production (Live RS)',
    moduleKey: 'ANTREAN',
    moduleNumber: 4,
    moduleName: 'Antrean Online (MJKN)',
    env: 'production',
    envLabel: 'Production (Live)',
    targetFaskes: 'FKRTL (Rumah Sakit)',
    description: 'Terintegrasi dengan aplikasi Mobile JKN untuk pendaftaran dan pemantauan antrean pasien di faskes.',
  },
];

interface BridgingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPcare?: () => void;
}

export const BridgingSettingsModal: React.FC<BridgingSettingsModalProps> = ({ isOpen, onClose, onOpenPcare }) => {
  if (!isOpen) return null;
  return <BridgingSettingsModalInner onClose={onClose} onOpenPcare={onOpenPcare} />;
};

const BridgingSettingsModalInner: React.FC<{
  onClose: () => void;
  onOpenPcare?: () => void;
}> = ({ onClose, onOpenPcare }) => {
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
  const [isOnline, setIsOnline] = useState<boolean>(bpjsConfig.isOnline === true);

  const [customBaseUrl, setCustomBaseUrl] = useState<string | null>(null);
  const baseUrl = customBaseUrl !== null ? customBaseUrl : (bpjsConfig.baseUrl || 'https://apijkn-dev.bpjs-kesehatan.go.id/antreanfktp_dev');
  const setBaseUrl = (val: string) => setCustomBaseUrl(val);

  const [isManualCustomInput, setIsManualCustomInput] = useState(false);

  const [activeTab, setActiveTab] = useState<'CREDENTIALS' | 'ALUR_ANTREAN' | 'WS_FKTP' | 'SANDBOX' | 'LOGS'>('CREDENTIALS');
  const [customWsDomain, setCustomWsDomain] = useState('https://kliniksombanmedika.id');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedEndpointDetail, setSelectedEndpointDetail] = useState<number | null>(null);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [pingResult, setPingResult] = useState<any>(null);
  const [sandboxHeaders, setSandboxHeaders] = useState<Record<string, string> | null>(null);

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
      baseUrl,
      isOnline,
    });
    showSwalSuccess('Konfigurasi Bridging BPJS berhasil diperbarui.');
  };

  const handleDownloadExcel = () => {
    setIsDownloadingExcel(true);
    try {
      const ok = exportWsFktpExcel({
        customBaseUrl: customWsDomain,
        namaFaskes,
        kdFaskes,
        environment,
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
      const res = await testBridgingPing({
        consId,
        secretKey,
        userKey,
        kdFaskes,
        namaFaskes,
        userPcareDev,
        passPcareDev,
        emailFaskes,
        baseUrl,
        environment,
        isOnline,
      });
      setPingResult(res);
      if (res && res.success && res.isWhitelisted) {
        const matched = BPJS_BRIDGING_ENDPOINT_OPTIONS.find((o) => o.value === baseUrl);
        const modTitle = matched?.moduleName || 'Web Service BPJS';
        showSwalSuccess(`Koneksi ${modTitle} mode ${environment === 'tester' ? 'Development / Tester' : 'Production'} terhubung normal (${res.latencyMs} ms)!`, 'Ping Berhasil');
      } else {
        showSwalError(res?.message || 'Bridging BPJS saat ini Nonaktif (Default: Off / Menunggu Whitelist).', 'Status Bridging Nonaktif');
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
              Konfigurasi Bridging Antrean Online BPJS (Mobile JKN & FKTP)
            </h2>
            <p className="text-xs text-slate-500">
              Integrasi Antrean 2 Arah, Kredensial Trustmark, 7 Task ID & 9 WS FKTP
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
            Kredensial & Base URL
          </button>
          <button
            onClick={() => setActiveTab('ALUR_ANTREAN')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ALUR_ANTREAN'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-700 hover:text-slate-900 bg-emerald-50/60 border border-emerald-200/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Alur Antrean & 7 Task ID</span>
          </button>
          <button
            onClick={() => setActiveTab('WS_FKTP')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'WS_FKTP'
                ? 'bg-white text-emerald-900 shadow-xs ring-1 ring-slate-900/5'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>9 WS FKTP Excel (.xlsx)</span>
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
            {/* Matriks 4 Modul Utama Bridging BPJS Kesehatan */}
            <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-white">Status 4 Modul Utama Bridging BPJS Kesehatan</h4>
                    <p className="text-[10px] text-slate-400">Verifikasi kesesuaian modul sistem faskes tingkat pertama (FKTP Klinik Pratama)</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  FKTP: Klinik Pratama &amp; TPMD
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {/* 1. PCare */}
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-emerald-400 flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5" />
                        1. PCare
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                        AKTIF (FKTP)
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      Pendaftaran, pemeriksaan medis, diagnosis ICD-10, dan rujukan pasien faskes pertama.
                    </p>
                  </div>
                  {onOpenPcare && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenPcare();
                      }}
                      className="w-full mt-1 py-1 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Buka Modul PCare</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* 2. VClaim */}
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-amber-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      2. VClaim
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300">
                      KHUSUS RS
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Pembuatan SEP &amp; klaim INA-CBGs rumah sakit. <em>Tidak digunakan pada klinik FKTP.</em>
                  </p>
                </div>

                {/* 3. Aplicare */}
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-blue-400 flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5" />
                      3. Aplicare
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300">
                      RAWAT JALAN
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Ketersediaan tempat tidur kamar &amp; jadwal layanan. Siap bila klinik rawat inap.
                  </p>
                </div>

                {/* 4. Antrean Online (MJKN) */}
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-emerald-500/40 bg-emerald-950/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-emerald-300 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" />
                      4. Antrean MJKN
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500 text-slate-950">
                      100% TERHUBUNG
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-100/90 leading-relaxed">
                    Integrasi 9 WS-FKTP Mobile JKN, booking kuota real-time, dan transmisi 7 Task ID.
                  </p>
                </div>
              </div>
            </div>

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
                  onChange={(e) => {
                    const newEnv = e.target.value as 'tester' | 'production';
                    setEnvironment(newEnv);
                    const currentMatch = BPJS_BRIDGING_ENDPOINT_OPTIONS.find((o) => o.value === baseUrl);
                    if (currentMatch) {
                      const counterpart = BPJS_BRIDGING_ENDPOINT_OPTIONS.find(
                        (o) => o.moduleKey === currentMatch.moduleKey && o.env === newEnv && o.targetFaskes === currentMatch.targetFaskes
                      ) || BPJS_BRIDGING_ENDPOINT_OPTIONS.find(
                        (o) => o.moduleKey === currentMatch.moduleKey && o.env === newEnv
                      );
                      if (counterpart) {
                        setBaseUrl(counterpart.value);
                      }
                    }
                  }}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl bg-white font-semibold text-slate-800"
                >
                  <option value="tester">Development / Tester (Trustmark Dev)</option>
                  <option value="production">Production (BPJS Live)</option>
                </select>
              </div>

              {/* Endpoint Base URL Select Option & Modul Info */}
              <div className="sm:col-span-2 space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <label className="block font-bold text-slate-900 text-xs">
                      Base URL Web Service BPJS (Select Option Modul API)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const currentMatch = BPJS_BRIDGING_ENDPOINT_OPTIONS.find((o) => o.value === baseUrl);
                      return currentMatch ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono">
                          {currentMatch.moduleName}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold font-mono">
                          URL Kustom
                        </span>
                      );
                    })()}
                    <button
                      type="button"
                      onClick={() => setIsManualCustomInput(!isManualCustomInput)}
                      className="text-[10px] text-slate-500 hover:text-emerald-700 underline cursor-pointer"
                    >
                      {isManualCustomInput ? 'Pilih Preset Dropdown' : 'Ketik Manual'}
                    </button>
                  </div>
                </div>

                {!isManualCustomInput ? (
                  <select
                    value={baseUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__MANUAL__') {
                        setIsManualCustomInput(true);
                        return;
                      }
                      setBaseUrl(val);
                      const matched = BPJS_BRIDGING_ENDPOINT_OPTIONS.find((u) => u.value === val);
                      if (matched) {
                        setEnvironment(matched.env);
                      }
                    }}
                    className="w-full py-2.5 px-3 border border-slate-300 rounded-xl font-mono text-xs bg-white text-slate-900 font-semibold focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 shadow-2xs cursor-pointer"
                  >
                    <optgroup label="1. PCare (Primary Care - FKTP: Puskesmas, Klinik, TPMD)">
                      {BPJS_BRIDGING_ENDPOINT_OPTIONS.filter((o) => o.moduleKey === 'PCARE').map((opt) => (
                        <option key={opt.value + opt.env} value={opt.value}>
                          [1. PCare] {opt.name} — {opt.value}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="2. VClaim (Virtual Claim - Khusus Rumah Sakit)">
                      {BPJS_BRIDGING_ENDPOINT_OPTIONS.filter((o) => o.moduleKey === 'VCLAIM').map((opt) => (
                        <option key={opt.value + opt.env} value={opt.value}>
                          [2. VClaim] {opt.name} — {opt.value}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="3. Aplicare (Ketersediaan Kamar & Jadwal Layanan)">
                      {BPJS_BRIDGING_ENDPOINT_OPTIONS.filter((o) => o.moduleKey === 'APLICARE').map((opt) => (
                        <option key={opt.value + opt.env} value={opt.value}>
                          [3. Aplicare] {opt.name} — {opt.value}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="4. Antrean Online (Mobile JKN - MJKN)">
                      {BPJS_BRIDGING_ENDPOINT_OPTIONS.filter((o) => o.moduleKey === 'ANTREAN').map((opt) => (
                        <option key={opt.value + opt.env} value={opt.value}>
                          [4. Antrean MJKN] {opt.name} — {opt.value}
                        </option>
                      ))}
                    </optgroup>

                    {!BPJS_BRIDGING_ENDPOINT_OPTIONS.some((o) => o.value === baseUrl) && (
                      <option value={baseUrl}>URL Kustom: {baseUrl}</option>
                    )}
                    <option value="__MANUAL__">+ Ketik URL Kustom Lainnya...</option>
                  </select>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://apijkn-dev.bpjs-kesehatan.go.id/antreanfktp_dev"
                      className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono text-xs bg-white text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                    />
                    <p className="text-[10px] text-slate-500">
                      Mode input manual aktif. Anda dapat mengetikkan URL proxy atau gateway kustom faskes.
                    </p>
                  </div>
                )}

                {/* Info Detail Modul Terpilih */}
                {(() => {
                  const currentMatch = BPJS_BRIDGING_ENDPOINT_OPTIONS.find((o) => o.value === baseUrl);
                  if (!currentMatch) {
                    return (
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600">
                        URL Bridging Kustom: <span className="font-mono font-bold text-slate-800">{baseUrl}</span>
                      </div>
                    );
                  }

                  return (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                          {currentMatch.moduleKey === 'PCARE' && <Stethoscope className="w-4 h-4 text-emerald-600" />}
                          {currentMatch.moduleKey === 'VCLAIM' && <Building2 className="w-4 h-4 text-amber-600" />}
                          {currentMatch.moduleKey === 'APLICARE' && <BedDouble className="w-4 h-4 text-blue-600" />}
                          {currentMatch.moduleKey === 'ANTREAN' && <Smartphone className="w-4 h-4 text-emerald-600" />}
                          <span>Modul {currentMatch.moduleNumber}: {currentMatch.moduleName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {currentMatch.targetFaskes}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            currentMatch.env === 'tester'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}>
                            {currentMatch.envLabel}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        <strong>Peruntukan Modul:</strong> {currentMatch.description}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-500 border-t border-slate-100">
                        <span className="truncate max-w-[80%] font-semibold text-slate-700 select-all">
                          {baseUrl}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                              navigator.clipboard.writeText(baseUrl);
                            }
                            showSwalSuccess('URL bridging berhasil disalin.');
                          }}
                          className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-sans font-semibold cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Salin URL</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="block font-bold text-slate-700">Status Bridging API BPJS &amp; Whitelist Domain (Default: Off)</label>
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
                  <option value="pending">Nonaktif / Default Off — Menunggu Whitelist Domain BPJS</option>
                  <option value="online">Aktif — Sudah Di-Whitelist (Domain https://kliniksombanmedika.id/)</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  {isOnline
                    ? 'Bridging API BPJS diaktifkan. Sistem akan mengirim transmisi data ke endpoint BPJS terpilih.'
                    : 'Status default adalah Nonaktif (false) sampai IP/Domain faskes di-whitelist oleh tim TI BPJS Kesehatan atau diaktifkan secara manual oleh Admin.'}
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
                <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 space-y-2">
                  {pingResult.isWhitelisted ? (
                    <div>
                      <div className="flex items-center justify-between font-bold text-emerald-700 mb-1">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Status: 200 OK (Terhubung Live)</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            environment === 'tester' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {environment === 'tester' ? 'Mode: Development / Tester' : 'Mode: Production'}
                          </span>
                          <span>Latensi: {pingResult.latencyMs} ms</span>
                        </div>
                      </div>
                      <p className="text-slate-500 font-sans text-xs">
                        Kredensial valid dan Domain https://kliniksombanmedika.id/ telah terhubung ke Web Service BPJS ({environment === 'tester' ? 'Development / Tester' : 'Production'}).
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between font-bold text-amber-700 mb-1">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Status: 201 Menunggu Whitelist IP/Domain</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            environment === 'tester' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {environment === 'tester' ? 'Mode: Development / Tester' : 'Mode: Production'}
                          </span>
                          <span>{pingResult.latencyMs ? `${pingResult.latencyMs} ms` : ''}</span>
                        </div>
                      </div>
                      <p className="text-amber-800 text-xs font-sans mt-1">
                        {pingResult.message || 'Koneksi ke endpoint BPJS Kesehatan ditolak atau timeout karena IP server faskes belum di-whitelist oleh tim TI BPJS Kesehatan.'}
                      </p>
                    </div>
                  )}

                  {/* Standard BPJS Server JSON Callback View */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1 font-sans">
                      <span className="font-bold text-slate-700">Response Callback Server BPJS (Standar JSON):</span>
                      <span className="font-mono text-[9px] text-slate-400">Endpoint: {baseUrl}</span>
                    </div>
                    <pre className="bg-slate-900 text-slate-100 p-2.5 rounded-xl text-[10px] font-mono overflow-x-auto max-h-40 select-all">
                      {JSON.stringify(
                        pingResult.raw || {
                          response: {
                            faskes: namaFaskes || 'KLINIK SOMBAN MEDIKA',
                            kdFaskes: kdFaskes || '019U901',
                            environment: environment === 'tester' ? 'development' : 'production',
                            mode: environment === 'tester' ? 'Development / Tester (Trustmark Dev)' : 'Production (BPJS Live)',
                            status: pingResult.isWhitelisted ? 'ACTIVE_BRIDGED' : 'PENDING_WHITELIST',
                            isWhitelisted: pingResult.isWhitelisted,
                          },
                          metadata: {
                            code: pingResult.isWhitelisted ? 200 : 201,
                            message: pingResult.message || (pingResult.isWhitelisted ? 'Ok' : 'Pending Whitelist'),
                          },
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: ALUR ANTREAN ONLINE & 7 TASK ID */}
        {activeTab === 'ALUR_ANTREAN' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
            {/* Banner Arsitektur Antrean Online FKTP & PCare */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white shadow-sm border border-emerald-800/40">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 shrink-0">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold text-[10px] uppercase tracking-wider">
                      Arsitektur Bridging FKTP
                    </span>
                    <span className="text-emerald-300 text-xs font-mono">Mobile JKN v2.0</span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Alur Antrean Online FKTP (Mobile JKN) &amp; 7 Task ID
                  </h3>
                  <p className="text-xs text-emerald-100/80 leading-relaxed">
                    Klinik Pratama &amp; Dokter Praktik Mandiri (FKTP) menggunakan integrasi <strong>Antrean Online FKTP (Mobile JKN)</strong> dan <strong>PCare</strong> untuk pelayanan pasien faskes tingkat pertama secara terpadu.
                  </p>
                </div>
              </div>

              {/* 3 Komponen Inti Bridging FKTP */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-emerald-700/40 text-[11px]">
                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5 mb-1">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Antrean Online (Mobile JKN)</span>
                  </div>
                  <p className="text-emerald-100/90 text-[10.5px] leading-relaxed">
                    Wajib di FKTP. Pasien mengambil antrean via Mobile JKN dan sistem klinik mengirim waktu layanan (7 Task ID).
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
                  <div className="font-bold text-teal-300 flex items-center gap-1.5 mb-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>PCare (Primary Care)</span>
                  </div>
                  <p className="text-teal-100/90 text-[10.5px] leading-relaxed">
                    Wajib di FKTP. Rekam medis, diagnosa ICD-10, tindakan klinis, dan rujukan peserta BPJS ke faskes rujukan.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
                  <div className="font-bold text-sky-300 flex items-center gap-1.5 mb-1">
                    <Server className="w-3.5 h-3.5" />
                    <span>9 WS FKTP BPJS (WS Antrean)</span>
                  </div>
                  <p className="text-sky-100/90 text-[10.5px] leading-relaxed">
                    9 Endpoint web service faskes untuk melayani permintaan kuota, jadwal poli, dan booking antrean dari Mobile JKN.
                  </p>
                </div>
              </div>
            </div>

            {/* Skema 2 Arah Antrean Online */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-emerald-600" />
                <span>Bagaimana Antrean Online 2 Arah Bekerja di Klinik Somban Medika?</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                {/* Arah 1: BPJS -> Faskes */}
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">1</span>
                      Arah Masuk: Dari Mobile JKN ke Klinik
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900">Inbound (9 WS FKTP)</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    Ketika pasien membuka aplikasi <strong>Mobile JKN</strong> di smartphone dan memilih <strong>Klinik Somban Medika</strong>:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[10.5px]">
                    <li>Server BPJS memanggil <code>/api/antrean/status</code> untuk melihat sisa kuota poli.</li>
                    <li>Pasien klik <em>Ambil Antrean</em>, BPJS memanggil <code>/api/antrean/ambil</code> ke server klinik.</li>
                    <li>Sistem klinik menerbitkan kode booking otomatis dan mengembalikan estimasi jam dilayani.</li>
                  </ul>
                </div>

                {/* Arah 2: Faskes -> BPJS */}
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">2</span>
                      Arah Keluar: Dari Klinik ke Server BPJS
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-200 text-blue-900">Outbound (7 Task ID)</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    Setiap pasien berobat di klinik dan petugas mengoperasikan sistem antrean:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[10.5px]">
                    <li>Pasien check-in di <strong>Kios Mandiri</strong> &rarr; Sistem kirim <strong>Task 1</strong>.</li>
                    <li>Petugas loket memanggil pasien &rarr; Sistem kirim <strong>Task 2 &amp; 3</strong>.</li>
                    <li>Dokter memanggil di ruang periksa &rarr; Sistem kirim <strong>Task 4 &amp; 5</strong>.</li>
                    <li>Farmasi meracik dan menyerahkan obat &rarr; Sistem kirim <strong>Task 6 &amp; 7</strong>.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Visualisasi 7 Task ID Resmi BPJS Kesehatan */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-slate-900 text-xs">
                    7 Tahapan Waktu Antrean (Task ID 1 s/d 7) BPJS Kesehatan
                  </h4>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Endpoint: /antrean/updatewaktu</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
                {/* Task 1 */}
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-emerald-700 text-[11px]">Task 1</span>
                      <span className="text-[9px] px-1 bg-emerald-100 text-emerald-800 rounded font-bold">Kios</span>
                    </div>
                    <strong className="block text-slate-900 text-[11px] font-bold">Check-in / Ambil Tiket</strong>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Pasien datang ke faskes dan check-in di Kios Mandiri atau ambil nomor antrean.
                    </p>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-200 text-[9px] font-mono text-slate-400">
                    Waktu Tunggu Admisi
                  </div>
                </div>

                {/* Task 2 */}
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-blue-700 text-[11px]">Task 2</span>
                      <span className="text-[9px] px-1 bg-blue-100 text-blue-800 rounded font-bold">Loket</span>
                    </div>
                    <strong className="block text-slate-900 text-[11px] font-bold">Panggil Admisi</strong>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Petugas pendaftaran menekan tombol panggil nomor antrean admisi di loket.
                    </p>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-200 text-[9px] font-mono text-slate-400">
                    Mulai Layanan Admisi
                  </div>
                </div>

                {/* Task 3 */}
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-blue-700 text-[11px]">Task 3</span>
                      <span className="text-[9px] px-1 bg-blue-100 text-blue-800 rounded font-bold">Loket</span>
                    </div>
                    <strong className="block text-slate-900 text-[11px] font-bold">Selesai Admisi</strong>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Petugas selesai verifikasi berkas BPJS dan mengarahkan pasien ke ruang tunggu Poli.
                    </p>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-200 text-[9px] font-mono text-slate-400">
                    Selesai Layanan Admisi
                  </div>
                </div>

                {/* Task 4 */}
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-teal-700 text-[11px]">Task 4</span>
                      <span className="text-[9px] px-1 bg-teal-100 text-teal-800 rounded font-bold">Poli</span>
                    </div>
                    <strong className="block text-slate-900 text-[11px] font-bold">Panggil Poli</strong>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Dokter/perawat memanggil nomor antrean pasien ke dalam ruang periksa poli.
                    </p>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-200 text-[9px] font-mono text-slate-400">
                    Waktu Tunggu Dokter
                  </div>
                </div>

                {/* Task 5 */}
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-teal-700 text-[11px]">Task 5</span>
                      <span className="text-[9px] px-1 bg-teal-100 text-teal-800 rounded font-bold">Poli</span>
                    </div>
                    <strong className="block text-slate-900 text-[11px] font-bold">Selesai Poli</strong>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Pemeriksaan dokter selesai, input rekam medis &amp; resep obat diterbitkan.
                    </p>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-200 text-[9px] font-mono text-slate-400">
                    Selesai Layanan Poli
                  </div>
                </div>

                {/* Task 6 */}
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-indigo-700 text-[11px]">Task 6</span>
                      <span className="text-[9px] px-1 bg-indigo-100 text-indigo-800 rounded font-bold">Farmasi</span>
                    </div>
                    <strong className="block text-slate-900 text-[11px] font-bold">Mulai Farmasi</strong>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Resep diterima apoteker dan obat mulai disiapkan atau diracik di instalasi farmasi.
                    </p>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-200 text-[9px] font-mono text-slate-400">
                    Waktu Tunggu Obat
                  </div>
                </div>

                {/* Task 7 */}
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-indigo-700 text-[11px]">Task 7</span>
                      <span className="text-[9px] px-1 bg-indigo-100 text-indigo-800 rounded font-bold">Farmasi</span>
                    </div>
                    <strong className="block text-slate-900 text-[11px] font-bold">Selesai Farmasi</strong>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Obat diserahkan ke pasien dengan edukasi aturan pakai. Pasien selesai berobat.
                    </p>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-200 text-[9px] font-mono text-slate-400">
                    Selesai Layanan Faskes
                  </div>
                </div>
              </div>

              {/* Status Otomatis di Sistem */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-700">
                    Semua Task ID di atas <strong>terpicu secara otomatis</strong> saat tombol di Kios Mandiri, Loket, Poli, atau Farmasi ditekan oleh petugas.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('WS_FKTP')}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shrink-0 cursor-pointer"
                >
                  Lihat 9 Endpoint WS FKTP &rarr;
                </button>
              </div>
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
                    URL WS FKTP {environment === 'production' ? 'Production' : 'Development / Tester'} Bridging Antrean Online Versi 2
                  </h3>
                  <p className="text-xs text-emerald-100/80 mt-0.5">
                    Data 9 endpoint dan metode web service resmi BPJS Kesehatan ({environment === 'production' ? 'Production / Live' : 'Development / Tester Trustmark'})
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
                        URL WS FKTP {environment === 'production' ? 'Production' : 'Development'}
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-300 w-28">
                        User {environment === 'production' ? 'Production' : 'Development'}
                      </th>
                      <th className="py-2.5 px-3 w-32">
                        Password {environment === 'production' ? 'Production' : 'Development'}
                      </th>
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
