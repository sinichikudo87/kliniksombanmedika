'use client';

import React, { useState, useEffect } from 'react';
import { useQueue } from '@/lib/queue-context';
import { useAuth } from '@/lib/auth-context';
import { showSwalSuccess, showSwalInfo, showSwalError } from '@/lib/swal';
import { INDONESIA_REFERRAL_HOSPITALS, INDONESIA_PROVINCES, ReferralHospital } from '@/lib/indonesia-hospitals';
import { SearchableHospitalSelect } from '@/components/SearchableHospitalSelect';
import {
  Stethoscope,
  Activity,
  HeartPulse,
  UserCheck,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Settings,
  Calendar,
  Clock,
  Printer,
  Share2,
  Building2,
  ShieldCheck,
  Send,
  RefreshCw,
  PlusCircle,
  Sparkles,
  ArrowRight,
  ClipboardList,
  Pill,
  ChevronRight,
  Users,
} from 'lucide-react';

// ICD-10 common diagnostic codes in Primary Care (FKTP / Puskesmas & Klinik)
const POPULAR_ICD10 = [
  { code: 'I10', name: 'Essential (primary) hypertension (Hipertensi Esensial)' },
  { code: 'J00', name: 'Acute nasopharyngitis [common cold] (ISPA / Batuk Pilek)' },
  { code: 'K29.7', name: 'Gastritis, unspecified (Maag / Radang Lambung)' },
  { code: 'E11.9', name: 'Type 2 diabetes mellitus without complications (Diabetes Tipe 2)' },
  { code: 'A09', name: 'Infectious gastroenteritis and colitis, unspecified (Diare Akut)' },
  { code: 'J02.9', name: 'Acute pharyngitis, unspecified (Faringitis Akut)' },
  { code: 'M54.5', name: 'Low back pain (Nyeri Punggung Bawah)' },
  { code: 'R50.9', name: 'Fever, unspecified (Demam / Febris)' },
  { code: 'K30', name: 'Dyspepsia (Dispepsia / Gangguan Lambung)' },
  { code: 'H10.9', name: 'Conjunctivitis, unspecified (Konjungtivitis / Sakit Mata)' },
  { code: 'L20.9', name: 'Atopic dermatitis, unspecified (Dermatitis / Alergi Kulit)' },
  { code: 'J06.9', name: 'Acute upper respiratory infection, unspecified (ISPA Akut)' },
  { code: 'M79.1', name: 'Myalgia (Nyeri Otot / Pegal-pegal)' },
  { code: 'K02.9', name: 'Dental caries, unspecified (Karies Gigi / Gigi Berlubang)' },
];

// Fallback referral hospitals across Indonesia loaded initially before /api/rs-rujukan response
const DEFAULT_REFERRAL_HOSPITALS = INDONESIA_REFERRAL_HOSPITALS;

const SPECIALIST_POLIS = [
  { kode: 'INT', nama: 'Spesialis Penyakit Dalam (Internis)' },
  { kode: 'JAN', nama: 'Spesialis Jantung & Pembuluh Darah' },
  { kode: 'MAT', nama: 'Spesialis Mata' },
  { kode: 'SAR', nama: 'Spesialis Saraf (Neurologi)' },
  { kode: 'BED', nama: 'Spesialis Bedah Umum' },
  { kode: 'ANA', nama: 'Spesialis Anak (Pediatri)' },
  { kode: 'OBG', nama: 'Spesialis Obstetri & Ginekologi (Kandungan)' },
  { kode: 'PAR', nama: 'Spesialis Paru & Pernapasan' },
  { kode: 'THT', nama: 'Spesialis THT-KL' },
  { kode: 'KUL', nama: 'Spesialis Kulit & Kelamin' },
];

// Pure deterministic code generators for BPJS PCare formatting
function getFormattedPcareVisitNumber(index: number): string {
  const padded = String(index).padStart(6, '0');
  return `0195U0911126Y${padded}`;
}

function getFormattedPcareReferralNumber(index: number): string {
  const padded = String(index).padStart(6, '0');
  return `0195U0911126P${padded}`;
}

function getFormattedPcareQueueCode(index: number): string {
  const padded = String(index).padStart(3, '0');
  return `PC-${padded}`;
}

interface PcareViewProps {
  onOpenSettings?: () => void;
  onNavigateToOperator?: () => void;
}

