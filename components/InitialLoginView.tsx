'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { useQueue } from '@/lib/queue-context';
import {
  Lock,
  User,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogIn,
  Users,
  Building2,
  Check,
} from 'lucide-react';

interface InitialLoginViewProps {
  onBypassToKiosk?: () => void;
}

export const InitialLoginView: React.FC<InitialLoginViewProps> = ({ onBypassToKiosk }) => {
  const { login, isLoading } = useAuth();
  const { bpjsConfig } = useQueue();

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Harap masukkan username dan password');
      return;
    }

    const result = await login(username.trim(), password.trim());
    if (result.success) {
      setSuccessMessage(result.message);
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100 text-slate-800 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans overflow-hidden">
      {/* Large Transparent Background Watermark Logo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
        <div className="relative w-[500px] h-[500px] sm:w-[680px] sm:h-[680px] lg:w-[850px] lg:h-[850px] opacity-[0.045] grayscale transform -rotate-12">
          <Image
            src="/assets/aistudio/Logo-01.jpg_cdb7cbc6.jpeg"
            alt="Watermark Logo Somban Medika"
            fill
            className="object-contain"
            referrerPolicy="no-referrer"
            priority
          />
        </div>
      </div>

      {/* Top Bar Branding */}
      <div className="relative z-10 max-w-6xl mx-auto w-full">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xs px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-white shadow-xs border border-slate-200 flex items-center justify-center shrink-0">
              <Image
                src="/assets/aistudio/Logo-01.jpg_cdb7cbc6.jpeg"
                alt="Logo Somban Medika"
                width={44}
                height={44}
                className="w-full h-full object-contain p-0.5"
                referrerPolicy="no-referrer"
                priority
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                <span>{bpjsConfig.namaFaskes}</span>
                <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 font-mono font-bold">
                  KD: {bpjsConfig.kdFaskes}
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Sistem Antrean Bridging BPJS Kesehatan VClaim & PCare (Trustmark API v2.0)
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Bridging BPJS Aktif
            </span>
            <span className="flex items-center gap-1.5 bg-slate-50 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-xl font-mono text-[11px]">
              ConsID: {bpjsConfig.consId}
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-5xl mx-auto w-full my-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Information & Public Security Standards */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Portal Otentikasi Petugas Faskes Terdaftar</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Akses Sistem Pelayanan Antrean & Rekam Medis
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Portal ini ditujukan untuk petugas dan tenaga medis berwenang pada faskes {bpjsConfig.namaFaskes}. Seluruh sesi terenkripsi dengan proteksi data pribadi sesuai regulasi UU PDP No. 27/2022.
            </p>
          </div>

          {/* Clinical Features Info */}
          <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Modul Pelayanan Faskes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Poli Umum & Poli Gigi</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Apotek & Farmasi (Task 7)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Loket Admisi & Panggilan TV</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Database & Keamanan RME</span>
              </div>
            </div>
          </div>

          {/* Bridging Status Note */}
          <div className="flex items-center gap-3 p-4 bg-slate-50/90 rounded-2xl border border-slate-200 text-xs text-slate-600">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-800">BPJS VClaim & PCare Connected</p>
              <p className="text-[11px] text-slate-500">
                Pembaruan Task ID 1 s/d 7 disinkronkan langsung ke server BPJS Kesehatan.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Public Login Form Card */}
        <div className="lg:col-span-6">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 text-slate-900 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Formulir Login Petugas</h3>
                <p className="text-xs text-slate-500 mt-0.5">Masukkan identitas akun petugas faskes terdaftar</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <Lock className="w-5 h-5" />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-bold">Otentikasi Gagal: </strong>
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-bold">Berhasil: </strong>
                  {successMessage}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Username Petugas / ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Masukkan username petugas..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-900 bg-slate-50/60"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password Akun
                  </label>
                  <span className="text-[11px] text-emerald-700 font-mono font-semibold">Password Awal: 000000</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Masukkan password akun (awal: 000000)..."
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono text-slate-900 bg-slate-50/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Password awal faskes adalah <code className="bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded font-mono">000000</code>. Sistem otomatis mengarahkan ke form ubah password saat login.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memverifikasi akun...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk ke Sistem Faskes</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  Atau Akses Pasien
                </span>
              </div>
            </div>

            {/* Direct Patient Kiosk Bypass */}
            {onBypassToKiosk && (
              <button
                type="button"
                onClick={onBypassToKiosk}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Buka Kios Mandiri Antrean (Mode Layanan Pasien)</span>
              </button>
            )}

            {/* Faskes System Footnote */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Terverifikasi BPJS VClaim & PCare</span>
              </span>
              <span className="font-mono text-slate-500">KD: {bpjsConfig.kdFaskes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hospital Footer */}
      <div className="relative z-10 max-w-6xl mx-auto w-full text-center py-3 text-xs text-slate-500 border-t border-slate-200/80">
        <p suppressHydrationWarning>
          © {new Date().getFullYear()} {bpjsConfig.namaFaskes} (Kode: {bpjsConfig.kdFaskes}) · Sistem Antrean Online Terintegrasi BPJS VClaim & PCare
        </p>
      </div>
    </div>
  );
};
