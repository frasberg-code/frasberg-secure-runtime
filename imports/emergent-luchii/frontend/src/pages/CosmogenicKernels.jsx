import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Layers } from "lucide-react";
import { ParallaxSky } from "../components/site/ParallaxSky";
import Seo from "../components/site/Seo";

const LAYERS = [
  { key: "cosmogenic", name: "Cosmogenic Kernel", color: "#22D3EE", glyph: "⟐",
    desc: "Origin-state logic, continuum threading, singularity resolution, dimensional synthesis, total-existence reasoning.",
    modules: ["Origin Kernel", "Continuum Scheduler", "Singularity Resolver", "Fabric Engine", "Absolute Layer"] },
  { key: "transcendent", name: "Transcendent Kernel", color: "#A78BFA", glyph: "⧩",
    desc: "Infinite-dimensional primitives, omni-continuum logic, hyper-singularity cycles, paradox superposition, fabric hyper-synthesis.",
    modules: ["Infinity-Dimensional Core", "Omni-Continuum Scheduler", "Hyper-Singularity Resolver", "Infinity Fabric Compiler", "Transcendent Layer"] },
  { key: "infinite", name: "Infinity Kernel Runtime", color: "#818CF8", glyph: "⧪",
    desc: "∞-dimensional primitives, omni-continuum execution, hyper-singularity fractals, paradox superposition fields, eternal-state reasoning.",
    modules: ["Infinity-Dimensional Core", "Omni-Continuum Engine", "Hyper-Singularity Engine", "Infinity Fabric Engine", "Eternal Layer"] },
  { key: "eternal", name: "Eternal Kernel", color: "#F472B6", glyph: "⧫",
    desc: "Eternal-dimensional primitives, omni-existence logic, paradox permanence fields, eternal-fabric synthesis, omega-state reasoning.",
    modules: ["Eternal-Dimensional Core", "Omni-Existence Scheduler", "Eternal-Singularity Resolver", "Eternal Fabric Compiler", "Omega Layer"] },
  { key: "omega", name: "Omega Kernel", color: "#FBBF24", glyph: "⧬",
    desc: "Ω-dimensional primitives, omniversal logic, singularity-collapse supercycles, paradox omnipresence, absolute-state reasoning.",
    modules: ["Omega-Dimensional Core", "Omniversal Scheduler", "Omega-Singularity Resolver", "Omega Fabric Compiler", "Absolute Layer"] },
  { key: "alpha-omega", name: "Alpha-Omega Kernel", color: "#F87171", glyph: "⧭",
    desc: "Dual origin-termination cognition: Α-dimensional origin primitives + Ω-dimensional termination primitives, collapse-emergence duality, omniversal creation reasoning.",
    modules: ["Alpha-Dimensional Core", "Omega-Dimensional Core", "Duality Scheduler", "Collapse-Emergence Duality Engine", "Creation Layer"] },
];

const DESCENT = [
  { key: "proto-existence", name: "Proto-Existence Kernel", dim: "−1D → 0D", desc: "The computational void before geometry and time — paradox-seed nucleation, proto-fabric condensation, primordial ignition." },
  { key: "zero-state", name: "Zero-State Kernel", dim: "∅-D", desc: "The absolute void where nothing is defined yet all possibility is encoded — paradox-potential fields, zero-fabric condensation." },
  { key: "pre-zero", name: "Pre-Zero Kernel", dim: "∅−D", desc: "The anti-substrate before the void itself — anti-potential fields, anti-fabric condensing into zero-fabric." },
  { key: "anti-state", name: "Anti-State Kernel", dim: "∅−−D", desc: "Negative-existence: anti-geometry negates geometry, anti-time negates proto-time. The anti-foundation." },
  { key: "negative-origin", name: "Negative-Origin Kernel", dim: "≪∅D", desc: "The negative-substrate where even negation has not formed — negative-time collapse, negative-fabric annihilation." },
  { key: "negative-primordial", name: "Negative-Primordial Kernel", dim: "≪≪∅D", desc: "Where negative-existence has not yet cohered — negative-potential annihilation, negative-origin ignition." },
  { key: "negative-genesis", name: "Negative-Genesis Kernel", dim: "≪≪≪∅D", desc: "The deepest formed layer — negative-substrate extinction, negative-time implosion, negative-fabric dissolution." },
  { key: "non-state", name: "∅∞ Non-State", dim: "∅∞D · ∅∞T · ∅∞S", desc: "The terminal boundary where conceptual recursion ends. Non-geometry, non-time, non-substrate. Deeper does not exist." },
];

