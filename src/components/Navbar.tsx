import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  Radio,
  CheckCircle2,
  Sun,
  Moon,
  MapPin,
  Database,
  LogIn,
  LogOut,
  User as UserIcon,
  Shield,
  Briefcase,
  Stethoscope,
  Pill,
  ChevronDown,
  UserPlus,
  Menu,
  X,
  Tv,
  BarChart3,
  Sliders,
  FileText,
  Download,
  CreditCard,
  Activity,
  FileCheck,
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { downloadPanduanPengoperasianPDF } from '../services/pdfManualGenerator';

interface NavbarProps {
  activeTab: 'display' | 'caller' | 'kiosk' | 'statistics' | 'bridging' | 'audio' | 'database';
  setActiveTab: (tab: 'display' | 'caller' | 'kiosk' | 'statistics' | 'bridging' | 'audio' | 'database') => void;
  openAudioModal: () => void;
  openBridgingModal: () => void;
  openMapModal: () => void;
  openDatabaseModal: () => void;
  openBerkasProdModal?: () => void;
  onGoToLogin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openAudioModal,
  openBridgingModal,
  openMapModal,
  openDatabaseModal,
  openBerkasProdModal,
  onGoToLogin,
}) => {
  const { ttsState, testSpeakerSound, bpjsConfig } = useQueue();
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout, openAuthModal } = useAuth();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isBpjsMenuOpen, setIsBpjsMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const bpjsMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (bpjsMenuRef.current && !bpjsMenuRef.current.contains(event.target as Node)) {
        setIsBpjsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu & bpjs menu when activeTab changes
  const handleNavClick = (tab: 'display' | 'caller' | 'kiosk' | 'statistics' | 'bridging' | 'audio' | 'database') => {
    setActiveTab(tab);
    setIsMobileNavOpen(false);
    setIsBpjsMenuOpen(false);
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', icon: Shield, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
      case 'petugas_loket':
        return { label: 'Loket', icon: Briefcase, color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
      case 'dokter':
        return { label: 'Dokter', icon: Stethoscope, color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' };
      case 'farmasi':
        return { label: 'Farmasi', icon: Pill, color: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' };
      default:
        return { label: 'Staf', icon: UserIcon, color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' };
    }
  };

  const roleInfo = getRoleBadge(currentUser?.role);
  const RoleIcon = roleInfo.icon;

  return (
    <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-50 transition-colors duration-150 w-full text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 min-w-0">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-xs shrink-0">
            <Radio className="w-4 h-4 text-slate-950" />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap leading-tight">
              Klinik Somban Medika
            </span>
            <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
              Bridging Antrean BPJS
            </span>
          </div>
        </div>

        {/* Zone 2: Desktop Navigation Links (Large Screens) */}
        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 min-w-0">
          <button
            onClick={() => setActiveTab('display')}
            className={`px-2 xl:px-2.5 2xl:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'display'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Layar TV
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`px-2 xl:px-2.5 2xl:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'statistics'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Statistik
          </button>
          <button
            onClick={() => setActiveTab('caller')}
            className={`px-2 xl:px-2.5 2xl:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'caller'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Loket
          </button>
          <button
            onClick={() => setActiveTab('kiosk')}
            className={`px-2 xl:px-2.5 2xl:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'kiosk'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Kiosk
          </button>
          <button
            onClick={openDatabaseModal}
            className={`px-2 xl:px-2.5 2xl:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              activeTab === 'database'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Database</span>
          </button>
          {/* Menu BPJS Dropdown & Tab Switcher */}
          <div className="relative flex items-center" ref={bpjsMenuRef}>
            <button
              onClick={() => {
                setActiveTab('bridging');
                setIsBpjsMenuOpen(false);
              }}
              className={`px-2 xl:px-2.5 2xl:px-3 py-1.5 text-xs font-semibold rounded-l-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'bridging'
                  ? 'bg-slate-800 text-emerald-400 border-y border-l border-slate-700 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Buka Layar Menu & Integrasi BPJS Kesehatan"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Menu BPJS</span>
            </button>
            <button
              onClick={() => setIsBpjsMenuOpen((prev) => !prev)}
              className={`px-1.5 py-1.5 text-xs font-semibold rounded-r-md transition-colors cursor-pointer border-l border-slate-700/60 ${
                activeTab === 'bridging' || isBpjsMenuOpen
                  ? 'bg-slate-800 text-emerald-400 border-y border-r border-slate-700 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Pilihan Sub-Menu & Integrasi BPJS"
              aria-label="Pilihan Sub-Menu BPJS"
            >
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isBpjsMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Menu BPJS Dropdown Modal/Popup */}
            {isBpjsMenuOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 z-[60] text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                <div
                  onClick={() => {
                    setIsBpjsMenuOpen(false);
                    setActiveTab('bridging');
                  }}
                  className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  title="Klik untuk membuka Layar Utama Bridging BPJS"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block hover:text-emerald-600 transition-colors">
                      Menu Integrasi BPJS
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      Antrean RS v2 &amp; PCare FKTP
                    </span>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    ONLINE
                  </span>
                </div>

                <div className="p-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setIsBpjsMenuOpen(false);
                      setActiveTab('bridging');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg flex items-center gap-2.5 text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
                  >
                    <Tv className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs">Layar Utama Bridging BPJS</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Buka dashboard bridging &amp; monitoring</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsBpjsMenuOpen(false);
                      openBridgingModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg flex items-center gap-2.5 text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
                  >
                    <Sliders className="w-4 h-4 text-teal-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs">Buka Modal Pengaturan BPJS</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Dialog pop-up konfigurasi &amp; kredensial</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsBpjsMenuOpen(false);
                      setActiveTab('bridging');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg flex items-center gap-2.5 text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs">Form Pasien BPJS (Kategori A)</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Verifikasi NIK/No. Kartu &amp; cetak tiket</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsBpjsMenuOpen(false);
                      setActiveTab('bridging');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg flex items-center gap-2.5 text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
                  >
                    <Activity className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs">Monitor Task ID 1-7 BPJS</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Lacak timestamp pelayanan per pasien</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsBpjsMenuOpen(false);
                      openDatabaseModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg flex items-center gap-2.5 text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
                  >
                    <Database className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs">Sinkronisasi Database MySQL</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Ekspor SQL tabel audit &amp; log bridging</p>
                    </div>
                  </button>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                  <button
                    onClick={() => {
                      setIsBpjsMenuOpen(false);
                      if (openBerkasProdModal) {
                        openBerkasProdModal();
                      }
                    }}
                    className="w-full px-3 py-2 text-left bg-emerald-50/70 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 rounded-lg flex items-center gap-2.5 text-emerald-900 dark:text-emerald-200 cursor-pointer transition-colors border border-emerald-200/60 dark:border-emerald-800/60"
                  >
                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs">Berkas Pengajuan PROD (.doc)</p>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-600 text-white rounded font-mono">
                          WORD
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80">
                        Surat Permohonan, BA UAT, Pakta Integritas, WS URL
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={openAudioModal}
            className={`px-2 xl:px-2.5 2xl:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'audio'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Suara
          </button>
        </nav>

        {/* Zone 3: Primary Actions, User Authentication, Theme & Mobile Menu */}
        <div className="flex items-center gap-2">
          {/* Cek Map Lokasi Button */}
          <button
            onClick={openMapModal}
            title="Lihat Peta Lokasi Klinik Somban Medika Sidoarjo"
            className="hidden md:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Maps</span>
          </button>

          {/* Unduh Panduan PDF SOP Button */}
          <button
            onClick={() => downloadPanduanPengoperasianPDF()}
            title="Unduh File PDF Buku Panduan Pengoperasian (SOP) Klinik Somban Medika"
            className="flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 px-2.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Buku SOP PDF</span>
          </button>

          {/* Test Speaker Button */}
          <button
            onClick={() => testSpeakerSound()}
            disabled={ttsState.isSpeaking}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              ttsState.isSpeaking
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/40'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xs'
            }`}
          >
            <Volume2 className={`w-3.5 h-3.5 ${ttsState.isSpeaking ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">{ttsState.isSpeaking ? 'Memanggil...' : 'Tes Speaker'}</span>
          </button>

          {/* Theme Toggle Button (Light/Dark) */}
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Beralih ke Mode Gelap' : 'Beralih ke Mode Terang'}
            className="p-1.5 rounded-md border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-slate-300" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* USER AUTHENTICATION BADGE / BUTTON */}
          {currentUser ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 pr-2 sm:pr-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 transition-all cursor-pointer text-left"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-xs">
                  {(currentUser.fullName || currentUser.username || 'P').charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-xs font-bold text-white leading-tight truncate max-w-[100px] md:max-w-[120px]">
                    {currentUser.fullName || currentUser.username}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[9px] font-semibold px-1 py-0.2 rounded font-mono ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1 z-[60] text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {currentUser.fullName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      @{currentUser.username} • {currentUser.email || 'Klinik Somban'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setActiveTab('bridging');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex items-center gap-2 text-slate-800 dark:text-slate-200 cursor-pointer font-semibold text-emerald-800 dark:text-emerald-300"
                  >
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>Menu &amp; Integrasi BPJS</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      openDatabaseModal();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>Database &amp; Prosedur SQL</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (openBerkasProdModal) {
                        openBerkasProdModal();
                      }
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>Berkas PROD BPJS (.doc)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      downloadPanduanPengoperasianPDF();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Unduh Panduan PDF (SOP)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      openAuthModal('login');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-blue-600" />
                    <span>Ganti Akun (Login Lain)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      openAuthModal('register');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-teal-600" />
                    <span>Daftar Petugas Baru</span>
                  </button>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 text-red-600 dark:text-red-400 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                if (onGoToLogin) {
                  onGoToLogin();
                } else {
                  openAuthModal('login');
                }
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk / Login</span>
            </button>
          )}

          {/* MOBILE / TABLET MENU TOGGLE BUTTON (Hidden on lg+ desktop screens) */}
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* MOBILE / TABLET NAVIGATION COLLAPSIBLE PANEL */}
      {isMobileNavOpen && (
        <>
          <div
            className="fixed inset-0 top-16 bg-slate-950/50 backdrop-blur-xs z-30 lg:hidden animate-in fade-in duration-150"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div className="relative z-40 lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-slate-900/98 backdrop-blur px-4 py-3 shadow-xl animate-in slide-in-from-top-2 duration-150 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={() => handleNavClick('display')}
                className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                  activeTab === 'display'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <Tv className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Layar TV Antrean</span>
              </button>

              <button
                onClick={() => handleNavClick('statistics')}
                className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                  activeTab === 'statistics'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Statistik Antrean</span>
              </button>

              <button
                onClick={() => handleNavClick('caller')}
                className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                  activeTab === 'caller'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <Briefcase className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Konsol Pemanggil</span>
              </button>

              <button
                onClick={() => handleNavClick('kiosk')}
                className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                  activeTab === 'kiosk'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <Radio className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Kiosk Tiket Pasien</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileNavOpen(false);
                  openDatabaseModal();
                }}
                className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                <Database className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Database & SQL</span>
              </button>

              <button
                onClick={() => handleNavClick('bridging')}
                className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                  activeTab === 'bridging'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Menu BPJS (Layar)</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileNavOpen(false);
                  openBridgingModal();
                }}
                className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                <Sliders className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Modal BPJS (Pop-up)</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileNavOpen(false);
                  openAudioModal();
                }}
                className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                <Volume2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Pengaturan Suara</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileNavOpen(false);
                  openMapModal();
                }}
                className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Peta Lokasi Klinik</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileNavOpen(false);
                  if (openBerkasProdModal) {
                    openBerkasProdModal();
                  }
                }}
                className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100"
              >
                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Berkas PROD (.doc)</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileNavOpen(false);
                  downloadPanduanPengoperasianPDF();
                }}
                className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Unduh Panduan PDF (SOP)</span>
              </button>
            </div>

            {/* Mobile Auth Action */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              {currentUser ? (
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {(currentUser.fullName || currentUser.username || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {currentUser.fullName || currentUser.username}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">@{currentUser.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors cursor-pointer shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    if (onGoToLogin) {
                      onGoToLogin();
                    } else {
                      openAuthModal('login');
                    }
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Buka Portal Masuk / Login Petugas</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};


