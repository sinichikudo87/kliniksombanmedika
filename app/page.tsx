'use client';

import React, { useState } from 'react';
import { QueueProvider, useQueue } from '@/lib/queue-context';
import { Navbar } from '@/components/Navbar';
import { KioskMode } from '@/components/KioskMode';
import { OperatorDashboard } from '@/components/OperatorDashboard';
import { TvDisplayMode } from '@/components/TvDisplayMode';
import { SecurityDatabaseView } from '@/components/SecurityDatabaseView';
import { BridgingSettingsModal } from '@/components/BridgingSettingsModal';
import { ShieldCheck, ArrowRight, HeartPulse, Sparkles, Building2, Phone, Mail } from 'lucide-react';

function MainApp() {
  const [currentTab, setCurrentTab] = useState<'KIOSK' | 'OPERATOR' | 'SECURITY' | 'TV'>('KIOSK');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { bpjsConfig } = useQueue();

  // If in TV Mode, render fullscreen waiting room display
  if (currentTab === 'TV') {
    return (
      <div className="relative">
        <button
          onClick={() => setCurrentTab('OPERATOR')}
          className="fixed top-4 left-4 z-50 bg-slate-900/90 hover:bg-slate-800 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700/80 backdrop-blur-md transition-all shadow-lg flex items-center gap-2 opacity-60 hover:opacity-100"
          title="Keluar dari Mode TV"
        >
          ← Kembali ke Dashboard
        </button>
        <TvDisplayMode onExitFullscreen={() => setCurrentTab('OPERATOR')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col justify-between font-sans">
      <div>
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {currentTab === 'KIOSK' && <KioskMode />}
          {currentTab === 'OPERATOR' && <OperatorDashboard />}
          {currentTab === 'SECURITY' && <SecurityDatabaseView />}
        </main>
      </div>

      {/* Hospital Footer */}
      <footer className="bg-white border-t border-slate-200/80 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-slate-500">
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm">
                  {bpjsConfig.namaFaskes}
                </span>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                  Kode Faskes: {bpjsConfig.kdFaskes}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed max-w-md">
                Sistem Antrean Online & Bridging Terintegrasi VClaim (Eclaim) dan PCare BPJS Kesehatan.
                Mendukung estimasi otomatis waktu tunggu pasien, Text-to-Speech (TTS) Indonesia,
                display TV ruang tunggu, dan penyimpanan rekam medis terenkripsi AES-256-GCM.
              </p>
            </div>

            <div>
              <p className="font-bold text-slate-800 mb-2 uppercase tracking-wider text-[11px]">
                Kredensial Bridging Terverifikasi
              </p>
              <ul className="space-y-1.5 text-slate-600">
                <li>Consumer ID: <strong className="font-mono text-slate-900">{bpjsConfig.consId}</strong></li>
                <li>User Key: <strong className="font-mono text-slate-900">4a1a8423...</strong></li>
                <li>User Dev: <strong className="font-mono text-slate-900">{bpjsConfig.userPcareDev}</strong></li>
                <li>Status: <span className="text-emerald-700 font-semibold">Bridging Terhubung</span></li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-slate-800 mb-2 uppercase tracking-wider text-[11px]">
                Vendor & Kontak Faskes
              </p>
              <ul className="space-y-1.5 text-slate-600">
                <li className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pengembangan Sendiri (Internal)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{bpjsConfig.emailFaskes}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Enkripsi Standar UU PDP No. 27/2022</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <p suppressHydrationWarning>© {new Date().getFullYear()} {bpjsConfig.namaFaskes}. Seluruh hak cipta dilindungi.</p>
            <p>Bridging Trustmark API v2.0 · Next.js 15 App Router · WebCrypto AES-GCM</p>
          </div>
        </div>
      </footer>

      <BridgingSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default function Home() {
  return (
    <QueueProvider>
      <MainApp />
    </QueueProvider>
  );
}
