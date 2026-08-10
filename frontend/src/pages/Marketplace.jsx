import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Download, Plus, X, Bot, Cpu, Puzzle, GitBranch, BadgeCheck, Zap, ShieldCheck, Rocket, Globe } from "lucide-react";
import { ParallaxSky } from "../components/site/ParallaxSky";
import { CognitionPreview } from "../components/site/CognitionPreview";
import { useAuth } from "../context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TYPES = [
  ["all", "All"], ["agent", "Agents"], ["model", "Models"], ["extension", "Extensions"], ["pipeline", "Pipelines"],
];
const ICONS = { agent: Bot, model: Cpu, extension: Puzzle, pipeline: GitBranch };

const bandColor = (s) => (s >= 90 ? "#34D399" : s >= 75 ? "#22D3EE" : s >= 60 ? "#FBBF24" : "#F87171");

function SafetyBadge({ score }) {
  const c = bandColor(score);
  return (
    <span className="flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11.5px]" style={{ borderColor: c, color: c }} data-testid="safety-badge">
      <ShieldCheck size={11} /> {score}/100
    </span>
  );
}

function DetailModal({ item, onClose, onInstall }) {
  const Icon = ICONS[item.type] || Bot;
  const hist = [...(item.history || [])].reverse();
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5 backdrop-blur-sm" data-testid="marketplace-detail-modal">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-[#0d0f12] p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300"><Icon size={18} /></span>
            <div>
              <p className="flex items-center gap-1.5 text-[16px] font-700">{item.name} {item.official && <BadgeCheck size={14} className="text-cyan-300" />}</p>
              <p className="font-mono text-[12px] uppercase tracking-wide text-gray-400">{item.type} · v{item.version} · {item.owner}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white" aria-label="Close" data-testid="detail-close"><X size={16} /></button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SafetyBadge score={item.safety_score ?? 75} />
          <span className="font-mono text-[12px]" style={{ color: bandColor(item.safety_score ?? 75) }}>{item.safety_band}</span>
          {item.evolution_mode && <span className="flex items-center gap-1 font-mono text-[12px] text-emerald-300"><Zap size={11} /> Evolution Mode on</span>}
        </div>
        <p className="mt-3 text-[14px] leading-relaxed text-gray-300">{item.description}</p>
        {item.source_repo && (
          <a href={`https://github.com/${item.source_repo}`} target="_blank" rel="noreferrer" data-testid="detail-source-repo"
            className="mt-2 inline-flex items-center gap-1.5 font-mono text-[12.5px] text-gray-400 underline hover:text-cyan-300">
            <GitBranch size={12} /> github.com/{item.source_repo}
          </a>
        )}

        {item.type === "agent" && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="font-mono text-[11.5px] uppercase tracking-wide text-gray-500">How this agent thinks</p>
            <CognitionPreview seed={item.id} labels />
          </div>
        )}
        <p className="mt-6 font-mono text-[12px] uppercase tracking-[0.2em] text-gray-400">Evolution history</p>
        <div className="mt-3 space-y-0" data-testid="evolution-timeline">
          {hist.length === 0 && <p className="text-[13.5px] text-gray-400">No lineage recorded yet.</p>}
          {hist.map((h, idx) => {
            const prev = hist[idx + 1];
            const delta = prev ? h.safety_score - prev.safety_score : 0;
            return (
              <div key={h.version} className="relative border-l border-white/15 pb-5 pl-5" data-testid={`lineage-step-${h.version}`}>
                <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full" style={{ background: bandColor(h.safety_score) }} />
                <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-700">
                  v{h.version}
                  <span className="font-mono text-[11.5px] font-400 text-gray-400">{h.date}</span>
                  <span className="font-mono text-[11.5px] font-400" style={{ color: bandColor(h.safety_score) }}>
                    safety {h.safety_score}{delta > 0 ? ` (+${delta})` : ""}
                  </span>
                </p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-gray-300">{h.note}</p>
              </div>
            );
          })}
        </div>
        <button onClick={() => onInstall(item)} data-testid="detail-install-btn"
          className="mt-4 w-full rounded-full bg-cyan-400 py-2.5 text-[14px] font-700 text-black transition-opacity hover:opacity-85">
          Install · {(item.installs || 0).toLocaleString()} installs
        </button>
      </div>
    </div>
  );
}

