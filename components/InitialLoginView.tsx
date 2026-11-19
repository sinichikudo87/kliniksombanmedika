'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { useQueue } from '@/lib/queue-context';
import { showSwalSuccess, showSwalError } from '@/lib/swal';
import { exportOperatingManualPdf } from '@/lib/client-pdf-manual';
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
  FileText,
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
      showSwalError('Harap masukkan username dan password', 'Form Belum Lengkap');
      return;
    }

    const result = await login(username.trim(), password.trim());
    if (result.success) {
      setSuccessMessage(result.message);
      showSwalSuccess(result.message, 'Login Berhasil');
    } else {
      setErrorMessage(result.message);
      showSwalError(result.message, 'Gagal Masuk');
    }
  };

  return (
    <div className="relative h-dvh w-full bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-800 flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 font-sans overflow-hidden">
      {/* Large Transparent Background Watermark Logo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
        <div className="relative w-[460px] h-[460px] sm:w-[640px] sm:h-[640px] lg:w-[800px] lg:h-[800px] opacity-[0.045] grayscale transform -rotate-12">
          <Image
            src="/assets/images/Logo-01.jpg_cdb7cbc6.jpeg"
            alt="Watermark Logo Somban Medika"
            fill
            className="object-contain"
            referrerPolicy="no-referrer"
            priority
          />
        </div>
      </div>

      {/* Top-Left Corner Brand Lockup */}
      <div className="relative z-10 w-full shrink-0 flex items-center justify-start">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-white shadow-xs border border-slate-200 flex items-center justify-center shrink-0">
            <Image
              src="/assets/images/Logo-01.jpg_cdb7cbc6.jpeg"
              alt="Logo Klinik Somban Medika"
              width={36}
              height={36}
              className="w-full h-full object-contain p-0.5"
              referrerPolicy="no-referrer"
              priority
            />
          </div>
          <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 truncate">
            {bpjsConfig.namaFaskes || 'KLINIK SOMBAN MEDIKA'}
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex-1 min-h-0 max-w-5xl mx-auto w-full flex items-center py-2">
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-7 items-center">
          {/* Left Column: Information & Public Security Standards */}
          <div className="hidden md:block md:col-span-6 space-y-3.5 lg:space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Portal Otentikasi Petugas Faskes Terdaftar</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                Akses Sistem Pelayanan Antrean &amp; Rekam Medis
              </h2>
              <p className="text-xs lg:text-[13px] text-slate-600 leading-relaxed">
                Portal ini ditujukan untuk petugas dan tenaga medis berwenang pada faskes {bpjsConfig.namaFaskes}. Seluruh sesi terenkripsi dengan proteksi data pribadi sesuai regulasi UU PDP No. 27/2022.
              </p>
            </div>

            {/* Clinical Features Info */}
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-3.5 lg:p-4 border border-slate-200 shadow-xs space-y-2.5">
              <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                Modul Pelayanan Faskes
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Poli Umum &amp; Poli Gigi</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Apotek &amp; Farmasi (Task 7)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Loket Admisi &amp; TV Display</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Rekam Medis &amp; Keamanan</span>
                </div>
              </div>
            </div>

            {/* Bridging Status Note */}
            <div className="flex items-center gap-3 p-3 bg-slate-50/90 rounded-2xl border border-slate-200 text-xs text-slate-600">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 text-xs">Antrean Online &amp; PCare Connected</p>
                <p className="text-[11px] text-slate-500">
                  Pembaruan Task ID 1 s/d 7 disinkronkan langsung ke server BPJS Kesehatan.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Public Login Form Card */}
          <div className="md:col-span-6">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-xl border border-slate-200 text-slate-900 relative overflow-hidden">
              {/* Background Large Transparent Watermark Icon */}
              <div
                className="absolute -right-8 -bottom-10 pointer-events-none select-none text-emerald-600/[0.08] z-0"
                aria-hidden="true"
              >
                <ShieldCheck className="w-56 h-56 sm:w-64 sm:h-64 transform -rotate-12" strokeWidth={1.2} />
              </div>

              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-3.5 relative z-10">
                <div className="min-w-0">
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Formulir Login Petugas</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Masukkan identitas akun petugas faskes terdaftar</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800 animate-in fade-in relative z-10">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <strong className="font-bold">Otentikasi Gagal: </strong>
                    {errorMessage}
                  </div>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800 animate-in fade-in relative z-10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <strong className="font-bold">Berhasil: </strong>
                    {successMessage}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 relative z-10">
                {/* Username Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
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
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-900 bg-slate-50/60"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
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
                      className="w-full pl-10 pr-11 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono text-slate-900 bg-slate-50/60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 leading-snug">
                    Password awal: <code className="bg-slate-100 text-slate-800 font-bold px-1 py-0.5 rounded font-mono">000000</code> · Otomatis ubah password saat login awal.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
              <div className="relative my-3.5 z-10">
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
              <div className="space-y-2 relative z-10">
                {onBypassToKiosk && (
                  <button
                    type="button"
                    onClick={onBypassToKiosk}
                    className="w-full py-2 px-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Buka Kios Mandiri Antrean (Mode Layanan Pasien)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const ok = exportOperatingManualPdf({
                      namaFaskes: bpjsConfig.namaFaskes,
                      kdFaskes: bpjsConfig.kdFaskes,
                      environment: bpjsConfig.environment,
                    });
                    if (ok) {
                      showSwalSuccess('Buku Panduan Pengoperasian (PDF) berhasil diunduh.', 'Unduh Berhasil');
                    }
                  }}
                  className="w-full py-2 px-4 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Unduh Buku Panduan Pengoperasian (PDF)</span>
                </button>
              </div>

              {/* Faskes System Footnote */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-medium relative z-10">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Terverifikasi Antrean Online &amp; PCare BPJS</span>
                </span>
                <span className="font-mono text-slate-500">KD: {bpjsConfig.kdFaskes}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hospital Footer - Running Text */}
      <div className="relative z-10 max-w-6xl mx-auto w-full shrink-0 py-2 text-xs text-slate-600 border-t border-slate-200/80 overflow-hidden">
        <div className="w-full overflow-hidden whitespace-nowrap">
          <p className="animate-footer-marquee font-medium" suppressHydrationWarning>
            © {new Date().getFullYear()} {bpjsConfig.namaFaskes} (Kode: {bpjsConfig.kdFaskes}) · Sistem Antrean Online Terintegrasi BPJS Kesehatan (Mobile JKN &amp; PCare)
          </p>
        </div>
      </div>
    </div>
  );
};
