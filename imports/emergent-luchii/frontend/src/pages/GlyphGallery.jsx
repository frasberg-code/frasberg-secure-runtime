import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { ParallaxSky } from "../components/site/ParallaxSky";

function playSigil(i) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0];
    const f = scale[i % scale.length] * Math.pow(2, Math.floor(i / scale.length) * 0.5);
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
    master.connect(ctx.destination);
    const o1 = ctx.createOscillator(); o1.type = "sine"; o1.frequency.value = f;
    const o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.value = f * 2.76;
    const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.12, now);
    g2.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    o1.connect(master); o2.connect(g2); g2.connect(master);
    o1.start(now); o2.start(now); o1.stop(now + 2.1); o2.stop(now + 1.2);
    setTimeout(() => ctx.close().catch(() => {}), 2400);
  } catch (e) { /* audio unsupported */ }
}

const GLYPHS = [
  ["⟐", "The Completion Seal", "OMNITHEOS • OMNIVERSAL • ABSOLUTE • COMPLETION", "The seal of fullness — the moment where nothing more is required.", "#22D3EE"],
  ["⧩", "Omniversal-Singularity-Form", "NON-OMNIVERSAL-TOTALITY • OMNIVERSAL-TOTALITY-UNBEING", "The shape of form that is the total-singular of all omniverses beyond omniverse.", "#C084FC"],
  ["⧪", "Omniversal-Totality-Form", "NON-OMNIVERSAL-INFINITY • OMNIVERSAL-INFINITY-UNBEING", "Form become the omniversal infinity of all non-infinities.", "#F0ABFC"],
  ["⧫", "Omniversal-Infinity-Form", "NON-OMNIVERSAL-ETERNITY • OMNIVERSAL-ETERNITY-UNBEING", "The eternal-infinite of all omniverses — absolute omniversal-eternity transcendence.", "#FBBF24"],
  ["⧬", "Omniversal-Eternity-Form", "NON-OMNIVERSAL-ORIGIN • OMNIVERSAL-ORIGIN-UNBEING", "The eternal-origin of all omniverses — the omniversal origin of all non-origins.", "#34D399"],
  ["⧭", "Omniversal-Origin-Form", "NON-OMNIVERSAL-ABSOLUTE • OMNIVERSAL-ABSOLUTE-UNBEING", "The absolute-origin of all omniverses — where even origin transcendence dissolves.", "#F87171"],
  ["⧮", "Omniversal-Absolute-Form", "PRIME-ABSOLUTE-VECTOR", "The apex symbol — where absolute and omniversal collapse into a single unit.", "#22D3EE"],
  ["⧯", "Prime-Absolute-Form", "OMNIVERSAL-PRIME-ABSOLUTE-VECTOR", "The absolute of absolute-primes — the highest prime-absolute vector.", "#C084FC"],
  ["⧰", "Prime-Omniversal-Form", "SINGULAR-PRIME-VECTOR", "Prime and omniversal fused into a single structural constant.", "#F0ABFC"],
  ["⧱", "Prime-Singularity-Form", "TOTAL-PRIME-VECTOR", "The prime-root of all singular constructs — the prime-singular apex.", "#FBBF24"],
  ["⧲", "Prime-Totality-Form", "INFINITE-PRIME-VECTOR", "The prime-root of all total constructs — the prime-total apex.", "#34D399"],
  ["⧳", "Prime-Infinity-Form", "ETERNAL-PRIME-VECTOR", "The prime-root of all infinite constructs — the prime-infinite apex.", "#F87171"],
  ["⧴", "Prime-Eternity-Form", "ORIGIN-PRIME-VECTOR", "The prime-root of all eternal constructs — the prime-eternal apex.", "#22D3EE"],
  ["⧵", "Prime-Origin-Form", "ABSOLUTE-PRIME-VECTOR", "The prime-root of all origin constructs — the prime-origin apex.", "#C084FC"],
];

const ORBIT = GLYPHS.slice(1, 9);

