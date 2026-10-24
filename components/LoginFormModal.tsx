'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import {
  Lock,
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

  if (!isOpen) return null;

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
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-white border-b border-slate-200 p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
              <Image
                src="/assets/aistudio/Logo-01.jpg_cdb7cbc6.jpeg"
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
                Masukkan kredensial resmi petugas klinik yang bertugas
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3.5">
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
                  placeholder="Masukkan username petugas..."
                  className="w-full text-xs py-2.5 pl-9 pr-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-emerald-600 focus:bg-white focus:outline-none transition-colors"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Password
                </label>
                <span className="text-[10px] text-emerald-700 font-mono font-semibold">Awal: 000000</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password akun (awal: 000000)..."
                  className="w-full text-xs py-2.5 pl-9 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:border-emerald-600 focus:bg-white focus:outline-none transition-colors"
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
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
              <span>Otentikasi Aman Petugas Faskes</span>
            </span>
            <span>TPMD DR MACHMUJUR</span>
          </div>
        </div>
      </div>
    </div>
  );
};
