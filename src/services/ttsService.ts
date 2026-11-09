import { TTSConfig } from '../types/queue';
import { chimeService } from './chimeAudio';

export interface TTSState {
  isSpeaking: boolean;
  currentText: string | null;
  queueLength: number;
}

type StateListener = (state: TTSState) => void;

class TTSService {
  private config: TTSConfig = {
    voiceName: '',
    voiceGender: 'wanita',
    rate: 0.92,
    pitch: 1.05,
    volume: 1.0,
    chimeType: 'hospital-harmonic',
    repeatCall: 1,
    speechEngine: 'browser-responsive',
  };

  private availableVoices: SpeechSynthesisVoice[] = [];
  private isProcessingQueue = false;
  private queue: Array<{ text: string; resolve: () => void }> = [];
  private listeners: StateListener[] = [];
  private isSpeakingNow = false;
  private currentSpokenText: string | null = null;

  constructor() {
    this.initVoices();
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const loadVoices = () => {
      this.availableVoices = window.speechSynthesis.getVoices();
      if (!this.config.voiceName) {
        // Find best Indonesian voice
        const indonesianVoice = this.availableVoices.find(
          (v) => v.lang.startsWith('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesia')
        );
        if (indonesianVoice) {
          this.config.voiceName = indonesianVoice.name;
        }
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.availableVoices.length === 0 && 'speechSynthesis' in window) {
      this.availableVoices = window.speechSynthesis.getVoices();
    }
    return this.availableVoices;
  }

  public getIndonesianVoices(): SpeechSynthesisVoice[] {
    const all = this.getAvailableVoices();
    const indonesian = all.filter(
      (v) => v.lang.startsWith('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesia')
    );
    return indonesian.length > 0 ? indonesian : all;
  }

  public updateConfig(newConfig: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): TTSConfig {
    return { ...this.config };
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  public getState(): TTSState {
    return {
      isSpeaking: this.isSpeakingNow,
      currentText: this.currentSpokenText,
      queueLength: this.queue.length,
    };
  }

  /**
   * Converts a queue ticket number like "A-024" or "B-105" into fluent Indonesian announcement phonetics.
   */
  public formatNomorAntreanPhonetic(nomorAntrean: string): string {
    const parts = nomorAntrean.split('-');
    const huruf = parts[0] ? parts[0].trim().toUpperCase() : '';
    const angkaStr = parts[1] ? parts[1].trim() : '';

    const digitMap: Record<string, string> = {
      '0': 'kosong',
      '1': 'satu',
      '2': 'dua',
      '3': 'tiga',
      '4': 'empat',
      '5': 'lima',
      '6': 'enam',
      '7': 'tujuh',
      '8': 'delapan',
      '9': 'sembilan',
    };

    const digitsSpoken = angkaStr
      .split('')
      .map((d) => digitMap[d] || d)
      .join(', ');

    return `${huruf}... ${digitsSpoken}`;
  }

  /**
   * Formats the complete announcement sentence for calling queue in hospital/clinic standard Indonesian.
   */
  public generatePanggilanText(nomorAntrean: string, tujuanLoket: string): string {
    const phoneticNumber = this.formatNomorAntreanPhonetic(nomorAntrean);
    // e.g. "Nomor antrean... A... kosong, dua, empat... Silakan menuju ke Loket 1"
    return `Nomor antrean... ${phoneticNumber}... Silakan menuju ke ${tujuanLoket}.`;
  }

  /**
   * Plays the announcement sound:
   * 1. Plays harmonic chime
   * 2. Speaks the clear Indonesian text
   */
  public async callQueue(nomorAntrean: string, tujuanLoket: string): Promise<void> {
    const text = this.generatePanggilanText(nomorAntrean, tujuanLoket);
    return this.enqueueSpeech(text);
  }

  /**
   * Directly speaks arbitrary text through the TTS queue
   */
  public async speakText(text: string): Promise<void> {
    return this.enqueueSpeech(text);
  }

  /**
   * Test speech preview directly
   */
  public async testSpeechPreview(sampleText?: string): Promise<void> {
    const text = sampleText || 'Nomor antrean... A... kosong, kosong, satu... Silakan menuju ke Loket satu.';
    return this.enqueueSpeech(text);
  }

  public stopAll(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.queue = [];
    this.isSpeakingNow = false;
    this.currentSpokenText = null;
    this.isProcessingQueue = false;
    this.notify();
  }

  private enqueueSpeech(text: string): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push({ text, resolve });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.queue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    const item = this.queue.shift();
    if (!item) {
      this.isProcessingQueue = false;
      return;
    }

    try {
      // 1. Play chime if configured
      if (this.config.chimeType !== 'none') {
        if (this.config.chimeType === 'hospital-harmonic') {
          await chimeService.playHospitalChime(this.config.volume);
        } else if (this.config.chimeType === 'airport-triple') {
          await chimeService.playAirportChime(this.config.volume);
        } else if (this.config.chimeType === 'bell-crystal') {
          await chimeService.playBellCrystal(this.config.volume);
        }
      }

      // Small pause between chime and speech for maximum clarity
      await new Promise((r) => setTimeout(r, 200));

      // 2. Speak
      const repeat = this.config.repeatCall || 1;
      for (let i = 0; i < repeat; i++) {
        await this.speakNative(item.text);
        if (i < repeat - 1) {
          // Pause between repeats
          await new Promise((r) => setTimeout(r, 1200));
        }
      }
    } catch (err) {
      console.error('Error during TTS playback:', err);
    } finally {
      this.isSpeakingNow = false;
      this.currentSpokenText = null;
      this.notify();
      item.resolve();
      this.isProcessingQueue = false;

      // Continue with remaining queue
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 250);
      }
    }
  }

  private speakNative(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        console.warn('SpeechSynthesis is not supported in this environment');
        resolve();
        return;
      }

      // Cancel previous lingering speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = this.config.rate;
      utterance.pitch = this.config.pitch;
      utterance.volume = this.config.volume;
      utterance.lang = 'id-ID';

      // Pick configured voice or best Indonesian voice
      const voices = this.getAvailableVoices();
      let chosenVoice: SpeechSynthesisVoice | undefined;

      if (this.config.voiceName) {
        chosenVoice = voices.find((v) => v.name === this.config.voiceName);
      }

      if (!chosenVoice) {
        chosenVoice = voices.find(
          (v) => v.lang.startsWith('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesia')
        );
      }

      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      this.isSpeakingNow = true;
      this.currentSpokenText = text;
      this.notify();

      utterance.onstart = () => {
        this.isSpeakingNow = true;
        this.currentSpokenText = text;
        this.notify();
      };

      utterance.onend = () => {
        this.isSpeakingNow = false;
        this.currentSpokenText = null;
        this.notify();
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        this.isSpeakingNow = false;
        this.currentSpokenText = null;
        this.notify();
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }
}

export const ttsService = new TTSService();
