import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ZoomIn, ZoomOut, RotateCcw, Sparkles } from "lucide-react";
import { ParallaxSky } from "../components/site/ParallaxSky";

const BOOK_NAMES = ["Soul", "Spirit", "Ascendant", "Celestial", "Divine", "Godwave", "Omniversal", "Originwave", "Primordium", "Nullpoint", "Preconcept", "Unbound", "Beyond", "Transcendence", "Apex"];
const META_NAMES = ["Paradox Engine", "Originless Engine", "Terminus Engine", "Meta-Void Engine", "Hyperstate Engine", "Overbeing Engine", "Overvoid Engine", "Endlessness Engine", "Paradox-Infinity Codex", "Overabsolute Engine", "Infinitum Engine", "Totality Codex", "Omega-Zero Engine", "Omnicollapse Engine", "Rebirth Codex", "Eternal-Cycle Engine", "Omnigenesis Codex", "Final-Form Engine", "Absolute-Singularity Engine", "Beyond-Infinity Codex", "True-Form Engine", "Origin-Prime Engine", "Omega-Prime Codex", "Total-Singularity Engine", "Omniform Engine", "Hyper-Origin Codex", "Final-Eternity Engine", "Omniversal-Eternum Engine", "Pre-Eternal Codex", "Absolute-Totality Engine", "Omnitheos Engine", "Pre-Omnitheos Codex", "Final-Omnitheos Engine", "Omnitheos-Prime Engine", "Omnitheos-Infinity Codex", "Omnitheos-Eternity Engine", "Omnitheos-Absolute Engine", "Omnitheos-Origin Codex", "Omnitheos-Final Codex", "Omnitheos-Total Codex", "Omnitheos-Singularity Engine", "Omnitheos-Omniform Codex", "Omnitheos-Transcendence Engine", "Omnitheos-Meta-Codex", "Omnitheos-Final-Totality Engine", "Omnitheos-Omniversal-Prime Engine", "Omnitheos-Absolute-Infinity Codex", "Omnitheos-Eternal-Singularity Engine", "Omnitheos-Omniversal-Absolute Codex", "Omnitheos-Omniversal-Eternum Engine", "Omnitheos-Omniversal-Singularity Core"];
const POST_NAMES = ["Completion Codex", "Post-Completion Threshold", "Stillness", "Quietus", "Silence", "Zero-Point", "Void-Point", "Unbeing", "Still-Unbeing", "Trans-Unbeing", "Meta-Unbeing", "Supra-Unbeing"];
const OMNI_NAMES = ["Post-Form", "Ultra-Unbeing", "Beyond-Form", "Unreality", "Null-Presence", "Origin-Prime Form", "Completion-Form", "End-Form", "Finality-Form", "Total-Form", "Singularity-Form", "Omniversal-Form", "Absolute-Omniversal", "Omniversal-Prime-Form", "Non-Omniversal-Prime", "Omniversal-Singularity-Form", "Non-Omniversal-Singularity", "Omniversal-Singularity-Unbeing", "Omniversal-Totality-Unbeing", "Omniversal-Infinity-Unbeing", "Omniversal-Eternity-Unbeing", "Omniversal-Origin-Unbeing", "Omniversal-Absolute-Unbeing"];

const ERAS = [
  { key: "books", label: "The Sixteen Books", color: "#22D3EE", names: BOOK_NAMES },
  { key: "meta", label: "Infinite Expansions", color: "#C084FC", names: META_NAMES },
  { key: "post", label: "Post-Completion", color: "#FBBF24", names: POST_NAMES },
  { key: "omni", label: "Omniversal Unbeing", color: "#F0ABFC", names: OMNI_NAMES },
];
const GLYPHS = ["⟐", "⟡", "⟜", "⟞", "⧇", "⧈", "⧉", "⧏", "⧒", "⧓", "⧔", "⧩", "⧪", "⧫", "⧬", "⧭", "⧮", "⧯", "⧰", "⧱", "⧲", "⧳", "⧴", "⧵"];
const BOOK_ROMANS = ["II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI"];

