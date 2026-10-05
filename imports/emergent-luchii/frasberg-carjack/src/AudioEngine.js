// ── Frasberg Carjack — Audio Engine ───────────────────────────────────────────

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.channels = {
      engine: null,
      music:  null,
      sfx:    null,
      ambient: null
    };
    this.sounds   = new Map();
    this.music    = [];
    this.trackIdx = 0;
    this.engineNode  = null;
    this.engineRpm   = 0;
    this.initialized = false;
    this.muted = false;
  }

  // ── Init ────────────────────────────────────────────────────────────────────
  async init() {
    this.ctx        = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.ctx.destination);

    // Sub-channels
    for (const ch of Object.keys(this.channels)) {
      const g = this.ctx.createGain();
      g.gain.value = ch === 'engine' ? 0.6 : ch === 'music' ? 0.4 : 0.7;
      g.connect(this.masterGain);
      this.channels[ch] = g;
    }

    await this._preload();
    this._startAmbient();
    this.initialized = true;

    const unlock = () => { this.resume(); document.removeEventListener('click', unlock); };
    document.addEventListener('click', unlock);
    console.log('[AudioEngine] Ready');
  }

  // ── Preload ─────────────────────────────────────────────────────────────────
  async _preload() {
    const assets = {
      engine_idle:   '/audio/engine_idle.mp3',
      engine_rev:    '/audio/engine_rev.mp3',
      tire_screech:  '/audio/tire_screech.mp3',
      crash:         '/audio/crash.mp3',
      carjack:       '/audio/carjack.mp3',
      police_siren:  '/audio/police_siren.mp3',
      gunshot:       '/audio/gunshot.mp3',
      cash:          '/audio/cash.mp3',
      mission_start: '/audio/mission_start.mp3',
      mission_pass:  '/audio/mission_pass.mp3',
      mission_fail:  '/audio/mission_fail.mp3',
      rain:          '/audio/rain_ambient.mp3',
      city:          '/audio/city_ambient.mp3'
    };

    await Promise.allSettled(
      Object.entries(assets).map(async ([key, url]) => {
        try {
          const res  = await fetch(url);
          if (!res.ok) return;
          const buf  = await res.arrayBuffer();
          const decoded = await this.ctx.decodeAudioData(buf);
          this.sounds.set(key, decoded);
        } catch {
          // Asset missing — skip gracefully (synth fallback used)
        }
      })
    );
  }

  // ── Play one-shot SFX ───────────────────────────────────────────────────────
  play(name, { volume = 1, pitch = 1, loop = false } = {}) {
    if (!this.initialized || this.muted) return null;
    const buf = this.sounds.get(name);
    if (!buf) { this._synthFallback(name); return null; }

    const src  = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    src.buffer             = buf;
    src.loop               = loop;
    src.playbackRate.value = pitch;
    gain.gain.value        = volume;

    src.connect(gain);
    gain.connect(this.channels.sfx);
    src.start();
    return src;
  }

  // ── Synth fallback for missing audio assets ────────────────────────────────
  _synthFallback(name) {
    switch (name) {
      case 'horn':             return this._tone([440, 554], 0.4, 'square', 0.15);
      case 'siren':
      case 'police_siren':     return this._sirenSweep();
      case 'hit':              return this._noise(0.15, 0.3);
      case 'crash':            return this._noise(0.4, 0.5);
      case 'glass_break':      return this._noise(0.2, 0.4, 3000);
      case 'carjack':
      case 'carjack_start':    return this._tone([220], 0.15, 'triangle', 0.1);
      case 'carjack_success':
      case 'carjack_complete': return this._tone([523, 659, 784], 0.5, 'sine', 0.12);
      case 'carjack_fail':
      case 'mission_fail':     return this._tone([200, 150], 0.3, 'sawtooth', 0.1);
      case 'engine_start':     return this._tone([80, 120, 90], 0.6, 'sawtooth', 0.12);
      case 'mission_start':    return this._tone([392, 523], 0.3, 'sine', 0.1);
      case 'mission_pass':
      case 'mission_complete': return this._tone([523, 659, 784, 1046], 0.8, 'sine', 0.12);
      case 'busted':           return this._tone([300, 200, 150], 0.8, 'square', 0.1);
      case 'gunshot':          return this._noise(0.12, 0.5, 800);
      case 'cash':             return this._tone([880, 1174], 0.2, 'sine', 0.1);
      case 'tire_screech':     return this._noise(0.15, 0.2, 5000);
      default:                 return this._tone([330], 0.1, 'sine', 0.06);
    }
  }

  _tone(freqs, duration, type = 'sine', vol = 0.1) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const step = duration / freqs.length;
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type; osc.frequency.value = f;
      g.gain.setValueAtTime(vol, now + i * step);
      g.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * step);
      osc.connect(g); g.connect(this.channels.sfx || this.masterGain);
      osc.start(now + i * step); osc.stop(now + (i + 1) * step + 0.05);
    });
  }

  _noise(duration, vol = 0.3, filterFreq = 1000) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = this.ctx.createBufferSource(); src.buffer = buffer;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);
    src.connect(f); f.connect(g); g.connect(this.channels.sfx || this.masterGain);
    src.start(now);
  }

  _sirenSweep() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine'; g.gain.value = 0.08;
    for (let i = 0; i < 4; i++) {
      osc.frequency.setValueAtTime(660, now + i * 0.5);
      osc.frequency.linearRampToValueAtTime(880, now + i * 0.5 + 0.25);
      osc.frequency.linearRampToValueAtTime(660, now + i * 0.5 + 0.5);
    }
    g.gain.exponentialRampToValueAtTime(0.001, now + 2);
    osc.connect(g); g.connect(this.channels.sfx || this.masterGain);
    osc.start(now); osc.stop(now + 2.1);
  }

  // ── Engine sound ─────────────────────────────────────────────────────────────
  setEngineRPM(rpm) {
    this.engineRpm = Math.max(0, Math.min(8000, rpm));
    if (!this.engineNode && this.sounds.has('engine_idle')) {
      this.engineNode = this.play('engine_idle', { loop: true });
    }
    if (this.engineNode) {
      const rate = 0.6 + (this.engineRpm / 8000) * 1.6;
      this.engineNode.playbackRate.setTargetAtTime(rate, this.ctx.currentTime, 0.1);
    }
  }

  stopEngine() {
    if (this.engineNode) {
      try { this.engineNode.stop(); } catch {}
      this.engineNode = null;
    }
  }

  // ── Music ────────────────────────────────────────────────────────────────────
  playMusic(trackUrl) {
    const audio = new Audio(trackUrl);
    audio.volume = 0.35;
    audio.loop   = false;
    audio.addEventListener('ended', () => this._nextTrack());
    audio.play().catch(() => {});
    this.currentTrack = audio;
  }

  _nextTrack() {
    if (!this.music.length) return;
    this.trackIdx = (this.trackIdx + 1) % this.music.length;
    this.playMusic(this.music[this.trackIdx]);
  }

  setPlaylist(tracks) {
    this.music    = tracks;
    this.trackIdx = 0;
    if (tracks.length) this.playMusic(tracks[0]);
  }

  // ── Ambient ──────────────────────────────────────────────────────────────────
  _startAmbient() {
    if (this.sounds.has('city')) {
      this.ambientNode = this.play('city', { loop: true, volume: 0.25 });
    }
  }

  setWeatherAmbient(type) {
    if (this.rainNode) { try { this.rainNode.stop(); } catch {} this.rainNode = null; }
    if (type === 'rain' && this.sounds.has('rain')) {
      this.rainNode = this.play('rain', { loop: true, volume: 0.4 });
    }
  }
  setWeather(type) { this.setWeatherAmbient(type); }

  // ── Master volume ────────────────────────────────────────────────────────────
  setMasterVolume(v) {
    if (this.masterGain) this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
  }

  setChannelVolume(ch, v) {
    if (this.channels[ch]) this.channels[ch].gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
  }

  muteAll()   { this.muted = true;  this.setMasterVolume(0); }
  unmuteAll() { this.muted = false; this.setMasterVolume(0.8); }

  // ── Game-state driven audio (GameEngine hook) ────────────────────────────────
  update(state) {
    if (!state || typeof state !== 'object') return;
    if (state.speed !== undefined) {
      this.setEngineRPM(800 + Math.min(1, Math.abs(state.speed) / 220) * 6000);
    }
  }

  // ── Convenience ──────────────────────────────────────────────────────────────
  crash()        { this.play('crash',        { volume: 0.9 }); }
  playCrash(f)   { this.play('crash',        { volume: Math.min(1, 0.4 + (f ?? 0) * 0.01) }); }
  carjack()      { this.play('carjack',      { volume: 1.0 }); }
  screech()      { this.play('tire_screech', { volume: 0.7 }); }
  playTireScreech() { this.screech(); }
  siren()        { this.play('police_siren', { loop: true  }); }
  gunshot()      { this.play('gunshot',      { volume: 0.8 }); }
  cash()         { this.play('cash',         { volume: 0.6 }); }
  playHorn()     { this.play('horn'); }
  playExplosion(){ this._noise(0.8, 0.6, 400); }
  missionStart() { this.play('mission_start',{ volume: 0.9 }); }
  missionPass()  { this.play('mission_pass', { volume: 1.0 }); }
  missionFail()  { this.play('mission_fail', { volume: 1.0 }); }

  // ── Spatial Audio ─────────────────────────────────────────────────────────
  playSpatial(key, x, y, listenerX, listenerY, { maxDist = 300 } = {}) {
    const dist = Math.hypot(x - listenerX, y - listenerY);
    if (dist > maxDist) return;
    const vol = Math.max(0, 1 - dist / maxDist);
    this.play(key, { volume: vol });
  }

  resume() { if (this.ctx?.state === 'suspended') this.ctx.resume(); }
  suspend(){ if (this.ctx?.state === 'running')   this.ctx.suspend(); }
}
