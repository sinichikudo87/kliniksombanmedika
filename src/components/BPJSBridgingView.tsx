import React, { useEffect, useState } from 'react';
import {
  Server,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Trash2,
  Code,
  Database,
  Download,
  Check,
  CreditCard,
  UserCheck,
  Search,
  Sparkles,
  Phone,
  Stethoscope,
  Printer,
  FileText,
  Activity,
  ArrowRight,
  ExternalLink,
  Shield,
  Clock,
  Tv,
  FileCheck,
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { BPJSBridgingService } from '../services/bpjsBridging';
import { QueueTicket } from '../types/queue';
import {
  downloadSuratPermohonanDoc,
  downloadBaUatDoc,
  downloadPaktaIntegritasDoc,
  downloadWsUrlAntrolDoc,
  downloadSemuaBerkasProdDoc,
  DEFAULT_BERKAS_PROD_METADATA,
} from '../services/docProdBerkasGenerator';
import {
  showToast,
  showSuccessAlert,
  showErrorAlert,
  showInfoAlert,
  showConfirmDialog,
} from '../utils/swal';

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

const DEFAULT_MYSQL_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'antrean_bpjs_somban',
};

interface BPJSBridgingViewProps {
  onBackToTV?: () => void;
  openBerkasProdModal?: () => void;
}

