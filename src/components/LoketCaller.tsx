import React, { useState } from 'react';
import {
  Volume2,
  PhoneCall,
  RotateCcw,
  CheckCircle,
  SkipForward,
  Play,
  Clock,
  ShieldCheck,
  Stethoscope,
  AlertCircle,
  UserCheck,
  CreditCard,
  Plus,
  Search,
  Sparkles,
  CheckCircle2,
  Printer,
  X,
  Phone,
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import { AnimatedHumanNurse } from './AnimatedHumanNurse';
import {
  showSuccessAlert,
  showErrorAlert,
  showToast,
  showConfirmDialog,
} from '../utils/swal';

export const LoketCaller: React.FC = () => {
  const {
    tickets,
    lokets,
    activeLoketId,
    setActiveLoketId,
    currentCalledTicket,
    panggilAntrean,
    panggilUlang,
    panggilBerikutnya,
    mulaiLayanan,
    selesaiLayanan,
    lewatiAntrean,
    ttsState,
    testSpeakerSound,
    ambilTiketBaru,
    cekPesertaBPJS,
  } = useQueue();
  const { currentUser, openAuthModal } = useAuth();

  const [filterKategori, setFilterKategori] = useState<string>('ALL');

  // BPJS Form Modal State for Loket Counter
  const [isBpjsModalOpen, setIsBpjsModalOpen] = useState<boolean>(false);
  const [bpjsCardInput, setBpjsCardInput] = useState<string>('0001827463910');
  const [bpjsNikInput, setBpjsNikInput] = useState<string>('3515085404880002');
  const [bpjsNamaInput, setBpjsNamaInput] = useState<string>('Siti Rahmawati');
  const [bpjsPoliInput, setBpjsPoliInput] = useState<string>('Poli Umum');
  const [bpjsKodePoliInput, setBpjsKodePoliInput] = useState<string>('UMU');
  const [bpjsDokterInput, setBpjsDokterInput] = useState<string>('dr. Machmujur');
  const [bpjsPhoneInput, setBpjsPhoneInput] = useState<string>('081234567890');
  const [bpjsKeluhanInput, setBpjsKeluhanInput] = useState<string>('Pemeriksaan kesehatan rutin');
  const [isCheckingBpjs, setIsCheckingBpjs] = useState<boolean>(false);
  const [bpjsVerifyResult, setBpjsVerifyResult] = useState<any | null>(null);
  const [bpjsVerifyError, setBpjsVerifyError] = useState<string | null>(null);
  const [bpjsSuccessTicket, setBpjsSuccessTicket] = useState<any | null>(null);

  const demoLoketPresets = [
    {
      nama: 'Siti Rahmawati',
      noKartu: '0001827463910',
      nik: '3515085404880002',
      kelas: 'Kelas 1 (Mandiri)',
      faskes: 'TPMD DR MACHMUJUR',
      noHp: '081234567890',
      poli: 'Poli Umum',
      kodePoli: 'UMU',
      dokter: 'dr. Machmujur',
      keluhan: 'Pusing dan tensi tinggi',
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
      keluhan: 'Kontrol rutin gula darah & tensi',
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
      keluhan: 'Imunisasi balita',
    },
  ];

  const handleApplyLoketPreset = (preset: (typeof demoLoketPresets)[0]) => {
    setBpjsCardInput(preset.noKartu);
    setBpjsNikInput(preset.nik);
    setBpjsNamaInput(preset.nama);
    setBpjsPhoneInput(preset.noHp);
    setBpjsPoliInput(preset.poli);
    setBpjsKodePoliInput(preset.kodePoli);
    setBpjsDokterInput(preset.dokter);
    setBpjsKeluhanInput(preset.keluhan);
    setBpjsVerifyResult({
      noKartu: preset.noKartu,
      nik: preset.nik,
      nama: preset.nama,
      statusPeserta: { keterangan: 'AKTIF (Terverifikasi BPJS Kesehatan)' },
      hakKelas: { keterangan: preset.kelas },
      provUmum: { nmProvider: preset.faskes },
    });
    setBpjsVerifyError(null);
  };

  const handleVerifyBpjsLoket = async () => {
    if (!bpjsCardInput.trim()) return;
    setIsCheckingBpjs(true);
    setBpjsVerifyError(null);
    try {
      const isNik = bpjsCardInput.trim().length === 16;
      const res = await cekPesertaBPJS(bpjsCardInput.trim(), isNik);
      if (res.status === 200 && res.data?.response?.peserta) {
        const p = res.data.response.peserta;
        setBpjsVerifyResult(p);
        if (p.nama) setBpjsNamaInput(p.nama);
        if (p.nik) setBpjsNikInput(p.nik);
      } else {
        setBpjsVerifyError(res.data?.metaData?.message || 'Nomor BPJS/NIK tidak ditemukan');
      }
    } catch (err: any) {
      setBpjsVerifyError(err?.message || 'Gagal memverifikasi BPJS');
    } finally {
      setIsCheckingBpjs(false);
    }
  };

  const handleRegisterBpjsAtLoket = async () => {
    try {
      const ticket = await ambilTiketBaru({
        kategori: 'BPJS',
        poliTujuan: bpjsPoliInput,
        kodePoli: bpjsKodePoliInput,
        dokterNama: bpjsDokterInput,
        namaPasien: bpjsNamaInput.trim() || 'Pasien BPJS Loket',
        noKartuBPJS: bpjsCardInput.trim() || '0001827463910',
        nik: bpjsNikInput.trim() || '3515085404880002',
      });
      setBpjsSuccessTicket(ticket);
      showSuccessAlert(
        'Pendaftaran Antrean Berhasil',
        `Nomor antrean ${ticket.nomorAntrean} untuk pasien ${ticket.namaPasien || '-'} berhasil diterbitkan.`
      );
    } catch (err: any) {
      showErrorAlert('Gagal Mendaftarkan Antrean', err?.message || 'Terjadi kendala saat mendaftarkan antrean.');
    }
  };

  const activeLoket = lokets.find((l) => l.id === activeLoketId) || lokets[0];

  // Waiting tickets filtered for this booth
  const waitingTickets = tickets.filter((t) => {
    if (t.status !== 'MENUNGGU') return false;
    if (filterKategori !== 'ALL' && t.huruf !== filterKategori) return false;
    return activeLoket.kategoriHuruf.includes(t.huruf);
  });

  const activeTicketForThisLoket =
    (currentCalledTicket && currentCalledTicket.loketDipanggil?.includes(activeLoket.nama.split('-')[0].trim()))
      ? currentCalledTicket
      : tickets.find(
          (t) =>
            t.loketDipanggil?.includes(activeLoket.nama.split('-')[0].trim()) &&
            (t.status === 'DIPANGGIL' || t.status === 'SEDANG_DILAYANI')
        );

  const handleStartService = () => {
    if (!activeTicketForThisLoket) return;
    mulaiLayanan(activeTicketForThisLoket.id);
    showToast(`Mulai melayani antrean ${activeTicketForThisLoket.nomorAntrean}`, 'info');
  };

  const handleFinishService = async () => {
    if (!activeTicketForThisLoket) return;
    await selesaiLayanan(activeTicketForThisLoket.id);
    showToast(`Pelayanan antrean ${activeTicketForThisLoket.nomorAntrean} selesai & sinkron Task ID`, 'success');
  };

  const handleSkipPatient = async () => {
    if (!activeTicketForThisLoket) return;
    const confirmed = await showConfirmDialog({
      title: `Lewati Antrean ${activeTicketForThisLoket.nomorAntrean}?`,
      text: 'Pasien akan ditandai terlewat (tidak hadir) dan loket siap memanggil nomor berikutnya.',
      confirmButtonText: 'Ya, Lewati Antrean',
      cancelButtonText: 'Batal',
    });
    if (confirmed) {
      lewatiAntrean(activeTicketForThisLoket.id);
      showToast(`Antrean ${activeTicketForThisLoket.nomorAntrean} berhasil dilewati`, 'info');
    }
  };

  const nextWaitingTicket = waitingTickets[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 w-full max-w-full overflow-x-hidden">
      {/* 1. Loket & Counter Selector Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Konsol Pemanggil Loket &amp; Poliklinik
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih loket pelayanan Anda untuk memanggil antrean dengan suara speaker otomatis dan sinkronisasi BPJS
            </p>
          </div>

          {/* Loket Selector Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-full pb-1 sm:pb-1">
            {lokets.map((loket) => {
              const isActive = activeLoketId === loket.id;
              return (
                <button
                  key={loket.id}
                  onClick={() => setActiveLoketId(loket.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs border border-slate-300 dark:border-emerald-500'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {loket.nama.split('-')[0].trim()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Info of Currently Selected Loket */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Loket Aktif:</span>
            <span className="font-bold text-slate-900 dark:text-white">{activeLoket.nama}</span>
            {activeLoket.ruang && (
              <span className="text-emerald-700 dark:text-emerald-400">({activeLoket.ruang})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Petugas / DPJP:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {currentUser ? currentUser.fullName : activeLoket.petugas}
            </span>
            {currentUser && (
              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded font-mono font-bold">
                Online
              </span>
            )}
            {!currentUser && (
              <button
                onClick={() => openAuthModal('login')}
                className="text-[11px] text-emerald-600 hover:underline font-semibold cursor-pointer ml-1"
              >
                (Login Petugas)
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">Kategori Antrean:</span>
              <span className="font-mono text-emerald-800 dark:text-emerald-400 font-bold">
                [{activeLoket.kategoriHuruf.join(', ')}]
              </span>
            </div>
            <button
              onClick={() => {
                setIsBpjsModalOpen(true);
                setBpjsSuccessTicket(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>+ Form Pendaftaran BPJS</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Calling Workspace (Grid of 2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0 max-w-full">
        {/* Left Column: Currently Served Ticket & Calling Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6 min-w-0">
          {/* Active Calling Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs relative">
            {/* Header Status */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                Antrean Sedang Dilayani di {activeLoket.nama.split('-')[0].trim()}
              </span>
              {activeTicketForThisLoket ? (
                <span
                  className={`text-xs px-2.5 py-0.5 rounded font-semibold ${
                    activeTicketForThisLoket.status === 'SEDANG_DILAYANI'
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {activeTicketForThisLoket.status === 'SEDANG_DILAYANI' ? 'Sedang Dilayani' : 'Telah Dipanggil'}
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Kosong / Siap Panggil
                </span>
              )}
            </div>

            {/* Giant Number or Ready state */}
            <div className="py-6 text-center">
              {activeTicketForThisLoket ? (
                <div>
                  <div className="text-7xl sm:text-8xl font-black font-mono tracking-tight text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {activeTicketForThisLoket.nomorAntrean}
                  </div>
                  <div className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                    {activeTicketForThisLoket.namaPasien}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center justify-center gap-2">
                    <span>No. RM: <strong className="text-slate-900 dark:text-slate-200">{activeTicketForThisLoket.nomorRM}</strong></span>
                    <span>·</span>
                    <span>Poli: <strong className="text-slate-900 dark:text-slate-200">{activeTicketForThisLoket.poliTujuan}</strong></span>
                    <span>·</span>
                    <span>BPJS: <strong className="text-emerald-700 dark:text-emerald-400 font-mono">{activeTicketForThisLoket.noKartuBPJS}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="py-2 flex flex-col items-center justify-center">
                  <AnimatedHumanNurse size="sm" showGreeting={false} className="mb-2" />
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Siap Memanggil Antrean
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    Belum ada antrean yang dipanggil di loket ini. Tekan tombol &quot;Panggil Berikutnya&quot; di bawah untuk memanggil pasien.
                  </p>
                  {nextWaitingTicket && (
                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                      <span>Antrean siap panggil:</span>
                      <strong className="font-mono">{nextWaitingTicket.nomorAntrean} ({nextWaitingTicket.namaPasien})</strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Task ID BPJS Progress Pill Bar */}
            {activeTicketForThisLoket && (
              <div className="my-3 p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    Status Task ID Bridging BPJS Antrean RS:
                  </span>
                  <span className="font-mono text-emerald-800 dark:text-emerald-400 font-bold">
                    Task {activeTicketForThisLoket.taskIdBpjs} / 7
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 dark:bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${(activeTicketForThisLoket.taskIdBpjs / 7) * 100}%` }}
                  />
                </div>
                <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
                  <span>Booking &amp; Check-in</span>
                  <span>Tunggu Poli</span>
                  <span>Pelayanan DPJP</span>
                  <span>Farmasi</span>
                </div>
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
              {/* Button: Panggil Berikutnya */}
              <button
                onClick={() => panggilBerikutnya(activeLoket.id)}
                disabled={ttsState.isSpeaking || !nextWaitingTicket}
                className="col-span-2 sm:col-span-2 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50 text-white transition-all shadow-xs cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Panggil Berikutnya {nextWaitingTicket ? `(${nextWaitingTicket.nomorAntrean})` : ''}</span>
              </button>

              {/* Button: Panggil Ulang */}
              <button
                onClick={panggilUlang}
                disabled={ttsState.isSpeaking || !activeTicketForThisLoket}
                className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-lg font-semibold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Panggil Ulang</span>
              </button>

              {/* Button: Mulai Dilayani */}
              <button
                onClick={handleStartService}
                disabled={!activeTicketForThisLoket || activeTicketForThisLoket.status === 'SEDANG_DILAYANI'}
                className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-lg font-semibold text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/60 dark:hover:bg-blue-800 disabled:opacity-40 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Mulai Layani</span>
              </button>

              {/* Button: Selesai Layanan */}
              <button
                onClick={handleFinishService}
                disabled={!activeTicketForThisLoket}
                className="col-span-2 sm:col-span-2 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-xs bg-teal-800 hover:bg-teal-900 dark:bg-teal-700 dark:hover:bg-teal-600 disabled:opacity-40 text-white transition-colors cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Selesai Melayani (Sync BPJS)</span>
              </button>

              {/* Button: Lewati / Batal */}
              <button
                onClick={handleSkipPatient}
                disabled={!activeTicketForThisLoket}
                className="col-span-2 sm:col-span-2 flex items-center justify-center gap-1.5 py-3 px-4 rounded-lg font-semibold text-xs bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 disabled:opacity-40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 transition-colors cursor-pointer"
              >
                <SkipForward className="w-4 h-4" />
                <span>Lewati Pasien (Tidak Hadir)</span>
              </button>
            </div>
          </div>

          {/* Voice Engine Feedback Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  ttsState.isSpeaking
                    ? 'bg-emerald-600 text-white animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  {ttsState.isSpeaking ? 'Sedang Memanggil Melalui Speaker...' : 'Speaker Standby & Siap'}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {ttsState.currentText ? ttsState.currentText : 'Format suara jernih Bahasa Indonesia dengan Denting Harmoni Faskes'}
                </span>
              </div>
            </div>

            <button
              onClick={() => testSpeakerSound()}
              className="px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium transition-colors cursor-pointer shrink-0"
            >
              Uji Coba Suara
            </button>
          </div>
        </div>

        {/* Right Column: Waiting Queue List (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col h-full min-h-[350px] lg:min-h-[500px] min-w-0">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Daftar Menunggu ({waitingTickets.length})
              </h3>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => setFilterKategori('ALL')}
                className={`px-2 py-0.5 rounded cursor-pointer ${filterKategori === 'ALL' ? 'bg-emerald-700 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterKategori('A')}
                className={`px-2 py-0.5 rounded font-mono cursor-pointer ${filterKategori === 'A' ? 'bg-emerald-700 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                A (BPJS)
              </button>
              <button
                onClick={() => setFilterKategori('B')}
                className={`px-2 py-0.5 rounded font-mono cursor-pointer ${filterKategori === 'B' ? 'bg-emerald-700 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                B (Umum)
              </button>
              <button
                onClick={() => setFilterKategori('P')}
                className={`px-2 py-0.5 rounded font-mono cursor-pointer ${filterKategori === 'P' ? 'bg-emerald-700 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                P (Prioritas)
              </button>
            </div>
          </div>

          {/* Quick BPJS Form Banner when filtering Kategori A */}
          {filterKategori === 'A' && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
              <span className="text-emerald-800 dark:text-emerald-300 font-semibold text-[11px] flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>Formulir Pendaftaran Antrean Pasien BPJS</span>
              </span>
              <button
                onClick={() => {
                  setIsBpjsModalOpen(true);
                  setBpjsSuccessTicket(null);
                }}
                className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Plus className="w-3 h-3" />
                <span>Buka Form</span>
              </button>
            </div>
          )}

          {/* List of Waiting Tickets */}
          <div className="mt-3 space-y-2 overflow-y-auto max-h-[520px] pr-1">
            {waitingTickets.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Tidak ada antrean menunggu untuk kriteria ini.</p>
              </div>
            ) : (
              waitingTickets.map((t, index) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-base text-emerald-800 dark:text-emerald-400">
                        {t.nomorAntrean}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                        {t.kategori}
                      </span>
                      {index === 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-800">
                          Urutan Pertama
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate mt-0.5">
                      {t.namaPasien}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Poli: {t.poliTujuan} · No. RM: {t.nomorRM}
                    </div>
                  </div>

                  {/* Individual Call Button */}
                  <button
                    onClick={() => panggilAntrean(t.id, activeLoket.id)}
                    disabled={ttsState.isSpeaking}
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-100 hover:bg-emerald-700 text-emerald-800 hover:text-white dark:bg-emerald-950/60 dark:hover:bg-emerald-600 dark:text-emerald-300 dark:hover:text-white border border-emerald-300 dark:border-emerald-600/40 transition-all cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Panggil</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Formulir Pendaftaran & Validasi Pasien BPJS Kesehatan */}
      {isBpjsModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[70] flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl max-w-2xl w-full p-4 sm:p-6 shadow-xl space-y-4 max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Form Pendaftaran Pasien BPJS (Kategori A)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Loket Pendaftaran &amp; Penerbitan SEP Klinik Somban Medika Sidoarjo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBpjsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 space-y-4 pr-1 text-xs">
              {/* Presets */}
              <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pilih Data Demo Pasien BPJS Cepat:</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">1-Klik</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {demoLoketPresets.map((d) => (
                    <button
                      key={d.noKartu}
                      type="button"
                      onClick={() => handleApplyLoketPreset(d)}
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

              {/* Form Input Fields */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                {/* Row 1: Nomor Kartu & Verifikasi */}
                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                    Nomor Kartu BPJS (13 Digit) / NIK (16 Digit):
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={bpjsCardInput}
                      onChange={(e) => setBpjsCardInput(e.target.value)}
                      placeholder="0001827463910"
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyBpjsLoket}
                      disabled={isCheckingBpjs || !bpjsCardInput.trim()}
                      className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{isCheckingBpjs ? 'Cek Server...' : 'Verifikasi'}</span>
                    </button>
                  </div>
                </div>

                {/* Row 2: Nama & NIK */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                      Nama Pasien Sesuai Kartu BPJS:
                    </label>
                    <input
                      type="text"
                      value={bpjsNamaInput}
                      onChange={(e) => setBpjsNamaInput(e.target.value)}
                      placeholder="Nama lengkap pasien"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                      NIK KTP:
                    </label>
                    <input
                      type="text"
                      value={bpjsNikInput}
                      onChange={(e) => setBpjsNikInput(e.target.value)}
                      placeholder="3515085404880002"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Row 3: Poli & Dokter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                      Poliklinik Tujuan:
                    </label>
                    <select
                      value={bpjsPoliInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBpjsPoliInput(val);
                        if (val === 'Poli Umum - Ruang 2' || val === 'Poli Umum 2 (dr. Diana)') {
                          setBpjsKodePoliInput('001');
                          setBpjsDokterInput('dr. Diana');
                        } else if (val === 'Poli Gigi & Mulut') {
                          setBpjsKodePoliInput('002');
                          setBpjsDokterInput('dr. Diana (Dokter Umum)');
                        } else if (val === 'Poli KIA & Kebidanan / KB') {
                          setBpjsKodePoliInput('003');
                          setBpjsDokterInput('Bidan');
                        } else if (val === 'Poli Lansia & Prolanis') {
                          setBpjsKodePoliInput('004');
                          setBpjsDokterInput('dr. Diana (Dokter Umum)');
                        } else if (val === 'Farmasi & Penyerahan Resep') {
                          setBpjsKodePoliInput('005');
                          setBpjsDokterInput('Wandi (Penyerahan Resep)');
                        } else if (val === 'Laboratorium & Cek Darah') {
                          setBpjsKodePoliInput('006');
                          setBpjsDokterInput('Analis Medis Somban');
                        } else {
                          setBpjsKodePoliInput('001');
                          setBpjsDokterInput('dr. Machmujur');
                        }
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-600"
                    >
                      <option value="Poli Umum - Ruang 1">[001] Poli Umum 1 (dr. Machmujur) · Default BPJS</option>
                      <option value="Poli Umum - Ruang 2">[001] Poli Umum 2 (dr. Diana)</option>
                      <option value="Poli Gigi & Mulut">[002] Poli Gigi &amp; Mulut (dr. Diana - Dokter Umum)</option>
                      <option value="Poli KIA & Kebidanan / KB">[003] Poli KIA &amp; KB (Bidan)</option>
                      <option value="Poli Lansia & Prolanis">[004] Poli Lansia &amp; Prolanis (dr. Diana - Dokter Umum)</option>
                      <option value="Farmasi & Penyerahan Resep">[005] Farmasi &amp; Penyerahan Resep (Wandi)</option>
                      <option value="Laboratorium & Cek Darah">[006] Laboratorium &amp; Cek Darah</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                      Dokter DPJP:
                    </label>
                    <input
                      type="text"
                      value={bpjsDokterInput}
                      readOnly
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 text-xs cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Row 4: Telepon & Keluhan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                      Nomor WhatsApp / HP:
                    </label>
                    <input
                      type="text"
                      value={bpjsPhoneInput}
                      onChange={(e) => setBpjsPhoneInput(e.target.value)}
                      placeholder="081234567890"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
                      Keluhan / Catatan Petugas:
                    </label>
                    <input
                      type="text"
                      value={bpjsKeluhanInput}
                      onChange={(e) => setBpjsKeluhanInput(e.target.value)}
                      placeholder="Keluhan pasien"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Status Verification Card */}
              {bpjsVerifyResult && (
                <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-xs space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-400 font-bold">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Status Kepesertaan BPJS Terverifikasi:
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900">
                      ELIGIBLE (SEP Siap)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-slate-700 dark:text-slate-300">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Nama:</span>
                      <strong className="text-slate-900 dark:text-white">{bpjsVerifyResult.nama}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Hak Kelas:</span>
                      <span>{bpjsVerifyResult.hakKelas?.keterangan || 'Kelas 1'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Faskes:</span>
                      <span className="truncate block">{bpjsVerifyResult.provUmum?.nmProvider || 'Klinik Somban Medika Sidoarjo'}</span>
                    </div>
                  </div>
                </div>
              )}

              {bpjsVerifyError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bpjsVerifyError}</span>
                </div>
              )}

              {/* Success Box */}
              {bpjsSuccessTicket && (
                <div className="p-4 rounded-xl bg-emerald-100/90 dark:bg-emerald-950/80 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-200 text-xs space-y-2 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                      <span>Nomor Antrean BPJS Berhasil Didaftarkan!</span>
                    </span>
                    <span className="text-2xl font-black font-mono text-emerald-900 dark:text-white">
                      {bpjsSuccessTicket.nomorAntrean}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                    Pasien <strong>{bpjsSuccessTicket.namaPasien}</strong> telah masuk antrean menunggu kategori A ({bpjsSuccessTicket.poliTujuan}).
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsBpjsModalOpen(false)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleRegisterBpjsAtLoket}
                className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Daftarkan &amp; Buat Antrean BPJS (A)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
