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
  FileCheck,
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { BPJSBridgingService } from '../services/bpjsBridging';
import { downloadSemuaBerkasProdDoc } from '../services/docProdBerkasGenerator';
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

interface BridgingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BridgingSettingsModal: React.FC<BridgingSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
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

  const [activeTab, setActiveTab] = useState<'form-bpjs' | 'config' | 'logs' | 'signature' | 'mysql'>('form-bpjs');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  // Form BPJS state
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
  const [ticketCreatedSuccess, setTicketCreatedSuccess] = useState<any | null>(null);

  const demoPresets = [
    {
      nama: 'Siti Rahmawati',
      noKartu: '0001827463910',
      nik: '3515085404880002',
      kelas: 'Kelas 1 (Mandiri)',
      faskes: 'Klinik Somban Medika Sidoarjo',
      noHp: '081234567890',
      poli: 'Poli Umum',
      kodePoli: 'UMU',
      dokter: 'dr. Machmujur',
      keluhan: 'Pusing dan kontrol tekanan darah rutin',
    },
    {
      nama: 'Bambang Sutrisno',
      noKartu: '0002938475612',
      nik: '3515081203750001',
      kelas: 'Kelas 3 (PBI APBD)',
      faskes: 'Puskesmas Candi Sidoarjo',
      noHp: '085732198765',
      poli: 'Poli Umum - Ruang 2',
      kodePoli: 'UMU',
      dokter: 'dr. Diana',
      keluhan: 'Pemeriksaan rutin gula darah & tensi',
    },
    {
      nama: 'Kayla Azzahra',
      noKartu: '0003849501923',
      nik: '3515086509200003',
      kelas: 'Kelas 2 (PPU)',
      faskes: 'Klinik Somban Medika Sidoarjo',
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
        setVerificationErrMsg(res.data?.metaData?.message || 'Peserta tidak ditemukan');
      }
    } catch (err: any) {
      setVerificationErrMsg(err?.message || 'Gagal memverifikasi');
    } finally {
      setIsVerifyingParticipant(false);
    }
  };

  const handleSubmitBPJSTicket = async () => {
    try {
      const ticket = await ambilTiketBaru({
        kategori: 'BPJS',
        poliTujuan: formPoli,
        kodePoli: formKodePoli,
        dokterNama: formDokter,
        namaPasien: formNama.trim() || 'Pasien BPJS Kesehatan',
        noKartuBPJS: formNoKartu.trim() || '0001827463910',
        nik: formNik.trim() || '3515085404880002',
      });
      setTicketCreatedSuccess(ticket);
      showSuccessAlert(
        'Tiket BPJS Berhasil Diterbitkan!',
        `Nomor antrean ${ticket.nomorAntrean} (${ticket.namaPasien}) untuk ${ticket.poliTujuan} berhasil didaftarkan dan disinkronkan ke server BPJS.`
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
    if (!isOpen) return;

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
        console.warn('Gagal menghitung HMAC signature modal:', err);
      }
    };

    calculateLive();
    const interval = setInterval(calculateLive, 3000);
    return () => clearInterval(interval);
  }, [isOpen, safeBpjs.consId, safeBpjs.secretKey]);

  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const handleSaveConfig = () => {
    setBpjsConfig(safeBpjs);
    showSuccessAlert(
      'Pengaturan Kredensial Disimpan!',
      'Kredensial BPJS Antrol & PCare FKTP TPMD DR MACHMUJUR berhasil disimpan secara persisten ke database server faskes.'
    );
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testBpjsConnection();
      setTestResult(res);
      if (res.status === 200) {
        showSuccessAlert('Koneksi BPJS Terhubung!', 'Web Service BPJS merespons dengan status HTTP 200 OK.');
      } else {
        showErrorAlert('Uji Koneksi BPJS Gagal', res.data?.metaData?.message || 'Server BPJS tidak merespons.');
      }
    } catch (err: any) {
      setTestResult({ status: 500, error: err?.message });
      showErrorAlert('Uji Koneksi BPJS Gagal', err?.message || 'Server BPJS tidak dapat dihubungi.');
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
        showSuccessAlert('Koneksi Database MySQL Sukses!', res.message);
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
      showSuccessAlert('Sinkronisasi MySQL Berhasil!', 'Seluruh data tiket antrean dan riwayat bridging tersimpan ke database MySQL.');
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
      setIsConfirmingReset(false);
      setResetSuccessMessage('Semua data antrean berhasil direset (0 tiket).');
      showSuccessAlert('Antrean Direset!', 'Seluruh nomor antrean hari ini telah berhasil dikosongkan (0 tiket).');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[70] flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl max-w-3xl w-full p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5 max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Integrasi Bridging BPJS &amp; Database MySQL
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Konfigurasi Antrean RS v2, HMAC-SHA256, dan Penyimpanan Tabel MySQL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('form-bpjs')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'form-bpjs'
                ? 'bg-emerald-700 text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Form Pasien BPJS</span>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'config'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Kredensial BPJS
          </button>
          <button
            onClick={() => setActiveTab('mysql')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'mysql'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Database MySQL</span>
          </button>
          <button
            onClick={() => setActiveTab('signature')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'signature'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Kalkulator HMAC
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Log Request API</span>
            {bridgingLogs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">
                {bridgingLogs.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto flex-1 space-y-4 pr-1 text-xs">
          {/* TAB 0: Formulir Pendaftaran Pasien BPJS & Verifikasi */}
          {activeTab === 'form-bpjs' && (
            <div className="space-y-4">
              {/* Presets */}
              <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Contoh Pasien Cepat (Demo Presets):</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                    1-Klik Isi Form Otomatis
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {demoPresets.map((d) => (
                    <button
                      key={d.noKartu}
                      type="button"
                      onClick={() => handleApplyPreset(d)}
                      className="p-2 text-left rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 hover:border-emerald-600 text-xs transition-all cursor-pointer shadow-xs group"
                    >
                      <div className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 truncate">
                        {d.nama}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        No. {d.noKartu}
                      </div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium truncate">
                        {d.poli}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields Grid */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3.5">
                {/* Row 1 */}
                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                    Nomor Kartu BPJS (13 Digit) atau NIK (16 Digit):
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={formNoKartu}
                      onChange={(e) => setFormNoKartu(e.target.value)}
                      placeholder="Contoh: 0001827463910"
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyPeserta}
                      disabled={isVerifyingParticipant || !formNoKartu.trim()}
                      className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{isVerifyingParticipant ? 'Mengecek...' : 'Cek BPJS'}</span>
                    </button>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                      Nama Lengkap Pasien:
                    </label>
                    <input
                      type="text"
                      value={formNama}
                      onChange={(e) => setFormNama(e.target.value)}
                      placeholder="Nama sesuai kartu BPJS/KTP"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                      NIK KTP (16 Digit):
                    </label>
                    <input
                      type="text"
                      value={formNik}
                      onChange={(e) => setFormNik(e.target.value)}
                      placeholder="3515085404880002"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                      Poliklinik Tujuan:
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
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-600 font-medium"
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
                    <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                      Dokter DPJP:
                    </label>
                    <input
                      type="text"
                      value={formDokter}
                      readOnly
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 text-xs cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Row 4 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                      Nomor HP / WhatsApp:
                    </label>
                    <input
                      type="text"
                      value={formNoHp}
                      onChange={(e) => setFormNoHp(e.target.value)}
                      placeholder="081234567890"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                      Keluhan Utama:
                    </label>
                    <input
                      type="text"
                      value={formKeluhan}
                      onChange={(e) => setFormKeluhan(e.target.value)}
                      placeholder="Keluhan berobat"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Status Verification Card */}
              {verifiedData && (
                <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-xs space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-400 font-bold">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Status Peserta di Server BPJS:
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900">
                      AKTIF / ELIGIBLE
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-slate-700 dark:text-slate-300">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Nama:</span>
                      <strong className="text-slate-900 dark:text-white">{verifiedData.nama}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Hak Kelas:</span>
                      <span>{verifiedData.hakKelas?.keterangan || 'Kelas 1'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Faskes Asal:</span>
                      <span className="truncate block">{verifiedData.provUmum?.nmProvider || 'Klinik Somban Medika Sidoarjo'}</span>
                    </div>
                  </div>
                </div>
              )}

              {verificationErrMsg && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{verificationErrMsg}</span>
                </div>
              )}

              {/* Ticket Created Success Box */}
              {ticketCreatedSuccess && (
                <div className="p-4 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/80 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-200 text-xs space-y-2 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                      <span>Tiket Antrean BPJS Berhasil Diterbitkan!</span>
                    </span>
                    <span className="text-2xl font-black font-mono text-emerald-900 dark:text-white">
                      {ticketCreatedSuccess.nomorAntrean}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                    Pasien <strong>{ticketCreatedSuccess.namaPasien}</strong> telah didaftarkan ke <strong>{ticketCreatedSuccess.poliTujuan}</strong> dengan Kode Booking <strong>{ticketCreatedSuccess.kodeBooking}</strong>. Bridging BPJS Task 1 telah dikirim ke server.
                  </p>
                </div>
              )}

              {/* Action Button: Generate Ticket */}
              <button
                type="button"
                onClick={handleSubmitBPJSTicket}
                className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Daftarkan Pasien &amp; Terbitkan Tiket Antrean BPJS Kategori A</span>
              </button>
            </div>
          )}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Mode Simulator / Sandbox BPJS:</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Gunakan simulasi responsif bersertifikasi BPJS atau hubungkan langsung ke server BPJS live.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setBpjsConfig((prev) => ({ ...prev, isSandbox: !prev.isSandbox }))}
                  className={`px-3.5 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                    bpjsConfig.isSandbox
                      ? 'bg-emerald-700 text-white'
                      : 'bg-amber-600 text-white'
                  }`}
                >
                  {bpjsConfig.isSandbox ? 'Sandbox Aktif' : 'Live Mode'}
                </button>
              </div>

              <div>
                <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                  Base URL Server BPJS:
                </label>
                <input
                  type="text"
                  value={bpjsConfig.baseUrl}
                  onChange={(e) => setBpjsConfig((prev) => ({ ...prev, baseUrl: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                    Consumer ID (Cons ID):
                  </label>
                  <input
                    type="text"
                    value={bpjsConfig.consId}
                    onChange={(e) => setBpjsConfig((prev) => ({ ...prev, consId: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                    Secret Key:
                  </label>
                  <input
                    type="password"
                    value={bpjsConfig.secretKey}
                    onChange={(e) => setBpjsConfig((prev) => ({ ...prev, secretKey: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                  User Key (Antrean BPJS):
                </label>
                <input
                  type="text"
                  value={bpjsConfig.userKey}
                  onChange={(e) => setBpjsConfig((prev) => ({ ...prev, userKey: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Preset TPMD DR MACHMUJUR Official Credentials */}
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                      Kredensial Faskes: TPMD DR MACHMUJUR
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-mono font-bold">
                      KD: {bpjsConfig.kodePPK}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold">
                      CID: {bpjsConfig.consId} ({bpjsConfig.jenisCid || 'Tester'})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Bridging FKTP {bpjsConfig.jenisBridging || 'Pcare (Eclaim)'} · User Dev: {bpjsConfig.userPcare || '0195U091-dev'} · {bpjsConfig.emailFaskes || 'praktekdokter91@gmail.com'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setBpjsConfig((prev) => ({
                      ...prev,
                      consId: '11495',
                      secretKey: '4xHABA0A84',
                      userKey: '4a1a84234ffc19f0c77750cebfa2444e',
                      kodePPK: '019U901',
                      namaFaskes: 'TPMD DR MACHMUJUR',
                      jenisBridging: 'Pcare (Eclaim)',
                      jenisCid: 'Tester',
                      cidTesterProd: 'Tester',
                      userPcare: '0195U091-dev',
                      passPcare: 'Dev1234#',
                      emailFaskes: 'praktekdokter91@gmail.com',
                      pengembanganVendor: 'Pengembangan sendiri',
                      kdAplikasi: '095',
                    }))
                  }
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs"
                >
                  Setel Ulang ke CID TPMD DR MACHMUJUR
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                    Kode PPK / Faskes (KD FASKES):
                  </label>
                  <input
                    type="text"
                    value={bpjsConfig.kodePPK}
                    onChange={(e) => setBpjsConfig((prev) => ({ ...prev, kodePPK: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                    Nama Fasilitas Kesehatan (Faskes):
                  </label>
                  <input
                    type="text"
                    value={bpjsConfig.namaFaskes}
                    onChange={(e) => setBpjsConfig((prev) => ({ ...prev, namaFaskes: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-600 font-bold"
                  />
                </div>
              </div>

              {/* PCare FKTP (Primary Care Eclaim) Specific Fields */}
              <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <span>Otentikasi Akun PCare FKTP (Eclaim Dev)</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                    JENIS CID: {bpjsConfig.jenisCid || 'Tester'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      User PCare Dev (username):
                    </label>
                    <input
                      type="text"
                      value={bpjsConfig.userPcare || ''}
                      onChange={(e) => setBpjsConfig((prev) => ({ ...prev, userPcare: e.target.value }))}
                      placeholder="0195U091-dev"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Password PCare Dev:
                    </label>
                    <input
                      type="text"
                      value={bpjsConfig.passPcare || ''}
                      onChange={(e) => setBpjsConfig((prev) => ({ ...prev, passPcare: e.target.value }))}
                      placeholder="Dev1234#"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Jenis Bridging:
                    </label>
                    <input
                      type="text"
                      value={bpjsConfig.jenisBridging || 'Pcare (Eclaim)'}
                      onChange={(e) => setBpjsConfig((prev) => ({ ...prev, jenisBridging: e.target.value }))}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Email Faskes:
                    </label>
                    <input
                      type="email"
                      value={bpjsConfig.emailFaskes || 'praktekdokter91@gmail.com'}
                      onChange={(e) => setBpjsConfig((prev) => ({ ...prev, emailFaskes: e.target.value }))}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">Auto-Sync Task ID (1-7):</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Kirim otomatis updatewaktu task 1 hingga 7 saat tiket dipanggil &amp; selesai dilayani
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={bpjsConfig.autoSyncBpjs}
                  onChange={(e) => setBpjsConfig((prev) => ({ ...prev, autoSyncBpjs: e.target.checked }))}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="flex-1 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer text-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Pengaturan Kredensial</span>
                </button>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="flex-1 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer text-xs"
                >
                  <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Menghubungkan ke Server...' : 'Uji Koneksi Bridging & Validasi'}</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3.5 rounded-lg border text-xs space-y-2.5 ${
                    testResult.status === 200
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-1.5 border-b border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-1.5 font-bold">
                      {testResult.status === 200 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-700 dark:text-rose-400" />
                      )}
                      <span>
                        Callback BPJS: {testResult.data?.metaData?.message || testResult.callback?.metaData?.message || (testResult.status === 200 ? 'Koneksi Sukses' : 'Koneksi Gagal')}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold">
                      Code: {testResult.data?.metaData?.code || testResult.callback?.metaData?.code || testResult.status || 200}
                    </span>
                  </div>

                  <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Callback JSON Resmi Web Service BPJS Kesehatan:
                  </div>
                  <pre className="text-[11px] font-mono overflow-x-auto p-2.5 bg-slate-900 dark:bg-slate-950 text-emerald-400 border border-slate-800 rounded max-h-56 shadow-inner">
                    {JSON.stringify(testResult.callback || testResult.data || testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MySQL Database Management (NEW) */}
          {activeTab === 'mysql' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                <Database className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700 dark:text-emerald-400" />
                <div>
                  <span className="font-bold block">Penyimpanan Database MySQL Aktif:</span>
                  <span>
                    Hasil transaksi bridging antrean dan log API disimpan secara persisten di database. Anda dapat menghubungkan ke MySQL server lokal/cloud atau mengekspor tabel SQL lengkap.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                    Host MySQL:
                  </label>
                  <input
                    type="text"
                    value={mysqlConfig.host}
                    onChange={(e) => setMysqlConfig((prev) => ({ ...prev, host: e.target.value }))}
                    placeholder="localhost atau IP database"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                    Port:
                  </label>
                  <input
                    type="number"
                    value={mysqlConfig.port}
                    onChange={(e) => setMysqlConfig((prev) => ({ ...prev, port: parseInt(e.target.value, 10) || 3306 }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                    Username MySQL:
                  </label>
                  <input
                    type="text"
                    value={mysqlConfig.user}
                    onChange={(e) => setMysqlConfig((prev) => ({ ...prev, user: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                    Password:
                  </label>
                  <input
                    type="password"
                    value={mysqlConfig.password || ''}
                    onChange={(e) => setMysqlConfig((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="(kosongkan jika tanpa password)"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                  Nama Database:
                </label>
                <input
                  type="text"
                  value={mysqlConfig.database}
                  onChange={(e) => setMysqlConfig((prev) => ({ ...prev, database: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* MySQL Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  onClick={handleTestMySQL}
                  disabled={isTestingMysql}
                  className="py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingMysql ? 'animate-spin' : ''}`} />
                  <span>{isTestingMysql ? 'Menguji...' : 'Tes Koneksi'}</span>
                </button>

                <button
                  onClick={handleSyncMySQL}
                  disabled={isSyncingMysql}
                  className="py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{isSyncingMysql ? 'Menyinkron...' : 'Sinkronkan Data'}</span>
                </button>

                <button
                  onClick={downloadSQLExport}
                  className="py-2 px-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                  title="Unduh skrip .SQL lengkap berisi tabel dan data"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh File .SQL</span>
                </button>
              </div>

              {mysqlTestResult && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                    mysqlTestResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {mysqlTestResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{mysqlTestResult.message}</span>
                </div>
              )}

              {mysqlSyncResult && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                    mysqlSyncResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {mysqlSyncResult.success ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{mysqlSyncResult.message}</span>
                </div>
              )}

              {/* Export and Reset Card */}
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Ekspor Skrip Tabel MySQL (.sql):
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Unduh file schema.sql berisi DDL tabel antrean dan riwayat bridging untuk diimpor ke phpMyAdmin.
                    </span>
                  </div>
                  <button
                    onClick={downloadSQLExport}
                    className="px-3 py-1.5 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh .SQL</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Hapus / Bersihkan Data Antrean:
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Total tiket saat ini: <strong className="font-mono">{tickets.length} antrean</strong>
                    </span>
                  </div>
                  {isConfirmingReset ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-rose-600 font-semibold">Yakin hapus semua?</span>
                      <button
                        onClick={handleResetData}
                        className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                      >
                        Ya, Hapus
                      </button>
                      <button
                        onClick={() => setIsConfirmingReset(false)}
                        className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsConfirmingReset(true)}
                      className="px-3 py-1.5 rounded-md bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-300 font-semibold text-xs border border-rose-200 dark:border-rose-800 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                      <span>Reset Antrean</span>
                    </button>
                  )}
                </div>

                {resetSuccessMessage && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{resetSuccessMessage}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: HMAC Signature Calculator */}
          {activeTab === 'signature' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Standar Autentikasi BPJS Kesehatan (HMAC-SHA256):</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  Setiap pemanggilan API BPJS membutuhkan 4 HTTP Header wajib yang dikalkulasi secara realtime:
                </p>

                <div className="space-y-2 font-mono text-[11px]">
                  <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Header 1: X-cons-id</span>
                    <strong className="text-slate-900 dark:text-white">{bpjsConfig.consId}</strong>
                  </div>
                  <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Header 2: X-timestamp (UTC Epoch Seconds)</span>
                    <strong className="text-emerald-800 dark:text-emerald-400">{liveTimestamp}</strong>
                  </div>
                  <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                      Header 3: X-signature (Base64 HMAC-SHA256 of ConsID + &amp; + Timestamp with SecretKey)
                    </span>
                    <strong className="text-amber-800 dark:text-amber-400 break-all">{liveSignature || 'Menghitung...'}</strong>
                  </div>
                  <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Header 4: user_key</span>
                    <strong className="text-slate-900 dark:text-white break-all">{bpjsConfig.userKey}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Bridging Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2">
                <span className="text-slate-600 dark:text-slate-400 text-xs">
                  Menampilkan riwayat komunikasi HTTP request/response ke server BPJS:
                </span>
                {bridgingLogs.length > 0 && (
                  <button
                    onClick={clearLogs}
                    className="flex items-center gap-1 text-slate-500 hover:text-rose-700 dark:text-slate-400 dark:hover:text-rose-400 text-xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Log</span>
                  </button>
                )}
              </div>

              {bridgingLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Belum ada aktivitas request BPJS.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bridgingLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                              log.method === 'POST'
                                ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {log.method}
                          </span>
                          <span className="text-slate-900 dark:text-white truncate max-w-xs">{log.endpoint}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-emerald-700 dark:text-emerald-400">{log.latencyMs} ms</span>
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400'
                                : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-400'
                            }`}
                          >
                            {log.responseStatus}
                          </span>
                          <span className="text-slate-500">{log.timestamp}</span>
                        </div>
                      </div>

                      {log.requestBody && (
                        <div className="text-[10px] text-slate-700 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 overflow-x-auto">
                          <span className="text-slate-500 block mb-0.5 font-bold">Payload:</span>
                          <pre>{JSON.stringify(log.requestBody, null, 2)}</pre>
                        </div>
                      )}

                      <div className="text-[10px] text-emerald-800 dark:text-emerald-400 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 overflow-x-auto">
                        <span className="text-slate-500 block mb-0.5 font-bold">Response:</span>
                        <pre>{JSON.stringify(log.responseBody, null, 2)}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button
            onClick={() => downloadSemuaBerkasProdDoc()}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Download Semua Berkas Permohonan PROD BPJS (.doc)"
          >
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>Unduh Berkas PROD (.doc)</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