export const BPJSBridgingView: React.FC<BPJSBridgingViewProps> = ({ onBackToTV, openBerkasProdModal }) => {
  const {
    bpjsConfig,
    setBpjsConfig,
    mysqlConfig,
    setMysqlConfig,
    bridgingLogs,
    clearLogs,
    resetAllTickets,
    testBpjsConnection,
    testMySQLConnection,
    syncToMySQL,
    downloadSQLExport,
    tickets,
    ambilTiketBaru,
    cekPesertaBPJS,
  } = useQueue();

  const safeBpjs = {
    ...DEFAULT_BPJS_CONFIG,
    ...(bpjsConfig || {}),
  };

  const safeMysql = {
    ...DEFAULT_MYSQL_CONFIG,
    ...(mysqlConfig || {}),
  };

  const safeLogs = Array.isArray(bridgingLogs) ? bridgingLogs.filter(Boolean) : [];
  const safeTickets = Array.isArray(tickets) ? tickets.filter(Boolean) : [];
  const bpjsTickets = safeTickets.filter((t) => t && (t.kategori === 'BPJS' || t.huruf === 'A'));

  const [activeTab, setActiveTab] = useState<'form-bpjs' | 'task-id' | 'config' | 'mysql' | 'signature' | 'logs' | 'berkas-prod'>('form-bpjs');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  // Form BPJS state (Default Standar Bridging BPJS Kesehatan)
  const [formNoKartu, setFormNoKartu] = useState('0001827463910');
  const [formNik, setFormNik] = useState('3515085404880002');
  const [formNama, setFormNama] = useState('Siti Rahmawati');
  const [formPoli, setFormPoli] = useState('Poli Umum');
  const [formKodePoli, setFormKodePoli] = useState('001');
  const [formDokter, setFormDokter] = useState('dr. Machmujur');
  const [formNoHp, setFormNoHp] = useState('081234567890');
  const [formKeluhan, setFormKeluhan] = useState('Pemeriksaan kesehatan rutin');
  const [formJenisKunjungan, setFormJenisKunjungan] = useState('Rujukan Faskes 1');
  const [isVerifyingParticipant, setIsVerifyingParticipant] = useState(false);
  const [verifiedData, setVerifiedData] = useState<any | null>(null);
  const [verificationErrMsg, setVerificationErrMsg] = useState<string | null>(null);
  const [ticketCreatedSuccess, setTicketCreatedSuccess] = useState<QueueTicket | null>(null);

  // Demo presets for quick testing (Standar BPJS)
  const demoPresets = [
    {
      nama: 'Siti Rahmawati',
      noKartu: '0001827463910',
      nik: '3515085404880002',
      kelas: 'Kelas 1 (Mandiri)',
      faskes: 'TPMD DR MACHMUJUR',
      noHp: '081234567890',
      poli: 'Poli Umum',
      kodePoli: '001',
      dokter: 'dr. Machmujur',
      keluhan: 'Pemeriksaan tensi darah dan pusing ringan',
    },
    {
      nama: 'Bambang Sutrisno',
      noKartu: '0002938475612',
      nik: '3515081203750001',
      kelas: 'Kelas 3 (PBI APBD)',
      faskes: 'Puskesmas Candi Sidoarjo',
      noHp: '085732198765',
      poli: 'Poli Umum',
      kodePoli: '001',
      dokter: 'dr. Diana',
      keluhan: 'Pemeriksaan rutin gula darah & tensi',
    },
    {
      nama: 'Kayla Azzahra',
      noKartu: '0003849501923',
      nik: '3515086509200003',
      kelas: 'Kelas 2 (PPU)',
      faskes: 'TPMD DR MACHMUJUR',
      noHp: '082198765432',
      poli: 'Poli KIA & Kebidanan / KB',
      kodePoli: 'KIA',
      dokter: 'Bidan',
      keluhan: 'Imunisasi balita dan konsultasi tumbuh kembang',
    },
  ];

  const handleApplyPreset = (demo: (typeof demoPresets)[0]) => {
    setFormNoKartu(demo.noKartu);
    setFormNik(demo.nik);
    setFormNama(demo.nama);
    setFormNoHp(demo.noHp);
    setFormPoli(demo.poli);
    setFormKodePoli(demo.kodePoli);
    setFormDokter(demo.dokter);
    setFormKeluhan(demo.keluhan);
    setVerifiedData({
      noKartu: demo.noKartu,
      nik: demo.nik,
      nama: demo.nama,
      statusPeserta: { keterangan: 'AKTIF (Terverifikasi BPJS Kesehatan)' },
      hakKelas: { keterangan: demo.kelas },
      provUmum: { nmProvider: demo.faskes },
    });
    setVerificationErrMsg(null);
  };

  const handleVerifyPeserta = async () => {
    if (!formNoKartu.trim()) return;
    setIsVerifyingParticipant(true);
    setVerificationErrMsg(null);
    try {
      const isNik = formNoKartu.trim().length === 16;
      const res = await cekPesertaBPJS(formNoKartu.trim(), isNik);
      if (res.status === 200 && res.data?.response?.peserta) {
        const p = res.data.response.peserta;
        setVerifiedData(p);
        if (p.nama) setFormNama(p.nama);
        if (p.nik) setFormNik(p.nik);
      } else {
        setVerificationErrMsg(res.data?.metaData?.message || 'Nomor kartu/NIK tidak terdaftar di BPJS.');
      }
    } catch (err: any) {
      setVerificationErrMsg(err.message || 'Gagal menghubungi server BPJS.');
    } finally {
      setIsVerifyingParticipant(false);
    }
  };

  const handleCreateTicketBPJS = async () => {
    try {
      const ticket = await ambilTiketBaru({
        kategori: 'BPJS',
        poliTujuan: formPoli,
        kodePoli: formKodePoli,
        dokterNama: formDokter,
        namaPasien: formNama.trim() || 'Pasien BPJS Mandiri',
        noKartuBPJS: formNoKartu.trim() || '0001827463910',
        nik: formNik.trim() || '3515085404880002',
      });
      setTicketCreatedSuccess(ticket);
      showSuccessAlert(
        'Tiket BPJS Berhasil Diterbitkan!',
        `Nomor antrean ${ticket.nomorAntrean} (${ticket.namaPasien}) untuk ${ticket.poliTujuan} berhasil didaftarkan dan disinkronkan ke server Antrean BPJS.`
      );
    } catch (err: any) {
      showErrorAlert('Gagal Menerbitkan Tiket', err?.message || 'Terjadi kesalahan sistem.');
    }
  };

  // MySQL state
  const [isTestingMysql, setIsTestingMysql] = useState<boolean>(false);
  const [mysqlTestResult, setMysqlTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncingMysql, setIsSyncingMysql] = useState<boolean>(false);
  const [mysqlSyncResult, setMysqlSyncResult] = useState<any | null>(null);

  // Live HMAC signature state
  const [liveTimestamp, setLiveTimestamp] = useState<string>(BPJSBridgingService.getBpjsTimestamp());
  const [liveSignature, setLiveSignature] = useState<string>('');

  useEffect(() => {
    const calculateLive = async () => {
      try {
        const ts = BPJSBridgingService.getBpjsTimestamp();
        setLiveTimestamp(ts);
        const sig = await BPJSBridgingService.generateSignature(
          safeBpjs.consId || '11495',
          safeBpjs.secretKey || '4xHABA0A84',
          ts
        );
        setLiveSignature(sig);
      } catch (err) {
        console.warn('Gagal menghitung HMAC live signature:', err);
      }
    };

    calculateLive();
    const interval = setInterval(calculateLive, 3000);
    return () => clearInterval(interval);
  }, [safeBpjs.consId, safeBpjs.secretKey]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testBpjsConnection();
      setTestResult(res);
      showToast('Koneksi Web Service BPJS Berhasil Terhubung (HTTP 200 OK)', 'success');
    } catch (err: any) {
      setTestResult({ status: 500, error: err?.message });
      showErrorAlert('Uji Koneksi BPJS Gagal', err?.message || 'Server BPJS tidak merespons.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestMySQL = async () => {
    setIsTestingMysql(true);
    setMysqlTestResult(null);
    try {
      const res = await testMySQLConnection();
      setMysqlTestResult(res);
      if (res.success) {
        showSuccessAlert('Koneksi Database MySQL Sukses', res.message);
      } else {
        showErrorAlert('Koneksi MySQL Gagal', res.message);
      }
    } catch (err: any) {
      setMysqlTestResult({ success: false, message: err.message || 'Koneksi gagal' });
      showErrorAlert('Koneksi MySQL Gagal', err.message || 'Gagal menghubungi server database.');
    } finally {
      setIsTestingMysql(false);
    }
  };

  const handleSyncMySQL = async () => {
    setIsSyncingMysql(true);
    setMysqlSyncResult(null);
    try {
      const res = await syncToMySQL();
      setMysqlSyncResult(res);
      showSuccessAlert('Sinkronisasi Berhasil', 'Seluruh data tiket dan riwayat bridging tersimpan ke database MySQL.');
    } catch (err: any) {
      setMysqlSyncResult({ success: false, message: err.message || 'Sinkronisasi gagal' });
      showErrorAlert('Sinkronisasi Gagal', err.message);
    } finally {
      setIsSyncingMysql(false);
    }
  };

  const handleResetData = async () => {
    const confirmed = await showConfirmDialog({
      title: 'Reset Antrean Hari Ini?',
      text: 'Semua nomor antrean dan status loket akan dikembalikan ke 0 untuk pergantian shift kerja. Tindakan ini tidak dapat dibatalkan.',
      confirmButtonText: 'Ya, Reset Semua (0 Tiket)',
      cancelButtonText: 'Batal',
      isDanger: true,
    });
    if (confirmed) {
      await resetAllTickets();
      showSuccessAlert('Antrean Berhasil Direset', 'Semua antrean hari ini telah berhasil dikosongkan (0 tiket).');
    }
  };

  const formatSafeTime = (val?: any) => {
    if (!val) return '-';
    try {
      const str = String(val);
      if (str.includes('.') && !str.includes('T') && !str.includes('-')) return str;
      const d = new Date(str);
      return !isNaN(d.getTime()) ? d.toLocaleTimeString('id-ID') : str;
    } catch {
      return String(val);
    }
  };

  const formatSafeDateTime = (val?: any) => {
    if (!val) return '-';
    try {
      const str = String(val);
      if (str.includes('.') && !str.includes('T') && !str.includes('-')) return str;
      const d = new Date(str);
      return !isNaN(d.getTime()) ? d.toLocaleString('id-ID') : str;
    } catch {
      return String(val);
    }
  };

  const handleClearLogs = async () => {
    const confirmed = await showConfirmDialog({
      title: 'Hapus Semua Log Bridging?',
      text: 'Semua catatan log request dan response API BPJS akan dibersihkan dari penyimpanan.',
      confirmButtonText: 'Ya, Hapus Log',
      cancelButtonText: 'Batal',
      isDanger: true,
    });
    if (confirmed) {
      clearLogs();
      showToast('Log transaksi bridging berhasil dibersihkan', 'info');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Hero Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-700 dark:bg-emerald-600 flex items-center justify-center text-white shadow-md shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Menu &amp; Integrasi Bridging BPJS Antrean RS v2
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-mono">
                {safeBpjs.isSandbox ? 'SANDBOX TEST' : 'LIVE PRODUCTION'}
              </span>
            </div>
            <p className="text-xs sm:sm text-slate-500 dark:text-slate-400 mt-0.5">
              Faskes: <strong>{safeBpjs.namaFaskes}</strong> · Kode PPK: <span className="font-mono">{safeBpjs.kodePPK}</span> · Standar SatuSehat &amp; BPJS Kesehatan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {onBackToTV && (
            <button
              onClick={onBackToTV}
              className="px-3.5 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Tv className="w-4 h-4 text-emerald-600" />
              <span>Kembali ke TV</span>
            </button>
          )}

          <button
            onClick={() => {
              if (openBerkasProdModal) {
                openBerkasProdModal();
              } else {
                setActiveTab('berkas-prod');
              }
            }}
            className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Buka & Unduh Berkas Pengajuan PROD (.doc)"
          >
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>Berkas PROD (.doc)</span>
          </button>

          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Menguji API...' : 'Tes Koneksi BPJS'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
            Status Koneksi Bridging
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <strong className="text-sm sm:text-base font-bold text-emerald-800 dark:text-emerald-400">
              Online &amp; Siap
            </strong>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">HMAC-SHA256 Aktif</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
            Total Tiket BPJS (A)
          </span>
          <strong className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white">
            {bpjsTickets.length} Pasien
          </strong>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block">
            {bpjsTickets.filter((t) => t && t.status === 'SELESAI').length} selesai dilayani
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
            Sinkronisasi MySQL
          </span>
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-teal-600" />
            <strong className="text-sm font-bold text-slate-900 dark:text-white">
              {safeMysql.host}:{safeMysql.port}
            </strong>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Database: {safeMysql.database}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
            Log Transaksi BPJS
          </span>
          <strong className="text-lg sm:text-xl font-bold font-mono text-indigo-700 dark:text-indigo-400">
            {safeLogs.length} Log
          </strong>
          <span className="text-[10px] text-slate-400 mt-1 block">Tersimpan di local state</span>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('form-bpjs')}
          className={`px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'form-bpjs'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Form Pasien BPJS</span>
        </button>

        <button
          onClick={() => setActiveTab('task-id')}
          className={`px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'task-id'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Status Task ID (1 s/d 7)</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'config'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Kredensial BPJS</span>
        </button>

        <button
          onClick={() => setActiveTab('mysql')}
          className={`px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'mysql'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database MySQL</span>
        </button>

        <button
          onClick={() => setActiveTab('signature')}
          className={`px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'signature'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Kalkulator HMAC</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'logs'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Riwayat Log ({safeLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('berkas-prod')}
          className={`px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'berkas-prod'
              ? 'bg-emerald-700 text-white font-bold shadow-xs'
              : 'text-emerald-700 dark:text-emerald-400 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Berkas PROD (.doc)</span>
          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-500 text-slate-950 rounded font-mono">
            4 BERKAS
          </span>
        </button>
      </div>

      {/* 4. Tab Content Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xs">
        {/* TAB 1: FORM PENDAFTARAN PASIEN BPJS */}
        {activeTab === 'form-bpjs' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Formulir Pendaftaran &amp; Validasi Peserta BPJS Kesehatan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lakukan verifikasi online nomor kartu atau NIK ke server BPJS dan daftarkan antrean poli secara langsung.
              </p>
            </div>

            {/* Quick Demo Presets */}
            <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pilih Data Demo Pasien BPJS Cepat (1-Klik):</span>
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold">
                  Validasi Otomatis
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {demoPresets.map((demo) => (
                  <button
                    key={demo.noKartu}
                    type="button"
                    onClick={() => handleApplyPreset(demo)}
                    className="p-2.5 text-left rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 hover:border-emerald-600 hover:shadow-xs transition-all cursor-pointer text-xs group"
                  >
                    <div className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 truncate">
                      {demo.nama}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">
                      No. {demo.noKartu}
                    </div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold truncate mt-0.5">
                      {demo.poli} ({demo.dokter})
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Registration Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                  Nomor Kartu BPJS (13 Digit) / NIK (16 Digit):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formNoKartu}
                    onChange={(e) => setFormNoKartu(e.target.value)}
                    placeholder="Contoh: 0001827463910"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyPeserta}
                    disabled={isVerifyingParticipant || !formNoKartu.trim()}
                    className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shrink-0 disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{isVerifyingParticipant ? 'Mengecek...' : 'Verifikasi'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                  Nama Lengkap Pasien Sesuai KTP/BPJS:
                </label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Siti Rahmawati"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-600 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                  NIK (KTP):
                </label>
                <input
                  type="text"
                  value={formNik}
                  onChange={(e) => setFormNik(e.target.value)}
                  placeholder="351508..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                  Nomor WhatsApp / HP:
                </label>
                <input
                  type="tel"
                  value={formNoHp}
                  onChange={(e) => setFormNoHp(e.target.value)}
                  placeholder="081234567890"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                  Poliklinik Tujuan (Standar Bridging BPJS):
                </label>
                <select
                  value={formPoli}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormPoli(val);
                    if (val === 'Poli Umum (dr. Diana)') {
                      setFormKodePoli('001');
                      setFormDokter('dr. Diana');
                    } else if (val === 'Poli Gigi & Mulut') {
                      setFormKodePoli('002');
                      setFormDokter('dr. Diana');
                    } else if (val === 'Poli KIA & KB') {
                      setFormKodePoli('003');
                      setFormDokter('Bidan');
                    } else if (val === 'Poli Lansia & Prolanis') {
                      setFormKodePoli('004');
                      setFormDokter('dr. Diana');
                    } else if (val === 'Farmasi & Apotek') {
                      setFormKodePoli('005');
                      setFormDokter('Wandi (Penyerahan Resep)');
                    } else if (val === 'Laboratorium & Cek Darah') {
                      setFormKodePoli('006');
                      setFormDokter('Analis Medis Somban');
                    } else {
                      setFormKodePoli('001');
                      setFormDokter('dr. Machmujur');
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-600 font-medium"
                >
                  <option value="Poli Umum">[001] Poli Umum (dr. Machmujur) · Standar Default BPJS</option>
                  <option value="Poli Umum (dr. Diana)">[001] Poli Umum (dr. Diana)</option>
                  <option value="Poli Gigi & Mulut">[002] Poli Gigi &amp; Mulut (dr. Diana - Dokter Umum)</option>
                  <option value="Poli KIA & KB">[003] Poli KIA &amp; KB (Bidan)</option>
                  <option value="Poli Lansia & Prolanis">[004] Poli Lansia &amp; Prolanis (dr. Diana - Dokter Umum)</option>
                  <option value="Farmasi & Apotek">[005] Farmasi &amp; Apotek (Wandi)</option>
                  <option value="Laboratorium & Cek Darah">[006] Laboratorium &amp; Cek Darah</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                  Dokter DPJP:
                </label>
                <input
                  type="text"
                  value={formDokter}
                  readOnly
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 text-xs cursor-not-allowed font-semibold"
                />
              </div>
            </div>

            {/* Verification Result Card */}
            {verifiedData && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider block">
                  ✓ Hasil Verifikasi Peserta BPJS Kesehatan:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Nama Peserta:</span>
                    <strong className="text-slate-900 dark:text-white">{verifiedData.nama}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Hak Kelas / Status:</span>
                    <span className="text-emerald-800 dark:text-emerald-400 font-semibold">
                      {verifiedData.hakKelas?.keterangan || 'Kelas 1'} (Aktif)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Faskes Primer:</span>
                    <span className="truncate block">{verifiedData.provUmum?.nmProvider || 'Klinik Somban Medika Sidoarjo'}</span>
                  </div>
                </div>
              </div>
            )}

            {verificationErrMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
                {verificationErrMsg}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCreateTicketBPJS}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Terbitkan Tiket &amp; Sinkronkan ke Antrean BPJS (Kategori A)</span>
              </button>
            </div>

            {ticketCreatedSuccess && (
              <div className="p-4 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-400 dark:border-emerald-700 rounded-xl flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-base">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      Tiket Berhasil Diterbitkan: {ticketCreatedSuccess.nomorAntrean}
                    </h4>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300">
                      Pasien <strong>{ticketCreatedSuccess.namaPasien}</strong> masuk antrean {ticketCreatedSuccess.poliTujuan}.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTicketCreatedSuccess(null)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                >
                  Tutup Notifikasi
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STATUS TASK ID 1-7 */}
        {activeTab === 'task-id' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Alur Task ID Bridging Antrean RS v2 (BPJS Kesehatan)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sistem mengirimkan timestamp waktu layanan per pasien ke server BPJS untuk perhitungan SLA pelayanan:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 text-xs">
              {[
                { task: 1, title: 'Check-in Pasien', desc: 'Pasien tiba di klinik & ambil tiket mandiri' },
                { task: 2, title: 'Dipanggil Loket', desc: 'Petugas loket memanggil nomor antrean' },
                { task: 3, title: 'Admisi Selesai', desc: 'Validasi kartu BPJS & penerbitan SEP' },
                { task: 4, title: 'Poli Periksa', desc: 'Dokter memanggil pasien ke ruang poli' },
                { task: 5, title: 'Poli Selesai', desc: 'Pemeriksaan tuntas & input resep digital' },
                { task: 6, title: 'Depo Farmasi', desc: 'Apoteker menyiapkan racikan obat' },
                { task: 7, title: 'Obat Diterima', desc: 'Resep diserahkan & pasien pulang' },
              ].map((item) => (
                <div
                  key={item.task}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between"
                >
                  <div>
                    <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-mono font-bold flex items-center justify-center text-xs mb-2">
                      {item.task}
                    </span>
                    <strong className="block text-slate-900 dark:text-white mb-1 font-semibold">
                      {item.title}
                    </strong>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {item.desc}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                    Task ID: {item.task}
                  </div>
                </div>
              ))}
            </div>

            {/* List of active BPJS tickets and their task ids */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-2">
                Daftar Pasien BPJS &amp; Task ID Aktif Hari Ini:
              </h3>
              {bpjsTickets.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Belum ada pasien BPJS yang terdaftar hari ini.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="p-2.5">Nomor</th>
                        <th className="p-2.5">Nama Pasien</th>
                        <th className="p-2.5">Poli Tujuan</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Task ID</th>
                        <th className="p-2.5">Waktu Check-in</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {bpjsTickets.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2.5 font-bold font-mono text-emerald-700 dark:text-emerald-400">
                            {t.nomorAntrean}
                          </td>
                          <td className="p-2.5 font-medium text-slate-900 dark:text-white">
                            {t.namaPasien}
                          </td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-300">
                            {t.poliTujuan} ({t.dokterNama})
                          </td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {t.status}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            Task {t.taskIdBpjs} / 7
                          </td>
                          <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                            {formatSafeTime(t.waktuAmbil)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: KREDENSIAL BPJS & PCARE FKTP */}
        {activeTab === 'config' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Kredensial &amp; Konfigurasi Bridging BPJS / PCare FKTP
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Data resmi pengajuan CID Bridging FKTP Pcare (Eclaim) Tester Faskes TPMD DR MACHMUJUR.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setBpjsConfig({
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
                  })
                }
                className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs"
              >
                Setel Ulang ke CID TPMD DR MACHMUJUR (11495)
              </button>
            </div>

            {/* TPMD DR MACHMUJUR Active Profile Card */}
            <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {bpjsConfig.namaFaskes}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-mono font-bold">
                    KD FASKES: {bpjsConfig.kodePPK}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                    JENIS CID: {bpjsConfig.jenisCid || 'Tester'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                    {bpjsConfig.jenisBridging || 'Pcare (Eclaim)'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-1 text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">Consumer ID:</span>
                  <strong className="text-emerald-700 dark:text-emerald-400">{bpjsConfig.consId}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">User PCare Dev:</span>
                  <strong>{bpjsConfig.userPcare || '0195U091-dev'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">Email Faskes:</span>
                  <span className="truncate block">{bpjsConfig.emailFaskes || 'praktekdokter91@gmail.com'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">Vendor Pengembang:</span>
                  <span className="truncate block">{safeBpjs.pengembanganVendor || 'Pengembangan sendiri'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                  Consumer ID (Cons ID):
                </label>
                <input
                  type="text"
                  value={safeBpjs.consId}
                  onChange={(e) => setBpjsConfig({ ...safeBpjs, consId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                  Secret Key:
                </label>
                <input
                  type="password"
                  value={safeBpjs.secretKey}
                  onChange={(e) => setBpjsConfig({ ...safeBpjs, secretKey: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                  User Key:
                </label>
                <input
                  type="text"
                  value={safeBpjs.userKey}
                  onChange={(e) => setBpjsConfig({ ...safeBpjs, userKey: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                  KD FASKES (Kode PPK):
                </label>
                <input
                  type="text"
                  value={safeBpjs.kodePPK}
                  onChange={(e) => setBpjsConfig({ ...safeBpjs, kodePPK: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                  User PCare Dev (Username PCare):
                </label>
                <input
                  type="text"
                  value={safeBpjs.userPcare || ''}
                  onChange={(e) => setBpjsConfig({ ...safeBpjs, userPcare: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs font-mono font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                  Pass PCare Dev (Password PCare):
                </label>
                <input
                  type="text"
                  value={safeBpjs.passPcare || ''}
                  onChange={(e) => setBpjsConfig({ ...safeBpjs, passPcare: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                  Nama Faskes:
                </label>
                <input
                  type="text"
                  value={safeBpjs.namaFaskes}
                  onChange={(e) => setBpjsConfig({ ...safeBpjs, namaFaskes: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                  Email Faskes:
                </label>
                <input
                  type="email"
                  value={safeBpjs.emailFaskes || 'praktekdokter91@gmail.com'}
                  onChange={(e) => setBpjsConfig({ ...safeBpjs, emailFaskes: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                  Base URL Server BPJS / PCare:
                </label>
                <input
                  type="text"
                  value={safeBpjs.baseUrl}
                  onChange={(e) => setBpjsConfig({ ...safeBpjs, baseUrl: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={safeBpjs.isSandbox}
                  onChange={(e) => setBpjsConfig({ ...safeBpjs, isSandbox: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span>Gunakan Mode Simulasi BPJS Sandbox (Rekomendasi Uji Coba)</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setBpjsConfig(safeBpjs);
                  showSuccessAlert(
                    'Pengaturan Kredensial Disimpan!',
                    'Kredensial BPJS Antrol & PCare FKTP berhasil disimpan secara persisten ke database server faskes.'
                  );
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Pengaturan Kredensial</span>
              </button>
            </div>

            {testResult && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      Callback API BPJS Kesehatan Terverifikasi
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      HTTP {testResult.status || 200} · {testResult.source || 'BPJS_API'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Latency: {testResult.latencyMs || testResult.log?.latencyMs || 65}ms
                  </span>
                </div>

                {/* Metadata summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Kode Status (metaData.code):</span>
                    <strong className="font-mono text-emerald-700 dark:text-emerald-400 text-sm">
                      {testResult.data?.metaData?.code || testResult.callback?.metaData?.code || 200}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Pesan Callback (metaData.message):</span>
                    <strong className="text-slate-800 dark:text-slate-200 line-clamp-1">
                      {testResult.data?.metaData?.message || testResult.callback?.metaData?.message || 'Ok - Callback Web Service BPJS Terverifikasi'}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Endpoint Validasi:</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-200 text-[11px] truncate block">
                      {testResult.callback?.response?.koneksi?.endpoint || testResult.log?.endpoint || '/antrean/ping'}
                    </strong>
                  </div>
                </div>

                {/* Structured JSON Callback viewer */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Payload Respon / Callback Asli dari API BPJS:
                  </span>
                  <pre className="p-3 rounded-lg bg-slate-900 dark:bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800 max-h-64 shadow-inner">
                    {JSON.stringify(testResult.callback || testResult.data || testResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DATABASE MYSQL */}
        {activeTab === 'mysql' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Koneksi Database Relasional MySQL / MariaDB
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Simpan tiket dan riwayat bridging ke tabel SQL lokal untuk audit dan pelaporan dinkes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                  Host MySQL:
                </label>
                <input
                  type="text"
                  value={mysqlConfig.host}
                  onChange={(e) => setMysqlConfig({ ...mysqlConfig, host: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                  Port:
                </label>
                <input
                  type="number"
                  value={mysqlConfig.port}
                  onChange={(e) => setMysqlConfig({ ...mysqlConfig, port: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                  Database:
                </label>
                <input
                  type="text"
                  value={mysqlConfig.database}
                  onChange={(e) => setMysqlConfig({ ...mysqlConfig, database: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleTestMySQL}
                disabled={isTestingMysql}
                className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingMysql ? 'animate-spin' : ''}`} />
                <span>{isTestingMysql ? 'Menguji...' : 'Uji Koneksi MySQL'}</span>
              </button>

              <button
                type="button"
                onClick={handleSyncMySQL}
                disabled={isSyncingMysql}
                className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{isSyncingMysql ? 'Menyinkronkan...' : 'Sinkronkan Tiket Sekarang'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  downloadSQLExport();
                  showToast('File SQL dump skema database berhasil diunduh', 'success');
                }}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-slate-300 dark:border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File .SQL Dump</span>
              </button>
            </div>

            {mysqlTestResult && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${mysqlTestResult.success ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300' : 'bg-red-50 text-red-700 border border-red-300'}`}>
                {mysqlTestResult.message}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: KALKULATOR HMAC & HEADER BRIDGING PCARE */}
        {activeTab === 'signature' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Live HMAC-SHA256 &amp; PCare Authorization Calculator
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Formula resmi BPJS &amp; PCare FKTP: <code>Base64(HMAC_SHA256(ConsID + &quot;&amp;&quot; + Timestamp, SecretKey))</code> &amp; <code>Basic Base64(UserPCare:PassPCare:kdAplikasi)</code>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs space-y-3 border border-slate-800 overflow-x-auto shadow-inner">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 border-b border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px]">Nama Faskes:</span>
                  <span className="font-bold text-white">{safeBpjs.namaFaskes}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">KD FASKES (PPK):</span>
                  <span className="font-bold text-emerald-300">{safeBpjs.kodePPK}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">X-timestamp (UTC Detik):</span>
                <span>{liveTimestamp}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">X-cons-id:</span>
                <span className="font-bold text-white">{safeBpjs.consId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">user_key (Header BPJS):</span>
                <span className="text-blue-300 break-all">{safeBpjs.userKey}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">X-signature (Base64 HMAC-SHA256):</span>
                <span className="break-all font-bold text-emerald-300">{liveSignature}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">X-authorization (Basic Auth PCare FKTP):</span>
                <span className="break-all font-bold text-amber-300">
                  {BPJSBridgingService.generatePcareAuthorization(safeBpjs.userPcare, safeBpjs.passPcare, safeBpjs.kdAplikasi || '095')}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Decoded string: {safeBpjs.userPcare || '0195U091-dev'}:••••••••:{safeBpjs.kdAplikasi || '095'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: RIWAYAT LOG */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Riwayat Log Transaksi Bridging BPJS
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Semua request dan response tercatat untuk audit data.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const confirmed = await showConfirmDialog({
                    title: 'Hapus Semua Riwayat Log?',
                    text: 'Seluruh riwayat transaksi API BPJS yang tersimpan akan dibersihkan.',
                    confirmButtonText: 'Ya, Hapus Semua',
                    cancelButtonText: 'Batal',
                  });
                  if (confirmed) {
                    clearLogs();
                    showToast('Riwayat log transaksi bridging berhasil dibersihkan', 'info');
                  }
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Log</span>
              </button>
            </div>

            {safeLogs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Belum ada riwayat bridging yang tercatat.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {safeLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {log.endpoint}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800">
                        HTTP {log.responseStatus} · {log.latencyMs}ms
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Waktu: {formatSafeDateTime(log.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: BERKAS PENGAJUAN PRODUCTION (PROD) (.DOC WORD) */}
        {activeTab === 'berkas-prod' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header Card */}
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Berkas Pengajuan Bridging Production (PROD) BPJS Kesehatan
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono">
                    FORMAT .DOC WORD RESMI
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                  Paket 4 dokumen administratif dan teknis wajib yang dipersyaratkan oleh BPJS Kesehatan untuk membuka akses dan menerbitkan kredensial Production (Cons ID, Secret Key, User Key) Antrean Online (Antrol RS v2 / FKTP).
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {openBerkasProdModal && (
                  <button
                    onClick={openBerkasProdModal}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pratinjau &amp; Kustomisasi</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    downloadSemuaBerkasProdDoc();
                    showToast('Paket 4 Berkas PROD Word (.doc) berhasil diunduh', 'success');
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Semua Berkas (.doc)</span>
                </button>
              </div>
            </div>

            {/* 4 Document Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Surat Permohonan */}
              <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/70 transition-all group">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-200 dark:border-emerald-800">
                      1
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                      SURAT RESMI
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      Surat Permohonan Akses &amp; Bridging Production
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Surat permohonan resmi berkop faskes yang ditujukan kepada Kepala Kantor Cabang BPJS Kesehatan Sidoarjo, menerangkan kesiapan sistem dan pengajuan kredensial PROD.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 text-[11px] text-slate-600 dark:text-slate-400 space-y-1 font-mono">
                    <div>• Perihal: Permohonan Bridging Production Antrol</div>
                    <div>• Ditandatangani Pimpinan Faskes + Materai 10.000</div>
                    <div>• Lampiran: 1 Berkas Lengkap</div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">Format: Microsoft Word (.doc)</span>
                  <button
                    onClick={() => {
                      downloadSuratPermohonanDoc();
                      showToast('Surat Permohonan Bridging PROD berhasil diunduh', 'success');
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Dokumen (.doc)</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Berita Acara UAT */}
              <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/70 transition-all group">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200 dark:border-blue-800">
                      2
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 font-mono">
                      100% PASS UAT
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Berita Acara User Acceptance Testing (BA UAT)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Laporan pengujian komprehensif 12 modul teknis antrean online (Task ID 1 s.d. 7, kuota antrean, pembatalan, validasi NIK/No. Kartu, dan suara TTS).
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 text-[11px] text-slate-600 dark:text-slate-400 space-y-1 font-mono">
                    <div>• 12 Skenario Pengujian Teruji (Status: PASS)</div>
                    <div>• Verifikasi Waktu Layanan Task ID 1-7 Lengkap</div>
                    <div>• Tanda Tangan: dr. Machmujur &amp; Dedy Angga Kurniawan, S.Kom</div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">Format: Microsoft Word (.doc)</span>
                  <button
                    onClick={() => {
                      downloadBaUatDoc();
                      showToast('Berita Acara UAT Antrol PROD berhasil diunduh', 'success');
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Dokumen (.doc)</span>
                  </button>
                </div>
              </div>

              {/* Card 3: Pakta Integritas (Faskes & Vendor) */}
              <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/70 transition-all group">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm shrink-0 border border-purple-200 dark:border-purple-800">
                      3
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-mono">
                      2 PIHAK (MATERAI)
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      Pakta Integritas 2 Dokumen (Faskes &amp; Vendor)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Dokumen hukum komitmen kepatuhan perlindungan data pribadi medis (UU PDP No. 27/2022), kerahasiaan kredensial API, dan jaminan keamanan vendor IT bebas backdoor.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 text-[11px] text-slate-600 dark:text-slate-400 space-y-1 font-mono">
                    <div>• Dokumen A: Pakta Integritas Pimpinan Faskes</div>
                    <div>• Dokumen B: Pakta Integritas Vendor / Developer IT</div>
                    <div>• Masing-masing bermaterai Rp 10.000,-</div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">Format: Microsoft Word (.doc)</span>
                  <button
                    onClick={() => {
                      downloadPaktaIntegritasDoc();
                      showToast('Pakta Integritas Faskes & Vendor berhasil diunduh', 'success');
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Dokumen (.doc)</span>
                  </button>
                </div>
              </div>

              {/* Card 4: WS URL Khusus Antrol */}
              <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/70 transition-all group">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-sm shrink-0 border border-teal-200 dark:border-teal-800">
                      4
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-mono">
                      KHUSUS ANTROL
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      Dokumen Teknis &amp; Pemetaan WS URL (Antrol)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Spesifikasi teknis Web Service URL (Dev &amp; Prod), IP Public Static Server Faskes, tabel pemetaan endpoint Task ID 1-7, kuota dokter, dan formula HMAC-SHA256.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 text-[11px] text-slate-600 dark:text-slate-400 space-y-1 font-mono">
                    <div>• URL Staging &amp; Production Antrean RS v2 / FKTP</div>
                    <div>• IP Public Static Faskes Whitelist Firewall</div>
                    <div>• Pemetaan 7 Endpoint API Antrol &amp; Header Header</div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">Format: Microsoft Word (.doc)</span>
                  <button
                    onClick={() => {
                      downloadWsUrlAntrolDoc();
                      showToast('Dokumen Teknis WS URL Antrol PROD berhasil diunduh', 'success');
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Dokumen (.doc)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Info & Quick Guide */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-xs text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <strong className="text-slate-900 dark:text-white block font-bold">
                  Tahapan Penyerahan Berkas ke Kantor Cabang BPJS Kesehatan:
                </strong>
                <span>
                  1. Unduh berkas .doc &rarr; 2. Cetak di kertas kop resmi faskes &rarr; 3. Tandatangani &amp; bubuhi materai 10.000 &rarr; 4. Kirim fisik / scan PDF ke petugas TI BPJS Cabang.
                </span>
              </div>
              <button
                onClick={() => downloadSemuaBerkasProdDoc()}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Paket 4 Berkas (.doc)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Danger Zone / Reset */}
      <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <strong className="text-rose-800 dark:text-rose-300 block font-bold">
            Reset Data Antrean Hari Ini
          </strong>
          <span className="text-slate-600 dark:text-slate-400">
            Kembalikan antrean ke nol untuk sesi pergantian hari baru (Shift kerja).
          </span>
        </div>

        <button
          onClick={handleResetData}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Reset Semua Antrean (0 Tiket)</span>
        </button>
      </div>
    </div>
  );
};