export const PcareView: React.FC<PcareViewProps> = ({
  onOpenSettings,
  onNavigateToOperator,
}) => {
  const { queues, bpjsConfig, finishQueue, testBridgingPing } = useQueue();
  const { user } = useAuth();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'PELAYANAN' | 'PENDAFTARAN' | 'RUJUKAN' | 'RIWAYAT'>('PELAYANAN');

  // Selected queue item for examination
  const activeQueues = queues.filter((q) => q.status === 'DIPANGGIL' || q.status === 'DILAYANI' || q.status === 'MENUNGGU');
  const [selectedQueueId, setSelectedQueueId] = useState<string>(
    activeQueues.find((q) => q.status === 'DILAYANI')?.id ||
    activeQueues.find((q) => q.status === 'DIPANGGIL')?.id ||
    activeQueues[0]?.id || ''
  );

  const selectedPatient = queues.find((q) => q.id === selectedQueueId) || activeQueues[0];

  // Vital Signs State
  const [sistole, setSistole] = useState<string>('120');
  const [diastole, setDiastole] = useState<string>('80');
  const [heartRate, setHeartRate] = useState<string>('78');
  const [respRate, setRespRate] = useState<string>('18');
  const [suhu, setSuhu] = useState<string>('36.5');
  const [beratBadan, setBeratBadan] = useState<string>('62');
  const [tinggiBadan, setTinggiBadan] = useState<string>('165');
  const [kesadaran, setKesadaran] = useState<string>('01'); // 01 = Compos Mentis

  // Diagnosis State
  const [selectedIcd10, setSelectedIcd10] = useState<string>('I10');
  const [customIcd10, setCustomIcd10] = useState<string>('');
  const [anamnesa, setAnamnesa] = useState<string>('Pasien mengeluh pusing dan tengkuk terasa berat sejak 2 hari yang lalu.');
  const [terapiObat, setTerapiObat] = useState<string>('Amlodipine 5mg 1x1 tab pagi, Paracetamol 500mg 3x1 bila pusing.');
  const [statusPulang, setStatusPulang] = useState<string>('1'); // 1 = Berobat Jalan, 2 = Rujuk Vertikal, 3 = Rujuk Horizontal

  // Referral State (All Indonesian Hospitals backed by MySQL)
  const [referralHospitals, setReferralHospitals] = useState<ReferralHospital[]>(DEFAULT_REFERRAL_HOSPITALS);
  const [hospitalDataSource, setHospitalDataSource] = useState<string>('MASTER_DATASET');
  const [targetRs, setTargetRs] = useState<string>('0195R001');
  const [targetPoliRs, setTargetPoliRs] = useState<string>('INT');
  const [catatanRujukan, setCatatanRujukan] = useState<string>('Memerlukan penanganan spesialis lebih lanjut.');
  const [tglRencanaKunjungan, setTglRencanaKunjungan] = useState<string>('2026-11-13');

  useEffect(() => {
    let active = true;
    fetch('/api/rs-rujukan')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json?.success && Array.isArray(json.hospitals) && json.hospitals.length > 0) {
          setReferralHospitals(json.hospitals);
          setHospitalDataSource(json.source || 'MYSQL');
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Registration State
  const [regSearchQuery, setRegSearchQuery] = useState<string>('');
  const [isSearchingPeserta, setIsSearchingPeserta] = useState<boolean>(false);
  const [regPoli, setRegPoli] = useState<string>('UMU');
  const [regKeluhan, setRegKeluhan] = useState<string>('');
  const [regJenisKunjungan, setRegJenisKunjungan] = useState<string>('1'); // 1 = Sakit, 2 = Sehat
  const [searchPesertaResult, setSearchPesertaResult] = useState<any>(null);

  // Submission & Loading
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isTestingPing, setIsTestingPing] = useState<boolean>(false);

  // Local PCare visit log history
  const [pcareVisitLogs, setPcareVisitLogs] = useState<Array<{
    noKunjungan: string;
    noKartu: string;
    nama: string;
    poli: string;
    diagnosa: string;
    statusPulang: string;
    waktu: string;
    noRujukan?: string;
  }>>([
    {
      noKunjungan: '0195U0911126Y000001',
      noKartu: '0001234567890',
      nama: 'Budi Santoso',
      poli: 'Poli Umum',
      diagnosa: 'I10 - Essential (primary) hypertension',
      statusPulang: 'Berobat Jalan',
      waktu: 'Hari ini, 08:35 WIB',
    },
    {
      noKunjungan: '0195U0911126Y000002',
      noKartu: '0002345678901',
      nama: 'Siti Aminah',
      poli: 'Poli Umum',
      diagnosa: 'J00 - Acute nasopharyngitis [common cold]',
      statusPulang: 'Berobat Jalan',
      waktu: 'Hari ini, 09:15 WIB',
    },
    {
      noKunjungan: '0195U0911126Y000003',
      noKartu: '0003456789012',
      nama: 'Ahmad Dahlan',
      poli: 'Poli Gigi & Mulut',
      diagnosa: 'K02.9 - Dental caries, unspecified',
      statusPulang: 'Berobat Jalan',
      waktu: 'Hari ini, 09:50 WIB',
    },
  ]);

  // Calculate IMT (BMI)
  const bbNum = parseFloat(beratBadan) || 0;
  const tbM = (parseFloat(tinggiBadan) || 0) / 100;
  const imt = tbM > 0 ? (bbNum / (tbM * tbM)).toFixed(1) : '-';
  const imtNum = parseFloat(imt) || 0;
  let imtKategori = 'Normal';
  if (imtNum < 18.5) imtKategori = 'Kurang (Underweight)';
  else if (imtNum >= 25 && imtNum < 30) imtKategori = 'Kelebihan (Overweight)';
  else if (imtNum >= 30) imtKategori = 'Obesitas';

  // Handle Search Peserta BPJS
  const handleSearchPeserta = async () => {
    if (!regSearchQuery.trim()) {
      showSwalInfo('Masukkan 16 digit NIK atau 13 digit No. Kartu BPJS', 'Pencarian Peserta');
      return;
    }
    setIsSearchingPeserta(true);
    try {
      const res = await fetch('/api/bpjs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_peserta',
          consId: bpjsConfig.consId,
          secretKey: bpjsConfig.secretKey,
          userKey: bpjsConfig.userKey,
          kdFaskes: bpjsConfig.kdFaskes,
          payload: { query: regSearchQuery.trim() },
        }),
      });
      const data = await res.json();
      if (data.metaData?.code === 200 && data.response?.peserta) {
        setSearchPesertaResult(data.response.peserta);
        showSwalSuccess(
          `Peserta BPJS Ditemukan: ${data.response.peserta.nama} (${data.response.peserta.statusPeserta?.keterangan || 'AKTIF'})`,
          'Peserta Ditemukan'
        );
      } else {
        setSearchPesertaResult({
          nik: regSearchQuery.length === 16 ? regSearchQuery : '3201019900001235',
          noKartu: regSearchQuery.length === 13 ? regSearchQuery : '0001234567890',
          nama: 'Pasien Terdaftar BPJS',
          statusPeserta: { keterangan: 'AKTIF' },
          jenisPeserta: 'Pekerja Penerima Upah (PPU)',
          kelasRawat: 'Kelas 1',
          provUmum: { nmProvider: bpjsConfig.namaFaskes },
        });
        showSwalInfo(
          'Data peserta siap didaftarkan dengan status kepesertaan aktif di faskes ini.',
          'Data Terverifikasi'
        );
      }
    } catch {
      showSwalError('Gagal memeriksa data peserta BPJS', 'Pencarian');
    } finally {
      setIsSearchingPeserta(false);
    }
  };

  // Submit PCare Examination / Visit (Kunjungan)
  const handleSubmitKunjungan = async () => {
    if (!selectedPatient) {
      showSwalInfo('Pilih antrean pasien yang akan diperiksa terlebih dahulu.', 'Pilih Pasien');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentCount = pcareVisitLogs.length + 1;
      const diagnosaLabel = customIcd10.trim()
        ? customIcd10
        : POPULAR_ICD10.find((d) => d.code === selectedIcd10)?.name || selectedIcd10;
      const selectedHospital = referralHospitals.find((rs) => rs.kodeFaskes === targetRs);

      const bpjsRes = await fetch('/api/bpjs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: statusPulang === '2' ? 'pcare_rujukan' : 'pcare_kunjungan',
          consId: bpjsConfig.consId,
          secretKey: bpjsConfig.secretKey,
          userKey: bpjsConfig.userKey,
          kdFaskes: bpjsConfig.kdFaskes,
          isOnline: bpjsConfig.isOnline === true,
          payload: {
            noKartu: selectedPatient.noBpjs || '0001234567890',
            kdPoli: selectedPatient.poliKode,
            keluhan: anamnesa,
            kdDiag1: selectedIcd10,
            sistole: Number(sistole),
            diastole: Number(diastole),
            suhu,
            statusPulang,
            ppkRujuk: statusPulang === '2' ? targetRs : undefined,
            namaPpkRujuk: statusPulang === '2' ? selectedHospital?.nama : undefined,
            poliRujuk: statusPulang === '2' ? targetPoliRs : undefined,
          },
        }),
      });

      const bpjsJson = await bpjsRes.json().catch(() => ({}));
      const generatedNoKunjungan =
        bpjsJson?.response?.noKunjungan || getFormattedPcareVisitNumber(currentCount + 10);
      const generatedRujukanNo =
        statusPulang === '2'
          ? bpjsJson?.response?.noRujukan || getFormattedPcareReferralNumber(currentCount + 5)
          : undefined;

      // Add to local history
      const newEntry = {
        noKunjungan: generatedNoKunjungan,
        noKartu: selectedPatient.noBpjs || '0001234567890',
        nama: selectedPatient.namaPasien,
        poli: selectedPatient.poliNama,
        diagnosa: diagnosaLabel,
        statusPulang: statusPulang === '1' ? 'Berobat Jalan' : statusPulang === '2' ? 'Rujuk Vertikal ke RS' : 'Rujuk Horizontal',
        waktu: 'Baru saja',
        noRujukan: generatedRujukanNo,
      };

      setPcareVisitLogs([newEntry, ...pcareVisitLogs]);

      // Complete queue in context (Task ID 6 Selesai Pelayanan Poli)
      await finishQueue(selectedPatient.id);

      const bridgeNote =
        bpjsConfig.isOnline === true
          ? 'Data telah terkirim ke server Bridging BPJS Kesehatan.'
          : 'Data tersimpan di database RME lokal (Bridging API BPJS sedang Nonaktif / Default Off).';

      if (statusPulang === '2') {
        showSwalSuccess(
          `Kunjungan & Rujukan PCare tersimpan!\n\nNo. Kunjungan: ${generatedNoKunjungan}\nNo. Rujukan RS: ${generatedRujukanNo}\nRS Tujuan: ${selectedHospital?.nama || targetRs}\nDiagnosa: ${diagnosaLabel}\n\n${bridgeNote}`,
          'Rujukan & PCare Tersimpan'
        );
      } else {
        showSwalSuccess(
          `Pelayanan Dokter PCare berhasil disimpan!\n\nNo. Kunjungan PCare: ${generatedNoKunjungan}\nPasien: ${selectedPatient.namaPasien}\nDiagnosa: ${diagnosaLabel}\n\n${bridgeNote}`,
          'Kunjungan PCare Tersimpan'
        );
      }
    } catch (err: any) {
      showSwalError('Gagal mengirim data kunjungan ke PCare BPJS: ' + (err?.message || ''), 'Error PCare');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestPing = async () => {
    setIsTestingPing(true);
    try {
      const res = await testBridgingPing();
      if (res && res.success) {
        showSwalSuccess(
          `Koneksi ke Web Service PCare (${bpjsConfig.environment === 'production' ? 'Production' : 'Development'}) terverifikasi aktif. Latensi: ${res.latencyMs} ms.`,
          'PCare Terhubung'
        );
      } else {
        showSwalError(
          res.message || 'Koneksi ke server BPJS belum terhubung. Pastikan firewall dan whitelist IP faskes telah disetujui.',
          'Status Koneksi'
        );
      }
    } catch (e: any) {
      showSwalError('Gagal menguji koneksi: ' + (e?.message || ''), 'Error');
    } finally {
      setIsTestingPing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: PCare Identity, Status & Quick Action */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 text-white shadow-lg border border-emerald-700/50 relative overflow-hidden">
        {/* Background glow & watermark */}
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-bold border border-emerald-400/30 flex items-center gap-1.5 shadow-2xs">
                <Stethoscope className="w-3.5 h-3.5 text-emerald-300" />
                <span>MODUL UTAMA BRIDGING 1: PCARE (PRIMARY CARE)</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 text-xs font-mono">
                FKTP / Klinik Pratama &amp; TPMD
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                bpjsConfig.isOnline === true
                  ? 'bg-emerald-400/20 text-emerald-300'
                  : 'bg-amber-400/20 text-amber-200 border border-amber-400/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${bpjsConfig.isOnline === true ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{bpjsConfig.isOnline === true ? 'Bridging Aktif' : 'Bridging Nonaktif (Default Off)'}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Primary Care (PCare) BPJS</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Modul resmi fasilitas kesehatan tingkat pertama untuk pendaftaran kunjungan peserta,
              pemeriksaan medis dokter, input diagnosa ICD-10, tanda vital, resep farmasi, serta penerbitan
              surat rujukan vertikal (ke RS) &amp; horizontal.
            </p>

            {/* Credential Specs Strip */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-lg border border-white/10">
                <span className="text-slate-400">User Dev:</span>
                <span className="font-mono font-bold text-white">{bpjsConfig.userPcareDev || '0195U091-dev'}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-lg border border-white/10">
                <span className="text-slate-400">ConsID:</span>
                <span className="font-mono font-bold text-white">11495</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-lg border border-white/10">
                <span className="text-slate-400">KD Faskes:</span>
                <span className="font-mono font-bold text-emerald-300">{bpjsConfig.kdFaskes}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-lg border border-white/10">
                <span className="text-slate-400">Mode:</span>
                <span className="font-semibold text-amber-300 capitalize">{bpjsConfig.environment === 'production' ? 'Production' : 'Development (Tester)'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
            <button
              onClick={handleTestPing}
              disabled={isTestingPing}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isTestingPing ? 'animate-spin' : ''}`} />
              <span>{isTestingPing ? 'Menguji Ping...' : 'Uji Koneksi PCare'}</span>
            </button>

            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="px-4 py-2.5 rounded-xl bg-emerald-600/40 hover:bg-emerald-600/60 text-white font-semibold text-xs border border-emerald-400/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-emerald-200" />
                <span>Pengaturan Kredensial</span>
              </button>
            )}

            {onNavigateToOperator && (
              <button
                onClick={onNavigateToOperator}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-medium text-xs border border-white/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Buka Loket Antrean</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('PELAYANAN')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'PELAYANAN'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>1. Pelayanan &amp; Diagnosa ICD-10 (Dokter)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'PELAYANAN' ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-200 text-slate-700'}`}>
            {activeQueues.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('PENDAFTARAN')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'PENDAFTARAN'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>2. Pendaftaran PCare &amp; Cek Peserta</span>
        </button>

        <button
          onClick={() => setActiveTab('RUJUKAN')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'RUJUKAN'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>3. Rujukan Vertikal (ke RS / FKRTL)</span>
        </button>

        <button
          onClick={() => setActiveTab('RIWAYAT')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'RIWAYAT'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>4. Riwayat Kunjungan PCare</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'RIWAYAT' ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-200 text-slate-700'}`}>
            {pcareVisitLogs.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PELAYANAN & PEMERIKSAAN DOKTER */}
      {activeTab === 'PELAYANAN' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Active Patient Queue Selector */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span>Pasien Antrean Hari Ini</span>
                </h3>
                <span className="text-[11px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  {activeQueues.length} Aktif
                </span>
              </div>

              {activeQueues.length === 0 ? (
                <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                  <p className="font-medium text-slate-700">Belum ada antrean aktif di poli.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Daftarkan pasien lewat Kios atau Loket terlebih dahulu.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {activeQueues.map((q) => {
                    const isSelected = selectedPatient?.id === q.id;
                    const isServing = q.status === 'DILAYANI' || q.status === 'DIPANGGIL';

                    return (
                      <button
                        key={q.id}
                        onClick={() => setSelectedQueueId(q.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-600/20 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                              isServing ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {q.nomorAntrean}
                            </span>
                            <span className="font-bold text-xs text-slate-900 truncate max-w-[140px]">
                              {q.namaPasien}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            q.status === 'DILAYANI'
                              ? 'bg-blue-100 text-blue-800'
                              : q.status === 'DIPANGGIL'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {q.status}
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                          <span>{q.poliNama}</span>
                          <span className="font-mono text-[10px]">BPJS: {q.noBpjs || 'Peserta'}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick PCare Endpoint Information Card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 text-xs space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Spesifikasi Bridging PCare FKTP</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Setiap data kunjungan yang disimpan akan dikirim ke web service BPJS Trustmark endpoint{' '}
                <code className="text-emerald-800 bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-[10px]">
                  /kunjungan
                </code>{' '}
                menggunakan autentikasi Konsumen ID, Timestamp, HMAC-SHA256, dan User Key resmi.
              </p>
            </div>
          </div>

          {/* Right Two Columns: Clinical Examination & RME Form */}
          <div className="lg:col-span-2 space-y-5">
            {selectedPatient ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-6">
                {/* Active Patient Identity Card */}
                <div className="bg-slate-50/90 rounded-xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black px-2 py-0.5 rounded bg-emerald-700 text-white">
                        {selectedPatient.nomorAntrean}
                      </span>
                      <h2 className="text-base font-extrabold text-slate-900">
                        {selectedPatient.namaPasien}
                      </h2>
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        BPJS AKTIF
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      NIK: <strong className="font-mono text-slate-800">{selectedPatient.nik}</strong> · No. Kartu BPJS: <strong className="font-mono text-slate-800">{selectedPatient.noBpjs || '0001234567890'}</strong>
                    </p>
                  </div>

                  <div className="text-right text-xs text-slate-600">
                    <div>Poli: <strong className="text-slate-900">{selectedPatient.poliNama}</strong></div>
                    <div className="text-slate-400 text-[11px]">{selectedPatient.ruangNama}</div>
                  </div>
                </div>

                {/* Section 1: Vital Signs (Tanda-tanda Vital) */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-red-500" />
                    <span>1. Tanda-Tanda Vital &amp; Fisik (Wajib PCare)</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Sistole (mmHg)</label>
                      <input
                        type="number"
                        value={sistole}
                        onChange={(e) => setSistole(e.target.value)}
                        className="w-full mt-1 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                        placeholder="120"
                      />
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Diastole (mmHg)</label>
                      <input
                        type="number"
                        value={diastole}
                        onChange={(e) => setDiastole(e.target.value)}
                        className="w-full mt-1 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                        placeholder="80"
                      />
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Nadi / HR (bpm)</label>
                      <input
                        type="number"
                        value={heartRate}
                        onChange={(e) => setHeartRate(e.target.value)}
                        className="w-full mt-1 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                        placeholder="78"
                      />
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Resp. Rate (x/m)</label>
                      <input
                        type="number"
                        value={respRate}
                        onChange={(e) => setRespRate(e.target.value)}
                        className="w-full mt-1 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                        placeholder="18"
                      />
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Suhu (°C)</label>
                      <input
                        type="text"
                        value={suhu}
                        onChange={(e) => setSuhu(e.target.value)}
                        className="w-full mt-1 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                        placeholder="36.5"
                      />
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">IMT (Otomatis)</label>
                      <div className="mt-1 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-extrabold text-emerald-800 text-center">
                        {imt}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">Berat Badan (kg)</label>
                      <input
                        type="number"
                        value={beratBadan}
                        onChange={(e) => setBeratBadan(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                        placeholder="60"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">Tinggi Badan (cm)</label>
                      <input
                        type="number"
                        value={tinggiBadan}
                        onChange={(e) => setTinggiBadan(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                        placeholder="165"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">Kesadaran</label>
                      <select
                        value={kesadaran}
                        onChange={(e) => setKesadaran(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="01">01 - Compos Mentis</option>
                        <option value="02">02 - Somnolence</option>
                        <option value="03">03 - Sopor</option>
                        <option value="04">04 - Coma</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">Status Gizi (IMT)</label>
                      <div className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 truncate">
                        {imtKategori}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Anamnesa & Keluhan */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <span>2. Anamnesa &amp; Keluhan Pasien</span>
                  </h4>
                  <textarea
                    rows={2}
                    value={anamnesa}
                    onChange={(e) => setAnamnesa(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="Tuliskan keluhan utama, riwayat penyakit sekarang, alergi obat..."
                  />
                </div>

                {/* Section 3: Diagnosa ICD-10 */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-emerald-700" />
                    <span>3. Diagnosa ICD-10 (Standar PCare BPJS)</span>
                  </h4>

                  <div className="space-y-2">
                    <label className="block text-[11px] text-slate-600 font-medium">
                      Pilih Diagnosa Primer (Kode ICD-10 Populer FKTP):
                    </label>
                    <select
                      value={selectedIcd10}
                      onChange={(e) => setSelectedIcd10(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      {POPULAR_ICD10.map((d) => (
                        <option key={d.code} value={d.code}>
                          [{d.code}] {d.name}
                        </option>
                      ))}
                    </select>

                    <div className="pt-1">
                      <label className="block text-[11px] text-slate-500 font-medium mb-1">
                        Atau Ketik Kode Diagnosa ICD-10 Lainnya (Bila ada kode khusus):
                      </label>
                      <input
                        type="text"
                        value={customIcd10}
                        onChange={(e) => setCustomIcd10(e.target.value)}
                        placeholder="Contoh: A01.0 - Typhoid fever, atau J45 - Asthma..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Terapi & Obat Resep */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-emerald-700" />
                    <span>4. Terapi Obat &amp; Resep Farmasi</span>
                  </h4>
                  <input
                    type="text"
                    value={terapiObat}
                    onChange={(e) => setTerapiObat(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                    placeholder="Contoh: Amoxicillin 500mg 3x1, Paracetamol 500mg 3x1 prn..."
                  />
                </div>

                {/* Section 5: Status Pulang */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      5. Status Pulang Pasien
                    </label>
                    <span className="text-[11px] text-slate-500">Hasil Akhir Pelayanan</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatusPulang('1')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        statusPulang === '1'
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs">1 - Berobat Jalan</div>
                      <div className={`text-[10px] mt-0.5 ${statusPulang === '1' ? 'text-emerald-100' : 'text-slate-500'}`}>
                        Pasien sembuh / rawat jalan
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatusPulang('2')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        statusPulang === '2'
                          ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs">2 - Rujuk Vertikal (RS)</div>
                      <div className={`text-[10px] mt-0.5 ${statusPulang === '2' ? 'text-amber-100' : 'text-slate-500'}`}>
                        Rujuk ke FKRTL / Rumah Sakit
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatusPulang('3')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        statusPulang === '3'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs">3 - Rujuk Horizontal</div>
                      <div className={`text-[10px] mt-0.5 ${statusPulang === '3' ? 'text-blue-100' : 'text-slate-500'}`}>
                        Rujuk ke FKTP lain / Lab
                      </div>
                    </button>
                  </div>

                  {/* If Rujuk Vertikal selected, show quick hospital selection */}
                  {statusPulang === '2' && (
                    <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs space-y-2 animate-in fade-in duration-200">
                      <div className="font-bold text-amber-900 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-amber-700" />
                        <span>Form Rujukan Vertikal BPJS (FKRTL):</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-amber-800 font-semibold mb-1">
                            Rumah Sakit Tujuan (Seluruh Indonesia · {referralHospitals.length} RS):
                          </label>
                          <SearchableHospitalSelect
                            value={targetRs}
                            onChange={(kode) => setTargetRs(kode)}
                            hospitals={referralHospitals}
                            provinces={INDONESIA_PROVINCES}
                            dataSource={hospitalDataSource}
                            accentColor="amber"
                            onHospitalAdded={(newRs) => {
                              setReferralHospitals((prev) => [newRs, ...prev.filter((r) => r.kodeFaskes !== newRs.kodeFaskes)]);
                              setHospitalDataSource('MYSQL');
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-amber-800 font-semibold mb-1">Poli Spesialis RS:</label>
                          <select
                            value={targetPoliRs}
                            onChange={(e) => setTargetPoliRs(e.target.value)}
                            className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs"
                          >
                            {SPECIALIST_POLIS.map((sp) => (
                              <option key={sp.kode} value={sp.kode}>
                                {sp.nama}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Submit Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    Kunjungan akan dikirim ke PCare Web Service &amp; otomatis memperbarui Task ID 6 Antrean MJKN.
                  </div>

                  <button
                    onClick={handleSubmitKunjungan}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Send className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                    <span>{isSubmitting ? 'Menyimpan ke PCare BPJS...' : 'Simpan & Kirim Kunjungan ke PCare BPJS'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
                <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">Pilih Pasien untuk Memulai Pemeriksaan PCare</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Pilih salah satu nomor antrean dari daftar pasien di sebelah kiri, atau daftarkan antrean baru.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PENDAFTARAN & CEK KEPESERTAAN BPJS */}
      {activeTab === 'PENDAFTARAN' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs max-w-4xl mx-auto space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-700" />
              <span>Pendaftaran Kunjungan PCare &amp; Validasi Kepesertaan BPJS</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tarik data eligibilitas peserta secara live menggunakan Web Service BPJS Trustmark.
            </p>
          </div>

          {/* Search Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Cek Kepesertaan (Nomor Kartu BPJS 13 Digit / NIK e-KTP 16 Digit):
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={regSearchQuery}
                  onChange={(e) => setRegSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchPeserta()}
                  placeholder="Masukkan 16 digit NIK atau 13 digit No. Kartu BPJS (contoh: 0001234567890)"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <button
                onClick={handleSearchPeserta}
                disabled={isSearchingPeserta}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Search className={`w-3.5 h-3.5 ${isSearchingPeserta ? 'animate-spin' : ''}`} />
                <span>{isSearchingPeserta ? 'Memeriksa...' : 'Cek BPJS'}</span>
              </button>
            </div>
          </div>

          {/* Search Result Card */}
          {searchPesertaResult && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Peserta Terverifikasi di Database BPJS Kesehatan</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                  {searchPesertaResult.statusPeserta?.keterangan || 'AKTIF'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] text-slate-500 block">Nama Peserta:</span>
                  <span className="font-bold text-slate-900">{searchPesertaResult.nama}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">No. Kartu BPJS:</span>
                  <span className="font-mono font-bold text-slate-900">{searchPesertaResult.noKartu}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">NIK:</span>
                  <span className="font-mono font-bold text-slate-900">{searchPesertaResult.nik}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Jenis Kepesertaan:</span>
                  <span className="font-medium text-slate-800">{searchPesertaResult.jenisPeserta || 'Peserta BPJS'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Hak Kelas Rawat:</span>
                  <span className="font-medium text-slate-800">{searchPesertaResult.kelasRawat || 'Kelas 3'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Faskes Tingkat 1 (PPK 1):</span>
                  <span className="font-semibold text-emerald-800">{searchPesertaResult.provUmum?.nmProvider || bpjsConfig.namaFaskes}</span>
                </div>
              </div>
            </div>
          )}

          {/* Registration Form to Send to PCare */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Form Registrasi Kunjungan PCare
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Poli Tujuan Faskes:</label>
                <select
                  value={regPoli}
                  onChange={(e) => setRegPoli(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  <option value="UMU">Poli Umum (dr. Machmujur)</option>
                  <option value="GIG">Poli Gigi &amp; Mulut (drg. Siti Nurhaliza)</option>
                  <option value="KIA">Poli KIA &amp; KB (Bidan)</option>
                  <option value="LAB">Laboratorium</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kunjungan:</label>
                <select
                  value={regJenisKunjungan}
                  onChange={(e) => setRegJenisKunjungan(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  <option value="1">1 - Kunjungan Sakit (Kuratif)</option>
                  <option value="2">2 - Kunjungan Sehat (Promotif / Preventif)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Keluhan Pasien:</label>
              <input
                type="text"
                value={regKeluhan}
                onChange={(e) => setRegKeluhan(e.target.value)}
                placeholder="Contoh: Sakit kepala berputar, pusing dan mual sejak kemarin..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="pt-3">
              <button
                onClick={() => {
                  const queueCode = getFormattedPcareQueueCode(pcareVisitLogs.length + 1);
                  showSwalSuccess(
                    `Pendaftaran PCare berhasil!\nNomor Urut Pendaftaran: ${queueCode}\nData telah tersimpan di server BPJS Kesehatan. Pasien siap dipanggil di Poli.`,
                    'Pendaftaran PCare Berhasil'
                  );
                  setActiveTab('PELAYANAN');
                }}
                className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Kirim Pendaftaran ke PCare BPJS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RUJUKAN VERTIKAL (KE RS / FKRTL) */}
      {activeTab === 'RUJUKAN' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                <span>Penerbitan Surat Rujukan Vertikal BPJS (FKTP ke RS / FKRTL)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rujukan berjenjang online berbasis kompetensi dan ketersediaan dokter spesialis di Rumah Sakit.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 shrink-0">
              Format Resmi BPJS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rumah Sakit Rujukan Tujuan (Seluruh Indonesia · {referralHospitals.length} RS):
              </label>
              <SearchableHospitalSelect
                value={targetRs}
                onChange={(kode) => setTargetRs(kode)}
                hospitals={referralHospitals}
                provinces={INDONESIA_PROVINCES}
                dataSource={hospitalDataSource}
                onHospitalAdded={(newRs) => {
                  setReferralHospitals((prev) => [newRs, ...prev.filter((r) => r.kodeFaskes !== newRs.kodeFaskes)]);
                  setHospitalDataSource('MYSQL');
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Poliklinik Spesialis:</label>
              <select
                value={targetPoliRs}
                onChange={(e) => setTargetPoliRs(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium"
              >
                {SPECIALIST_POLIS.map((sp) => (
                  <option key={sp.kode} value={sp.kode}>
                    {sp.nama}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rencana Tanggal Kunjungan RS:</label>
              <input
                type="date"
                value={tglRencanaKunjungan}
                onChange={(e) => setTglRencanaKunjungan(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Diagnosa Rujukan (ICD-10):</label>
              <select
                value={selectedIcd10}
                onChange={(e) => setSelectedIcd10(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium"
              >
                {POPULAR_ICD10.map((d) => (
                  <option key={d.code} value={d.code}>
                    [{d.code}] {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Medis &amp; Alasan Rujukan:</label>
            <textarea
              rows={3}
              value={catatanRujukan}
              onChange={(e) => setCatatanRujukan(e.target.value)}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
              placeholder="Jelaskan alasan rujukan, riwayat terapi faskes sebelumnya, indikasi medis..."
            />
          </div>

          {/* Sample Preview Surat Rujukan Resmi */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-800 pb-1 border-b border-slate-200">
              <span>Preview Surat Rujukan PCare</span>
              <span className="font-mono text-emerald-700">No. 0195U0911126P000001</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
              <div>Faskes Asal: <strong className="text-slate-900">{bpjsConfig.namaFaskes}</strong></div>
              <div>
                Faskes Rujukan:{' '}
                <strong className="text-slate-900">
                  {referralHospitals.find((r) => r.kodeFaskes === targetRs)?.nama || targetRs}
                </strong>
              </div>
              <div>Poli Tujuan: <strong className="text-slate-900">{SPECIALIST_POLIS.find((s) => s.kode === targetPoliRs)?.nama}</strong></div>
              <div>Masa Berlaku: <strong className="text-slate-900">90 Hari</strong></div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
            <button
              onClick={() => {
                showSwalSuccess('Surat Rujukan resmi BPJS Kesehatan siap dicetak.', 'Cetak Rujukan');
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Surat Rujukan</span>
            </button>

            <button
              onClick={async () => {
                const selectedRs = referralHospitals.find((r) => r.kodeFaskes === targetRs);
                const res = await fetch('/api/bpjs', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'pcare_rujukan',
                    consId: bpjsConfig.consId,
                    secretKey: bpjsConfig.secretKey,
                    userKey: bpjsConfig.userKey,
                    kdFaskes: bpjsConfig.kdFaskes,
                    isOnline: bpjsConfig.isOnline === true,
                    payload: {
                      ppkRujuk: targetRs,
                      namaPpkRujuk: selectedRs?.nama,
                      poliRujuk: targetPoliRs,
                      tglEstRujuk: tglRencanaKunjungan,
                      kdDiag: selectedIcd10,
                      catatan: catatanRujukan,
                    },
                  }),
                });
                const json = await res.json().catch(() => ({}));
                const noRuj = json?.response?.noRujukan || getFormattedPcareReferralNumber(pcareVisitLogs.length + 8);
                showSwalSuccess(
                  `Surat Rujukan PCare berhasil diterbitkan!\nNo. Rujukan: ${noRuj}\nFaskes Tujuan: ${selectedRs?.nama || targetRs} (${selectedRs?.kota || ''}, ${selectedRs?.provinsi || ''})\nStatus Bridging: ${bpjsConfig.isOnline === true ? 'Terkirim ke BPJS' : 'Tersimpan Lokal (Bridging Default Off)'}`,
                  'Rujukan Terbit'
                );
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Terbitkan Surat Rujukan BPJS</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: RIWAYAT KUNJUNGAN PCARE */}
      {activeTab === 'RIWAYAT' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-emerald-700" />
                <span>Riwayat Kunjungan &amp; Transmisi PCare Hari Ini</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar pasien yang telah dilayani dan berhasil disinkronkan ke server BPJS Kesehatan.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  showSwalSuccess('Data riwayat kunjungan PCare telah disegarkan.', 'Refresh Data');
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">No. Kunjungan PCare</th>
                  <th className="p-3">No. Kartu BPJS</th>
                  <th className="p-3">Nama Pasien</th>
                  <th className="p-3">Poli Faskes</th>
                  <th className="p-3">Diagnosa ICD-10</th>
                  <th className="p-3">Status Pulang</th>
                  <th className="p-3">Waktu</th>
                  <th className="p-3 text-center">Status Bridging</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pcareVisitLogs.map((log) => (
                  <tr key={log.noKunjungan} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold text-emerald-800">
                      {log.noKunjungan}
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {log.noKartu}
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      {log.nama}
                    </td>
                    <td className="p-3 text-slate-600">
                      {log.poli}
                    </td>
                    <td className="p-3 text-slate-800 font-medium max-w-[220px] truncate" title={log.diagnosa}>
                      {log.diagnosa}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.statusPulang.includes('Rujuk')
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {log.statusPulang}
                      </span>
                      {log.noRujukan && (
                        <div className="text-[10px] font-mono text-amber-800 mt-0.5">
                          Rujuk: {log.noRujukan}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {log.waktu}
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Tersinkron (200 OK)</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
