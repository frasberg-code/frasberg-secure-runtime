// ── Frasberg Carjack — VoiceSystem (pedestrian reaction voice lines) ──────────
const CARJACK_LINES = [
  "Hey! That's my car!",
  "Somebody call the cops!",
  "Help! Car thief!",
  "Are you out of your mind?!",
  "Not my car, man!",
  "Stop that guy!",
  "Oh my god, my car!",
];
const PANIC_LINES = ["Run!", "Look out!", "Get out of the way!"];
const BRIBE_LINES = ["Pleasure doing business with you.", "We were never here.", "Consider it forgotten."];

export class VoiceSystem {
  constructor() {
    this.enabled = typeof speechSynthesis !== 'undefined';
    this._last = 0;
  }

  say(text, { pitch = 1, rate = 1.05, volume = 0.9 } = {}) {
    if (!this.enabled) return;
    const now = Date.now();
    if (now - this._last < 1200) return;   // don't stack chatter
    this._last = now;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.pitch = pitch;
      u.rate = rate;
      u.volume = volume;
      speechSynthesis.speak(u);
    } catch (_) {}
  }

  sayCarjack() {
    const line = CARJACK_LINES[Math.floor(Math.random() * CARJACK_LINES.length)];
    this.say(line, { pitch: 0.8 + Math.random() * 0.7, rate: 1.1 + Math.random() * 0.25 });
  }

  sayPanic() {
    this.say(PANIC_LINES[Math.floor(Math.random() * PANIC_LINES.length)], { pitch: 1.3, rate: 1.3 });
  }

  sayBribe() {
    this.say(BRIBE_LINES[Math.floor(Math.random() * BRIBE_LINES.length)], { pitch: 0.7, rate: 0.95 });
  }
}
