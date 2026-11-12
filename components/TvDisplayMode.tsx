'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useQueue } from '@/lib/queue-context';
import { speakIndonesianQueue } from '@/lib/tts-announcer';
import { maskName } from '@/lib/encrypted-db';
import { QueueItem } from '@/types/queue';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Clock,
  Radio,
  CheckCircle2,
  Sparkles,
  Stethoscope,
  Activity,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  ArrowLeft,
  UserCheck,
} from 'lucide-react';

export const TvDisplayMode: React.FC<{ onExitFullscreen?: () => void }> = ({ onExitFullscreen }) => {
  const {
    currentCalled,
    queues,
    poliList,
    bpjsConfig,
    audioEnabled,
    setAudioEnabled,
    callQueue,
  } = useQueue();

  const [formattedDate, setFormattedDate] = useState<string>('');
  const [formattedTime, setFormattedTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isCallingNext, setIsCallingNext] = useState<boolean>(false);

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setFormattedDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
      setFormattedTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Priority selection for the Main TV Spotlight:
  // 1. Actively being called right now (DIPANGGIL)
  // 2. Currently being served in doctor room (DILAYANI)
  // 3. Next in line waiting to be called (MENUNGGU)
  // 4. Most recently called patient today
  const activeCalled = currentCalled && currentCalled.status === 'DIPANGGIL'
    ? currentCalled
    : queues.find((q) => q.status === 'DIPANGGIL') || null;

  const activeServing = !activeCalled
    ? (currentCalled && currentCalled.status === 'DILAYANI' ? currentCalled : queues.find((q) => q.status === 'DILAYANI') || null)
    : null;

  const nextWaiting = (!activeCalled && !activeServing)
    ? queues.find((q) => q.status === 'MENUNGGU') || null
    : null;

  const lastCalled = (!activeCalled && !activeServing && !nextWaiting)
    ? [...queues]
        .filter((q) => q.waktuDipanggil)
        .sort((a, b) => new Date(b.waktuDipanggil!).getTime() - new Date(a.waktuDipanggil!).getTime())[0] || null
    : null;

  const displayQueue: QueueItem | null = activeCalled || activeServing || nextWaiting || lastCalled || null;

  const displayState: 'DIPANGGIL' | 'DILAYANI' | 'MENUNGGU' | 'TERAKHIR' | 'STANDBY' = (() => {
    if (activeCalled) return 'DIPANGGIL';
    if (activeServing) return 'DILAYANI';
    if (nextWaiting) return 'MENUNGGU';
    if (lastCalled) return 'TERAKHIR';
    return 'STANDBY';
  })();

  const isCallingAnimation = displayState === 'DIPANGGIL';

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const handleTestTts = async () => {
    if (displayQueue) {
      await speakIndonesianQueue(
        displayQueue.nomorAntrean,
        displayQueue.poliNama,
        displayQueue.ruangNama
      );
    } else {
      await speakIndonesianQueue('A-001', 'Poli Umum', 'Ruang Satu');
    }
  };

  const handleCallQueueItem = async (queueItem: QueueItem) => {
    setIsCallingNext(true);
    try {
      await callQueue(queueItem.id);
    } finally {
      setIsCallingNext(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white overflow-hidden">
      {/* Large Transparent Background Watermark Logo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
        <div className="relative w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] lg:w-[920px] lg:h-[920px] opacity-[0.04] grayscale transform -rotate-12">
          <Image
            src="/assets/images/Logo-01.jpg_cdb7cbc6.jpeg"
            alt="Watermark Logo Somban Medika"
            fill
            className="object-contain"
            referrerPolicy="no-referrer"
            priority
          />
        </div>
      </div>

      {/* TV Header Bar */}
      <header className="relative z-10 bg-white border-b border-slate-200/90 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-white shadow-xs border border-slate-200 flex items-center justify-center shrink-0">
            <Image
              src="/assets/images/Logo-01.jpg_cdb7cbc6.jpeg"
              alt="Logo Somban Medika"
              width={48}
              height={48}
              className="w-full h-full object-contain p-0.5"
              referrerPolicy="no-referrer"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 uppercase">
                {bpjsConfig.namaFaskes}
              </h1>
              <span className="bg-emerald-50 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Bridging BPJS ({bpjsConfig.kdFaskes})
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold tracking-wide">
              SISTEM ANTREAN ELEKTRONIK & RUANG TUNGGU PASIEN TERPADU
            </p>
          </div>
        </div>

        {/* Live Clock & Controls */}
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="text-right">
            <div className="text-2xl md:text-3xl font-mono font-black text-emerald-700 tracking-wider">
              {formattedTime || '--:--:--'} <span className="text-xs text-emerald-800 font-sans font-bold">WIB</span>
            </div>
            <p className="text-xs text-slate-500 font-semibold">{formattedDate || 'Waktu Faskes'}</p>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            {onExitFullscreen && (
              <button
                onClick={onExitFullscreen}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                title="Kembali ke Dashboard Operator"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
            )}

            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              title={audioEnabled ? 'Matikan Suara Audio' : 'Aktifkan Suara Audio'}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                audioEnabled
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 shadow-2xs'
                  : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
              }`}
            >
              {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button
              onClick={handleTestTts}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Test Suara</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors shadow-2xs cursor-pointer"
              title="Fullscreen Mode"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main TV Content Area (16:9 Split) */}
      <main className="relative z-10 flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN (7 Cols): GIANT SPOTLIGHT OF CALLED PATIENT */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div
            className={`relative rounded-3xl bg-white border-2 p-7 sm:p-9 shadow-lg transition-all duration-500 flex flex-col justify-between h-full ${
              displayState === 'DIPANGGIL'
                ? 'border-emerald-500 ring-8 ring-emerald-500/20 scale-[1.01]'
                : displayState === 'DILAYANI'
                ? 'border-blue-400 ring-4 ring-blue-400/10'
                : displayState === 'MENUNGGU'
                ? 'border-amber-400 ring-4 ring-amber-400/15'
                : 'border-slate-200'
            }`}
          >
            {/* Ambient Background Glow */}
            <div
              className={`absolute inset-0 bg-radial pointer-events-none rounded-3xl ${
                displayState === 'DIPANGGIL'
                  ? 'from-emerald-500/10 via-transparent to-transparent'
                  : displayState === 'DILAYANI'
                  ? 'from-blue-500/10 via-transparent to-transparent'
                  : displayState === 'MENUNGGU'
                  ? 'from-amber-500/10 via-transparent to-transparent'
                  : 'from-slate-500/5 via-transparent to-transparent'
              }`}
            />

            {/* Top Tag & Status Badges */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {displayState === 'DIPANGGIL' && (
                  <>
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-600"></span>
                    </span>
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-800">
                      PANGGILAN AKTIF SAAT INI
                    </span>
                  </>
                )}
                {displayState === 'DILAYANI' && (
                  <>
                    <span className="h-3 w-3 rounded-full bg-blue-600 inline-block"></span>
                    <span className="text-xs font-black uppercase tracking-widest text-blue-800">
                      SEDANG DILAYANI DI RUANGAN
                    </span>
                  </>
                )}
                {displayState === 'MENUNGGU' && (
                  <>
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                    </span>
                    <span className="text-xs font-black uppercase tracking-widest text-amber-800">
                      ANTREAN BERIKUTNYA (SIAP DIPANGGIL)
                    </span>
                  </>
                )}
                {displayState === 'TERAKHIR' && (
                  <>
                    <span className="h-3 w-3 rounded-full bg-slate-400 inline-block"></span>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-600">
                      PANGGILAN TERAKHIR
                    </span>
                  </>
                )}
                {displayState === 'STANDBY' && (
                  <>
                    <span className="h-3 w-3 rounded-full bg-slate-300 inline-block"></span>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                      STATUS ANTREAN FASKES
                    </span>
                  </>
                )}
              </div>

              {displayQueue?.tipePasien && (
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full border ${
                    displayQueue.tipePasien === 'BPJS'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-blue-50 border-blue-300 text-blue-800'
                  }`}
                >
                  PASIEN {displayQueue.tipePasien}
                </span>
              )}
            </div>

            {/* Giant Number & Name */}
            <div className="relative z-10 my-auto py-6 sm:py-8 text-center">
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-2">
                NOMOR ANTREAN
              </p>
              <div
                className={`text-7xl sm:text-8xl md:text-9xl font-black tracking-tight transition-transform duration-300 ${
                  displayState === 'DIPANGGIL'
                    ? 'text-emerald-600 scale-105'
                    : displayState === 'DILAYANI'
                    ? 'text-blue-700'
                    : displayState === 'MENUNGGU'
                    ? 'text-amber-600'
                    : 'text-slate-900'
                }`}
              >
                {displayQueue ? displayQueue.nomorAntrean : '---'}
              </div>

              {/* Patient Name Privacy Masked */}
              <div className="mt-3 sm:mt-4">
                <span className="text-xl sm:text-2xl font-black text-slate-800">
                  {displayQueue ? maskName(displayQueue.namaPasien) : 'Belum Ada Antrean Aktif'}
                </span>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  {displayState === 'DIPANGGIL' && 'Silakan masuk ke ruang pemeriksaan dokter'}
                  {displayState === 'DILAYANI' && 'Pemeriksaan dokter / pelayanan sedang berlangsung'}
                  {displayState === 'MENUNGGU' && 'Harap bersiap di ruang tunggu pasien, giliran Anda berikutnya'}
                  {displayState === 'TERAKHIR' && 'Pelayanan nomor ini telah diselesaikan'}
                  {displayState === 'STANDBY' && 'Silakan mengambil nomor antrean pada Kios Pendaftaran'}
                </p>
              </div>
            </div>

            {/* Destination Info Box & Quick Action */}
            <div className="relative z-10 bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tujuan Pelayanan</p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
                    {displayQueue ? displayQueue.poliNama : 'Poli TPMD'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ruangan / Loket</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    {displayQueue ? displayQueue.ruangNama : 'Ruang Periksa'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  <span>
                    {displayQueue?.dokterNama ? `Dokter: ${displayQueue.dokterNama}` : 'Dokter Pemeriksa Bertugas'}
                  </span>
                </span>

                {displayState === 'DIPANGGIL' && (
                  <span className="text-emerald-700 font-bold bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                    {displayQueue?.panggilanKe ? `Panggilan Ke-${displayQueue.panggilanKe}` : 'Panggilan Pertama'}
                  </span>
                )}

                {displayState === 'MENUNGGU' && displayQueue && (
                  <button
                    onClick={() => handleCallQueueItem(displayQueue)}
                    disabled={isCallingNext}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <PhoneCall className={`w-3.5 h-3.5 ${isCallingNext ? 'animate-spin' : ''}`} />
                    <span>Panggil {displayQueue.nomorAntrean} Sekarang</span>
                  </button>
                )}

                {displayState === 'DILAYANI' && (
                  <span className="text-blue-700 font-bold bg-blue-100/80 px-2.5 py-1 rounded-lg">
                    Sedang Dilayani
                  </span>
                )}

                {displayState === 'TERAKHIR' && (
                  <span className="text-slate-600 font-bold bg-slate-200 px-2.5 py-1 rounded-lg">
                    Selesai Dilayani
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 Cols): REAL-TIME POLI OVERVIEW GRID */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-xs font-extrabold tracking-wider uppercase text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" /> STATUS ANTREAN PER POLI
            </h2>
            <span className="text-xs text-slate-500 font-medium">Otomatis Terupdate</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 flex-1">
            {poliList.map((poli) => {
              // Current serving in this poli
              const servingItem = queues.find(
                (q) =>
                  q.poliKode === poli.kode && (q.status === 'DIPANGGIL' || q.status === 'DILAYANI')
              );
              // Next waiting queue
              const nextWaitingItem = queues.find(
                (q) => q.poliKode === poli.kode && q.status === 'MENUNGGU'
              );
              // Total waiting in this poli
              const waitingTotal = queues.filter(
                (q) => q.poliKode === poli.kode && q.status === 'MENUNGGU'
              ).length;

              return (
                <div
                  key={poli.kode}
                  className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 font-black border border-emerald-200 flex items-center justify-center text-sm">
                        {poli.prefix}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">{poli.nama}</h3>
                        {poli.dokter ? (
                          <p className="text-[11px] text-slate-500 font-medium">{poli.dokter}</p>
                        ) : null}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                      {poli.ruang}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 text-center">
                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-200/80">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Sedang Dipanggil</p>
                      <p className="text-lg font-black text-emerald-700 mt-0.5">
                        {servingItem ? servingItem.nomorAntrean : '-'}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-200/80">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Selanjutnya</p>
                      <p className="text-lg font-black text-slate-800 mt-0.5">
                        {nextWaitingItem ? nextWaitingItem.nomorAntrean : '-'}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-200/80">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Sisa Antrean</p>
                      <p className="text-lg font-black text-amber-600 mt-0.5">
                        {waitingTotal} <span className="text-[10px] font-medium text-slate-500">pasien</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>Estimasi per pasien: ±{poli.durasiRataRataMenit} menit</span>
                    <span className="text-emerald-700 font-bold">
                      {waitingTotal > 0 ? `Total tunggu: ±${waitingTotal * poli.durasiRataRataMenit} mnt` : 'Antrean Lengang'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Running Text Ticker at Bottom */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3 px-6 flex items-center gap-4 overflow-hidden text-white">
        <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider shrink-0 flex items-center gap-1.5 shadow-xs">
          <Radio className="w-3.5 h-3.5 animate-pulse" /> PENGUMUMAN
        </span>

        <div className="overflow-hidden whitespace-nowrap w-full">
          <div className="inline-block animate-marquee text-xs md:text-sm text-slate-200 font-medium">
            Selamat Datang di {bpjsConfig.namaFaskes} (Kode Faskes: {bpjsConfig.kdFaskes}) · Harap perhatikan nomor antrean pada layar dan audio panggilan · Pasien BPJS Kesehatan harap menyiapkan KTP/Kartu BPJS untuk verifikasi berkas · Layanan Terhubung Langsung dengan Antrean Online (Mobile JKN) & PCare BPJS Kesehatan · Tetap jaga protokol kesehatan di ruang tunggu.
          </div>
        </div>
      </footer>
    </div>
  );
};
