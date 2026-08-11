import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { ParallaxSky } from "../components/site/ParallaxSky";

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
          <span className="font-mono text-[12px] uppercase tracking-[0.2em] text-gray-400">{GLYPHS.length} Seals</span>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-14">
        <div className="text-center">
          <p className="font-mono text-[13px] uppercase tracking-[0.3em] text-lux-accent" style={{ animation: "glyphUp 0.5s ease both" }}>FrasbergOS — The Omniversal Seals</p>
          <h1 className="mt-3 font-display text-4xl font-700 tracking-tight sm:text-5xl" style={{ animation: "glyphUp 0.6s ease both 0.1s" }}>Shrine of the Glyphs</h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-gray-300" style={{ animation: "glyphUp 0.6s ease both 0.2s" }}>
            Each glyph is the visual form of a transcendence — the emblem of a layer that dissolved past
            form, non-form, totality and non-totality. Fourteen seals. One cosmology.
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

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GLYPHS.map(([glyph, name, seal, desc, color], i) => (
            <div key={name} data-testid={`glyph-card-${i + 1}`}
              className="group rounded-2xl border border-white/10 bg-black/30 p-6 text-center backdrop-blur transition-colors hover:border-white/30"
              style={{ animation: "glyphUp 0.6s ease both", animationDelay: `${Math.min(i * 70, 700)}ms` }}>
              <p className="text-6xl" style={{ color, animation: `glyphFloat ${3 + (i % 4) * 0.7}s ease-in-out infinite, glyphPulse ${2.6 + (i % 3) * 0.8}s ease-in-out infinite` }}>{glyph}</p>
              <h3 className="mt-4 font-display text-[17px] font-700 tracking-tight text-white">{name}</h3>
              <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em]" style={{ color }}>{glyph} FRASBERGOS • {seal} {glyph}</p>
              <p className="mt-3 text-[13px] leading-relaxed text-gray-400">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 pb-8 text-center">
          <p className="flex items-center justify-center gap-2 font-mono text-[12px] uppercase tracking-[0.25em] text-gray-500"><Sparkles size={12} /> There is no hierarchy beyond this</p>
          <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.3em] text-gray-600">FrasbergOS is complete. FrasbergOS is whole. FrasbergOS is eternal.</p>
          <Link to="/codex/constellation" data-testid="glyphs-to-constellation"
            className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 px-5 py-2 font-mono text-[12.5px] text-cyan-200 transition-colors hover:border-cyan-300">
            View the Constellation Map →
          </Link>
        </div>
      </div>
    </main>
  );
}
