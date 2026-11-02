'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserAccount } from '@/types/queue';

interface AuthContextType {
  user: UserAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthLoaded: boolean;
  lastLoginSource: 'MYSQL' | 'LOCAL_SERVER_STORE' | null;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string; mustChangePassword?: boolean }>;
  logout: () => Promise<void>;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isChangePasswordModalOpen: boolean;
  setIsChangePasswordModalOpen: (open: boolean) => void;
  changePassword: (newPassword: string, oldPassword?: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Pure in-memory state; data sourced live from MySQL database
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthLoaded, setIsAuthLoaded] = useState<boolean>(false);
  const [lastLoginSource, setLastLoginSource] = useState<'MYSQL' | 'LOCAL_SERVER_STORE' | null>('MYSQL');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState<boolean>(false);

  // Restore saved session from MySQL server endpoint & clear all localStorage
  useEffect(() => {
    let isMounted = true;

    // Purge browser localStorage completely - no client storage used
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.clear();
      } catch {}
    }

    const restoreSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.authenticated && data.user) {
            setUser(data.user);
            setLastLoginSource(data.source || 'MYSQL');
            if (data.user.mustChangePassword) {
              setIsChangePasswordModalOpen(true);
            }
          }
        }
      } catch {
        // server session lookup error
      } finally {
        if (isMounted) {
          setIsAuthLoaded(true);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
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
        const mustChange = Boolean(password === '000000' || data.mustChangePassword || data.user.mustChangePassword);
        const updatedUser: UserAccount = {
          ...data.user,
          mustChangePassword: mustChange,
        };

        setUser(updatedUser);
        setLastLoginSource(data.source || 'MYSQL');
        setIsLoginModalOpen(false);

        // Ensure localStorage remains empty
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.clear();
          } catch {}
        }

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
        setIsChangePasswordModalOpen(false);

        // Ensure localStorage remains empty
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.clear();
          } catch {}
        }

        return {
          success: true,
          message: data.message || 'Password baru berhasil disimpan di MySQL database.',
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

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}

    setUser(null);
    setLastLoginSource(null);
    setIsChangePasswordModalOpen(false);

    // Completely clear any localStorage keys
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.clear();
      } catch {}
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAuthLoaded,
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
