import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../types/auth';

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  usersList: User[];
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  setAuthModalTab: (tab: 'login' | 'register') => void;
  login: (identifier: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
  register: (data: {
    username: string;
    password: string;
    fullName: string;
    role: UserRole;
    email?: string;
    phone?: string;
    nip?: string;
    loketId?: string;
  }) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  executeSelectProcedure: (procedureName: string, params: any) => Promise<any>;
  executeUpsertProcedure: (procedureName: string, data: any) => Promise<any>;
  fetchDatabaseSchema: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'somban_auth_token_v1';
const USER_KEY = 'somban_auth_user_v1';
const SPLASH_SHOWN_KEY = 'somban_splash_shown_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(USER_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Gagal membaca sesi user tersimpan:', e);
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(TOKEN_KEY);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [usersList, setUsersList] = useState<User[]>([]);

  // Initial load: verify session & refresh users
  useEffect(() => {
    refreshUsers();

    // Verify stored session with backend
    const savedToken = token || (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null);
    if (savedToken) {
      fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      })
        .then((res) => {
          if (res.status === 401) {
            // Sesi kedaluwarsa
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setCurrentUser(null);
            setToken(null);
            return null;
          }
          return res.json();
        })
        .then((json) => {
          if (json && json.success && json.user) {
            setCurrentUser(json.user);
            localStorage.setItem(USER_KEY, JSON.stringify(json.user));
          }
        })
        .catch((err) => {
          console.warn('Pengecekan sesi offline, mempertahankan data lokal:', err);
        });
    }
  }, []);

  const refreshUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUsersList(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const login = async (identifier: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const json = await res.json();
      if (json.success && json.user && json.token) {
        setCurrentUser(json.user);
        setToken(json.token);
        localStorage.setItem(TOKEN_KEY, json.token);
        localStorage.setItem(USER_KEY, JSON.stringify(json.user));
        try {
          sessionStorage.setItem(SPLASH_SHOWN_KEY, 'true');
        } catch (e) {}
        setIsAuthModalOpen(false);
        refreshUsers();
        return { success: true, message: json.message, user: json.user };
      }
      return { success: false, message: json.message || 'Login gagal' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal menghubungi server' };
    }
  };

  const register = async (data: {
    username: string;
    password: string;
    fullName: string;
    role: UserRole;
    email?: string;
    phone?: string;
    nip?: string;
    loketId?: string;
  }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success && json.user && json.token) {
        setCurrentUser(json.user);
        setToken(json.token);
        localStorage.setItem(TOKEN_KEY, json.token);
        localStorage.setItem(USER_KEY, JSON.stringify(json.user));
        try {
          sessionStorage.setItem(SPLASH_SHOWN_KEY, 'true');
        } catch (e) {}
        setIsAuthModalOpen(false);
        refreshUsers();
        return { success: true, message: json.message, user: json.user };
      }
      return { success: false, message: json.message || 'Pendaftaran gagal' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal menghubungi server' };
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ token }),
        });
      } catch (e) {
        console.error('Logout error:', e);
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setCurrentUser(null);
    setToken(null);
  };

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Run SELECT Stored Procedure via API
  const executeSelectProcedure = async (procedureName: string, params: any) => {
    const res = await fetch('/api/procedures/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ procedureName, params }),
    });
    return res.json();
  };

  // Run UPSERT Stored Procedure via API
  const executeUpsertProcedure = async (procedureName: string, data: any) => {
    const res = await fetch('/api/procedures/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ procedureName, data }),
    });
    const result = await res.json();
    if (procedureName === 'sp_upsert_user') {
      refreshUsers();
    }
    return result;
  };

  // Fetch Database Schema & Stored Procedure Definitions
  const fetchDatabaseSchema = async () => {
    const res = await fetch('/api/database/schema');
    return res.json();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isAuthenticated: !!currentUser,
        isLoading,
        isAuthModalOpen,
        authModalTab,
        usersList,
        openAuthModal,
        closeAuthModal,
        setAuthModalTab,
        login,
        register,
        logout,
        refreshUsers,
        executeSelectProcedure,
        executeUpsertProcedure,
        fetchDatabaseSchema,
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
