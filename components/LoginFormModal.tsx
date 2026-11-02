'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
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
  ShieldCheck,
} from 'lucide-react';

interface LoginFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const REGISTERED_ACCOUNTS = [
  { username: 'dr.machmujur', label: 'Dokter', role: 'DOKTER' },
  { username: 'admin', label: 'Admin RME', role: 'ADMIN_RME' },
  { username: 'loket01', label: 'Loket 01', role: 'PETUGAS_LOKET' },
  { username: 'farmasi01', label: 'Farmasi', role: 'PETUGAS_FARMASI' },
  { username: '0195U091-dev', label: 'Bridging BPJS', role: 'ADMIN_BRIDGING' },
];

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
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex min-h-screen items-center justify-center p-3 sm:p-4 md:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="relative w-full max-w-md my-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Large Transparent Watermark Icon */}
        <div
          className="absolute -right-8 -bottom-10 pointer-events-none select-none text-emerald-600/[0.07] z-0"
          aria-hidden="true"
        >
          <ShieldCheck className="w-56 h-56 transform -rotate-12" strokeWidth={1.2} />
        </div>

        {/* Header Banner */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-5 relative z-10">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/70 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 pr-8">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
              <Image
                src="/assets/images/Logo-01.jpg_cdb7cbc6.jpeg"
                alt="Logo Somban Medika"
                width={40}
                height={40}
                className="w-full h-full object-contain p-0.5"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-slate-900">Login Petugas Faskes</h3>
              <p className="text-xs text-slate-500">
                Masukkan kredensial akun klinik Anda
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-5 space-y-3.5 relative z-10">
          {/* Quick Account Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500">Pilih Akun Cepat:</span>
              <span className="text-[10px] text-emerald-700 font-mono font-medium">Awal: 000000</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {REGISTERED_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => {
                    setUsername(acc.username);
                    if (!password) setPassword('000000');
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono font-medium transition-colors cursor-pointer ${
                    username === acc.username
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Username / ID Petugas
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: dr.machmujur, admin, loket01..."
                  className="w-full text-xs py-2.5 pl-9 pr-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-emerald-600 focus:bg-white focus:outline-none transition-colors"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Password Akun
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Password awal: 000000</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password..."
                  className="w-full text-xs py-2.5 pl-9 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-emerald-600 focus:bg-white focus:outline-none transition-colors"
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
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

          {/* Footer Diagnostic Note */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sistem Faskes Terhubung</span>
            </span>
            <span>TPMD DR MACHMUJUR</span>
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
