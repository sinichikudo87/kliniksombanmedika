/**
 * Audio Chime Synthesizer using Web Audio API.
 * Produces crisp, crystal-clear hospital & airport style announcement chimes.
 */

class ChimeAudioService {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Plays a 3-tone harmonic chime (Hospital Standard: C5 -> E5 -> G5)
   */
  async playHospitalChime(volume = 0.9): Promise<void> {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Frequencies: C5 (523.25 Hz), E5 (659.25 Hz), G5 (783.99 Hz)
    const tones = [
      { freq: 523.25, time: 0.00, dur: 0.45 },
      { freq: 659.25, time: 0.22, dur: 0.45 },
      { freq: 783.99, time: 0.44, dur: 0.70 },
    ];

    return new Promise((resolve) => {
      tones.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Warm harmonic mix: sine with gentle triangle overtone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        // Gentle envelope: smooth attack, decaying release
        gain.gain.setValueAtTime(0.0001, now + time);
        gain.gain.linearRampToValueAtTime(volume * 0.4, now + time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur);
      });

      // Total chime duration is ~1.2 seconds
      setTimeout(() => {
        resolve();
      }, 1150);
    });
  }

  /**
   * Airport style 2-tone crisp chime (F5 -> Bb5)
   */
  async playAirportChime(volume = 0.9): Promise<void> {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const tones = [
      { freq: 698.46, time: 0.00, dur: 0.5 },
      { freq: 932.33, time: 0.26, dur: 0.7 },
    ];

    return new Promise((resolve) => {
      tones.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.0001, now + time);
        gain.gain.linearRampToValueAtTime(volume * 0.4, now + time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur);
      });

      setTimeout(() => {
        resolve();
      }, 980);
    });
  }

  /**
   * Crystal bell tone
   */
  async playBellCrystal(volume = 0.9): Promise<void> {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1760, now); // A6 overtone

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume * 0.35, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.85);
    osc2.stop(now + 0.85);

    return new Promise((resolve) => setTimeout(resolve, 850));
  }
}

export const chimeService = new ChimeAudioService();
