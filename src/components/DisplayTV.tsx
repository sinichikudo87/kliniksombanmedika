import React, { useEffect, useState } from 'react';
import {
  Volume2,
  Maximize2,
  Minimize2,
  Clock,
  Building2,
  Radio,
  RotateCcw,
  MapPin,
  Tv,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { AnimatedHumanNurse } from './AnimatedHumanNurse';
import { QueueStatisticsDashboard } from './QueueStatisticsDashboard';

const slideImages = [
  {
    src: '/klinik_somban_real_1.jpg',
    title: 'Gedung & Plang Faskes Klinik Somban Medika',
    desc: 'Tampak depan klinik, plang faskes resmi, dan akses jalan Kebonsari Candi Sidoarjo',
    mapUrl: 'https://maps.app.goo.gl/NX7nyKLxtx7rGx6j7',
    label: 'Google Maps Lokasi 1',
  },
  {
    src: '/klinik_somban_real_2.jpg',
    title: 'Area Depan & Parkir Pasien Klinik',
    desc: 'Halaman parkir tertata rapi dan akses mudah bagi pasien rawat jalan & BPJS',
    mapUrl: 'https://maps.app.goo.gl/uHrybrxspgEcp1y18',
    label: 'Google Maps Lokasi 2',
  },
  {
    src: '/klinik_somban_real_3.jpg',
    title: 'Fasilitas & Pintu Masuk Pelayanan',
    desc: 'Pintu masuk pelayanan, ruang tunggu ber-AC, dan meja pendaftaran admisi',
    mapUrl: 'https://maps.app.goo.gl/QXjJ8D3GxnB8ZAnPA',
    label: 'Google Maps Lokasi 3',
  },
  {
    src: '/klinik_somban_real_4.jpg',
    title: 'Ruang Pelayanan & Pemeriksaan Poli',
    desc: 'Pelayanan dokter Poli Umum (dr. Machmujur & dr. Diana), KIA, dan tindakan medis terpadu',
    mapUrl: 'https://maps.app.goo.gl/N4vAU5jERNLj48G68',
    label: 'Google Maps Lokasi 4',
  },
  {
    src: '/klinik_somban_real_5.jpg',
    title: 'Lingkungan Faskes Kebonsari Candi',
    desc: 'Lokasi strategis di Kampung Bebek Kebonsari RT.05 RW.03, Candi, Kabupaten Sidoarjo',
    mapUrl: 'https://maps.app.goo.gl/uAmruwLvrU1tkzTR6',
    label: 'Google Maps Lokasi 5',
  },
];

interface DisplayTVProps {
  openMapModal?: () => void;
}

export const DisplayTV: React.FC<DisplayTVProps> = ({ openMapModal }) => {
  const { currentCalledTicket, lokets, ttsState, panggilUlang, bpjsConfig } = useQueue();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isTvModeExpanded, setIsTvModeExpanded] = useState<boolean>(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [displayViewOption, setDisplayViewOption] = useState<'live' | 'statistics'>('live');

  // Live Clock updater
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Slide rotator
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slideImages.length);
    }, 8000);
    return () => clearInterval(slideTimer);
  }, []);

  // Listen to native fullscreen changes
  useEffect(() => {
    const onFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      if (!isNowFullscreen && isTvModeExpanded) {
        setIsTvModeExpanded(false);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [isTvModeExpanded]);

  // Keyboard shortcut: Press F or F11 for fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
          setIsTvModeExpanded(true);
        })
        .catch(() => {
          // Fallback CSS fullscreen if native is disallowed in iframe
          setIsTvModeExpanded(!isTvModeExpanded);
          setIsFullscreen(!isTvModeExpanded);
        });
    } else {
      document.exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
          setIsTvModeExpanded(false);
        })
        .catch(() => {
          setIsTvModeExpanded(false);
          setIsFullscreen(false);
        });
    }
  };

  const formattedDate = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Mask patient name for medical privacy
  const getMaskedName = (name?: string) => {
    if (!name) return 'Pasien Terdaftar';
    const words = name.split(' ');
    if (words.length === 1) {
      return words[0].slice(0, 3) + '***';
    }
    return `${words[0]} ${words[1].slice(0, 2)}***`;
  };

  return (
    <div
      className={`text-slate-900 dark:text-slate-100 flex flex-col justify-between select-none transition-colors duration-150 w-full max-w-full overflow-x-hidden ${
        isTvModeExpanded
          ? 'fixed inset-0 z-50 w-full h-screen p-4 sm:p-6 lg:p-8 2xl:p-10 overflow-y-auto bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur-sm'
          : 'min-h-[calc(100vh-4rem)] p-4 sm:p-6 bg-transparent'
      }`}
    >
      {/* 1. Header Bar: Hospital Name, Realtime Clock & Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 2xl:w-14 2xl:h-14 rounded-xl bg-emerald-700 dark:bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-8 2xl:h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <h1 className="text-base sm:text-xl 2xl:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {bpjsConfig.namaFaskes}
              </h1>
              <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-emerald-950 text-slate-700 dark:text-emerald-400 font-mono font-semibold">
                PPK: {bpjsConfig.kodePPK}
              </span>
              {isTvModeExpanded && (
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-700 text-white animate-pulse">
                  <Tv className="w-3 h-3" />
                  <span>Mode TV Fullscreen</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs 2xl:text-sm text-slate-500 dark:text-slate-400">
              <span className="truncate max-w-xs sm:max-w-md">
                Kampung Bebek Kebonsari RT.05 RW.03, Candi - Sidoarjo
              </span>
              {openMapModal && (
                <button
                  onClick={openMapModal}
                  className="text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer shrink-0"
                >
                  <MapPin className="w-3 h-3" />
                  <span>Lihat Peta</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-wrap sm:flex-nowrap justify-between sm:justify-end w-full sm:w-auto">
          {/* New View Option for Main Display */}
          <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 text-xs shadow-xs">
            <button
              onClick={() => setDisplayViewOption('live')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                displayViewOption === 'live'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Layar Antrean</span>
            </button>
            <button
              onClick={() => setDisplayViewOption('statistics')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                displayViewOption === 'statistics'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Statistik Antrean</span>
            </button>
          </div>

          <div className="text-right">
            <div className="text-xl sm:text-3xl 2xl:text-4xl font-extrabold tracking-tight font-mono text-emerald-800 dark:text-emerald-400 tabular-nums">
              {formattedTime} <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-sans font-medium">WIB</span>
            </div>
            <div className="text-[11px] sm:text-xs 2xl:text-sm text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 dark:text-slate-500" />
              <span>{formattedDate}</span>
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            title={isTvModeExpanded ? 'Keluar Layar Penuh (ESC)' : 'Mode Layar TV Penuh (Fullscreen)'}
            className={`p-2 sm:p-2.5 2xl:p-3 rounded-lg border transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
              isTvModeExpanded
                ? 'bg-emerald-700 text-white border-emerald-600'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {isTvModeExpanded ? <Minimize2 className="w-4 h-4 2xl:w-5 2xl:h-5" /> : <Maximize2 className="w-4 h-4 2xl:w-5 2xl:h-5" />}
            <span className="text-xs font-semibold hidden md:inline">
              {isTvModeExpanded ? 'Keluar TV' : 'Layar Penuh TV'}
            </span>
          </button>
        </div>
      </div>

      {/* Main View: Either Statistics Dashboard or Live Calling Screen */}
      {displayViewOption === 'statistics' ? (
        <div className="my-4 flex-1">
          <QueueStatisticsDashboard
            isEmbeddedInTV={true}
            onBackToTV={() => setDisplayViewOption('live')}
          />
        </div>
      ) : (
        /* 2. Main Content Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 flex-1 items-stretch w-full min-w-0 max-w-full">
        {/* Left Column: Calling Spotlight or Free-standing Cartoon Nurse (7 Cols) */}
        <div
          className={`lg:col-span-7 flex flex-col justify-between relative transition-all duration-300 min-w-0 ${
            currentCalledTicket
              ? 'rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 2xl:p-10 shadow-xs'
              : 'p-3 sm:p-6 2xl:p-8 items-center justify-center'
          }`}
        >
          {/* Audio Speaking Ripple Indicator & Waveform */}
          {ttsState.isSpeaking && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-600 text-emerald-900 dark:text-emerald-300 px-3 py-1.5 rounded-md text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-ping" />
              <Volume2 className="w-4 h-4" />
              <span>Suara Speaker Memanggil</span>
              {/* Dynamic Sound Equalizer Wave Bars */}
              <div className="flex items-end gap-0.5 h-3 ml-1">
                <span className="w-1 bg-emerald-600 h-2 animate-bounce" />
                <span className="w-1 bg-emerald-600 h-3 animate-bounce [animation-delay:0.1s]" />
                <span className="w-1 bg-emerald-600 h-1.5 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1 bg-emerald-600 h-2.5 animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          )}

          <div className="w-full flex flex-col items-center">
            {/* Header label above active call or waiting status */}
            <div className="flex items-center gap-2 text-xs 2xl:text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 mb-2">
              <Radio className="w-4 h-4" />
              <span>{currentCalledTicket ? 'Nomor Antrean Sedang Dipanggil' : 'Menunggu Panggilan Petugas'}</span>
            </div>

            {/* If there is an active called ticket */}
            {currentCalledTicket ? (
              <div className="text-center py-6 sm:py-10 2xl:py-14 w-full">
                <div
                  className={`text-5xl sm:text-7xl md:text-8xl 2xl:text-[11rem] font-black tracking-tight font-mono tabular-nums transition-colors leading-none truncate max-w-full px-2 ${
                    ttsState.isSpeaking
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-950 dark:text-white'
                  }`}
                >
                  {currentCalledTicket.nomorAntrean}
                </div>

                {/* Destination Room / Loket */}
                <div className="mt-3 sm:mt-4 2xl:mt-6 inline-block bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-2 sm:py-2.5 2xl:px-8 2xl:py-3.5 rounded-lg shadow-xs max-w-full">
                  <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm 2xl:text-base mr-2 font-medium">Tujuan:</span>
                  <span className="text-base sm:text-xl md:text-2xl 2xl:text-3xl font-bold text-slate-900 dark:text-emerald-300 tracking-tight">
                    {currentCalledTicket.loketDipanggil || 'Menuju Ruangan Pelayanan'}
                  </span>
                </div>
              </div>
            ) : (
              /* Cartoon Nurse Host: Standalone, Zero Background, No Borders, Not inside a box */
              <div className="py-2 sm:py-4 text-center flex flex-col items-center justify-center w-full">
                <AnimatedHumanNurse size="lg" showGreeting={true} />
              </div>
            )}
          </div>

          {/* Details Bar of Current Patient or Waiting Guide (No rigid nested boxes when waiting) */}
          <div className="w-full mt-4">
            {currentCalledTicket ? (
              <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg p-4 sm:p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs 2xl:text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Nama Pasien</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {getMaskedName(currentCalledTicket.namaPasien)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Kategori</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {currentCalledTicket.kategori === 'BPJS' ? 'BPJS Kesehatan (JKN)' : currentCalledTicket.kategori || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Poli Tujuan</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {currentCalledTicket.poliTujuan || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Kode Booking BPJS</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                      {currentCalledTicket.kodeBooking || '-'}
                    </span>
                  </div>
                </div>

                {/* Quick Re-announce Button (When active ticket exists) */}
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {ttsState.currentText ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-mono truncate max-w-md block">
                        &quot;{ttsState.currentText}&quot;
                      </span>
                    ) : (
                      <span>Tekan panggil ulang jika pasien belum hadir di loket</span>
                    )}
                  </div>
                  <button
                    onClick={panggilUlang}
                    disabled={ttsState.isSpeaking}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors border border-slate-300 dark:border-slate-700 shadow-xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Panggil Ulang Suara</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Borderless Clean Step Guidance When Waiting */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs text-slate-600 dark:text-slate-300 text-center max-w-2xl mx-auto pt-2">
                <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 backdrop-blur-xs">
                  <strong className="block text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-0.5">1. Siapkan Dokumen</strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">KTP / NIK atau KIS Digital di Mobile JKN</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 backdrop-blur-xs">
                  <strong className="block text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-0.5">2. Dengarkan Speaker</strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Denting bel mendahului panggilan nama/nomor</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 backdrop-blur-xs">
                  <strong className="block text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-0.5">3. Menuju Loket / Poli</strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Poli Umum 1 &amp; 2, KIA, atau Farmasi</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Lokets Status & Media Banner (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4 min-w-0">
          {/* Active Counters Grid */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex-1">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xs font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
                Status Ruangan Pelayanan
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Live FKTP</span>
            </div>

            <div className="space-y-2">
              {lokets.slice(0, 5).map((loket) => {
                const isCurrentBeingCalled = currentCalledTicket?.loketDipanggil?.includes(loket.nama.split('-')[0].trim());
                return (
                  <div
                    key={loket.id}
                    className={`flex items-center justify-between p-3 2xl:p-4 rounded-lg border transition-colors ${
                      isCurrentBeingCalled
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-600/50'
                        : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800/80'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-xs 2xl:text-sm text-slate-900 dark:text-slate-100 truncate">
                        {loket.nama}
                      </div>
                      <div className="text-[11px] 2xl:text-xs text-slate-500 dark:text-slate-400 truncate">
                        {loket.petugas}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] 2xl:text-xs text-slate-500 dark:text-slate-400 block">Antrean</span>
                      <span className="font-mono font-bold text-lg 2xl:text-2xl text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {isCurrentBeingCalled && currentCalledTicket ? currentCalledTicket.nomorAntrean : '--'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Informational Media Banner / Slideshow */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden relative shadow-xs">
            <div className="relative h-44 2xl:h-56 w-full bg-slate-900 group">
              <a
                href={slideImages[currentSlideIndex].mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Klik untuk membuka lokasi klinik di Google Maps"
                className="block w-full h-full cursor-pointer"
              >
                <img
                  src={slideImages[currentSlideIndex].src}
                  alt={slideImages[currentSlideIndex].title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                
                {/* Google Maps Link Badge */}
                <div
                  className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/75 group-hover:bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold backdrop-blur transition-all shadow-xs z-10"
                >
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>Google Maps Lokasi</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                </div>

                <div className="absolute bottom-3 left-4 right-4 z-10">
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-0.5">
                    Informasi Klinik &amp; Foto Lokasi Resmi
                  </span>
                  <h3 className="text-sm 2xl:text-base font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                    {slideImages[currentSlideIndex].title}
                  </h3>
                  <p className="text-xs 2xl:text-sm text-slate-300 line-clamp-1">
                    {slideImages[currentSlideIndex].desc}
                  </p>
                </div>
              </a>

              {/* Indicator dots */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                {slideImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentSlideIndex(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === currentSlideIndex ? 'bg-emerald-400 w-4' : 'bg-white/60 w-1.5'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 3. Bottom Marquee Running Ticker */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex items-center gap-3 w-full max-w-full min-w-0 overflow-hidden" style={{ contain: 'paint' }}>
        <span className="bg-emerald-700 dark:bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded shrink-0 uppercase tracking-wider">
          Pengumuman
        </span>
        <div className="overflow-hidden whitespace-nowrap text-xs 2xl:text-sm text-slate-700 dark:text-slate-300 relative flex-1 min-w-0 font-medium" style={{ contain: 'paint' }}>
          <div className="inline-block animate-marquee">
            Selamat Datang di {bpjsConfig.namaFaskes} · Alamat: Kampung Bebek dan Telur Asin, Kebonsari RT.05 RW.03 Candi - Sidoarjo · Mohon memperhatikan panggilan nomor antrean melalui pengeras suara · Pasien BPJS harap menyiapkan NIK/KTP atau Kartu KIS Digital Mobile JKN · Layanan Poli Umum (dr. Machmujur &amp; dr. Diana), KIA &amp; KB, Prolanis, serta Farmasi buka setiap hari Senin s/d Sabtu.
          </div>
        </div>
      </div>
    </div>
  );
};