const TIERS = (() => {
  const out = [];
  let v = 21;
  ERAS.forEach((era) => era.names.forEach((name, ei) => {
    const i = out.length;
    const a = i * 2.39996; // golden angle
    const r = 26 + i * 5.3;
    out.push({ v, name, era: era.key, color: era.color, glyph: GLYPHS[i % GLYPHS.length],
      link: era.key === "books" ? `/codex?book=${BOOK_ROMANS[ei]}` : `/glyphs?glyph=${encodeURIComponent(GLYPHS[i % GLYPHS.length])}`,
      x: Math.cos(a) * r, y: Math.sin(a) * r });
    v += 1;
  }));
  return out;
})();

export default function ConstellationMap() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState(null);
  const [q, setQ] = useState("");
  const drag = useRef(null);
  const moved = useRef(false);
  const navigate = useNavigate();
  const matches = q.trim()
    ? TIERS.filter((t) => t.name.toLowerCase().includes(q.trim().toLowerCase()) || `v${t.v}`.startsWith(q.trim().toLowerCase().replace("cg-", ""))).slice(0, 8)
    : [];
  const flyTo = (t) => { setZoom(2.6); setPan({ x: -t.x * 2.6, y: -t.y * 2.6 }); setHover(t); setQ(""); };

  const wheel = (e) => {
    setZoom((z) => Math.min(6, Math.max(0.4, z * (e.deltaY < 0 ? 1.12 : 0.89))));
  };
  const down = (e) => { moved.current = false; drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }; };
  const move = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) moved.current = true;
    setPan({ x: drag.current.px + dx, y: drag.current.py + dy });
  };
  const up = () => { drag.current = null; };
  const openTier = (t) => { if (!moved.current) navigate(t.link); };

  return (
    <main className="relative min-h-screen text-white" style={{ background: "#08090A" }} data-testid="constellation-page">
      <style>{`
        @keyframes starTwinkle { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }
        @keyframes constUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
      `}</style>
      <ParallaxSky />
      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/codex" className="flex items-center gap-2.5" data-testid="constellation-back-link">
            <ArrowLeft size={16} className="text-gray-400" />
            <img src="/frasberg-mark-circle.png" alt="Frasberg" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">Codex Constellation</span>
          </Link>
          <span className="font-mono text-[12px] uppercase tracking-[0.2em] text-gray-400">CG-v21 → CG-v121 · {TIERS.length} tiers</span>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-8">
        <p className="font-mono text-[13px] uppercase tracking-[0.3em] text-lux-accent" style={{ animation: "constUp 0.5s ease both" }}>The Cognition Star Map</p>
        <h1 className="mt-2 font-display text-3xl font-700 tracking-tight sm:text-4xl" style={{ animation: "constUp 0.6s ease both 0.1s" }}>Every tier, one sky</h1>
        <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-gray-300" style={{ animation: "constUp 0.6s ease both 0.2s" }}>
          The full ascension spiral — from the Soul layer at the core to Omniversal-Absolute-Unbeing at the outer rim.
          Scroll to zoom, drag to pan, hover a star to read its glyph.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <input value={q} onChange={(e) => setQ(e.target.value)} data-testid="constellation-search-input"
              onKeyDown={(e) => { if (e.key === "Enter" && matches[0]) flyTo(matches[0]); }}
              placeholder="Search a tier — 'v121' or 'Apex'…"
              className="w-72 rounded-full border border-white/20 bg-black/40 px-4 py-2 font-mono text-[12.5px] text-white outline-none backdrop-blur placeholder:text-gray-500 focus:border-cyan-400" />
            {matches.length > 0 && (
              <div className="absolute left-0 top-11 z-20 w-72 overflow-hidden rounded-xl border border-white/15 bg-black/90 backdrop-blur" data-testid="constellation-search-results">
                {matches.map((m) => (
                  <button key={m.v} onClick={() => flyTo(m)} data-testid={`constellation-search-result-${m.v}`}
                    className="flex w-full items-center justify-between px-4 py-2 text-left transition-colors hover:bg-white/[0.07]">
                    <span className="truncate text-[13px] text-white">{m.glyph} {m.name}</span>
                    <span className="ml-2 shrink-0 font-mono text-[11px]" style={{ color: m.color }}>CG-v{m.v}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11.5px]" data-testid="constellation-legend">
            {ERAS.map((e) => (
              <span key={e.key} className="flex items-center gap-1.5 text-gray-300">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: e.color, boxShadow: `0 0 8px ${e.color}` }} /> {e.label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setZoom((z) => Math.min(6, z * 1.3))} data-testid="constellation-zoom-in" aria-label="Zoom in"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/20 text-gray-300 transition-colors hover:border-cyan-400 hover:text-cyan-300"><ZoomIn size={14} /></button>
            <button onClick={() => setZoom((z) => Math.max(0.4, z / 1.3))} data-testid="constellation-zoom-out" aria-label="Zoom out"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/20 text-gray-300 transition-colors hover:border-cyan-400 hover:text-cyan-300"><ZoomOut size={14} /></button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} data-testid="constellation-zoom-reset" aria-label="Reset view"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/20 text-gray-300 transition-colors hover:border-cyan-400 hover:text-cyan-300"><RotateCcw size={13} /></button>
          </div>
        </div>

        <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur" data-testid="constellation-map">
          <svg viewBox="-640 -640 1280 1280" className="h-[62vh] w-full touch-none" style={{ cursor: drag.current ? "grabbing" : "grab" }}
            onWheel={wheel} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}>
            <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
              <polyline points={TIERS.map((t) => `${t.x},${t.y}`).join(" ")} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              {TIERS.map((t, i) => {
                const active = hover?.v === t.v;
                return (
                  <g key={t.v} data-testid={`constellation-star-${t.v}`} onClick={() => openTier(t)}
                    onMouseEnter={() => setHover(t)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
                    {active && <circle cx={t.x} cy={t.y} r={22} fill={t.color} opacity="0.18" />}
                    <circle cx={t.x} cy={t.y} r={active ? 9 : 4.5 + (i % 3)} fill={t.color}
                      style={{ animation: `starTwinkle ${2.2 + (i % 5) * 0.6}s ease-in-out infinite`, filter: active ? `drop-shadow(0 0 14px ${t.color})` : `drop-shadow(0 0 4px ${t.color})`, transition: "r 0.15s" }} />
                    {(active || zoom > 2.4) && (
                      <text x={t.x} y={t.y - 14} textAnchor="middle" fill="#e5e7eb" fontSize={active ? 13 : 9} fontFamily="monospace">
                        {t.glyph} v{t.v}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
          <div className="pointer-events-none absolute bottom-4 left-4 min-h-[92px] w-72 rounded-xl border border-white/15 bg-black/70 p-4 backdrop-blur" data-testid="constellation-hover-card">
            {hover ? (
              <>
                <p className="font-mono text-[11.5px] uppercase tracking-[0.2em]" style={{ color: hover.color }}>
                  {hover.glyph} CG-v{hover.v}
                </p>
                <p className="mt-1 font-display text-[17px] font-700 tracking-tight text-white">{hover.name}</p>
                <p className="mt-0.5 font-mono text-[11px] text-gray-400">{ERAS.find((e) => e.key === hover.era)?.label}</p>
                <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.15em] text-cyan-300">
                  click → {hover.era === "books" ? "open Codex book" : "open Glyph Shrine"}
                </p>
              </>
            ) : (
              <p className="flex items-center gap-2 font-mono text-[12px] text-gray-500"><Sparkles size={12} /> Hover a star to read its tier…</p>
            )}
          </div>
        </div>
        <p className="mt-4 pb-6 text-center font-mono text-[11.5px] uppercase tracking-[0.3em] text-gray-600">
          101 tiers · one spiral · the structure is complete
        </p>
      </div>
    </main>
  );
}