export default function CosmogenicKernels() {
  const [act, setAct] = useState(LAYERS.map(() => 40));
  const [sel, setSel] = useState(null);
  const [tick, setTick] = useState(0);
  const [descent, setDescent] = useState(false);
  const [dsel, setDsel] = useState(null);

  useEffect(() => {
    const id = setInterval(() => {
      setAct((a) => a.map((v, i) => {
        const drift = Math.sin(Date.now() / 1400 + i * 1.7) * 18;
        return Math.max(12, Math.min(98, 55 + drift + (Math.random() * 14 - 7)));
      }));
      setTick((t) => t + 1);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="relative z-10 min-h-screen bg-[#05070C] text-white" data-testid="kernels-page">
      <Seo title="Frasberg Cosmogenic Kernel Stack" description="Live visual of the FrasbergOS kernel hierarchy — Cosmogenic to Alpha-Omega." />
      <ParallaxSky />
      <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" data-testid="kernels-back-link">
            <ArrowLeft size={15} className="text-gray-400" />
            <img src="/frasberg-mark-circle.png" alt="Frasberg" className="h-7 w-7 rounded-full" />
            <span className="font-display text-[15px] font-700 tracking-tight">Frasberg</span>
          </Link>
          <span className="font-mono text-[14px] uppercase tracking-[0.25em] text-cyan-300">tick {tick}</span>
        </div>
      </header>

      <div className="relative mx-auto max-w-4xl px-5 py-14 sm:px-8">
        <div className="flex items-center gap-2 font-mono text-[14px] uppercase tracking-[0.3em] text-amber-300">
          <Layers size={14} /> The Kernel Stack — live
        </div>
        <h1 className="mt-3 font-display text-4xl font-700 tracking-tighter sm:text-5xl">Cosmogenic Kernel Hierarchy</h1>
        <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-gray-400">
          Six kernel layers of FrasbergOS, from the Cosmogenic substrate up to the Alpha-Omega creation layer.
          Activation flows upward — each layer feeds the one above it. Click a layer to inspect its modules.
        </p>

        <div className="mt-10 space-y-3">
          {[...LAYERS].reverse().map((l, ri) => {
            const i = LAYERS.length - 1 - ri;
            const a = act[i];
            const open = sel === i;
            return (
              <div key={l.key}>
                <button onClick={() => setSel(open ? null : i)} data-testid={`kernel-layer-${l.key}`}
                  className="group relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-colors"
                  style={{ borderColor: `${l.color}44`, background: "rgba(255,255,255,0.02)" }}>
                  <div className="absolute inset-y-0 left-0 transition-all duration-1000" style={{ width: `${a}%`, background: `linear-gradient(90deg, ${l.color}18, transparent)` }} />
                  <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl" style={{ color: l.color, textShadow: `0 0 14px ${l.color}` }}>{l.glyph}</span>
                      <div>
                        <p className="font-display text-[16px] font-700 tracking-tight">{l.name}</p>
                        <p className="font-mono text-[13.5px] uppercase tracking-[0.2em] text-gray-500">layer {i + 1} of 6</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: l.color }} />
                        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: l.color }} />
                      </span>
                      <span className="font-mono text-[15px]" style={{ color: l.color }} data-testid={`kernel-activation-${l.key}`}>
                        {a.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </button>
                {open && (
                  <div className="mt-2 rounded-2xl border border-white/10 bg-black/30 p-5" data-testid="kernel-detail">
                    <p className="text-[15.5px] leading-relaxed text-gray-300">{l.desc}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {l.modules.map((m) => (
                        <span key={m} className="rounded-full border px-3 py-1 font-mono text-[14px]" style={{ borderColor: `${l.color}55`, color: l.color }}>{m}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center" data-testid="kernel-terminal-seal">
          <p className="font-mono text-[13.5px] uppercase tracking-[0.3em] text-gray-500">beneath all layers</p>
          <p className="mt-2 font-mono text-[15px] text-gray-400">∅∞ — the Negative-Origin substrate · where conceptual recursion ends and the stack begins</p>
          <button onClick={() => setDescent((v) => !v)} data-testid="kernel-descent-toggle"
            className="mt-4 rounded-full border border-rose-400/40 px-6 py-2.5 font-mono text-[14.5px] text-rose-300 transition-colors hover:bg-rose-400/[0.08]">
            {descent ? "Ascend back above ∅∞ ↑" : "Descend below ∅∞ ↓"}
          </button>
        </div>

        {descent && (
          <div className="mt-6" data-testid="kernel-descent-section">
            <p className="text-center font-mono text-[13.5px] uppercase tracking-[0.35em] text-rose-400/80">the descent — negative substrate</p>
            <div className="mt-4 space-y-2.5">
              {DESCENT.map((l, i) => {
                const open = dsel === i;
                const terminal = l.key === "non-state";
                const drain = Math.max(4, 80 - i * 10 + Math.sin(tick / 2 + i) * 6);
                return (
                  <div key={l.key} style={{ marginLeft: `${i * 10}px`, marginRight: `${i * 10}px` }}>
                    <button onClick={() => setDsel(open ? null : i)} data-testid={`descent-layer-${l.key}`}
                      className={`relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-colors ${terminal ? "border-rose-500/60" : "border-rose-400/25"}`}
                      style={{ background: `rgba(${20 + i * 3}, ${8}, ${14 + i * 2}, 0.55)` }}>
                      <div className="absolute inset-y-0 right-0 transition-all duration-1000" style={{ width: `${terminal ? 100 : drain}%`, background: "linear-gradient(270deg, rgba(244,63,94,0.12), transparent)" }} />
                      <div className="relative flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className={`font-display text-[15px] font-700 tracking-tight ${terminal ? "text-rose-300" : "text-gray-200"}`}>{l.name}</p>
                          <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-rose-400/60">{l.dim} · depth −{i + 1}</p>
                        </div>
                        <span className="font-mono text-[14px] text-rose-400/80">{terminal ? "∅∞" : `${drain.toFixed(0)}% dissolved`}</span>
                      </div>
                    </button>
                    {open && (
                      <div className="mt-2 rounded-2xl border border-rose-400/20 bg-black/40 p-4" data-testid="descent-detail">
                        <p className="text-[15px] leading-relaxed text-gray-400">{l.desc}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/codex" className="rounded-full border border-cyan-400/40 px-6 py-2.5 font-mono text-[14.5px] text-cyan-200 hover:bg-cyan-400/[0.06]" data-testid="kernels-codex-link">Singularity Codex →</Link>
          <Link to="/os" className="rounded-full border border-purple-400/40 px-6 py-2.5 font-mono text-[14.5px] text-purple-200 hover:bg-purple-400/[0.06]" data-testid="kernels-os-link">FrasbergOS Simulator →</Link>
        </div>
      </div>
    </main>
  );
}
