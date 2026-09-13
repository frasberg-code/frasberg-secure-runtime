import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, Loader2, Gauge, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { ParallaxSky } from "../components/site/ParallaxSky";
import Seo from "../components/site/Seo";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TIER_ORDER = ["1B", "7B", "70B", "X"];
const TIER_COLORS = { "1B": "#94A3B8", "7B": "#22D3EE", "70B": "#A78BFA", X: "#FBBF24" };
const AXES = ["depth", "precision", "abstraction", "multi_agent", "temporal", "creativity"];
const STARFIELD_LAYERS = ["surface", "structured", "deep", "frontier", "cosmogenic"];

function Radar({ scores, color }) {
  const cx = 70, cy = 70, r = 52;
  const pt = (i, v) => {
    const ang = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
    return `${cx + Math.cos(ang) * r * (v / 10)},${cy + Math.sin(ang) * r * (v / 10)}`;
  };
  const poly = AXES.map((a, i) => pt(i, scores[a] || 0)).join(" ");
  const grid = AXES.map((a, i) => pt(i, 10)).join(" ");
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <polygon points={grid} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <polygon points={AXES.map((a, i) => pt(i, 5)).join(" ")} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      <polygon points={poly} fill={`${color}33`} stroke={color} strokeWidth="1.5" />
      {AXES.map((a, i) => {
        const [x, y] = pt(i, 12.4).split(",");
        return <text key={a} x={x} y={y} textAnchor="middle" fontSize="6.5" fill="rgba(255,255,255,0.45)" fontFamily="monospace">{a.slice(0, 5)}</text>;
      })}
    </svg>
  );
}

