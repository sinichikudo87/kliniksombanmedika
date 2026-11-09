import React, { useState } from 'react';
import {
  LogIn,
  UserPlus,
  Lock,
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Stethoscope,
  Briefcase,
  Pill,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Tv,
  Radio,
  Sun,
  Moon,
  Sparkles,
  HeartPulse,
  FileText,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { downloadPanduanPengoperasianPDF } from '../services/pdfManualGenerator';
import { UserRole } from '../types/auth';

interface LoginScreenProps {
  onSelectPublicView: (tab: 'display' | 'kiosk' | 'bridging' | 'statistics') => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSelectPublicView,
}) => {
  const { login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [quickLoginSuccess, setQuickLoginSuccess] = useState<string | null>(null);

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('petugas_loket');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regNip, setRegNip] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Quick Demo Accounts
  const demoAccounts = [
    {
      title: 'Administrator SIM-RS (Akses Penuh)',
      role: 'admin' as UserRole,
      badge: 'Admin Dedy',
      badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      icon: Shield,
      identifier: 'dedy',
      password: 'admin123',
      name: 'Dedy',
      desc: 'Akses penuh database, bridging BPJS & semua pengaturan',
    },
    {
      title: 'Petugas Loket 1 (Admisi)',
      role: 'petugas_loket' as UserRole,
      badge: 'Loket 1',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      icon: Briefcase,
      identifier: 'loket1',
      password: 'loket123',
      name: 'Ifa',
      desc: 'Pemanggil antrean loket pendaftaran & admisi',
    },
    {
      title: 'Dokter Poli Umum (Ruang 1)',
      role: 'dokter' as UserRole,
      badge: 'dr. Machmujur',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      icon: Stethoscope,
      identifier: 'dr_machmujur',
      password: 'dokter123',
      name: 'dr. Machmujur',
      desc: 'Dokter Penanggung Jawab & Poli Umum (Ruang 1)',
    },
    {
      title: 'Dokter Poli Umum (Ruang 2)',
      role: 'dokter' as UserRole,
      badge: 'dr. Diana',
      badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      icon: Stethoscope,
      identifier: 'dr_diana',
      password: 'dokter123',
      name: 'dr. Diana',
      desc: 'Dokter Pemeriksa Poli Umum (Ruang 2)',
    },
    {
      title: 'Penyerahan Resep / Farmasi',
      role: 'farmasi' as UserRole,
      badge: 'Wandi (Resep)',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      icon: Pill,
      identifier: 'wandi',
      password: 'farmasi123',
      name: 'Wandi',
      desc: 'Penyerahan resep & pemanggilan loket obat',
    },
  ];

  const handleQuickLogin = async (identifier: string, pass: string, name: string) => {
    setLoginIdentifier(identifier);
    setLoginPassword(pass);
    setLoginError(null);
    setIsLoggingIn(true);
    setQuickLoginSuccess(`Memproses login sebagai ${name}...`);

    const res = await login(identifier, pass);
    setIsLoggingIn(false);

    if (!res.success) {
      setLoginError(res.message);
      setQuickLoginSuccess(null);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setQuickLoginSuccess(null);

    if (!loginIdentifier.trim() || !loginPassword) {
      setLoginError('Harap isi username/email dan password.');
      return;
    }

    setIsLoggingIn(true);
    const res = await login(loginIdentifier.trim(), loginPassword);
    setIsLoggingIn(false);

    if (!res.success) {
      setLoginError(res.message);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!regUsername.trim() || !regFullName.trim() || !regPassword) {
      setRegError('Username, Nama Lengkap, dan Password wajib diisi.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Password minimal 6 karakter demi keamanan akun!');
      return;
    }

    setIsRegistering(true);
    const res = await register({
      username: regUsername.trim(),
      fullName: regFullName.trim(),
      password: regPassword,
      role: regRole,
      email: regEmail.trim() || undefined,
      phone: regPhone.trim() || undefined,
      nip: regNip.trim() || undefined,
    });
    setIsRegistering(false);

    if (!res.success) {
      setRegError(res.message);
    } else {
      setRegSuccess('Pendaftaran berhasil! Mengalihkan ke sistem...');
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-transparent text-slate-900 dark:text-slate-100 transition-colors duration-150 relative">
      {/* Top Bar Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-4 sm:px-6 py-3.5 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                  Klinik Somban Medika
                </h1>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                  Sidoarjo
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sistem Antrean Digital Terpadu &amp; Bridging BPJS SatuSehat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Unduh Panduan PDF Button */}
            <button
              onClick={() => downloadPanduanPengoperasianPDF()}
              title="Unduh Buku Panduan Pengoperasian (SOP) PDF"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Buku SOP PDF</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Hero & Quick Demo Logins) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Portal Resmi Pelayanan Kesehatan</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                Selamat Datang di Portal Masuk Petugas &amp; Pengguna
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                Silakan masuk dengan akun petugas loket, dokter, farmasi, atau administrator Anda. Sistem siap dengan modul pemanggil suara jernih dan bridging BPJS online.
              </p>
            </div>

            {/* Quick 1-Click Demo Accounts */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Akses Cepat 1-Klik (Akun Demo Resmi)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Pilih peran:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {demoAccounts.map((acc) => {
                  const Icon = acc.icon;
                  return (
                    <button
                      key={acc.identifier}
                      type="button"
                      disabled={isLoggingIn}
                      onClick={() => handleQuickLogin(acc.identifier, acc.password, acc.name)}
                      className="group flex flex-col items-start p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/50 dark:bg-slate-950/60 dark:hover:bg-slate-800/80 transition-all text-left cursor-pointer disabled:opacity-50"
                    >
                      <div className="w-full flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-xs group-hover:scale-105 transition-transform">
                            <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {acc.name}
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${acc.badgeColor}`}>
                          {acc.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {acc.desc}
                      </p>
                      <div className="mt-2 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-medium group-hover:underline">
                        Masuk sebagai @{acc.identifier} →
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Public Quick Access Options */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/10 via-teal-950/10 to-transparent border border-emerald-200 dark:border-emerald-800/50">
              <div className="flex items-center gap-2 mb-2">
                <Tv className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Mode Publik Tanpa Login (Layar Antrean &amp; Kiosk Pasien):
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                Untuk monitor TV di ruang tunggu atau perangkat mesin kiosk cetak tiket pasien mandiri:
              </p>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => onSelectPublicView('display')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
                >
                  <Tv className="w-4 h-4" />
                  <span>Buka Layar Display TV Ruang Tunggu</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectPublicView('kiosk')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
                >
                  <Radio className="w-4 h-4" />
                  <span>Buka Kiosk Pengambilan Tiket Mandiri</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectPublicView('bridging')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Buka Menu &amp; Bridging BPJS</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectPublicView('statistics')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span>Buka Dashboard Statistik &amp; Monitoring</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (Login / Register Card) */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
              {/* Card Header & Tabs */}
              <div className="p-5 pb-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {activeTab === 'login' ? 'Masuk ke Akun Anda' : 'Registrasi Petugas Baru'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      SIM Antrean &amp; Bridging Faskes
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex rounded-xl bg-slate-200/70 dark:bg-slate-800 p-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeTab === 'login'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Masuk (Login)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeTab === 'register'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Daftar Akun</span>
                  </button>
                </div>
              </div>

              {/* Form Body */}
              <div className="p-5 sm:p-6">
                {activeTab === 'login' ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    {loginError && (
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                        <div>
                          <p className="font-semibold">Login Gagal</p>
                          <p>{loginError}</p>
                        </div>
                      </div>
                    )}

                    {quickLoginSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 animate-spin" />
                        <span>{quickLoginSuccess}</span>
                      </div>
                    )}

                    {/* Username or Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>Username / NIP / Email:</span>
                      </label>
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="Contoh: dedy, wandi, atau loket1"
                        autoComplete="username"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Password:</span>
                        </label>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Default: admin123 / loket123
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Masukkan kata sandi..."
                          autoComplete="current-password"
                          required
                          className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition-all cursor-pointer disabled:opacity-60"
                    >
                      {isLoggingIn ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Memverifikasi Akun...</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          <span>Masuk ke Sistem Antrean</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                    {regError && (
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                        <div>
                          <p className="font-semibold">Registrasi Gagal</p>
                          <p>{regError}</p>
                        </div>
                      </div>
                    )}

                    {regSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>{regSuccess}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Nama Lengkap Beserta Gelar:
                      </label>
                      <input
                        type="text"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="Contoh: dr. Siti Aminah, Sp.A"
                        required
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 font-sans"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Username:
                        </label>
                        <input
                          type="text"
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          placeholder="siti_aminah"
                          required
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Peran / Jabatan:
                        </label>
                        <select
                          value={regRole}
                          onChange={(e) => setRegRole(e.target.value as UserRole)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        >
                          <option value="petugas_loket">Petugas Loket</option>
                          <option value="dokter">Dokter Pemeriksa</option>
                          <option value="farmasi">Petugas Farmasi / Obat</option>
                          <option value="admin">Administrator SIM-RS</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Password (Min. 6 Karakter):
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full px-3 py-2 pr-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Email (Opsional):
                        </label>
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="nama@puskesmas.go.id"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          NIP / No. Pegawai:
                        </label>
                        <input
                          type="text"
                          value={regNip}
                          onChange={(e) => setRegNip(e.target.value)}
                          placeholder="19920101..."
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isRegistering}
                      className="w-full mt-2 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
                    >
                      {isRegistering ? (
                        <span>Mendaftarkan Akun...</span>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Daftarkan &amp; Langsung Masuk</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Klinik Somban Medika. Pelayanan Kesehatan &amp; Faskes Tingkat Pertama (FKTP).</p>
          <div className="flex items-center gap-3 font-mono text-[11px] flex-wrap justify-center">
            <button
              onClick={() => downloadPanduanPengoperasianPDF()}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-sans font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unduh Buku Panduan Pengoperasian (PDF)</span>
            </button>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">● Bridging BPJS Online</span>
            <span>● SatuSehat Kemenkes</span>
            <span>● Multi-Loket TTS</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">● Versi 1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
