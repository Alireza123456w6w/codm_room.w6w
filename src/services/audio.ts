class TacticalAudio {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    this.enabled = localStorage.getItem('codm_sfx') !== 'false';
  }

  public init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem('codm_sfx', this.enabled ? 'true' : 'false');
    if (this.enabled) {
      this.init();
      this.play('click');
    }
    return this.enabled;
  }

  public play(type: 'click' | 'lock' | 'headshot' | 'nuke' | 'reload' | 'radio' | 'uav' | 'emp') {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const tm = this.ctx.currentTime;

      if (type === 'click') {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, tm);
        osc.frequency.exponentialRampToValueAtTime(600, tm + 0.05);
        g.gain.setValueAtTime(0.12, tm);
        g.gain.exponentialRampToValueAtTime(0.001, tm + 0.05);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(tm);
        osc.stop(tm + 0.05);
      } else if (type === 'lock') {
        [1100, 1760].forEach((freq, idx) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, tm + idx * 0.06);
          g.gain.setValueAtTime(0.15, tm + idx * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, tm + idx * 0.06 + 0.12);
          osc.connect(g);
          g.connect(this.ctx.destination);
          osc.start(tm + idx * 0.06);
          osc.stop(tm + idx * 0.06 + 0.12);
        });
      } else if (type === 'headshot') {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2400, tm);
        osc.frequency.exponentialRampToValueAtTime(3200, tm + 0.15);
        g.gain.setValueAtTime(0.2, tm);
        g.gain.exponentialRampToValueAtTime(0.001, tm + 0.28);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(tm);
        osc.stop(tm + 0.28);
      } else if (type === 'nuke') {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, tm);
        osc.frequency.linearRampToValueAtTime(750, tm + 0.4);
        osc.frequency.linearRampToValueAtTime(220, tm + 0.8);
        g.gain.setValueAtTime(0.18, tm);
        g.gain.exponentialRampToValueAtTime(0.01, tm + 0.85);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(tm);
        osc.stop(tm + 0.85);
      } else if (type === 'reload') {
        [0, 0.11].forEach((delay) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(700, tm + delay);
          osc.frequency.exponentialRampToValueAtTime(300, tm + delay + 0.04);
          g.gain.setValueAtTime(0.12, tm + delay);
          g.gain.exponentialRampToValueAtTime(0.001, tm + delay + 0.04);
          osc.connect(g);
          g.connect(this.ctx.destination);
          osc.start(tm + delay);
          osc.stop(tm + delay + 0.04);
        });
      } else if (type === 'uav') {
        [880, 1320, 1760].forEach((f, i) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, tm + i * 0.08);
          g.gain.setValueAtTime(0.12, tm + i * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, tm + i * 0.08 + 0.15);
          osc.connect(g);
          g.connect(this.ctx.destination);
          osc.start(tm + i * 0.08);
          osc.stop(tm + i * 0.08 + 0.15);
        });
      } else if (type === 'emp' || type === 'radio') {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, tm);
        osc.frequency.linearRampToValueAtTime(1040, tm + 0.1);
        osc.frequency.linearRampToValueAtTime(440, tm + 0.25);
        g.gain.setValueAtTime(0.15, tm);
        g.gain.exponentialRampToValueAtTime(0.001, tm + 0.3);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(tm);
        osc.stop(tm + 0.3);
      }
    } catch {
      // Audio not supported
    }
  }
}

export const AudioFX = new TacticalAudio();