function PublishForm({ onDone, onClose }) {
  const [form, setForm] = useState({ type: "agent", name: "", description: "", version: "1.0.0" });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch(`${API}/marketplace/publish`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Publish failed");
      toast.success(`${d.name} published to the marketplace`);
      onDone();
    } catch (err) { toast.error(String(err.message || err)); }
    setBusy(false);
  };
  const field = "w-full rounded-lg border border-white/20 bg-white/[0.06] px-4 py-2.5 text-[14px] text-white outline-none focus:border-cyan-400";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5 backdrop-blur-sm" data-testid="marketplace-publish-modal">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0d0f12] p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-700">Publish to Marketplace</h2>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white" aria-label="Close" data-testid="publish-close"><X size={16} /></button>
        </div>
        <label className="mt-5 block text-[13px] text-gray-300">Type
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={`${field} mt-1.5`} data-testid="publish-type">
            <option value="agent">Agent</option><option value="model">Model</option>
            <option value="extension">Extension</option><option value="pipeline">Pipeline</option>
          </select>
        </label>
        <label className="mt-4 block text-[13px] text-gray-300">Name
          <input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`${field} mt-1.5`} data-testid="publish-name" />
        </label>
        <label className="mt-4 block text-[13px] text-gray-300">Description
          <textarea required minLength={5} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${field} mt-1.5`} data-testid="publish-description" />
        </label>
        <label className="mt-4 block text-[13px] text-gray-300">Version
          <input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} className={`${field} mt-1.5`} data-testid="publish-version" />
        </label>
        <button type="submit" disabled={busy} data-testid="publish-submit"
          className="mt-6 w-full rounded-full bg-cyan-400 py-2.5 text-[14px] font-700 text-black transition-opacity hover:opacity-85 disabled:opacity-40">
          {busy ? "Publishing…" : "Publish"}
        </button>
      </form>
    </div>
  );
}

export default function Marketplace() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [type, setType] = useState("all");
  const [showPublish, setShowPublish] = useState(false);
  const [installing, setInstalling] = useState(null);
  const [detail, setDetail] = useState(null);
  const openDetail = async (item) => {
    try {
      const r = await fetch(`${API}/marketplace/${item.id}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Failed to load");
      setDetail(d);
    } catch (e) { toast.error(String(e.message || e)); }
  };

  const load = () => {
    fetch(`${API}/marketplace${type !== "all" ? `?type=${type}` : ""}`)
      .then((r) => r.json()).then((d) => setItems(d.items || [])).catch(() => setItems([]));
  };
  useEffect(load, [type]);

  const install = async (item) => {
    setInstalling(item.id);
    try {
      const r = await fetch(`${API}/marketplace/${item.id}/install`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Install failed");
      toast.success(`${item.name} installed — ${d.installs.toLocaleString()} installs`);
      load();
    } catch (e) { toast.error(String(e.message || e)); }
    setInstalling(null);
  };

  const toggleEvolution = async (item) => {
    try {
      const r = await fetch(`${API}/marketplace/${item.id}/evolution`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !item.evolution_mode }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Toggle failed");
      toast.success(d.evolution_mode
        ? `${item.name}: Evolution Mode ON — auto-updates via validated improvement cycles`
        : `${item.name}: Evolution Mode off`);
      load();
    } catch (e) { toast.error(String(e.message || e)); }
  };

  return (
    <main className="relative min-h-screen text-white" style={{ background: "#08090A" }} data-testid="marketplace-page">
      <ParallaxSky />
      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5" data-testid="marketplace-home-link">
            <ArrowLeft size={16} className="text-gray-400" />
            <img src="/luchii-mark-circle.png" alt="Frasberg Luchii" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">Marketplace</span>
          </Link>
          <button onClick={() => user ? setShowPublish(true) : toast.error("Sign in to publish")} data-testid="marketplace-publish-btn"
            className="flex items-center gap-1.5 rounded-full bg-cyan-400 px-5 py-2 text-[13.5px] font-700 text-black transition-opacity hover:opacity-85">
            <Plus size={14} /> Publish
          </button>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-12">
        <h1 className="font-display text-3xl font-700 tracking-tight sm:text-4xl">Agents, Models & Extensions</h1>
        <p className="mt-3 max-w-xl text-[16px] text-gray-300">Publish and install agents, models, extensions and pipelines built for the Frasberg platform.</p>

        <div className="mt-8 flex flex-wrap items-center gap-2" data-testid="marketplace-filters">
          {TYPES.map(([k, label]) => (
            <button key={k} onClick={() => setType(k)} data-testid={`marketplace-filter-${k}`}
              className={`rounded-full border px-4 py-1.5 text-[13.5px] transition-colors ${type === k ? "border-cyan-400 bg-cyan-400/10 text-cyan-300" : "border-white/15 text-gray-300 hover:border-white/40"}`}>
              {label}
            </button>
          ))}
          <span className="mx-1 hidden h-5 w-px bg-white/15 sm:block" />
          {[["deploy", "Deploy", Rocket], ["evolution", "Evolution", GitBranch], ["safety", "Safety", ShieldCheck], ["regions", "Regions", Globe]].map(([k, label, Icon]) => (
            <Link key={k} to={`/marketplace/${k}`} data-testid={`marketplace-nav-${k}`}
              className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-1.5 text-[13.5px] text-gray-300 transition-colors hover:border-cyan-400 hover:text-cyan-300">
              <Icon size={12} /> {label}
            </Link>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="marketplace-grid">
          {items === null && <p className="font-mono text-[13px] text-gray-400">Loading…</p>}
          {items !== null && items.length === 0 && <p className="text-gray-400">Nothing here yet — be the first to publish.</p>}
          {(items || []).map((i) => {
            const Icon = ICONS[i.type] || Bot;
            return (
              <div key={i.id} className="flex flex-col rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur transition-colors hover:border-cyan-400/40" data-testid={`marketplace-item-${i.id}`}>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300"><Icon size={17} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-[15px] font-700">
                      <button onClick={() => openDetail(i)} className="truncate text-left transition-colors hover:text-cyan-300" data-testid={`marketplace-view-${i.id}`}>{i.name}</button>
                      {i.official && <BadgeCheck size={14} className="shrink-0 text-cyan-300" title="Official Frasberg" />}
                    </p>
                    <p className="font-mono text-[12.5px] uppercase tracking-wide text-gray-400">{i.type} · v{i.version} · {i.owner}</p>
                  </div>
                  <SafetyBadge score={i.safety_score ?? 75} />
                </div>
                <p className="mt-3 flex-1 text-[14px] leading-relaxed text-gray-300">{i.description}</p>
                {i.type === "agent" && (
                  <div className="mt-3 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-1" data-testid={`cognition-preview-${i.id}`}>
                    <CognitionPreview seed={i.id} height={44} />
                  </div>
                )}
                {i.evolution_mode && (
                  <p className="mt-2 flex items-center gap-1.5 font-mono text-[12px] text-emerald-300" data-testid={`marketplace-evolution-badge-${i.id}`}>
                    <Zap size={11} /> Evolution Mode — validated auto-updates {i.evolution?.lineage ? `· ${i.evolution.lineage}` : ""}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-mono text-[12.5px] text-gray-400">{(i.installs || 0).toLocaleString()} installs</span>
                  <span className="flex items-center gap-1.5">
                    {user && (
                      <button onClick={() => toggleEvolution(i)} data-testid={`marketplace-evolution-toggle-${i.id}`}
                        title="Evolution Mode — agent auto-updates through validated improvement cycles (publisher only)"
                        className={`grid h-8 w-8 place-items-center rounded-full border transition-colors ${i.evolution_mode ? "border-emerald-400 text-emerald-300" : "border-white/20 text-gray-400 hover:border-emerald-400 hover:text-emerald-300"}`}>
                        <Zap size={13} />
                      </button>
                    )}
                    <button onClick={() => install(i)} disabled={installing === i.id} data-testid={`marketplace-install-${i.id}`}
                      className="flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-1.5 text-[13px] font-600 transition-colors hover:border-cyan-400 hover:text-cyan-300 disabled:opacity-40">
                      <Download size={12} /> {installing === i.id ? "Installing…" : "Install"}
                    </button>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {showPublish && <PublishForm onClose={() => setShowPublish(false)} onDone={() => { setShowPublish(false); load(); }} />}
      {detail && <DetailModal item={detail} onClose={() => setDetail(null)} onInstall={(it) => { install(it); setDetail(null); }} />}
    </main>
  );
}
