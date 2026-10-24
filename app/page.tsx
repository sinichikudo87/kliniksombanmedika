'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QueueProvider, useQueue } from '@/lib/queue-context';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';
import { KioskMode } from '@/components/KioskMode';
import { OperatorDashboard } from '@/components/OperatorDashboard';
import { TvDisplayMode } from '@/components/TvDisplayMode';
import { SecurityDatabaseView } from '@/components/SecurityDatabaseView';
import { BridgingSettingsModal } from '@/components/BridgingSettingsModal';
import { InitialLoginView } from '@/components/InitialLoginView';
import { ChangePasswordModal } from '@/components/ChangePasswordModal';
import Image from 'next/image';
import { ShieldCheck, ArrowRight, HeartPulse, Sparkles, Building2, Phone, Mail, Lock } from 'lucide-react';

function MainApp() {
  const { user, isAuthenticated } = useAuth();
  const [currentTab, setCurrentTab] = useState<'KIOSK' | 'OPERATOR' | 'SECURITY' | 'TV'>('KIOSK');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPatientBypass, setIsPatientBypass] = useState(false);
  const { bpjsConfig } = useQueue();

  const isRmeAdmin = Boolean(user && user.role === 'ADMIN_RME');

  const prevAuthRef = useRef(isAuthenticated);
  useEffect(() => {
    // If user was logged in and now logged out, return to Login Form screen
    if (prevAuthRef.current && !isAuthenticated) {
      setIsPatientBypass(false);
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // Initial Screen: Display Login Form first if not logged in
  if (!isAuthenticated && !isPatientBypass) {
    return (
      <InitialLoginView
        onBypassToKiosk={() => {
          setIsPatientBypass(true);
          setCurrentTab('KIOSK');
        }}
      />
    );
  }

  // Jika login terdeteksi menggunakan password awal (000000), redirect wajib ubah password
  if (isAuthenticated && user?.mustChangePassword) {
    return (
      <div className="relative min-h-screen bg-slate-900 flex items-center justify-center p-4 overflow-hidden">
        {/* Large Transparent Background Watermark Logo */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
          <div className="relative w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] opacity-[0.06] grayscale transform -rotate-12">
            <Image
              src="/assets/aistudio/Logo-01.jpg_cdb7cbc6.jpeg"
              alt="Watermark Logo Somban Medika"
              fill
              className="object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <ChangePasswordModal
          isOpen={true}
          onClose={() => {}}
          isMandatory={true}
        />
      </div>
    );
  }

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
    <div className="relative min-h-screen bg-slate-100/70 text-slate-900 flex flex-col justify-between font-sans overflow-hidden">
      {/* Large Transparent Background Watermark Logo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
        <div className="relative w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] lg:w-[880px] lg:h-[880px] opacity-[0.035] grayscale transform -rotate-12">
          <Image
            src="/assets/aistudio/Logo-01.jpg_cdb7cbc6.jpeg"
            alt="Watermark Logo Somban Medika"
            fill
            className="object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <div className="relative z-10">
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {currentTab === 'KIOSK' && <KioskMode />}
          {currentTab === 'OPERATOR' && <OperatorDashboard />}
          {currentTab === 'SECURITY' && (
            isRmeAdmin ? (
              <SecurityDatabaseView />
            ) : (
              <div className="bg-white rounded-3xl p-8 sm:p-12 border border-red-200 text-center max-w-xl mx-auto my-12 shadow-lg">
                <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Akses Terbatas: Administrator RME</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Modul Keamanan dan Basis Data hanya dapat dilihat oleh Administrator RME.
                </p>
              </div>
            )
          )}
        </main>
      </div>

      {/* Hospital Footer */}
      <footer className="relative z-10 bg-white border-t border-slate-200/80 mt-12 py-8">
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
    <AuthProvider>
      <QueueProvider>
        <MainApp />
      </QueueProvider>
    </AuthProvider>
  );
}
