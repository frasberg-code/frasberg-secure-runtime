import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Users, Globe, ShieldCheck, GitBranch, Activity } from "lucide-react";
import { ParallaxSky } from "../components/site/ParallaxSky";
import { RegionMap, RegionCards } from "../components/site/RegionMesh";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const card = "rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur";
const label = "flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.2em] text-gray-400";
const safetyColor = (s) => (s >= 90 ? "#34D399" : s >= 75 ? "#22D3EE" : s >= 60 ? "#FBBF24" : "#F87171");

export default function OpsCenter() {
  const [os, setOs] = useState(null);
  const [hosting, setHosting] = useState(null);
  const [denied, setDenied] = useState(false);
  const [items, setItems] = useState([]);

  const pull = useCallback(() => {
    fetch(`${API}/os/tick`, { method: "POST" }).then((r) => r.json()).then(setOs).catch(() => {});
  }, []);

  useEffect(() => {
    pull();
    const t = setInterval(pull, 3000);
    fetch(`${API}/admin/hosting`, { credentials: "include" })
      .then((r) => { if (r.status === 401 || r.status === 403) { setDenied(true); return null; } return r.json(); })
      .then((d) => d && setHosting(d)).catch(() => {});
    fetch(`${API}/marketplace`).then((r) => r.json()).then((d) => setItems(d.items || [])).catch(() => {});
    return () => clearInterval(t);
  }, [pull]);

  const evolving = items.filter((i) => (i.history || []).length > 1 || i.evolution_mode);
  return (
    <main className="relative min-h-screen text-white" style={{ background: "#08090A" }} data-testid="ops-center-page">
      <ParallaxSky />
      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5" data-testid="ops-home-link">
            <ArrowLeft size={16} className="text-gray-400" />
            <img src="/frasberg-mark-circle.png" alt="Frasberg" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">Kernel v4 Ops Center</span>
          </Link>
          <span className="flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-wide text-emerald-300"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> live</span>
        </div>
      </header>
      <div className="relative z-10 mx-auto max-w-6xl px-5 py-10">
        <h1 className="font-display text-3xl font-700 tracking-tight sm:text-4xl">Global Ops Center</h1>
        <p className="mt-3 max-w-2xl text-[15px] text-gray-300">Tenants, mesh, safety envelopes and evolution tracking — the whole kernel on one governed pane.</p>

        {os && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="ops-global-stats">
            {[["Kernel tick", os.kernel.tick], ["Mesh load", `${Math.round(os.kernel.load * 100)}%`],
              ["Regions healthy", `${(os.regions || []).filter((r) => r.status === "healthy").length}/${(os.regions || []).length}`],
              ["Tenants", hosting ? hosting.tenants.length : "—"]].map(([k, v]) => (
              <div key={k} className={card}>
                <p className="font-mono text-[11.5px] uppercase text-gray-500">{k}</p>
                <p className="mt-1 font-mono text-2xl font-700 text-cyan-200">{v}</p>
              </div>
            ))}
          </div>
        )}

        {os && (
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className={`${card} lg:col-span-2`} data-testid="ops-mesh-panel">
              <p className={label}><Globe size={12} /> Region mesh</p>
              <RegionMap regions={os.regions || []} />
            </div>
            <div className={card} data-testid="ops-safety-panel">
              <p className={label}><ShieldCheck size={12} /> Safety envelope</p>
              <div className="mt-3 space-y-2">
                {Object.entries(os.node_stats || {}).map(([n, s]) => (
                  <p key={n} className="flex items-center justify-between font-mono text-[12px]" data-testid={`ops-safety-${n}`}>
                    <span className="text-gray-300">{n}</span>
                    <span style={{ color: safetyColor(s.safety) }}>{s.safety}/100 · {s.traffic} pulses</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className={card} data-testid="ops-evolution-panel">
            <p className={label}><GitBranch size={12} /> Evolution tracker</p>
            <div className="mt-3 space-y-2.5">
              {evolving.slice(0, 8).map((i) => (
                <div key={i.id} className="flex flex-wrap items-center justify-between gap-2" data-testid={`ops-evo-${i.id}`}>
                  <span className="text-[13.5px] font-600">{i.name}</span>
                  <span className="font-mono text-[11.5px] text-gray-400">
                    {(i.history || []).length} cycles · <span style={{ color: safetyColor(i.safety_score) }}>{i.safety_score}/100</span>
                    {i.evolution_mode && <span className="ml-2 rounded-full border border-cyan-400/50 px-2 py-0.5 text-cyan-300">evolving</span>}
                  </span>
                </div>
              ))}
              {evolving.length === 0 && <p className="text-[13px] text-gray-500">No evolving agents yet.</p>}
            </div>
          </div>
          <div className={card} data-testid="ops-tenants-panel">
            <p className={label}><Users size={12} /> Tenants</p>
            {denied && <p className="mt-3 text-[13.5px] text-amber-300">Admin login required for tenant governance — <Link to="/auth?mode=login" className="underline">sign in</Link>.</p>}
            {hosting && (
              <div className="mt-3 space-y-2.5">
                {hosting.tenants.slice(0, 8).map((t) => (
                  <div key={t.id} className="flex flex-wrap items-center justify-between gap-2" data-testid={`ops-tenant-${t.id}`}>
                    <span className="truncate text-[13px] font-600">{t.email}</span>
                    <span className="font-mono text-[11.5px] text-gray-400">{t.plan} · {t.isolation} · {t.billing.cognition_cycles.toLocaleString()} cycles · {t.region_permissions.length} regions</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {os && (
          <>
            <div className="mt-5"><RegionCards regions={os.regions || []} /></div>
            <div className={`${card} mt-5`} data-testid="ops-event-panel">
              <p className={label}><Activity size={12} /> Kernel event stream</p>
              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto font-mono text-[12.5px] text-gray-300">
                {(os.events || []).map((e, i) => <p key={i}><span className="text-cyan-300/70">[t{e.tick}]</span> {e.text}</p>)}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
