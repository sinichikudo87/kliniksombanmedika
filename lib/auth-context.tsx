'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserAccount } from '@/types/queue';

interface AuthContextType {
  user: UserAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastLoginSource: 'MYSQL' | 'LOCAL_SERVER_STORE' | null;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string; mustChangePassword?: boolean }>;
  logout: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isChangePasswordModalOpen: boolean;
  setIsChangePasswordModalOpen: (open: boolean) => void;
  changePassword: (newPassword: string, oldPassword?: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initial state is null so Login Form displays first on load
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastLoginSource, setLastLoginSource] = useState<'MYSQL' | 'LOCAL_SERVER_STORE' | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState<boolean>(false);

  // Restore saved session from localStorage on client mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedUser = localStorage.getItem('tpmd_current_user');
        const savedSource = localStorage.getItem('tpmd_auth_source');
        if (savedUser) {
          const parsed: UserAccount = JSON.parse(savedUser);
          setUser(parsed);
          if (parsed.mustChangePassword) {
            setIsChangePasswordModalOpen(true);
          }
        }
        if (savedSource === 'MYSQL' || savedSource === 'LOCAL_SERVER_STORE') {
          setLastLoginSource(savedSource);
        }
      } catch {}
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; message: string; mustChangePassword?: boolean }> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        // Deteksi jika password adalah password awal '000000'
        const mustChange = Boolean(password === '000000' || data.mustChangePassword || data.user.mustChangePassword);
        const updatedUser: UserAccount = {
          ...data.user,
          mustChangePassword: mustChange,
        };

        setUser(updatedUser);
        setLastLoginSource(data.source || 'MYSQL');
        try {
          localStorage.setItem('tpmd_current_user', JSON.stringify(updatedUser));
          localStorage.setItem('tpmd_auth_source', data.source || 'MYSQL');
        } catch {}

        setIsLoginModalOpen(false);

        if (mustChange) {
          setIsChangePasswordModalOpen(true);
        }

        return {
          success: true,
          message: mustChange
            ? 'Login berhasil. Terdeteksi password awal default (000000). Silakan ubah password baru Anda.'
            : (data.message || `Login sukses via ${data.source === 'MYSQL' ? 'MySQL Database' : 'Server Faskes'}`),
          mustChangePassword: mustChange,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Username atau password salah',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Gagal terhubung ke server autentikasi',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (newPassword: string, oldPassword?: string): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'Tidak ada sesi petugas aktif' };
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          oldPassword: oldPassword || '000000',
          newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const updatedUser: UserAccount = {
          ...user,
          mustChangePassword: false,
        };
        setUser(updatedUser);
        try {
          localStorage.setItem('tpmd_current_user', JSON.stringify(updatedUser));
        } catch {}
        setIsChangePasswordModalOpen(false);
        return {
          success: true,
          message: data.message || 'Password baru berhasil disimpan di database.',
        };
      } else {
        return {
          success: false,
          message: data.message || 'Gagal memperbarui password',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Koneksi ke server database gagal',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setLastLoginSource(null);
    setIsChangePasswordModalOpen(false);
    try {
      localStorage.removeItem('tpmd_current_user');
      localStorage.removeItem('tpmd_auth_source');
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        lastLoginSource,
        login,
        logout,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isChangePasswordModalOpen,
        setIsChangePasswordModalOpen,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
