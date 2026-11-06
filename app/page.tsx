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
import {
  ShieldCheck,
  ArrowRight,
  HeartPulse,
  Sparkles,
  Building2,
  Phone,
  Mail,
  Lock,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { showSwalSuccess, showSwalError } from '@/lib/swal';
import { exportWsFktpExcel } from '@/lib/client-excel-export';

function MainApp() {
  const { user, isAuthenticated, isAuthLoaded } = useAuth();
  const [currentTab, setCurrentTab] = useState<'KIOSK' | 'OPERATOR' | 'SECURITY' | 'TV'>('KIOSK');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPatientBypass, setIsPatientBypass] = useState(false);
  const { bpjsConfig, updateBpjsConfig, testBridgingPing } = useQueue();
  const [isPinging, setIsPinging] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  const isBridgingConnected = bpjsConfig.isOnline === true;

  const handleTestPingFromFooter = async () => {
    setIsPinging(true);
    try {
      const res = await testBridgingPing();
      if (res && res.success && res.isWhitelisted) {
        showSwalSuccess(
          res.message || `Tes koneksi ke Web Service BPJS terverifikasi terhubung (${res.latencyMs} ms). Domain https://kliniksombanmedika.id/ aktif di-whitelist.`,
          'Bridging Terhubung'
        );
      } else {
        showSwalError(
          res.message || 'Koneksi ke endpoint BPJS belum terbuka. Pastikan domain faskes (https://kliniksombanmedika.id/) telah di-whitelist oleh tim BPJS Kesehatan.',
          'Status Bridging'
        );
      }
    } catch (err: any) {
      showSwalError('Koneksi BPJS gagal: ' + (err.message || 'Handshake timeout'), 'Status Bridging');
    } finally {
      setIsPinging(false);
    }
  };

  const handleDownloadExcel = () => {
    setIsDownloadingExcel(true);
    try {
      const defaultDomain = typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://kliniksombanmedika.id';

      const ok = exportWsFktpExcel({
        customBaseUrl: defaultDomain,
        namaFaskes: bpjsConfig.namaFaskes,
        kdFaskes: bpjsConfig.kdFaskes,
      });
      if (ok) {
        showSwalSuccess('File Excel resmi BPJS (URL WS FKTP Production) berhasil diunduh ke komputer Anda.', 'Download Berhasil');
      } else {
        showSwalError('Gagal menyiapkan file Excel.', 'Download Gagal');
      }
    } catch (err: any) {
      showSwalError('Terjadi kendala saat download Excel: ' + (err?.message || ''), 'Download Gagal');
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const isRmeAdmin = Boolean(user && user.role === 'ADMIN_RME');
  const isAdministrator = Boolean(
    isAuthenticated &&
    user &&
    (user.role === 'ADMIN_BRIDGING' || user.role === 'ADMIN_RME' || user.role.toUpperCase().includes('ADMIN'))
  );

  const prevAuthRef = useRef(isAuthenticated);
  useEffect(() => {
    // If user was logged in and now logged out, return to Login Form screen
    if (prevAuthRef.current && !isAuthenticated) {
      setIsPatientBypass(false);
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // Loading state during initial client hydration to ensure SSR and Client match
  if (!isAuthLoaded) {
    return (
      <div className="relative min-h-screen bg-slate-900 flex items-center justify-center p-4 overflow-hidden">
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
          <div className="relative w-[360px] h-[360px] opacity-[0.05] grayscale transform -rotate-12">
            <Image
              src="/assets/images/Logo-01.jpg_cdb7cbc6.jpeg"
              alt="Watermark Logo Somban Medika"
              fill
              className="object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4 text-slate-300">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-sm font-medium tracking-wide text-slate-400">Memuat Sistem Antrean Klinik Somban Medika...</p>
        </div>
      </div>
    );
  }

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
              src="/assets/images/Logo-01.jpg_cdb7cbc6.jpeg"
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
    <div className="relative min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans overflow-hidden">
      {/* Large Transparent Background Watermark Logo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
        <div className="relative w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] lg:w-[880px] lg:h-[880px] opacity-[0.035] grayscale transform -rotate-12">
          <Image
            src="/assets/images/Logo-01.jpg_cdb7cbc6.jpeg"
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
            <div className="space-y-2.5 md:col-span-2">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm">
                  {bpjsConfig.namaFaskes}
                </span>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                  Kode Faskes: {bpjsConfig.kdFaskes}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed max-w-md">
                Sistem Antrean Online &amp; Bridging Terintegrasi BPJS Kesehatan (Mobile JKN &amp; PCare).
                Mendukung estimasi otomatis waktu tunggu pasien, Text-to-Speech (TTS) Indonesia,
                display TV ruang tunggu, dan penyimpanan rekam medis terenkripsi AES-256-GCM.
              </p>

              {/* Direct Excel Download Action in Footer - Hanya tampil jika sudah login */}
              {isAuthenticated && (
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleDownloadExcel}
                    disabled={isDownloadingExcel}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
                    title="Download File Dokumen Excel Format BPJS Kesehatan (.xlsx)"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                    <span>{isDownloadingExcel ? 'Menyiapkan File...' : 'Download Excel WS FKTP (.xlsx)'}</span>
                    <Download className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 text-[11px] font-medium bg-emerald-50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Format Resmi BPJS KC Sidoarjo
                  </span>
                </div>
              )}
            </div>

            {/* Kredensial & Status Bridging - Hanya tampil jika sudah login */}
            {isAuthenticated ? (
              <div>
                <p className="font-bold text-slate-800 mb-2 uppercase tracking-wider text-[11px]">
                  Kredensial Bridging Terverifikasi
                </p>
                <ul className="space-y-1.5 text-slate-600">
                  <li>Consumer ID: <strong className="font-mono text-slate-900">******</strong></li>
                  <li>User Key: <strong className="font-mono text-slate-900">4a1a8423...</strong></li>
                  <li>User Dev: <strong className="font-mono text-slate-900">{bpjsConfig.userPcareDev}</strong></li>
                  <li className="pt-1">
                    <div className="flex flex-col gap-1.5">
                      <span className="font-semibold text-slate-700">Status Bridging:</span>
                      <div className="flex flex-wrap items-center gap-2">
                        {isBridgingConnected ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Bridging Terhubung (Live)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs" title="IP Server faskes belum di-whitelist oleh tim TI BPJS">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                            <span>Menunggu Whitelist IP BPJS</span>
                          </span>
                        )}
                      </div>

                      <div className="mt-1">
                        <button
                          onClick={handleTestPingFromFooter}
                          disabled={isPinging}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                          title="Uji koneksi ping handshake ke BPJS"
                        >
                          <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin text-emerald-600' : ''}`} />
                          <span>{isPinging ? 'Menguji...' : 'Uji Ping BPJS'}</span>
                        </button>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            ) : (
              <div>
                <p className="font-bold text-slate-800 mb-2 uppercase tracking-wider text-[11px]">
                  Layanan Antrean & RME
                </p>
                <ul className="space-y-1.5 text-slate-600">
                  <li>Klinik Somban Medika</li>
                  <li>Poli Umum, Gigi, KIA & Laboratorium</li>
                  <li className="text-emerald-700 font-medium">Terintegrasi Sistem BPJS Kesehatan</li>
                </ul>
              </div>
            )}

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

      {isAdministrator && (
        <BridgingSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      )}
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
