import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft, Moon, Sun, Sparkles, Globe, Play, Trash2, GitMerge, ArrowRightLeft,
  Landmark, Cpu, ShieldCheck, Zap, X,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useTheme } from "../context/ThemeContext";
import Starfield from "../components/site/Starfield";
import Footer from "../components/site/Footer";
import Seo from "../components/site/Seo";

const API = `${process.env.REACT_APP_BACKEND_URL}/api/cloud`;

const PHASE_COLOR = {
  genesis: "#4ade80", growth: "#22d3ee", stability: "#7c6cf0",
  decay: "#f0c040", collapse: "#ff5555", rebirth: "#f472b6",
};

function KernelBar({ kernel }) {
  if (!kernel) return null;
  const items = [
    ["Universes", kernel.universes], ["Agents", kernel.agents], ["Ascended", kernel.ascendedAgents],
    ["Population", kernel.totalPopulation?.toLocaleString()], ["Avg entropy", kernel.avgEntropy],
    ["Avg stability", kernel.avgStability], ["Collapses recovered", kernel.collapsesRecovered],
    ["Paradoxes resolved", kernel.paradoxesResolved], ["Singularities", kernel.singularities],
  ];
  return (
    <div className="rounded-2xl border border-lux-border bg-lux-surface p-5" data-testid="kernel-status-bar">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-lux-accent">
          <Cpu size={14} /> Omni-Intelligence Core · {kernel.omniIntelligence}
        </span>
        <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wide ${kernel.posture === "strict" ? "border-red-500/60 text-red-400" : "border-emerald-400/50 text-emerald-400"}`} data-testid="kernel-posture">
          <ShieldCheck size={12} /> posture: {kernel.posture}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
        {items.map(([l, v]) => (
          <div key={l}>
            <p className="font-mono text-[9px] uppercase tracking-wide text-lux-text2">{l}</p>
            <p className="font-display text-lg font-600 text-lux-text">{v ?? 0}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GenesisForm({ onCreated }) {
  const [name, setName] = useState("");
  const [physics, setPhysics] = useState("standard");
  const [terrain, setTerrain] = useState("mixed");
  const [climate, setClimate] = useState("temperate");
  const [agents, setAgents] = useState(20);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      const r = await fetch(`${API}/universes`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || null, physicsModel: physics, terrainType: terrain, climateProfile: climate, agentCount: Number(agents) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Genesis failed");
      toast.success(`Universe ${d.name} born`);
      setName("");
      onCreated();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const sel = "rounded-full border border-lux-border bg-lux-surface px-4 py-2 font-mono text-xs outline-none focus:border-lux-accent";
  return (
    <div className="rounded-2xl border border-lux-border bg-lux-surface p-5" data-testid="genesis-form">
      <h2 className="flex items-center gap-2 font-display text-xl font-600"><Sparkles size={17} className="text-lux-accent" /> Universe Genesis Engine</h2>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Universe name (optional)"
          data-testid="genesis-name-input" className={`${sel} w-52`} />
        <select value={physics} onChange={(e) => setPhysics(e.target.value)} data-testid="genesis-physics-select" className={sel}>
          <option value="standard">Standard physics</option>
          <option value="exotic">Exotic physics</option>
          <option value="quantum">Quantum physics</option>
          <option value="chaotic">Chaotic physics</option>
        </select>
        <select value={terrain} onChange={(e) => setTerrain(e.target.value)} data-testid="genesis-terrain-select" className={sel}>
          <option value="flat">Flat</option><option value="mountain">Mountain</option>
          <option value="ocean">Ocean</option><option value="mixed">Mixed</option>
        </select>
        <select value={climate} onChange={(e) => setClimate(e.target.value)} data-testid="genesis-climate-select" className={sel}>
          <option value="temperate">Temperate</option><option value="arid">Arid</option>
          <option value="frozen">Frozen</option><option value="tropical">Tropical</option>
        </select>
        <label className="flex items-center gap-2 font-mono text-xs text-lux-text2">
          Agents <input type="range" min="4" max="60" value={agents} onChange={(e) => setAgents(e.target.value)} data-testid="genesis-agents-slider" /> {agents}
        </label>
        <button onClick={create} disabled={busy} data-testid="genesis-create-btn"
          className="rounded-full bg-lux-accent px-6 py-2.5 text-sm font-600 text-lux-bg transition-transform hover:-translate-y-0.5 disabled:opacity-50">
          {busy ? "Creating…" : "Create Universe"}
        </button>
      </div>
    </div>
  );
}

function UniverseDetail({ uid, onClose, refresh }) {
  const [d, setD] = useState(null);
  const load = useCallback(() => {
    fetch(`${API}/universes/${uid}`).then((r) => (r.ok ? r.json() : null)).then(setD).catch(() => {});
  }, [uid]);
  useEffect(() => { load(); }, [load]);
  if (!d) return null;
  const s = d.summary;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose} data-testid="universe-detail-modal">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-lux-border bg-lux-bg p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl font-700">{s.name}</h2>
            <p className="mt-1 font-mono text-[11px] text-lux-text2">
              tick {s.tick} · <span style={{ color: PHASE_COLOR[s.phase] }}>{s.phase.toUpperCase()}</span> · {s.physicsModel} physics ·
              {" "}{s.dimensions} dimensions · {s.fractalLayers} fractal layers · entropy {s.entropy} · stability {s.stability}
            </p>
          </div>
          <button onClick={onClose} data-testid="detail-close-btn" className="grid h-9 w-9 place-items-center rounded-full border border-lux-border text-lux-text2 hover:border-lux-accent"><X size={16} /></button>
        </div>
        {(d.flags.evolutionFrozen || d.flags.auditMode) && (
          <p className="mt-3 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-2 font-mono text-[11px] text-red-400" data-testid="detail-safety-flags">
            KERNEL SAFETY: {d.flags.evolutionFrozen && "evolution frozen "} {d.flags.auditMode && "· audit mode"}
          </p>
        )}
        <div className="mt-5" style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={d.metrics} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(140,140,170,0.12)" />
              <XAxis dataKey="t" tick={{ fontSize: 9 }} stroke="#8a86a3" />
              <YAxis tick={{ fontSize: 9 }} stroke="#8a86a3" width={34} domain={[0, 1]} />
              <Tooltip contentStyle={{ background: "#111018", border: "1px solid #2a2740", borderRadius: 10, fontSize: 11 }} />
              <Line type="monotone" dataKey="entropy" stroke="#f0c040" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="stability" stroke="#22d3ee" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="instability" stroke="#ff5555" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-lux-text2">Top agents — reputation · soul · ascension</p>
            <div className="mt-2 space-y-1.5" data-testid="detail-agents-list">
              {d.agents.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-lux-border px-3 py-2 text-xs">
                  <span className="text-lux-text">{a.name} <span className="text-lux-text2">· {a.role} · {a.behavior}</span></span>
                  <span className="font-mono text-[10px] text-lux-text2">
                    rep {a.reputation} · {a.soul.alignment} · T{a.ascension.tier} {a.ascension.form}{a.reincarnations > 0 ? ` · ↻${a.reincarnations}` : ""}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-lux-text2">Civilizations</p>
            <div className="mt-2 space-y-1.5" data-testid="detail-civs-list">
              {d.civilizations.map((c) => (
                <div key={c.id} className="rounded-xl border border-lux-border px-3 py-2 text-xs">
                  <span className="text-lux-text">{c.name}</span>
                  {c.era && <span className="ml-2 rounded-full border border-lux-gold/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-lux-gold">{c.era}</span>}
                  <span className="ml-2 font-mono text-[10px] text-lux-text2">
                    {c.governance} · tech {c.technologyLevel} · pop {c.population.toLocaleString()}{c.warsWon > 0 ? ` · ⚔ ${c.warsWon} wars won` : ""}
                  </span>
                  {c.rituals?.length > 0 && <p className="mt-0.5 font-mono text-[9px] text-lux-text2">rituals: {c.rituals.join(", ")}</p>}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-lux-text2">Mythology</p>
            <div className="mt-2 space-y-1.5" data-testid="detail-myths-list">
              {d.myths.length === 0 && <p className="text-xs text-lux-text2">No myths yet — run more ticks</p>}
              {d.myths.map((m) => (
                <div key={m.id} className="rounded-xl border border-lux-border px-3 py-2 text-xs">
                  <span className="text-lux-gold">{m.title}</span>
                  <p className="mt-0.5 text-[11px] text-lux-text2">"{m.moral}"</p>
                </div>
              ))}
            </div>
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-lux-text2">Event stream</p>
            <div className="mt-2 max-h-56 space-y-1.5 overflow-y-auto" data-testid="detail-events-list">
              {d.events.map((e) => (
                <p key={e.id} className="text-[11px] text-lux-text2"><span className="text-lux-accent">[{e.kind}]</span> {e.text}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FrasbergCloud() {
  const { theme, toggle } = useTheme();
  const [kernel, setKernel] = useState(null);
  const [universes, setUniverses] = useState([]);
  const [detail, setDetail] = useState(null);
  const [merge, setMerge] = useState([]);
  const [congress, setCongress] = useState(null);
  const [resTitle, setResTitle] = useState("");
  const [autoRun, setAutoRun] = useState(false);

  const refresh = useCallback(() => {
    fetch(`${API}/kernel`).then((r) => r.json()).then(setKernel).catch(() => {});
    fetch(`${API}/universes`).then((r) => r.json()).then((d) => setUniverses(d.universes || [])).catch(() => {});
    fetch(`${API}/congress`).then((r) => r.json()).then(setCongress).catch(() => {});
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const tick = async (id, steps, quiet = false) => {
    const r = await fetch(`${API}/universes/${id}/tick`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ steps }),
    });
    const d = await r.json();
    if (r.ok) {
      const events = d.events || [];
      const important = ["singularity", "collapse", "war", "era", "ascension", "exchange"];
      (quiet ? events.filter((e) => important.includes(e.kind)) : events.slice(-3))
        .slice(-3).forEach((e) => toast(e.text, { description: e.kind }));
      refresh();
    }
  };

  // Auto-Run Mode — the multiverse evolves live while you watch
  useEffect(() => {
    if (!autoRun) return;
    const id = setInterval(() => {
      universes.forEach((u) => tick(u.id, 1, true));
    }, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, universes.map((u) => u.id).join(",")]);

  const del = async (id) => {
    await fetch(`${API}/universes/${id}`, { method: "DELETE" });
    toast.success("Universe dissolved");
    refresh();
  };

  const toggleMerge = (id) => {
    setMerge((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id].slice(-2)));
  };

  const synthesize = async () => {
    if (merge.length !== 2) { toast.error("Select exactly 2 universes to fuse"); return; }
    const r = await fetch(`${API}/synthesize`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ a: merge[0], b: merge[1] }),
    });
    const d = await r.json();
    if (r.ok) { toast.success(`Omni-Synthesis complete — ${d.name}`); setMerge([]); refresh(); }
    else toast.error(d.detail || "Synthesis failed");
  };

  const migrate = async () => {
    if (merge.length !== 2) { toast.error("Select 2 universes (source first, then target)"); return; }
    const r = await fetch(`${API}/migrate`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: merge[0], target: merge[1], count: 5 }),
    });
    const d = await r.json();
    if (r.ok) { toast.success(`${d.migrated} agents migrated ${d.from} → ${d.to}`); setMerge([]); refresh(); }
    else toast.error(d.detail || "Migration failed");
  };

  const tradeKnowledge = async () => {
    if (merge.length !== 2) { toast.error("Select 2 universes (source first, then target)"); return; }
    const r = await fetch(`${API}/trade`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: merge[0], target: merge[1], commodity: "knowledge", amount: 500 }),
    });
    const d = await r.json();
    if (r.ok) { toast.success(`Trade complete — ${d.delivered} knowledge delivered`); setMerge([]); refresh(); }
    else toast.error(d.detail || "Trade failed");
  };

  const exchange = async () => {
    if (merge.length !== 2) { toast.error("Select 2 universes for a cultural exchange"); return; }
    const r = await fetch(`${API}/exchange`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ a: merge[0], b: merge[1] }),
    });
    const d = await r.json();
    if (r.ok) { toast.success(`Cultural exchange — ${d.civilizations.join(" ↔ ")} shared "${d.ritual}" (impact ${d.impactScore})`); setMerge([]); refresh(); }
    else toast.error(d.detail || "Exchange failed");
  };

  const propose = async () => {
    if (!resTitle.trim()) return;
    await fetch(`${API}/congress/resolutions`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: resTitle }),
    });
    setResTitle("");
    toast.success("Resolution proposed to the Congress");
    refresh();
  };

  const vote = async (rid) => {
    const r = await fetch(`${API}/congress/resolutions/${rid}/vote`, { method: "POST" });
    const d = await r.json();
    if (r.ok) { toast(d.passed ? "Resolution PASSED" : "Resolution FAILED", { description: `${d.votes} member universes voted` }); refresh(); }
  };

  return (
    <main className="relative z-10 min-h-screen bg-lux-bg text-lux-text" data-testid="frasberg-cloud-page">
      <Seo title="Frasberg Cloud — Multiverse Simulation Console" description="Create universes, evolve agents with souls and psychology, govern the multiverse. Frasberg Cloud V1." />
      <div className="pointer-events-none absolute inset-0 opacity-50"><Starfield /></div>

      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" data-testid="cloud-home-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <img src="/frasberg-mark-circle.png" alt="Frasberg" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">Frasberg</span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-lux-text2 sm:inline">Cloud V1</span>
          </Link>
          <button onClick={toggle} aria-label="Toggle theme" data-testid="cloud-theme-toggle"
            className="grid h-10 w-10 place-items-center rounded-full border border-lux-border transition-colors hover:border-lux-accent hover:text-lux-accent">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <h1 className="font-display text-4xl font-700 tracking-tighter sm:text-5xl">Frasberg Cloud</h1>
        <p className="mt-2 max-w-2xl text-sm text-lux-text2">
          The multiverse simulation console. Birth universes, evolve agents with psychology and souls,
          watch civilizations rise, myths spread, singularities ignite — and govern it all.
        </p>
        <button onClick={() => setAutoRun((v) => !v)} data-testid="auto-run-toggle"
          className={`mt-5 flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-600 transition-transform hover:-translate-y-0.5 ${autoRun ? "bg-emerald-400 text-lux-bg" : "border border-lux-border text-lux-text2 hover:border-lux-accent hover:text-lux-text"}`}>
          <Play size={14} /> {autoRun ? "Auto-Run: LIVE — evolving every 5s (click to pause)" : "Auto-Run Mode: start live evolution"}
        </button>

        <div className="mt-8 space-y-6">
          <KernelBar kernel={kernel} />
          <GenesisForm onCreated={refresh} />

          {merge.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-lux-accent/40 bg-lux-surface p-4" data-testid="multiverse-ops-bar">
              <span className="font-mono text-[11px] text-lux-text2">{merge.length}/2 universes selected</span>
              <button onClick={synthesize} data-testid="ops-synthesize-btn" className="flex items-center gap-1.5 rounded-full border border-lux-border px-4 py-1.5 text-xs hover:border-lux-accent"><GitMerge size={13} /> Omni-Synthesis (fuse)</button>
              <button onClick={migrate} data-testid="ops-migrate-btn" className="flex items-center gap-1.5 rounded-full border border-lux-border px-4 py-1.5 text-xs hover:border-lux-accent"><ArrowRightLeft size={13} /> Migrate 5 agents</button>
              <button onClick={tradeKnowledge} data-testid="ops-trade-btn" className="flex items-center gap-1.5 rounded-full border border-lux-border px-4 py-1.5 text-xs hover:border-lux-accent"><Zap size={13} /> Trade knowledge</button>
              <button onClick={exchange} data-testid="ops-exchange-btn" className="flex items-center gap-1.5 rounded-full border border-lux-border px-4 py-1.5 text-xs hover:border-lux-accent"><Landmark size={13} /> Cultural exchange</button>
              <button onClick={() => setMerge([])} className="font-mono text-xs text-lux-text2 hover:text-lux-text">clear</button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="universe-grid">
            {universes.length === 0 && (
              <p className="col-span-full py-10 text-center font-mono text-xs uppercase tracking-wide text-lux-text2">
                The void awaits — create your first universe above
              </p>
            )}
            {universes.map((u) => (
              <div key={u.id} data-testid={`universe-card-${u.id}`}
                className={`rounded-2xl border p-5 transition-colors ${merge.includes(u.id) ? "border-lux-accent" : "border-lux-border"} bg-lux-surface`}>
                <div className="flex items-start justify-between">
                  <button onClick={() => setDetail(u.id)} data-testid={`universe-open-${u.id}`} className="text-left">
                    <h3 className="flex items-center gap-2 font-display text-lg font-600 hover:text-lux-accent"><Globe size={15} className="text-lux-accent" /> {u.name}</h3>
                  </button>
                  <span className="rounded-full px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wide"
                    style={{ color: PHASE_COLOR[u.phase], border: `1px solid ${PHASE_COLOR[u.phase]}66` }}>
                    {u.phase}
                  </span>
                </div>
                <p className="mt-2 font-mono text-[10px] text-lux-text2">
                  tick {u.tick} · {u.physicsModel} · {u.terrain}/{u.climate} · {u.dimensions}D
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[10px] text-lux-text2">
                  <span>entropy <span className="text-lux-text">{u.entropy}</span></span>
                  <span>stability <span className="text-lux-text">{u.stability}</span></span>
                  <span>agents <span className="text-lux-text">{u.agents}</span></span>
                  <span>pop <span className="text-lux-text">{u.population.toLocaleString()}</span></span>
                  <span>rep <span className="text-lux-text">{u.avgReputation}</span></span>
                  <span>☄ <span className="text-lux-text">{u.singularities}</span></span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button onClick={() => tick(u.id, 1)} data-testid={`tick-1-${u.id}`}
                    className="flex items-center gap-1 rounded-full bg-lux-accent px-3.5 py-1.5 text-xs font-600 text-lux-bg hover:-translate-y-0.5 transition-transform"><Play size={11} /> Tick</button>
                  <button onClick={() => tick(u.id, 10)} data-testid={`tick-10-${u.id}`}
                    className="rounded-full border border-lux-border px-3.5 py-1.5 text-xs hover:border-lux-accent">×10</button>
                  <button onClick={() => toggleMerge(u.id)} data-testid={`select-${u.id}`}
                    className={`rounded-full border px-3.5 py-1.5 text-xs ${merge.includes(u.id) ? "border-lux-accent text-lux-accent" : "border-lux-border hover:border-lux-accent"}`}>
                    {merge.includes(u.id) ? "Selected" : "Select"}
                  </button>
                  <button onClick={() => del(u.id)} data-testid={`delete-${u.id}`} aria-label="Delete universe"
                    className="ml-auto grid h-8 w-8 place-items-center rounded-full border border-lux-border text-lux-text2 hover:border-red-500/60 hover:text-red-400"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-lux-border bg-lux-surface p-5" data-testid="congress-panel">
            <h2 className="flex items-center gap-2 font-display text-xl font-600"><Landmark size={17} className="text-lux-gold" /> Multiverse Diplomatic Congress</h2>
            <p className="mt-1 font-mono text-[11px] text-lux-text2">{congress?.memberUniverses || 0} member universes</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <input value={resTitle} onChange={(e) => setResTitle(e.target.value)} placeholder="Propose a resolution…"
                data-testid="congress-resolution-input"
                className="w-full max-w-md rounded-full border border-lux-border bg-lux-bg px-4 py-2 font-mono text-xs outline-none focus:border-lux-accent" />
              <button onClick={propose} data-testid="congress-propose-btn"
                className="rounded-full bg-lux-gold px-5 py-2 text-xs font-600 text-lux-bg hover:-translate-y-0.5 transition-transform">Propose</button>
            </div>
            <div className="mt-4 space-y-2" data-testid="congress-resolutions-list">
              {(congress?.resolutions || []).map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-lux-border px-4 py-2.5">
                  <span className="text-sm text-lux-text">{r.title}</span>
                  {r.passed === null || r.passed === undefined ? (
                    <button onClick={() => vote(r.id)} data-testid={`congress-vote-${r.id}`}
                      className="rounded-full border border-lux-border px-4 py-1 text-xs hover:border-lux-accent">Call vote</button>
                  ) : (
                    <span className={`rounded-full border px-3 py-0.5 font-mono text-[10px] uppercase ${r.passed ? "border-emerald-400/50 text-emerald-400" : "border-red-500/50 text-red-400"}`}>
                      {r.passed ? "Passed" : "Failed"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {kernel?.absoluteLaws && (
            <div className="rounded-2xl border border-lux-border bg-lux-surface p-5" data-testid="absolute-laws-panel">
              <h2 className="font-display text-xl font-600">Kernel Absolute Law Layer</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {kernel.absoluteLaws.map((l) => (
                  <div key={l.id} className="rounded-xl border border-lux-border px-4 py-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-lux-accent">{l.domain}</p>
                    <p className="mt-1 text-xs text-lux-text2">"{l.axiom}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {detail && <UniverseDetail uid={detail} onClose={() => { setDetail(null); refresh(); }} refresh={refresh} />}
      <Footer />
    </main>
  );
}
