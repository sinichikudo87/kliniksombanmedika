'use client';

import React, { useState, useEffect } from 'react';
import { useQueue } from '@/lib/queue-context';
import { chimePlayer } from '@/lib/tts-announcer';
import {
  CreditCard,
  Tv,
  LayoutDashboard,
  ShieldCheck,
  Settings,
  Volume2,
  VolumeX,
  BellRing,
  Activity,
  Lock,
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'KIOSK' | 'OPERATOR' | 'SECURITY' | 'TV';
  setCurrentTab: (tab: 'KIOSK' | 'OPERATOR' | 'SECURITY' | 'TV') => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenSettings }) => {
  const { bpjsConfig, audioEnabled, setAudioEnabled } = useQueue();
  const [formattedTime, setFormattedTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      setFormattedTime(
        new Date().toLocaleTimeString('id-ID', {
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

  const handleTestChime = async () => {
    await chimePlayer.playChime();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Clinic Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-sm ring-1 ring-emerald-700/20 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-[15px] text-slate-900 tracking-tight truncate">
                  {bpjsConfig.namaFaskes}
                </span>
                <span className="hidden xl:inline text-[11px] font-mono text-slate-400">·</span>
                <span className="hidden xl:inline text-[11px] font-mono text-slate-500">
                  KD: {bpjsConfig.kdFaskes}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-emerald-700 font-semibold">Bridging VClaim & PCare</span>
                <span className="text-slate-300">·</span>
                <span className="font-mono text-slate-600">CID: {bpjsConfig.consId}</span>
              </div>
            </div>
          </div>

          {/* Navigation Controls (Desktop Segmented Bar) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 shadow-2xs">
            <button
              onClick={() => setCurrentTab('KIOSK')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'KIOSK'
                  ? 'bg-white text-emerald-900 shadow-xs ring-1 ring-slate-900/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <CreditCard className={`w-3.5 h-3.5 ${currentTab === 'KIOSK' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Kios Mandiri</span>
            </button>

            <button
              onClick={() => setCurrentTab('OPERATOR')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'OPERATOR'
                  ? 'bg-white text-emerald-900 shadow-xs ring-1 ring-slate-900/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <LayoutDashboard className={`w-3.5 h-3.5 ${currentTab === 'OPERATOR' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Dashboard Loket</span>
            </button>

            <button
              onClick={() => setCurrentTab('TV')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'TV'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Tv className={`w-3.5 h-3.5 ${currentTab === 'TV' ? 'text-emerald-200' : 'text-slate-400'}`} />
              <span>Mode TV Display</span>
            </button>

            <button
              onClick={() => setCurrentTab('SECURITY')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'SECURITY'
                  ? 'bg-white text-emerald-900 shadow-xs ring-1 ring-slate-900/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Lock className={`w-3.5 h-3.5 ${currentTab === 'SECURITY' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Database Terenkripsi</span>
            </button>
          </nav>

          {/* Right Area: Live Clock, Audio Controls, Bridging Settings */}
          <div className="flex items-center gap-2">
            {/* Live Monospace Clock */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-700 shadow-2xs">
              <span>{formattedTime || '--:--:--'}</span>
              <span className="text-[10px] text-slate-400 font-sans font-semibold">WIB</span>
            </div>

            {/* Audio Toggle */}
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              title={audioEnabled ? 'Audio Notifikasi Aktif' : 'Audio Dinonaktifkan'}
              className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all ${
                audioEnabled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/70 shadow-2xs'
                  : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Hospital Chime Test Bell */}
            <button
              onClick={handleTestChime}
              title="Test Bunyi Bel Notifikasi (Chime)"
              className="h-9 w-9 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors shadow-2xs"
            >
              <BellRing className="w-4 h-4" />
            </button>

            {/* Bridging Settings Modal Button */}
            <button
              onClick={onOpenSettings}
              title="Konfigurasi Kredensial Bridging BPJS"
              className="h-9 px-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline font-semibold">Bridging BPJS</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Sub-bar */}
        <div className="lg:hidden flex items-center justify-between py-2 border-t border-slate-100 gap-1 overflow-x-auto">
          <button
            onClick={() => setCurrentTab('KIOSK')}
            className={`flex-1 min-w-[76px] py-1.5 px-2 rounded-lg text-center text-xs font-medium transition-colors ${
              currentTab === 'KIOSK'
                ? 'bg-emerald-50 text-emerald-800 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kios
          </button>
          <button
            onClick={() => setCurrentTab('OPERATOR')}
            className={`flex-1 min-w-[76px] py-1.5 px-2 rounded-lg text-center text-xs font-medium transition-colors ${
              currentTab === 'OPERATOR'
                ? 'bg-emerald-50 text-emerald-800 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Loket
          </button>
          <button
            onClick={() => setCurrentTab('TV')}
            className={`flex-1 min-w-[76px] py-1.5 px-2 rounded-lg text-center text-xs font-medium transition-colors ${
              currentTab === 'TV'
                ? 'bg-emerald-700 text-white font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mode TV
          </button>
          <button
            onClick={() => setCurrentTab('SECURITY')}
            className={`flex-1 min-w-[76px] py-1.5 px-2 rounded-lg text-center text-xs font-medium transition-colors ${
              currentTab === 'SECURITY'
                ? 'bg-emerald-50 text-emerald-800 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Keamanan
          </button>
        </div>
      </div>
    </header>
  );
};
