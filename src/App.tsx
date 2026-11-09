import React, { useState, useCallback, useEffect } from 'react';
import { QueueProvider } from './context/QueueContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { DisplayTV } from './components/DisplayTV';
import { LoketCaller } from './components/LoketCaller';
import { KioskAmbilTiket } from './components/KioskAmbilTiket';
import { QueueStatisticsDashboard } from './components/QueueStatisticsDashboard';
import { AudioSettingsModal } from './components/AudioSettingsModal';
import { BridgingSettingsModal } from './components/BridgingSettingsModal';
import { ClinicMapModal } from './components/ClinicMapModal';
import { AuthModal } from './components/AuthModal';
import { DatabaseProcedureManager } from './components/DatabaseProcedureManager';
import { BPJSBridgingView } from './components/BPJSBridgingView';
import { BerkasProdDocModal } from './components/BerkasProdDocModal';
import { SplashScreen } from './components/SplashScreen';
import { LoginScreen } from './components/LoginScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Tv, Briefcase, Radio, BarChart3, Database, Shield } from 'lucide-react';

function MainApp() {
  const { currentUser } = useAuth();

  // Check if splash has already been viewed in this session OR if user is already logged in
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const alreadyShown = sessionStorage.getItem('somban_splash_shown_v1');
        const savedUser = localStorage.getItem('somban_auth_user_v1');
        if (alreadyShown === 'true' || savedUser) {
          return false;
        }
      } catch (e) {
        return false;
      }
    }
    return true;
  });

  const [isPublicMode, setIsPublicMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'display' | 'caller' | 'kiosk' | 'statistics' | 'bridging' | 'audio' | 'database'>('display');
  const [isAudioModalOpen, setIsAudioModalOpen] = useState<boolean>(false);
  const [isBridgingModalOpen, setIsBridgingModalOpen] = useState<boolean>(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState<boolean>(false);
  const [isBerkasProdModalOpen, setIsBerkasProdModalOpen] = useState<boolean>(false);

  // If user becomes logged in, permanently dismiss splash screen
  useEffect(() => {
    if (currentUser) {
      try {
        sessionStorage.setItem('somban_splash_shown_v1', 'true');
      } catch (e) {}
      setShowSplash(false);
    }
  }, [currentUser]);

  const handleFinishSplash = useCallback(() => {
    try {
      sessionStorage.setItem('somban_splash_shown_v1', 'true');
    } catch (e) {}
    setShowSplash(false);
  }, []);

  // 1. Splash Screen on initial fresh visit only (Never if user is logged in or already seen)
  if (showSplash && !currentUser) {
    return (
      <SplashScreen
        onFinish={handleFinishSplash}
        durationMs={1800}
      />
    );
  }

  // 2. Login Screen (if user is not logged in and not in public viewing mode)
  if (!currentUser && !isPublicMode) {
    return (
      <LoginScreen
        onSelectPublicView={(tab) => {
          try {
            sessionStorage.setItem('somban_splash_shown_v1', 'true');
          } catch (e) {}
          setIsPublicMode(true);
          setActiveTab(tab as any);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white transition-colors duration-150 pb-16 lg:pb-0 w-full max-w-full overflow-x-hidden">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'audio') {
            setIsAudioModalOpen(true);
          } else if (tab === 'database') {
            setIsDatabaseModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        openAudioModal={() => setIsAudioModalOpen(true)}
        openBridgingModal={() => setIsBridgingModalOpen(true)}
        openMapModal={() => setIsMapModalOpen(true)}
        openDatabaseModal={() => setIsDatabaseModalOpen(true)}
        openBerkasProdModal={() => setIsBerkasProdModalOpen(true)}
        onGoToLogin={() => setIsPublicMode(false)}
      />

      {/* Main View Area with ErrorBoundary to prevent blank screen (ngeblak) */}
      <main className="flex-1 w-full max-w-full min-w-0 overflow-x-hidden">
        <ErrorBoundary onReset={() => setActiveTab('display')}>
          {activeTab === 'display' && <DisplayTV openMapModal={() => setIsMapModalOpen(true)} />}
          {activeTab === 'statistics' && <QueueStatisticsDashboard onBackToTV={() => setActiveTab('display')} />}
          {activeTab === 'caller' && <LoketCaller />}
          {activeTab === 'kiosk' && <KioskAmbilTiket openMapModal={() => setIsMapModalOpen(true)} />}
          {activeTab === 'bridging' && (
            <BPJSBridgingView
              onBackToTV={() => setActiveTab('display')}
              openBerkasProdModal={() => setIsBerkasProdModalOpen(true)}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Mobile Sticky Bottom Tab Bar (Effortless 1-handed smartphone thumb navigation) */}
      <nav aria-label="Navigasi Bawah Ponsel" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur px-2 py-1 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('display')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'display'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Tv className="w-4 h-4 mb-0.5" />
          <span>Layar TV</span>
        </button>

        <button
          onClick={() => setActiveTab('caller')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'caller'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4 mb-0.5" />
          <span>Loket</span>
        </button>

        <button
          onClick={() => setActiveTab('kiosk')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'kiosk'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4 mb-0.5" />
          <span>Kiosk</span>
        </button>

        <button
          onClick={() => setActiveTab('bridging')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'bridging'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4 mb-0.5 text-emerald-600" />
          <span>BPJS</span>
        </button>

        <button
          onClick={() => setActiveTab('statistics')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'statistics'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 mb-0.5" />
          <span>Statistik</span>
        </button>

        <button
          onClick={() => setIsDatabaseModalOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <Database className="w-4 h-4 mb-0.5 text-emerald-600" />
          <span>Database</span>
        </button>
      </nav>

      {/* Floating Modals */}
      <AudioSettingsModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
      />

      <BridgingSettingsModal
        isOpen={isBridgingModalOpen}
        onClose={() => setIsBridgingModalOpen(false)}
      />

      <ClinicMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
      />

      <DatabaseProcedureManager
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
      />

      <BerkasProdDocModal
        isOpen={isBerkasProdModalOpen}
        onClose={() => setIsBerkasProdModalOpen(false)}
      />

      <AuthModal />
    </div>
  );
}


export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueueProvider>
          <ErrorBoundary>
            <MainApp />
          </ErrorBoundary>
        </QueueProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

