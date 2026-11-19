'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { showSwalSuccess, showSwalError } from '@/lib/swal';
import {
  User,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X,
  RefreshCw,
} from 'lucide-react';

interface LoginFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginFormModal: React.FC<LoginFormModalProps> = ({ isOpen, onClose }) => {
  const { login, isLoading } = useAuth();

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useLockBodyScroll(isOpen);

  const handleClose = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    onClose();
  };

  if (!isOpen) return null;

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
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setErrorMessage(result.message);
      showSwalError(result.message, 'Gagal Masuk');
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] overflow-hidden bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="relative w-full max-w-[420px] max-h-[90vh] bg-white rounded-2xl shadow-2xl shadow-slate-950/35 border border-slate-200/90 flex flex-col overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 px-6 py-5 text-white shrink-0 relative border-b border-emerald-400/20">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 text-emerald-200/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 pr-9">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-white border border-white/20 shadow-xs flex items-center justify-center shrink-0">
              <Image
                src="/assets/images/Logo-01.jpg_cdb7cbc6.jpeg"
                alt="Logo Somban Medika"
                width={44}
                height={44}
                className="w-full h-full object-contain p-0.5"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold tracking-tight text-white">
                Login Petugas Faskes
              </h3>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Masukkan kredensial akun klinik Anda
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto overflow-x-hidden modal-scroll">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Username / ID Petugas
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username akun petugas"
                  className="w-full h-11 text-sm pl-10 pr-3.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white focus:outline-none transition-all"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password Akun
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password akun"
                  className="w-full h-11 text-sm pl-10 pr-10 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white focus:outline-none transition-all"
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi akun...</span>
                </>
              ) : (
                <>
                  <span>Verifikasi & Masuk Sistem</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
            <span>Autentikasi Petugas Klinik</span>
            <span className="text-slate-400">·</span>
            <span>Akses Terenkripsi</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
};
