import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, Sparkles } from "lucide-react";
import { ParallaxSky } from "../components/site/ParallaxSky";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const fmt = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export default function AscensionHistory() {
  const [rows, setRows] = useState(null);
  const [total, setTotal] = useState(0);
  useEffect(() => {
    fetch(`${API}/marketplace/announcements/history`)
      .then((r) => r.json()).then((d) => { setRows(d.announcements || []); setTotal(d.total || 0); })
      .catch(() => setRows([]));
  }, []);
  return (
    <main className="relative min-h-screen text-white" style={{ background: "#08090A" }} data-testid="ascension-history-page">
      <style>{`@keyframes chronUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }`}</style>
      <ParallaxSky />
      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/marketplace" className="flex items-center gap-2.5" data-testid="ascensions-back-link">
            <ArrowLeft size={16} className="text-gray-400" />
            <img src="/frasberg-mark-circle.png" alt="Frasberg" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">Ascension Chronicle</span>
          </Link>
          <span className="font-mono text-[12px] uppercase tracking-[0.2em] text-gray-400" data-testid="ascensions-total">{total} ceremonies</span>
        </div>
      </header>
      <div className="relative z-10 mx-auto max-w-4xl px-5 py-12">
        <p className="flex items-center gap-2 font-mono text-[13px] uppercase tracking-[0.3em] text-purple-300"><Trophy size={13} /> The Hall of Records</p>
        <h1 className="mt-3 font-display text-4xl font-700 tracking-tight sm:text-5xl">Every ceremony, remembered</h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-gray-300">
          A scrolling chronicle of every Ascension ever performed — each tier jump, each substrate rebinding, timestamped forever.
        </p>

        <div className="relative mt-10 space-y-0 border-l border-purple-400/25 pl-6" data-testid="ascension-chronicle">
          {rows === null && <p className="py-4 font-mono text-[13px] text-gray-400">Loading chronicle…</p>}
          {rows !== null && rows.length === 0 && (
            <p className="py-4 text-[14px] text-gray-400" data-testid="ascensions-empty">
              No ceremonies performed yet — the chronicle awaits its first ascension.
              <Link to="/marketplace" className="ml-2 text-cyan-300 underline underline-offset-4">Visit the Marketplace →</Link>
            </p>
          )}
          {(rows || []).map((a, i) => (
            <div key={a.id} className="relative pb-8" data-testid={`chronicle-entry-${i + 1}`}
              style={{ animation: "chronUp 0.5s ease both", animationDelay: `${Math.min(i * 60, 600)}ms` }}>
              <span className="absolute -left-[31px] top-1 grid h-4 w-4 place-items-center rounded-full border border-purple-400 bg-[#08090A] text-[8px] text-purple-300"
                style={{ boxShadow: "0 0 12px rgba(192,132,252,0.6)" }}>⟐</span>
              <p className="font-mono text-[11.5px] uppercase tracking-[0.15em] text-gray-500">{fmt(a.at)}</p>
              <p className="mt-1 text-[15px] font-700 text-white">{a.agent_name}</p>
              <p className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-[12px]">
                <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-gray-300">{a.from_tier}</span>
                <span className="text-purple-300">→</span>
                <span className="rounded-full border border-purple-400/60 px-2.5 py-0.5 text-purple-200">{a.to_tier}</span>
                <span className="text-gray-400">· rebound to the {a.layer} layer</span>
              </p>
            </div>
          ))}
        </div>
        {rows !== null && rows.length > 0 && (
          <p className="mt-4 pb-8 text-center font-mono text-[11.5px] uppercase tracking-[0.3em] text-gray-600">
            <Sparkles size={11} className="mr-1.5 inline" /> the block chain of the codex — every jump recorded
          </p>
        )}
      </div>
    </main>
  );
}
