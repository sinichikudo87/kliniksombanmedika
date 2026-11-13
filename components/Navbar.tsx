'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useQueue } from '@/lib/queue-context';
import { useAuth } from '@/lib/auth-context';
import { LoginFormModal } from '@/components/LoginFormModal';
import { ChangePasswordModal } from '@/components/ChangePasswordModal';
import { chimePlayer } from '@/lib/tts-announcer';
import { showSwalSuccess, showSwalInfo } from '@/lib/swal';
import {
  CreditCard,
  Tv,
  LayoutDashboard,
  Settings,
  Volume2,
  VolumeX,
  BellRing,
  LogOut,
  LogIn,
  Stethoscope,
  KeyRound,
  ChevronDown,
  Database,
  Menu,
  X,
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'KIOSK' | 'OPERATOR' | 'PCARE' | 'SECURITY' | 'TV';
  setCurrentTab: (tab: 'KIOSK' | 'OPERATOR' | 'PCARE' | 'SECURITY' | 'TV') => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenSettings }) => {
  const { bpjsConfig, switchBpjsEnvironment, audioEnabled, setAudioEnabled } = useQueue();
  const {
    user,
    isAuthenticated,
    logout,
    isLoginModalOpen,
    setIsLoginModalOpen,
    isChangePasswordModalOpen,
    setIsChangePasswordModalOpen,
  } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isSwitchingEnv, setIsSwitchingEnv] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isRmeAdmin = Boolean(user && (user.role === 'ADMIN_RME' || user.role === 'ADMIN'));
  const isAdministrator = Boolean(
    isAuthenticated &&
      user &&
      (user.role === 'ADMIN' ||
        user.role === 'ADMIN_BRIDGING' ||
        user.role === 'ADMIN_RME' ||
        user.role.toUpperCase().includes('ADMIN'))
  );

  const isBridgingOnline = bpjsConfig.isOnline === true;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
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

  const isProdMode = bpjsConfig.environment === 'production';

  const handleToggleBpjsMode = async (checked: boolean) => {
    if (isSwitchingEnv) return;
    const targetEnv: 'tester' | 'production' = checked ? 'production' : 'tester';
    setIsSwitchingEnv(true);
    try {
      const res = await switchBpjsEnvironment(targetEnv);
      const label = targetEnv === 'production' ? 'Production (Live)' : 'Development (Tester)';
      if (res.success) {
        showSwalSuccess(
          `Mode ${label} aktif dan terhubung ke BPJS (${res.latencyMs} ms).`,
          `BPJS Mode ${targetEnv === 'production' ? 'PROD' : 'DEV'}`
        );
      } else {
        showSwalInfo(
          `Mode dialihkan ke ${label} & tersimpan (${res.baseUrl}). Ping status: ${res.message || 'server cloud preview tidak masuk whitelist IP BPJS'}.`,
          `Mode ${targetEnv === 'production' ? 'PROD' : 'DEV'} Disimpan`
        );
      }
    } finally {
      setIsSwitchingEnv(false);
    }
  };

  const userDisplayName = user?.namaLengkap || (user as any)?.nama_lengkap || user?.username || 'Petugas';
  const userInitials = userDisplayName.slice(0, 2).toUpperCase();

  const navItems: Array<{
    id: 'KIOSK' | 'OPERATOR' | 'PCARE' | 'TV';
    label: string;
    mobileLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'KIOSK', label: 'Kios Mandiri', mobileLabel: 'Kios', icon: CreditCard },
    { id: 'OPERATOR', label: 'Loket Antrean', mobileLabel: 'Loket', icon: LayoutDashboard },
    { id: 'PCARE', label: 'PCare BPJS', mobileLabel: 'PCare', icon: Stethoscope },
    { id: 'TV', label: 'TV Display', mobileLabel: 'TV', icon: Tv },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Left: Brand Identity */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <Image
                  src="/assets/images/Logo-01.jpg_cdb7cbc6.jpeg"
                  alt="Logo Somban Medika"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain p-0.5"
                  referrerPolicy="no-referrer"
                  priority
                />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-slate-900 tracking-tight truncate max-w-[170px] sm:max-w-[240px]">
                  {bpjsConfig.namaFaskes}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                      isBridgingOnline ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span className={`truncate ${isBridgingOnline ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {isBridgingOnline ? 'Bridging BPJS Aktif' : 'Bridging BPJS Off'}
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Clean Uniform Navigation Tabs (Desktop) */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-900/5'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              {isRmeAdmin && (
                <button
                  onClick={() => setCurrentTab('SECURITY')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    currentTab === 'SECURITY'
                      ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-900/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Database className={`w-3.5 h-3.5 ${currentTab === 'SECURITY' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>RME &amp; DB</span>
                </button>
              )}
            </nav>

            {/* Right: Mode Slide Switch, Audio Toggle & Unified Account/Menu Dropdown */}
            <div className="flex items-center gap-2 shrink-0" ref={menuRef}>
              <label
                title={
                  isProdMode
                    ? 'Mode Koneksi BPJS: Production (Live) — geser untuk kembali ke Dev/Tester'
                    : 'Mode Koneksi BPJS: Development (Tester) — geser untuk beralih ke Production'
                }
                className={`hidden sm:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-xl border transition-colors select-none ${
                  isSwitchingEnv ? 'opacity-60 cursor-wait' : 'cursor-pointer'
                } ${
                  isProdMode
                    ? 'bg-emerald-50/90 border-emerald-200'
                    : 'bg-amber-50/90 border-amber-200'
                }`}
              >
                <span
                  className={`text-[10px] font-extrabold tracking-wide ${
                    !isProdMode ? 'text-amber-800' : 'text-slate-400'
                  }`}
                >
                  DEV
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  aria-label="Pilih Mode Koneksi BPJS Dev atau Production"
                  checked={isProdMode}
                  disabled={isSwitchingEnv}
                  onChange={(e) => handleToggleBpjsMode(e.target.checked)}
                  className="sr-only peer"
                />
                <span className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-amber-500 transition-colors peer-checked:bg-emerald-600">
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
                      isProdMode ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    }`}
                  />
                </span>
                <span
                  className={`text-[10px] font-extrabold tracking-wide ${
                    isProdMode ? 'text-emerald-800' : 'text-slate-400'
                  }`}
                >
                  PROD
                </span>
              </label>

              <button
                onClick={handleToggleAudio}
                title={audioEnabled ? 'Audio Notifikasi Aktif' : 'Audio Dinonaktifkan'}
                className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                  audioEnabled
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'
                }`}
              >
                {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {!isAuthenticated && (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="hidden sm:flex h-9 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>
              )}

              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  className={`h-9 px-2.5 sm:px-3 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer ${
                    isMenuOpen
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {isAuthenticated && user ? (
                    <>
                      <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                        {userInitials}
                      </span>
                      <span className="hidden md:inline max-w-[110px] truncate">{userDisplayName}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </>
                  ) : (
                    <>
                      {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                      <span className="hidden sm:inline">Menu</span>
                    </>
                  )}
                </button>

                {/* Compact Popover Dropdown */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 space-y-1.5 z-50">
                    {isAuthenticated && user ? (
                      <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="font-bold text-xs text-slate-900 truncate">{userDisplayName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                          <span>Peran: {user.role}</span>
                          <span className="font-mono text-[10px]">KD: {bpjsConfig.kdFaskes}</span>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setIsLoginModalOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Login Petugas Faskes</span>
                      </button>
                    )}

                    <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-bold text-slate-800">Mode BPJS</div>
                        <div className="text-[10px] text-slate-500">
                          {isProdMode ? 'Production (Live)' : 'Development (Tester)'}
                        </div>
                      </div>
                      <label
                        className={`inline-flex items-center gap-1.5 select-none ${
                          isSwitchingEnv ? 'opacity-60 cursor-wait' : 'cursor-pointer'
                        }`}
                      >
                        <span className={`text-[10px] font-bold ${!isProdMode ? 'text-amber-700' : 'text-slate-400'}`}>
                          DEV
                        </span>
                        <input
                          type="checkbox"
                          role="switch"
                          aria-label="Mode Koneksi BPJS Dev atau Production"
                          checked={isProdMode}
                          disabled={isSwitchingEnv}
                          onChange={(e) => handleToggleBpjsMode(e.target.checked)}
                          className="sr-only peer"
                        />
                        <span className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-amber-500 transition-colors peer-checked:bg-emerald-600">
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
                              isProdMode ? 'translate-x-[18px]' : 'translate-x-[3px]'
                            }`}
                          />
                        </span>
                        <span className={`text-[10px] font-bold ${isProdMode ? 'text-emerald-700' : 'text-slate-400'}`}>
                          PROD
                        </span>
                      </label>
                    </div>

                    {isAdministrator && (
                      <button
                        onClick={() => {
                          onOpenSettings();
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 text-left flex items-center justify-between gap-2 text-xs font-semibold text-slate-800 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-slate-500" />
                          <span>Pengaturan Bridging BPJS</span>
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            isBridgingOnline
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isBridgingOnline ? 'Aktif' : 'Off'}
                        </span>
                      </button>
                    )}

                    {isRmeAdmin && (
                      <button
                        onClick={() => {
                          setCurrentTab('SECURITY');
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 text-left flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer"
                      >
                        <Database className="w-4 h-4 text-slate-500" />
                        <span>Rekam Medis &amp; Database MySQL</span>
                      </button>
                    )}

                    <button
                      onClick={handleTestChime}
                      className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 text-left flex items-center justify-between text-xs font-semibold text-slate-800 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <BellRing className="w-4 h-4 text-emerald-600" />
                        <span>Test Bel Antrean</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Audio</span>
                    </button>

                    {isAuthenticated && user && (
                      <div className="pt-1 mt-1 border-t border-slate-100 space-y-1">
                        <button
                          onClick={() => {
                            setIsChangePasswordModalOpen(true);
                            setIsMenuOpen(false);
                          }}
                          className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 text-left flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4 text-slate-500" />
                          <span>Ganti Password</span>
                        </button>
                        <button
                          onClick={() => {
                            logout();
                            setIsMenuOpen(false);
                          }}
                          className="w-full px-3 py-2 rounded-xl hover:bg-red-50 text-left flex items-center gap-2 text-xs font-semibold text-red-600 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span>Keluar</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Sub-bar (Single Clean Row, No Duplicate Drawer Tabs) */}
          <div className="lg:hidden flex items-center py-1.5 border-t border-slate-100 gap-1 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setIsMenuOpen(false);
                  }}
                  className={`flex-1 min-w-[68px] py-1.5 px-2 rounded-lg text-center text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.mobileLabel}
                </button>
              );
            })}
            {isRmeAdmin && (
              <button
                onClick={() => {
                  setCurrentTab('SECURITY');
                  setIsMenuOpen(false);
                }}
                className={`flex-1 min-w-[68px] py-1.5 px-2 rounded-lg text-center text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  currentTab === 'SECURITY'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                RME
              </button>
            )}
          </div>
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
