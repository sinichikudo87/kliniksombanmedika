'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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
    <div className="relative min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white overflow-hidden">
      {/* Large Transparent Background Watermark Logo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
        <div className="relative w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] lg:w-[920px] lg:h-[920px] opacity-[0.04] grayscale transform -rotate-12">
          <Image
            src="/assets/aistudio/Logo-01.jpg_cdb7cbc6.jpeg"
            alt="Watermark Logo Somban Medika"
            fill
            className="object-contain"
            referrerPolicy="no-referrer"
            priority
          />
        </div>
      </div>

      {/* TV Header Bar - Default Light Mode */}
      <header className="relative z-10 bg-white border-b border-slate-200/90 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-white shadow-xs border border-slate-200 flex items-center justify-center shrink-0">
            <Image
              src="/assets/aistudio/Logo-01.jpg_cdb7cbc6.jpeg"
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
        <div className="flex items-center gap-5">
          <div className="text-right">
            <div className="text-2xl md:text-3xl font-mono font-black text-emerald-700 tracking-wider">
              {formattedTime || '--:--:--'} <span className="text-xs text-emerald-800 font-sans font-bold">WIB</span>
            </div>
            <p className="text-xs text-slate-500 font-semibold">{formattedDate || 'Waktu Faskes'}</p>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
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
              <span>Test Suara Panggilan</span>
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
            className={`relative rounded-3xl bg-white border-2 p-8 sm:p-10 shadow-lg transition-all duration-500 flex flex-col justify-between h-full ${
              isCallingAnimation
                ? 'border-emerald-500 ring-8 ring-emerald-500/20 scale-[1.01]'
                : 'border-slate-200'
            }`}
          >
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-radial from-emerald-500/5 via-transparent to-transparent pointer-events-none rounded-3xl" />

            {/* Top Tag */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-600"></span>
                </span>
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">
                  PANGGILAN AKTIF SAAT INI
                </span>
              </div>
              {currentCalled?.tipePasien && (
                <span className="px-3.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-full">
                  PASIEN {currentCalled.tipePasien}
                </span>
              )}
            </div>

            {/* Giant Number */}
            <div className="relative z-10 my-auto py-8 text-center">
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-2">
                NOMOR ANTREAN
              </p>
              <div
                className={`text-7xl sm:text-8xl md:text-9xl font-black tracking-tight text-slate-900 transition-transform duration-300 ${
                  isCallingAnimation ? 'scale-105 text-emerald-600' : ''
                }`}
              >
                {currentCalled ? currentCalled.nomorAntrean : '---'}
              </div>

              {/* Patient Name Privacy Masked */}
              <div className="mt-4">
                <span className="text-xl sm:text-2xl font-extrabold text-slate-800">
                  {currentCalled ? maskName(currentCalled.namaPasien) : 'Menunggu Panggilan Pasien'}
                </span>
              </div>
            </div>

            {/* Destination Info Box */}
            <div className="relative z-10 bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tujuan Pelayanan</p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
                    {currentCalled ? currentCalled.poliNama : 'Poli TPMD'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ruangan / Loket</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    {currentCalled ? currentCalled.ruangNama : 'Ruang Periksa'}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  Dokter: <strong className="text-slate-900 font-bold">{currentCalled?.dokterNama || 'dr. Machmujur'}</strong>
                </span>
                <span className="text-emerald-700 font-bold">
                  {currentCalled?.panggilanKe ? `Panggilan Ke-${currentCalled.panggilanKe}` : 'Panggilan Pertama'}
                </span>
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
                  className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 font-black border border-emerald-200 flex items-center justify-center text-sm">
                        {poli.prefix}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">{poli.nama}</h3>
                        <p className="text-[11px] text-slate-500 font-medium">{poli.dokter}</p>
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
                        {nextWaiting ? nextWaiting.nomorAntrean : '-'}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-200/80">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Sisa Antrean</p>
                      <p className="text-lg font-black text-amber-600 mt-0.5">
                        {waitingTotal} <span className="text-[10px] font-medium text-slate-500">pasien</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
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
            Selamat Datang di {bpjsConfig.namaFaskes} (Kode Faskes: {bpjsConfig.kdFaskes}) · Harap perhatikan nomor antrean pada layar dan audio panggilan · Pasien BPJS Kesehatan harap menyiapkan KTP/Kartu BPJS untuk verifikasi berkas · Layanan Terhubung Langsung dengan VClaim & PCare BPJS Kesehatan · Tetap jaga protokol kesehatan di ruang tunggu.
          </div>
        </div>
      </footer>
    </div>
  );
};
