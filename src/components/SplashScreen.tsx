import React, { useEffect, useState, useRef } from 'react';
import {
  Activity,
  ShieldCheck,
  Volume2,
  Sparkles,
  ChevronRight,
  Database,
  Building2,
  HeartPulse,
} from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  durationMs = 1800,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Memulai sistem antrean...');
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const triggerFinish = () => {
    try {
      sessionStorage.setItem('somban_splash_shown_v1', 'true');
    } catch (e) {}
    onFinishRef.current();
  };

  useEffect(() => {
    const startTime = Date.now();
    const intervalTime = 30;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const calculated = Math.min(100, Math.round((elapsed / durationMs) * 100));

      setProgress(calculated);

      // Realistic system loading milestones
      if (calculated < 20) {
        setStatusMessage('Menyiapkan antarmuka antrean & komponen responsif...');
      } else if (calculated < 45) {
        setStatusMessage('Menginisialisasi modul suara Text-to-Speech (Indonesian Voice)...');
      } else if (calculated < 70) {
        setStatusMessage('Menghubungkan layanan bridging BPJS Kesehatan & SatuSehat...');
      } else if (calculated < 92) {
        setStatusMessage('Sinkronisasi data loket pemanggil & statistik...');
      } else {
        setStatusMessage('Sistem siap! Mengalihkan ke portal faskes...');
      }

      if (calculated >= 100) {
        clearInterval(timer);
        setIsFadingOut(true);
        setTimeout(() => {
          triggerFinish();
        }, 200);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [durationMs]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      triggerFinish();
    }, 50);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 text-slate-800 dark:text-white select-none transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top Bar: Skip button & Institution tag */}
      <div className="w-full max-w-4xl flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
          <span className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-emerald-800 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60">
            Klinik Somban Medika • Sidoarjo
          </span>
        </div>

        <button
          onClick={handleSkip}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700/80 backdrop-blur transition-all cursor-pointer shadow-xs hover:border-slate-300 group"
        >
          <span>Lewati</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Main Center Content: Hospital Branding & Pulse Animation */}
      <div className="flex flex-col items-center justify-center text-center my-auto max-w-lg px-4">
        {/* Pulsing Glowing Emblem */}
        <div className="relative mb-6">
          {/* Subtle Outer Glowing Rings */}
          <div className="absolute -inset-4 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
          <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 opacity-60 blur-xs animate-spin duration-7000" />

          {/* Central Logo Container */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 dark:shadow-emerald-500/30 flex items-center justify-center">
            <HeartPulse className="w-12 h-12 sm:w-14 sm:h-14 text-emerald-600 dark:text-emerald-400 animate-pulse drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            
            {/* Small Floating Sparkle */}
            <div className="absolute -top-1.5 -right-1.5 p-1 bg-emerald-600 text-white rounded-full shadow-md">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>

        {/* Institution Title */}
        <div className="space-y-1.5 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-[11px] sm:text-xs font-medium font-mono mb-1">
            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>FASKES TINGKAT PERTAMA (FKTP)</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            KLINIK SOMBAN MEDIKA
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Sistem Manajemen Antrean Terpadu, Layanan Poliklinik &amp; Bridging BPJS SatuSehat
          </p>
        </div>

        {/* Progress Bar & Numerical Counter */}
        <div className="w-full max-w-md space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-600 dark:text-slate-400 truncate max-w-[280px] sm:max-w-[340px] text-left">
              {statusMessage}
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold ml-2 shrink-0">
              {progress}%
            </span>
          </div>

          {/* Track Bar */}
          <div className="w-full h-2.5 sm:h-3 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 transition-all duration-100 ease-out shadow-[0_0_10px_rgba(16,185,129,0.4)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* System Capability Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-8 text-[11px] text-slate-700 dark:text-slate-300 font-mono">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 shadow-xs">
            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>BPJS Antrean Online</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 shadow-xs">
            <Activity className="w-3 h-3 text-teal-600 dark:text-teal-400" />
            <span>SatuSehat Kemenkes</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 shadow-xs">
            <Volume2 className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            <span>Multi-Loket TTS Voice</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 shadow-xs">
            <Database className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>Stored Procedures</span>
          </span>
        </div>
      </div>

      {/* Bottom Footer: Version & Legal */}
      <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 pt-4 border-t border-slate-200 dark:border-slate-800/60 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-600 dark:text-slate-400">Versi 1.0</span>
          <span>•</span>
          <span>Sidoarjo, Jawa Timur</span>
        </div>
        <p>© 2026 Klinik Somban Medika. All rights reserved.</p>
      </div>
    </div>
  );
};
