'use client';

import React, { useState, useEffect } from 'react';
import { useQueue } from '@/lib/queue-context';
import { speakIndonesianQueue, chimePlayer } from '@/lib/tts-announcer';
import { maskName } from '@/lib/encrypted-db';
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
} from 'lucide-react';

export const TvDisplayMode: React.FC<{ onExitFullscreen?: () => void }> = ({ onExitFullscreen }) => {
  const { currentCalled, queues, poliList, bpjsConfig, audioEnabled, setAudioEnabled } = useQueue();

  const [formattedDate, setFormattedDate] = useState<string>('');
  const [formattedTime, setFormattedTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isCallingAnimation, setIsCallingAnimation] = useState<boolean>(false);

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

  // Pulse animation whenever currentCalled updates
  useEffect(() => {
    if (!currentCalled) return;
    const startTimer = setTimeout(() => {
      setIsCallingAnimation(true);
    }, 10);
    const stopTimer = setTimeout(() => {
      setIsCallingAnimation(false);
    }, 5000);
    return () => {
      clearTimeout(startTimer);
      clearTimeout(stopTimer);
    };
  }, [currentCalled]);

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
    if (currentCalled) {
      await speakIndonesianQueue(
        currentCalled.nomorAntrean,
        currentCalled.poliNama,
        currentCalled.ruangNama
      );
    } else {
      await speakIndonesianQueue('A-010', 'Poli Umum', 'Ruang Satu');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white">
      {/* TV Header Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">
                {bpjsConfig.namaFaskes}
              </h1>
              <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Bridging VClaim / PCare ({bpjsConfig.kdFaskes})
              </span>
            </div>
            <p className="text-xs text-slate-400 tracking-wide">
              SISTEM ANTREAN ELEKTRONIK & RUANG TUNGGU PASIEN TERPADU
            </p>
          </div>
        </div>

        {/* Live Clock & Controls */}
        <div className="flex items-center gap-5">
          <div className="text-right">
            <div className="text-2xl md:text-3xl font-mono font-black text-emerald-400 tracking-wider">
              {formattedTime || '--:--:--'} <span className="text-xs text-emerald-500 font-sans">WIB</span>
            </div>
            <p className="text-xs text-slate-400 font-medium">{formattedDate || 'Waktu Faskes'}</p>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              title={audioEnabled ? 'Matikan Suara Audio' : 'Aktifkan Suara Audio'}
              className={`p-2.5 rounded-xl border transition-colors ${
                audioEnabled
                  ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30'
                  : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'
              }`}
            >
              {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button
              onClick={handleTestTts}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Test Panggilan TTS</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
              title="Fullscreen Mode"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main TV Content Area (16:9 Split) */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN (7 Cols): GIANT SPOTLIGHT OF CALLED PATIENT */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div
            className={`relative rounded-3xl bg-gradient-to-b from-slate-900 to-slate-900/80 border-2 p-8 sm:p-10 shadow-2xl transition-all duration-500 flex flex-col justify-between h-full ${
              isCallingAnimation
                ? 'border-emerald-400 ring-8 ring-emerald-500/20 scale-[1.01]'
                : 'border-slate-800'
            }`}
          >
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none rounded-3xl" />

            {/* Top Tag */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  PANGGILAN AKTIF SAAT INI
                </span>
              </div>
              {currentCalled?.tipePasien && (
                <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-full">
                  PASIEN {currentCalled.tipePasien}
                </span>
              )}
            </div>

            {/* Giant Number */}
            <div className="relative z-10 my-auto py-8 text-center">
              <p className="text-sm font-semibold tracking-widest text-slate-400 uppercase mb-2">
                NOMOR ANTREAN
              </p>
              <div
                className={`text-7xl sm:text-8xl md:text-9xl font-black tracking-tight text-white drop-shadow-[0_10px_25px_rgba(16,185,129,0.3)] transition-transform duration-300 ${
                  isCallingAnimation ? 'scale-105 text-emerald-300' : ''
                }`}
              >
                {currentCalled ? currentCalled.nomorAntrean : '---'}
              </div>

              {/* Patient Name Privacy Masked */}
              <div className="mt-4">
                <span className="text-lg sm:text-xl font-bold text-slate-200">
                  {currentCalled ? maskName(currentCalled.namaPasien) : 'Menunggu Panggilan'}
                </span>
              </div>
            </div>

            {/* Destination Info Box */}
            <div className="relative z-10 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase">Tujuan Poli</p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
                    {currentCalled ? currentCalled.poliNama : 'Poli TPMD'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase">Ruangan / Loket</p>
                  <p className="text-xl sm:text-2xl font-black text-white mt-0.5">
                    {currentCalled ? currentCalled.ruangNama : 'Ruang Periksa'}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-emerald-400" />
                  Dokter: <strong className="text-slate-200 font-semibold">{currentCalled?.dokterNama || 'dr. Machmujur'}</strong>
                </span>
                <span className="text-emerald-400/90 font-medium">
                  {currentCalled?.panggilanKe ? `Panggilan Ke-${currentCalled.panggilanKe}` : 'Panggilan Pertama'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 Cols): REAL-TIME POLI OVERVIEW GRID */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-sm font-bold tracking-wider uppercase text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" /> STATUS ANTREAN PER POLI
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
              const nextWaiting = queues.find(
                (q) => q.poliKode === poli.kode && q.status === 'MENUNGGU'
              );
              // Total waiting in this poli
              const waitingTotal = queues.filter(
                (q) => q.poliKode === poli.kode && q.status === 'MENUNGGU'
              ).length;

              return (
                <div
                  key={poli.kode}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm">
                        {poli.prefix}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{poli.nama}</h3>
                        <p className="text-[11px] text-slate-400">{poli.dokter}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {poli.ruang}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 text-center">
                    <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/80">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Sedang Dipanggil</p>
                      <p className="text-lg font-black text-emerald-400 mt-0.5">
                        {servingItem ? servingItem.nomorAntrean : '-'}
                      </p>
                    </div>
                    <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/80">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Selanjutnya</p>
                      <p className="text-lg font-black text-slate-200 mt-0.5">
                        {nextWaiting ? nextWaiting.nomorAntrean : '-'}
                      </p>
                    </div>
                    <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/80">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Sisa Antrean</p>
                      <p className="text-lg font-black text-amber-400 mt-0.5">
                        {waitingTotal} <span className="text-[10px] font-normal text-slate-400">pasien</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Estimasi per pasien: ±{poli.durasiRataRataMenit} menit</span>
                    <span className="text-emerald-400 font-medium">
                      {waitingTotal > 0 ? `Total tunggu: ±${waitingTotal * poli.durasiRataRataMenit} mnt` : 'Tidak ada antrean'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Running Text Ticker at Bottom */}
      <footer className="bg-emerald-950/90 border-t border-emerald-800/50 py-3 px-6 flex items-center gap-4 overflow-hidden">
        <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider shrink-0 flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 animate-pulse" /> PENGUMUMAN
        </span>

        <div className="overflow-hidden whitespace-nowrap w-full">
          <div className="inline-block animate-marquee text-xs md:text-sm text-emerald-100 font-medium">
            Selamat Datang di TPMD DR. MACHMUJUR (Kode Faskes: {bpjsConfig.kdFaskes}) · Harap perhatikan nomor antrean pada layar dan audio panggilan · Pasien BPJS Kesehatan harap menyiapkan KTP/Kartu BPJS untuk verifikasi berkas · Layanan Terhubung Langsung dengan VClaim & PCare BPJS Kesehatan · Tetap jaga protokol kesehatan di ruang tunggu.
          </div>
        </div>
      </footer>
    </div>
  );
};
