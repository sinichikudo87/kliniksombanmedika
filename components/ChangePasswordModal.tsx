'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Save,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMandatory?: boolean;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  isMandatory = false,
}) => {
  const { user, changePassword, isLoading, logout } = useAuth();

  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const mustChange = isMandatory || Boolean(user?.mustChangePassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!newPassword.trim()) {
      setErrorMessage('Password baru tidak boleh kosong');
      return;
    }

    if (newPassword.trim().length < 6) {
      setErrorMessage('Password baru minimal 6 karakter demi keamanan');
      return;
    }

    if (newPassword.trim() === '000000') {
      setErrorMessage('Password baru tidak boleh menggunakan password awal default (000000)');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok');
      return;
    }

    const result = await changePassword(newPassword.trim(), oldPassword.trim() || '000000');
    if (result.success) {
      setSuccessMessage(result.message);
      setTimeout(() => {
        onClose();
        setNewPassword('');
        setConfirmPassword('');
        setOldPassword('');
      }, 900);
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 sm:p-6 relative">
          {!mustChange && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-white/10 border border-white/20 p-1 flex items-center justify-center shrink-0">
              <Image
                src="/assets/aistudio/Logo-01.jpg_cdb7cbc6.jpeg"
                alt="Logo Somban Medika"
                width={44}
                height={44}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  {mustChange ? 'Wajib Ganti Password Awal' : 'Ubah Password Akun Petugas'}
                </h3>
                {mustChange && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Keamanan Faskes
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Akun: <strong className="text-white font-mono">{user?.username}</strong> ({user?.namaLengkap})
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {mustChange ? (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Password Default Terdeteksi (000000)</p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Demi kepatuhan privasi rekam medis (UU PDP No. 27/2022), Anda wajib mengganti password awal faskes dengan password pribadi yang aman sebelum dapat mengakses dashboard layanan.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Gunakan kombinasi minimal 6 karakter untuk mengamankan akun Anda.</span>
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-900 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Notice */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900 font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!mustChange && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Password Saat Ini
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan password saat ini"
                  className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-emerald-600 focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Password Baru (Minimal 6 Karakter)
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan password baru yang aman"
                  className="w-full text-xs py-2.5 pl-3 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-emerald-600 focus:bg-white focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full text-xs py-2.5 pl-3 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-emerald-600 focus:bg-white focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menyimpan ke Database...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Password Baru & Masuk</span>
                  </>
                )}
              </button>

              {mustChange && (
                <button
                  type="button"
                  onClick={logout}
                  className="py-3 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  title="Batalkan & Logout"
                >
                  <LogOut className="w-4 h-4 text-slate-500" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </form>

          {/* Footer Security Note */}
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Enkripsi Database Faskes</span>
            <span>019U901 - TPMD DR MACHMUJUR</span>
          </div>
        </div>
      </div>
    </div>
  );
};
