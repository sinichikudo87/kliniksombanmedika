/**
 * Web Audio API Hospital / Airport Notification Chime
 */
class HospitalChime {
  private ctx: AudioContext | null = null;

  private initContext() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Plays a pleasant 3-tone hospital chime (C5 -> E5 -> G5)
   */
  async playChime(): Promise<void> {
    return new Promise((resolve) => {
      try {
        const ctx = this.initContext();
        if (!ctx) {
          resolve();
          return;
        }

        const now = ctx.currentTime;
        // Chime frequencies: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz)
        const notes = [
          { freq: 523.25, time: 0.0, dur: 0.4 },
          { freq: 659.25, time: 0.25, dur: 0.4 },
          { freq: 783.99, time: 0.5, dur: 0.9 },
        ];

        notes.forEach(({ freq, time, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + time);

          // Warm harmonic chime envelope
          gain.gain.setValueAtTime(0.001, now + time);
          gain.gain.exponentialRampToValueAtTime(0.35, now + time + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + time);
          osc.stop(now + time + dur + 0.05);
        });

        setTimeout(() => {
          resolve();
        }, 1300);
      } catch (e) {
        console.warn('Audio chime playback issue:', e);
        resolve();
      }
    });
  }
}

export const chimePlayer = new HospitalChime();

/**
 * Text-to-Speech in Indonesian
 */
export async function speakIndonesianQueue(
  ticketNumber: string,
  destination: string,
  roomOrCounter: string
): Promise<void> {
  if (typeof window === 'undefined') return;

  // First, play hospital chime
  await chimePlayer.playChime();

  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  // Parse ticket number into spelled out speech: e.g. "A-012" -> "A... kosong, satu, dua"
  const prefixMatch = ticketNumber.match(/^([A-Za-z]+)-?(\d+)$/);
  let spokenTicket = ticketNumber;

  if (prefixMatch) {
    const letter = prefixMatch[1].toUpperCase();
    const digits = prefixMatch[2];
    const digitWords: Record<string, string> = {
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

    const spelledDigits = digits
      .split('')
      .map((d) => digitWords[d] || d)
      .join(', ');

    spokenTicket = `Nomor antrean, ${letter}... ${spelledDigits}`;
  } else {
    spokenTicket = `Nomor antrean ${ticketNumber}`;
  }

  const speechText = `${spokenTicket}. Silakan menuju ke ${destination}, ${roomOrCounter}.`;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(speechText);
  utterance.lang = 'id-ID';
  utterance.rate = 0.88; // Slightly calmer, articulate pacing for hospital announcements
  utterance.pitch = 1.05;

  // Try to find an Indonesian voice
  const voices = window.speechSynthesis.getVoices();
  const indonesianVoice = voices.find(
    (v) =>
      v.lang.toLowerCase().includes('id') ||
      v.name.toLowerCase().includes('indonesia') ||
      v.name.toLowerCase().includes('damayanti') ||
      v.name.toLowerCase().includes('andika') ||
      v.name.toLowerCase().includes('gadis')
  );

  if (indonesianVoice) {
    utterance.voice = indonesianVoice;
  }

  return new Promise((resolve) => {
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}