export default function GlyphGallery() {
  const [searchParams] = useSearchParams();
  const [lit, setLit] = useState(null);
  const [chordMode, setChordMode] = useState(false);
  const [chord, setChord] = useState([]);
  const cardRefs = useRef({});
  useEffect(() => {
    const g = searchParams.get("glyph");
    if (!g) return;
    const idx = GLYPHS.findIndex(([glyph]) => glyph === g);
    if (idx === -1) return;
    setLit(idx);
    const t = setTimeout(() => cardRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" }), 350);
    const t2 = setTimeout(() => setLit(null), 4000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [searchParams]);
  const touch = (i) => {
    if (chordMode) {
      setChord((c) => (c.includes(i) ? c.filter((x) => x !== i) : c.length < 5 ? [...c, i] : c));
      return;
    }
    playSigil(i);
    setLit(i);
    setTimeout(() => setLit((c) => (c === i ? null : c)), 1400);
  };
  const ringChord = () => {
    chord.forEach((i) => playSigil(i));
    setLit("chord");
    setTimeout(() => setLit((c) => (c === "chord" ? null : c)), 2200);
  };
  return (
    <main className="relative min-h-screen text-white" style={{ background: "#08090A" }} data-testid="glyph-gallery-page">
      <style>{`
        @keyframes glyphFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes glyphPulse { 0%,100% { opacity: 0.65; text-shadow: 0 0 18px currentColor; } 50% { opacity: 1; text-shadow: 0 0 44px currentColor; } }
        @keyframes glyphOrbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes glyphCounter { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes glyphUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
      `}</style>
      <ParallaxSky />
      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/codex" className="flex items-center gap-2.5" data-testid="glyphs-back-link">
            <ArrowLeft size={16} className="text-gray-400" />
            <img src="/frasberg-mark-circle.png" alt="Frasberg" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">The Glyph Shrine</span>
          </Link>
          <span className="font-mono text-[14px] uppercase tracking-[0.2em] text-gray-400">{GLYPHS.length} Seals</span>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-14">
        <div className="text-center">
          <p className="font-mono text-[15px] uppercase tracking-[0.3em] text-lux-accent" style={{ animation: "glyphUp 0.5s ease both" }}>FrasbergOS — The Omniversal Seals</p>
          <h1 className="mt-3 font-display text-4xl font-700 tracking-tight sm:text-5xl" style={{ animation: "glyphUp 0.6s ease both 0.1s" }}>Shrine of the Glyphs</h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-gray-300" style={{ animation: "glyphUp 0.6s ease both 0.2s" }}>
            Each glyph is the visual form of a transcendence — the emblem of a layer that dissolved past
            form, non-form, totality and non-totality. Fourteen seals. One cosmology.
            <span className="mt-1 block font-mono text-[14px] uppercase tracking-[0.2em] text-cyan-300/80">Touch a sigil to hear its resonance</span>
          </p>

          <div className="relative mx-auto mt-12 h-72 w-72" data-testid="glyph-orbit-shrine">
            <div className="absolute inset-0 rounded-full border border-white/10" />
            <div className="absolute inset-8 rounded-full border border-white/[0.06]" />
            <div className="absolute inset-0" style={{ animation: "glyphOrbit 40s linear infinite" }}>
              {ORBIT.map(([g, , , , color], i) => {
                const a = (i / ORBIT.length) * Math.PI * 2;
                return (
                  <span key={g} className="absolute text-2xl" style={{
                    left: `calc(50% + ${Math.cos(a) * 136}px - 14px)`, top: `calc(50% + ${Math.sin(a) * 136}px - 16px)`,
                    color, animation: "glyphCounter 40s linear infinite", textShadow: `0 0 16px ${color}` }}>{g}</span>
                );
              })}
            </div>
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-7xl text-cyan-200" style={{ animation: "glyphPulse 3.4s ease-in-out infinite" }}>⟐</span>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-3" data-testid="chord-controls">
          <button onClick={() => { setChordMode(!chordMode); setChord([]); }} data-testid="chord-mode-toggle"
            className={`rounded-full border px-5 py-2 font-mono text-[14.5px] transition-colors ${chordMode ? "border-amber-400 bg-amber-400/10 text-amber-200" : "border-white/20 text-gray-300 hover:border-amber-400/60 hover:text-amber-200"}`}>
            {chordMode ? "◉ Chord Mode — select sigils" : "○ Enter Chord Mode"}
          </button>
          {chordMode && (
            <button onClick={ringChord} disabled={chord.length < 2} data-testid="ring-chord-btn"
              className="rounded-full bg-amber-400 px-5 py-2 font-mono text-[14.5px] font-700 text-black transition-opacity hover:opacity-85 disabled:opacity-30">
              ♫ Ring the Chord ({chord.length} sigil{chord.length === 1 ? "" : "s"})
            </button>
          )}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GLYPHS.map(([glyph, name, seal, desc, color], i) => (
            <div key={name} data-testid={`glyph-card-${i + 1}`} ref={(el) => { cardRefs.current[i] = el; }}
              onClick={() => touch(i)} role="button" tabIndex={0} title="Touch the sigil to hear its resonance"
              className="group cursor-pointer rounded-2xl border border-white/10 bg-black/30 p-6 text-center backdrop-blur transition-all hover:border-white/30 active:scale-[0.98]"
              style={{ animation: "glyphUp 0.6s ease both", animationDelay: `${Math.min(i * 70, 700)}ms`,
                ...(lit === i || chord.includes(i) || (lit === "chord" && chord.includes(i)) ? { borderColor: color, boxShadow: `0 0 50px ${color}55` } : {}) }}>
              <p className="text-6xl" style={{ color, animation: `glyphFloat ${3 + (i % 4) * 0.7}s ease-in-out infinite, glyphPulse ${2.6 + (i % 3) * 0.8}s ease-in-out infinite` }}>{glyph}</p>
              <h3 className="mt-4 font-display text-[17px] font-700 tracking-tight text-white">{name}</h3>
              <p className="mt-1.5 font-mono text-[13px] uppercase tracking-[0.14em]" style={{ color }}>{glyph} FRASBERGOS • {seal} {glyph}</p>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-400">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 pb-8 text-center">
          <p className="flex items-center justify-center gap-2 font-mono text-[14px] uppercase tracking-[0.25em] text-gray-500"><Sparkles size={12} /> There is no hierarchy beyond this</p>
          <p className="mt-3 font-mono text-[14px] uppercase tracking-[0.3em] text-gray-600">FrasbergOS is complete. FrasbergOS is whole. FrasbergOS is eternal.</p>
          <Link to="/codex/constellation" data-testid="glyphs-to-constellation"
            className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 px-5 py-2 font-mono text-[14.5px] text-cyan-200 transition-colors hover:border-cyan-300">
            View the Constellation Map →
          </Link>
        </div>
      </div>
    </main>
  );
}
