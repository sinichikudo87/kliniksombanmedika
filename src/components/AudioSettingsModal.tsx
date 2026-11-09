import React, { useEffect, useState } from 'react';
import {
  Volume2,
  Bell,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { ttsService } from '../services/ttsService';
import { showSuccessAlert, showToast } from '../utils/swal';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ isOpen, onClose }) => {
  const { ttsConfig, updateTTSConfig, testSpeakerSound, ttsState } = useQueue();

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [samplePhrase, setSamplePhrase] = useState<string>(
    'Nomor antrean... A... kosong, dua, empat... Silakan menuju ke Loket satu.'
  );

  useEffect(() => {
    if (isOpen) {
      const voices = ttsService.getAvailableVoices();
      setAvailableVoices(voices);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const indonesianVoices = availableVoices.filter(
    (v) => v.lang.startsWith('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesia')
  );

  const handleSaveAndClose = () => {
    showToast('Pengaturan suara speaker berhasil disimpan', 'success');
    onClose();
  };

  const handleResetDefault = () => {
    updateTTSConfig({ rate: 0.92, pitch: 1.05, volume: 1.0, chimeType: 'hospital-harmonic', repeatCall: 1 });
    showToast('Pengaturan audio direset ke standar Rumah Sakit', 'info');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[70] flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl max-w-xl w-full p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5 animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Pengaturan Suara Speaker &amp; TTS
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Konfigurasi mesin text-to-speech responsif dan denting bel pemanggil
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4 text-xs">
          {/* 1. Voice Selector */}
          <div>
            <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1.5 flex items-center justify-between">
              <span>Pilihan Suara (Voice Synthesis):</span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                {indonesianVoices.length > 0 ? `${indonesianVoices.length} Suara Bahasa Indonesia Terdeteksi` : 'Menggunakan Suara Default Sistem'}
              </span>
            </label>
            <select
              value={ttsConfig.voiceName}
              onChange={(e) => updateTTSConfig({ voiceName: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
            >
              <option value="">Otomatis (Rekomendasi Terbaik Bahasa Indonesia)</option>
              {availableVoices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang}) {v.default ? ' - Bawaan Sistem' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Chime Type */}
          <div>
            <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1.5">
              Tipe Denting Bel (Harmonic Chime):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'hospital-harmonic', name: 'Harmoni RS (3 Nada)' },
                { id: 'airport-triple', name: 'Denting Bandara (2 Nada)' },
                { id: 'bell-crystal', name: 'Kristal Bell' },
                { id: 'none', name: 'Tanpa Denting' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => updateTTSConfig({ chimeType: c.id as any })}
                  className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                    ttsConfig.chimeType === c.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-800 dark:text-emerald-300 font-bold'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 mx-auto mb-1 opacity-70" />
                  <span className="text-[11px] block leading-tight">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Sliders: Rate, Pitch, Volume */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
            {/* Speed Rate */}
            <div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1 font-medium">
                <span>Kecepatan Bicara:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">{ttsConfig.rate}x</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.3"
                step="0.05"
                value={ttsConfig.rate}
                onChange={(e) => updateTTSConfig({ rate: parseFloat(e.target.value) })}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Pitch */}
            <div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1 font-medium">
                <span>Tinggi Nada:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">{ttsConfig.pitch}</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.05"
                value={ttsConfig.pitch}
                onChange={(e) => updateTTSConfig({ pitch: parseFloat(e.target.value) })}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Volume */}
            <div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1 font-medium">
                <span>Volume Speaker:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">{Math.round(ttsConfig.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={ttsConfig.volume}
                onChange={(e) => updateTTSConfig({ volume: parseFloat(e.target.value) })}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          {/* 4. Repeat Panggilan */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">Jumlah Pengulangan Panggilan:</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Berapa kali kalimat diulang saat tombol panggil ditekan</span>
            </div>
            <div className="flex gap-1">
              {[1, 2].map((num) => (
                <button
                  key={num}
                  onClick={() => updateTTSConfig({ repeatCall: num })}
                  className={`px-3 py-1.5 rounded font-bold cursor-pointer transition-colors ${
                    ttsConfig.repeatCall === num
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {num}x
                </button>
              ))}
            </div>
          </div>

          {/* 5. Custom Phrase Preview Tester */}
          <div>
            <label className="font-semibold text-slate-800 dark:text-slate-300 block mb-1">
              Uji Coba Kalimat Panggilan:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={samplePhrase}
                onChange={(e) => setSamplePhrase(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-600"
              />
              <button
                onClick={() => testSpeakerSound(samplePhrase)}
                disabled={ttsState.isSpeaking}
                className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{ttsState.isSpeaking ? 'Berbicara...' : 'Bunyikan'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={handleResetDefault}
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Standar RS</span>
          </button>
          <button
            onClick={handleSaveAndClose}
            className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold transition-colors cursor-pointer"
          >
            Tutup &amp; Simpan
          </button>
        </div>
      </div>
    </div>
  );
};