export default function TierBenchmark() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [board, setBoard] = useState([]);

  const loadBoard = () =>
    fetch(`${API}/benchmark/leaderboard`).then((r) => (r.ok ? r.json() : [])).then((d) => Array.isArray(d) && setBoard(d)).catch(() => {});
  useEffect(() => { loadBoard(); }, []);

  const run = async () => {
    if (!user) { toast.error("Sign in to run the benchmark"); return; }
    if (prompt.trim().length < 5) { toast.error("Enter a prompt first"); return; }
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/benchmark/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Benchmark failed");
      setResult(data);
      loadBoard();
      toast.success(data.cost_tokens ? `Benchmark complete — ${data.cost_tokens} tokens spent` : "Benchmark complete");
    } catch (e) {
      toast.error(e.message);
    } finally { setRunning(false); }
  };

  return (
    <main className="relative z-10 min-h-screen bg-[#05070C] text-white" data-testid="benchmark-page">
      <Seo title="Luchii Tier Benchmark Arena — Frasberg" description="Run one prompt across Luchii 1B, 7B, 70B and X and compare reasoning depth." />
      <ParallaxSky />
      <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" data-testid="benchmark-back-link">
            <ArrowLeft size={15} className="text-gray-400" />
            <img src="/frasberg-mark-circle.png" alt="Frasberg" className="h-7 w-7 rounded-full" />
            <span className="font-display text-[15px] font-700 tracking-tight">Frasberg</span>
          </Link>
          <span className="font-mono text-[14px] uppercase tracking-[0.25em] text-amber-300">4 tokens / run</span>
        </div>
      </header>

      <div className="relative mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="flex items-center gap-2 font-mono text-[14px] uppercase tracking-[0.3em] text-cyan-300">
          <Gauge size={14} /> Luchii Tier Stress-Test Suite
        </div>
        <h1 className="mt-3 font-display text-4xl font-700 tracking-tighter sm:text-5xl">Tier Benchmark Arena</h1>
        <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-gray-400">
          One prompt, four tiers. Watch cognition scale from 1B surface reasoning to the cosmogenic Starfield tier —
          scored on the Frasberg Reasoning Ladder across six axes.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !running && run()}
            placeholder='Try: "Explain why the sky is blue" or "Design a 12-agent climate system"'
            data-testid="benchmark-prompt-input"
            className="flex-1 rounded-full border border-white/15 bg-white/[0.03] px-6 py-3.5 text-[14px] outline-none focus:border-cyan-400/60" />
          <button onClick={run} disabled={running} data-testid="benchmark-run-btn"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-8 py-3.5 font-mono text-[15px] font-600 text-[#05070C] transition-opacity hover:opacity-85 disabled:opacity-50">
            {running ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            {running ? "Running 4 tiers…" : "Run Benchmark"}
          </button>
        </div>
        {!user && <p className="mt-3 font-mono text-[14px] text-amber-300/80" data-testid="benchmark-signin-hint">Sign in to run — each run costs 4 Frasberg tokens (100 free daily).</p>}

        {running && (
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4" data-testid="benchmark-loading">
            {TIER_ORDER.map((t) => (
              <div key={t} className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
            ))}
          </div>
        )}

        {result && (
          <>
            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" data-testid="benchmark-results">
              {TIER_ORDER.map((t) => {
                const tier = result.tiers[t];
                if (!tier) return null;
                const color = TIER_COLORS[t];
                return (
                  <div key={t} className="flex flex-col rounded-2xl border p-5" style={{ borderColor: `${color}44`, background: "rgba(255,255,255,0.02)" }} data-testid={`benchmark-tier-${t}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-display text-[16px] font-700 tracking-tight" style={{ color }}>{tier.name}</p>
                        <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-gray-500">{tier.label} tier</p>
                      </div>
                      <span className="rounded-full border px-2.5 py-1 font-mono text-[14px] font-600" style={{ borderColor: `${color}66`, color }} data-testid={`benchmark-total-${t}`}>
                        {tier.weighted_total.toFixed(1)}
                      </span>
                    </div>
                    <div className="mx-auto mt-2"><Radar scores={tier.scores} color={color} /></div>
                    <div className="mt-1 max-h-52 overflow-y-auto rounded-xl border border-white/[0.07] bg-black/30 p-3 text-[14px] leading-relaxed text-gray-300 whitespace-pre-wrap" data-testid={`benchmark-output-${t}`}>
                      {tier.output}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6" data-testid="benchmark-starfield-viz">
              <p className="font-mono text-[14px] uppercase tracking-[0.3em] text-gray-400">Starfield depth visualization</p>
              <div className="mt-4 space-y-2">
                {STARFIELD_LAYERS.map((layer, li) => (
                  <div key={layer} className="flex items-center gap-3">
                    <span className="w-24 font-mono text-[13.5px] uppercase tracking-[0.15em] text-gray-500">{layer}</span>
                    <div className="flex flex-1 gap-2">
                      {TIER_ORDER.map((t) => {
                        const depth = result.tiers[t]?.scores?.depth || 0;
                        const lit = depth >= (li + 1) * 2;
                        const color = TIER_COLORS[t];
                        return (
                          <div key={t} className="h-3 flex-1 rounded-full transition-all duration-700"
                            style={{ background: lit ? color : "rgba(255,255,255,0.06)", boxShadow: lit ? `0 0 10px ${color}88` : "none" }} />
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-3 pt-1">
                  <span className="w-24" />
                  <div className="flex flex-1 gap-2">
                    {TIER_ORDER.map((t) => (
                      <span key={t} className="flex-1 text-center font-mono text-[13.5px]" style={{ color: TIER_COLORS[t] }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        <div className="mt-14 rounded-2xl border border-amber-400/20 bg-amber-400/[0.02] p-6" data-testid="benchmark-leaderboard">
          <div className="flex items-center gap-2 font-mono text-[14px] uppercase tracking-[0.3em] text-amber-300">
            <Trophy size={13} /> Benchmark leaderboard — top runs
          </div>
          {board.length === 0 ? (
            <p className="mt-4 text-[15px] text-gray-500" data-testid="benchmark-leaderboard-empty">No runs yet — be the first on the wall.</p>
          ) : (
            <div className="mt-4 space-y-1.5">
              {board.map((r, i) => (
                <div key={r.id || i} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.07] bg-black/25 px-4 py-2.5" data-testid={`benchmark-board-row-${i}`}>
                  <span className={`w-7 font-mono text-[15px] font-700 ${i === 0 ? "text-amber-300" : i < 3 ? "text-gray-200" : "text-gray-500"}`}>#{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] text-gray-200">“{r.prompt}”</p>
                    <p className="font-mono text-[13px] uppercase tracking-[0.15em] text-gray-600">{r.user_name} · {(r.ts || "").slice(0, 10)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {TIER_ORDER.map((t) => (
                      <span key={t} className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[13px]" style={{ color: TIER_COLORS[t] }}>
                        {t} {(r.totals?.[t] ?? 0).toFixed(1)}
                      </span>
                    ))}
                    <span className="ml-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 font-mono text-[14px] font-600 text-amber-300">
                      ★ {(r.best ?? 0).toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
