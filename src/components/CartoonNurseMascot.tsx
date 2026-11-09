import React, { useState } from 'react';
import { Sparkles, Volume2 } from 'lucide-react';
import { ttsService } from '../services/ttsService';

interface CartoonNurseMascotProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showGreeting?: boolean;
}

export const CartoonNurseMascot: React.FC<CartoonNurseMascotProps> = ({
  className = '',
  size = 'lg',
  showGreeting = true,
}) => {
  const [isSpeakingGreeting, setIsSpeakingGreeting] = useState<boolean>(false);

  // Interactive click: Speaks welcoming greeting through audio speaker
  const handleMascotClick = () => {
    setIsSpeakingGreeting(true);

    const greetingText =
      'Halo! Selamat datang di Klinik Somban Medika. Silakan duduk dengan nyaman ya, nomor antrean Anda akan segera kami panggil.';
    ttsService.speakText(greetingText);

    setTimeout(() => {
      setIsSpeakingGreeting(false);
    }, 4500);
  };

  // Dimensional scaling (Strictly NO BOX, standalone character)
  const sizeClasses = {
    sm: 'w-28 h-56 sm:w-32 sm:h-64',
    md: 'w-44 h-84 sm:w-52 sm:h-96',
    lg: 'w-60 h-[420px] sm:w-68 sm:h-[460px] 2xl:w-76 2xl:h-[510px]',
    xl: 'w-72 h-[490px] sm:w-84 sm:h-[560px] 2xl:w-96 2xl:h-[630px]',
  }[size];

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
      style={{ isolation: 'isolate' }}
    >
      {/* 1. Organic Floating Speech Callout (NO RIGID BOX, soft speech balloon with pointer) */}
      {showGreeting && (
        <div className="relative mb-2 max-w-sm sm:max-w-md px-4 py-2 rounded-2xl bg-emerald-500/10 dark:bg-emerald-400/10 backdrop-blur-xs text-center transition-all duration-300 transform hover:scale-[1.02]">
          <div className="flex items-center justify-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-xs sm:text-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-spin" />
            <span>Perawat Siaga Klinik Somban Medika</span>
            <span className="text-sm">😊</span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
            &quot;Selamat datang! Silakan duduk dengan nyaman, nomor antrean Anda akan segera dipanggil.&quot;
          </p>
          {/* Subtle speech balloon tail */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-emerald-500/10 dark:bg-emerald-400/10 rotate-45" />
        </div>
      )}

      {/* 2. Free-standing Mascot: ZERO BACKGROUND, NOT IN A BOX, CLEAN PRISTINE CHARACTER */}
      <div
        onClick={handleMascotClick}
        title="Klik perawat untuk sapaan suara ramah!"
        className={`relative ${sizeClasses} cursor-pointer group transition-transform duration-300 ease-out hover:scale-[1.015]`}
      >
        {/* Soft Floor Contact Shadow: Anchors character directly in 3D floor space */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-44 sm:w-52 h-5 rounded-full bg-slate-900/15 dark:bg-black/45 blur-xs animate-shadow-breathe pointer-events-none" />

        {/* Character Body with Gentle Breathing Motion */}
        <div className="w-full h-full relative animate-nurse-bob">
          {/* High-End 3D Cartoon Nurse Image: Clean, Natural, Pristine */}
          <img
            src="/src/assets/images/nurse_3d_cartoon_trimmed.png"
            alt="Perawat Kartun 3D Klinik Somban Medika Membawa Tab"
            className="w-full h-full object-contain pointer-events-none drop-shadow-md select-none"
            referrerPolicy="no-referrer"
          />

          {/* Active Tablet Status Glowing LED Indicator */}
          <div
            className="absolute top-[51%] left-[49.5%] -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-emerald-400/80 blur-xs animate-tablet-pulse pointer-events-none"
            title="Tab Pelayanan Antrean Aktif"
          />

          {/* Interactive Speech Indicator when Speaking */}
          {isSpeakingGreeting && (
            <div className="absolute top-2 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-lg animate-bounce">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Menyapa Pasien...</span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Helper Hint */}
      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
        <span>Klik perawat untuk mendengarkan sapaan suara</span>
        <span className="text-emerald-500">👋</span>
      </div>
    </div>
  );
};
