'use client';

import React, { useState, useEffect } from 'react';
import { useQueue } from '@/lib/queue-context';
import { useAuth } from '@/lib/auth-context';
import { LoginFormModal } from '@/components/LoginFormModal';
import { ChangePasswordModal } from '@/components/ChangePasswordModal';
import { chimePlayer } from '@/lib/tts-announcer';
import { showSwalSuccess } from '@/lib/swal';
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
  User,
  LogOut,
  LogIn,
  Stethoscope,
  KeyRound,
  Menu,
  X,
  Clock,
  Sparkles,
  ChevronDown,
  Database,
  SlidersHorizontal,
} from 'lucide-react';

import Image from 'next/image';

interface NavbarProps {
  currentTab: 'KIOSK' | 'OPERATOR' | 'SECURITY' | 'TV';
  setCurrentTab: (tab: 'KIOSK' | 'OPERATOR' | 'SECURITY' | 'TV') => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenSettings }) => {
  const { bpjsConfig, audioEnabled, setAudioEnabled } = useQueue();
  const {
    user,
    isAuthenticated,
    logout,
    isLoginModalOpen,
    setIsLoginModalOpen,
    isChangePasswordModalOpen,
    setIsChangePasswordModalOpen,
    lastLoginSource,
  } = useAuth();
  const [formattedTime, setFormattedTime] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Keamanan dan DB hanya bisa dilihat oleh Administrator RME
  const isRmeAdmin = Boolean(user && (user.role === 'ADMIN_RME' || user.role === 'ADMIN'));

  // Menu Set Bridging BPJS HANYA tampil jika yang login adalah Administrator
  const isAdministrator = Boolean(
    isAuthenticated &&
    user &&
    (user.role === 'ADMIN' || user.role === 'ADMIN_BRIDGING' || user.role === 'ADMIN_RME' || user.role.toUpperCase().includes('ADMIN'))
  );

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
    showSwalSuccess('Bunyi bel antrean berhasil dimainkan!', 'Test Bel Notifikasi');
  };

  const handleToggleAudio = () => {
    const nextVal = !audioEnabled;
    setAudioEnabled(nextVal);
    showSwalSuccess(
      nextVal ? 'Audio bel & suara panggil TTS diaktifkan.' : 'Audio dinonaktifkan (hening).',
      nextVal ? 'Audio Aktif' : 'Audio Nonaktif'
    );
  };

  const maskedConsId = '******';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
          {/* Brand Logo & Clinic Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-white shadow-xs border border-slate-200 flex items-center justify-center shrink-0">
              <Image
                src="/assets/images/Logo-01.jpg_cdb7cbc6.jpeg"
                alt="Logo Somban Medika"
                width={40}
                height={40}
                className="w-full h-full object-contain p-0.5"
                referrerPolicy="no-referrer"
                priority
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-xs sm:text-sm md:text-[15px] text-slate-900 tracking-tight truncate max-w-[140px] sm:max-w-[220px] md:max-w-none">
                  {bpjsConfig.namaFaskes}
                </span>
                <span className="hidden xl:inline text-[11px] font-mono text-slate-400">·</span>
                <span className="hidden xl:inline text-[11px] font-mono text-slate-500">
                  KD: {bpjsConfig.kdFaskes}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-emerald-700 font-semibold truncate">Bridging BPJS</span>
                <span className="hidden sm:inline text-slate-300">·</span>
                <span className="hidden sm:inline font-mono text-slate-600">CID: {maskedConsId}</span>
              </div>
            </div>
          </div>

          {/* Navigation Controls (Desktop Segmented Bar - Clean 3 Core Tabs) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 shadow-2xs">
            <button
              onClick={() => setCurrentTab('KIOSK')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'OPERATOR'
                  ? 'bg-white text-emerald-900 shadow-xs ring-1 ring-slate-900/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <LayoutDashboard className={`w-3.5 h-3.5 ${currentTab === 'OPERATOR' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Loket Antrean</span>
            </button>

            <button
              onClick={() => setCurrentTab('TV')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'TV'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Tv className={`w-3.5 h-3.5 ${currentTab === 'TV' ? 'text-emerald-200' : 'text-slate-400'}`} />
              <span>TV Display</span>
            </button>
          </nav>

          {/* Right Area: Controls & User Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Live Clock (Compact) */}
            <div className="hidden xl:flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-700 shadow-2xs">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{formattedTime || '--:--:--'}</span>
              <span className="text-[9px] text-slate-400 font-sans font-semibold">WIB</span>
            </div>

            {/* Quick Audio Mute/Unmute */}
            <button
              onClick={handleToggleAudio}
              title={audioEnabled ? 'Audio Notifikasi Aktif' : 'Audio Dinonaktifkan'}
              className={`hidden sm:flex h-8 w-8 rounded-lg border items-center justify-center transition-all cursor-pointer ${
                audioEnabled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-2xs'
                  : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
            >
              {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Desktop User Account Pill (Compact & Elegant) */}
            {isAuthenticated && user ? (
              <div className="hidden md:flex items-center gap-1.5 bg-slate-100/90 border border-slate-200 pl-2 pr-1.5 py-1 rounded-xl text-xs">
                <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-2xs">
                  {(user.namaLengkap || (user as any).nama_lengkap || user.username || 'PT').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 text-left pr-1">
                  <div className="font-bold text-slate-800 text-[11px] truncate max-w-[100px] leading-tight">
                    {user.namaLengkap || (user as any).nama_lengkap || user.username}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">
                    [{user.role}]
                  </div>
                </div>

                <div className="flex items-center border-l border-slate-200/80 pl-1 gap-0.5">
                  <button
                    onClick={() => setIsChangePasswordModalOpen(true)}
                    title="Ubah Password Akun"
                    className="p-1 text-slate-500 hover:text-emerald-700 rounded-md hover:bg-white transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={logout}
                    title="Keluar (Logout)"
                    className="p-1 text-red-500 hover:text-red-700 rounded-md hover:bg-white transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="hidden sm:flex h-8 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}

            {/* Master Hamburger / Settings Dropdown Button (Desktop & Mobile) */}
            <div className="relative">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                title="Menu Pengaturan & Fitur Tambahan"
                className={`h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                  isMobileMenuOpen
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {isMobileMenuOpen ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Menu className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Menu</span>
                {/* Indikator status bridging di tombol menu */}
                <span
                  className={`w-2 h-2 rounded-full ${
                    bpjsConfig.isOnline === true ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                  title={bpjsConfig.isOnline === true ? 'BPJS Terhubung' : 'BPJS Belum Whitelist'}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Persistent Mobile Navigation Sub-bar */}
        <div className="lg:hidden flex items-center justify-between py-1.5 border-t border-slate-100 gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              setCurrentTab('KIOSK');
              setIsMobileMenuOpen(false);
            }}
            className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg text-center text-xs font-medium transition-colors ${
              currentTab === 'KIOSK'
                ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kios
          </button>
          <button
            onClick={() => {
              setCurrentTab('OPERATOR');
              setIsMobileMenuOpen(false);
            }}
            className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg text-center text-xs font-medium transition-colors ${
              currentTab === 'OPERATOR'
                ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Loket
          </button>
          <button
            onClick={() => {
              setCurrentTab('TV');
              setIsMobileMenuOpen(false);
            }}
            className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg text-center text-xs font-medium transition-colors ${
              currentTab === 'TV'
                ? 'bg-emerald-700 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mode TV
          </button>
          {isRmeAdmin && (
            <button
              onClick={() => {
                setCurrentTab('SECURITY');
                setIsMobileMenuOpen(false);
              }}
              className={`flex-1 min-w-[85px] py-1.5 px-2 rounded-lg text-center text-xs font-medium transition-colors ${
                currentTab === 'SECURITY'
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              RME & DB
            </button>
          )}
        </div>

        {/* Collapsible Mega Menu Drawer / Panel (Universal for Desktop & Mobile) */}
        {isMobileMenuOpen && (
          <div className="py-3 px-2 sm:px-4 border-t border-slate-200/80 bg-white/95 backdrop-blur-md rounded-b-2xl shadow-xl animate-in slide-in-from-top duration-200 space-y-3">
            {/* Quick Navigation Tabs (For Mobile or Screen Narrowing) */}
            <div className="lg:hidden flex items-center justify-between pb-2 border-b border-slate-100 gap-1 overflow-x-auto no-scrollbar">
              <button
                onClick={() => {
                  setCurrentTab('KIOSK');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg text-center text-xs font-medium transition-colors ${
                  currentTab === 'KIOSK'
                    ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kios Mandiri
              </button>
              <button
                onClick={() => {
                  setCurrentTab('OPERATOR');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg text-center text-xs font-medium transition-colors ${
                  currentTab === 'OPERATOR'
                    ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Loket
              </button>
              <button
                onClick={() => {
                  setCurrentTab('TV');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg text-center text-xs font-medium transition-colors ${
                  currentTab === 'TV'
                    ? 'bg-emerald-700 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mode TV
              </button>
            </div>

            {/* Menu Items Grid: Fitur Lanjutan, Konfigurasi & Admin */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
              {/* 1. Pengaturan Bridging BPJS (Hanya Admin) */}
              {isAdministrator && (
                <button
                  onClick={() => {
                    onOpenSettings();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-start justify-between gap-3 transition-all cursor-pointer ${
                    bpjsConfig.isOnline === true
                      ? 'bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100/70 text-emerald-950'
                      : 'bg-amber-50/80 border-amber-200 hover:bg-amber-100/70 text-amber-950'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      bpjsConfig.isOnline === true ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      <Settings className="w-4 h-4 animate-spin-slow" />
                    </div>
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span>Bridging BPJS</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          bpjsConfig.isOnline === true ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                        }`}>
                          {bpjsConfig.isOnline === true ? 'Online' : 'Pending Whitelist'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                        Kredensial ConsID, Secret, UserKey & status IP faskes
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* 2. Database & Rekam Medis RME (Hanya Admin RME) */}
              {isRmeAdmin && (
                <button
                  onClick={() => {
                    setCurrentTab('SECURITY');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-start justify-between gap-3 transition-all cursor-pointer ${
                    currentTab === 'SECURITY'
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      currentTab === 'SECURITY' ? 'bg-slate-800 text-emerald-400' : 'bg-slate-200 text-slate-700'
                    }`}>
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span>Rekam Medis & Keamanan</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.2 rounded font-bold">
                          Admin
                        </span>
                      </div>
                      <p className={`text-[11px] mt-0.5 ${currentTab === 'SECURITY' ? 'text-slate-300' : 'text-slate-500'}`}>
                        Kelola data pasien, akun dokter, reset password & audit log
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* 3. Audio & Chime Notifikasi */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white rounded-xl border border-slate-200 text-slate-700">
                    <BellRing className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800">Audio & Bel Antrean</div>
                    <div className="text-[11px] text-slate-500">
                      {audioEnabled ? 'Bel suara aktif' : 'Mode suara hening'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleToggleAudio}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      audioEnabled
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {audioEnabled ? 'Mute' : 'Aktifkan'}
                  </button>
                  <button
                    onClick={handleTestChime}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Test Bel
                  </button>
                </div>
              </div>
            </div>

            {/* User Session Row (Bila login di HP atau Tablet) */}
            {isAuthenticated && user ? (
              <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-[11px]">
                    {(user.namaLengkap || (user as any).nama_lengkap || user.username || 'PT').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 leading-tight">
                      {user.namaLengkap || (user as any).nama_lengkap || user.username}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Peran: <strong className="text-emerald-800 font-semibold">{user.role}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setIsChangePasswordModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="py-1 px-2.5 bg-white hover:bg-slate-100 rounded-lg text-slate-700 font-semibold text-[11px] border border-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3 text-emerald-600" />
                    <span>Ganti Password</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="py-1 px-2.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-700 font-semibold text-[11px] border border-red-200 flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3 text-red-600" />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-1">
                <button
                  onClick={() => {
                    setIsLoginModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login Petugas Faskes</span>
                </button>
              </div>
            )}

            {/* Drawer Footer Status */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1 font-mono border-t border-slate-100">
              <span>Jam Operasional: {formattedTime || '--:--:--'} WIB</span>
              <span>KD Faskes: {bpjsConfig.kdFaskes} · ConsID: {maskedConsId}</span>
            </div>
          </div>
        )}
      </div>
    </header>

    <LoginFormModal
      isOpen={isLoginModalOpen}
      onClose={() => setIsLoginModalOpen(false)}
    />

    <ChangePasswordModal
      isOpen={isChangePasswordModalOpen}
      onClose={() => setIsChangePasswordModalOpen(false)}
      isMandatory={Boolean(user?.mustChangePassword)}
    />
  </>
  );
};
