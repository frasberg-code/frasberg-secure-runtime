import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Globe, Activity, Scale, ShieldAlert, Network, Rocket, Pause, Play } from "lucide-react";
import { ParallaxSky } from "../components/site/ParallaxSky";
import { RegionMap, RegionCards } from "../components/site/RegionMesh";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const card = "rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur";
const label = "flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.2em] text-gray-400";

const autoscaleDecision = (r) => (r.load > 0.65 ? ["scale up", "#F87171"] : r.load < 0.25 ? ["scale down", "#22D3EE"] : ["hold", "#34D399"]);

export default function CloudConsole() {
  const [state, setState] = useState(null);
  const [live, setLive] = useState(true);
  const timer = useRef(null);

  const call = useCallback(async (path, method = "GET", body = null) => {
    try {
      const r = await fetch(`${API}/os/${path}`, {
        method, ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
      });
      const d = await r.json();
      if (r.ok) setState(d);
    } catch {}
  }, []);

  useEffect(() => { call("state"); }, [call]);
  useEffect(() => {
    if (live) timer.current = setInterval(() => call("tick", "POST"), 3000);
    return () => clearInterval(timer.current);
  }, [live, call]);

  const regions = state?.regions || [];
  const pairs = [];
  for (let i = 0; i < regions.length; i++)
    for (let j = i + 1; j < regions.length; j++) pairs.push([regions[i], regions[j]]);

  return (
    <main className="relative min-h-screen text-white" style={{ background: "#08090A" }} data-testid="cloud-console-page">
      <ParallaxSky />
      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5" data-testid="console-home-link">
            <ArrowLeft size={16} className="text-gray-400" />
            <img src="/luchii-mark-circle.png" alt="Frasberg" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">Cloud Console</span>
          </Link>
          <button onClick={() => setLive(!live)} data-testid="console-live-toggle"
            className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 font-mono text-[12px] uppercase tracking-wide transition-colors ${live ? "border-emerald-400 text-emerald-300" : "border-white/20 text-gray-400"}`}>
            {live ? <><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> live</> : <><Play size={11} /> paused</>}
          </button>
        </div>
      </header>
      <div className="relative z-10 mx-auto max-w-6xl px-5 py-10">
        <h1 className="font-display text-3xl font-700 tracking-tight sm:text-4xl">AIM v2 — Global Mesh Console</h1>
        <p className="mt-3 max-w-2xl text-[15px] text-gray-300">Region health, cognition distribution, autoscaling, failover and federation — one governed pane of glass.</p>

        {!state ? <p className="mt-10 font-mono text-[13px] text-gray-400">Connecting to mesh…</p> : (
          <>
            <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div className={`${card} lg:col-span-2`} data-testid="console-mesh-panel">
                <p className={label}><Globe size={12} /> Mesh map</p>
                <RegionMap regions={regions} />
              </div>
              <div className="space-y-5">
                <div className={card} data-testid="console-autoscale-panel">
                  <p className={label}><Scale size={12} /> Autoscale decisions</p>
                  <div className="mt-3 space-y-2">
                    {regions.map((r) => {
                      const [d, c] = autoscaleDecision(r);
                      return (
                        <p key={r.id} className="flex items-center justify-between font-mono text-[12.5px]" data-testid={`autoscale-${r.id}`}>
                          <span className="text-gray-300">{r.name} · {Math.round(r.load * 100)}%</span>
                          <span className="rounded-full border px-2.5 py-0.5 text-[11.5px]" style={{ borderColor: c, color: c }}>{d}</span>
                        </p>
                      );
                    })}
                  </div>
                </div>
                <div className={card} data-testid="console-failover-panel">
                  <p className={label}><ShieldAlert size={12} /> Failover</p>
                  {state.scenario?.name === "region_failover" ? (
                    <p className="mt-2 font-mono text-[12.5px] text-amber-300" data-testid="console-failover-status">active — us-west degraded, {state.scenario.remaining} ticks to recovery</p>
                  ) : regions.some((r) => r.healing_in) ? (
                    <p className="mt-2 font-mono text-[12.5px] text-cyan-300" data-testid="console-failover-status">self-healing: {regions.filter((r) => r.healing_in).map((r) => `${r.id} (${r.healing_in}t)`).join(", ")}</p>
                  ) : (
                    <p className="mt-2 font-mono text-[12.5px] text-emerald-300" data-testid="console-failover-status">all regions nominal</p>
                  )}
                  <button onClick={async () => { await call("scenario", "POST", { name: "region_failover" }); toast.warning("Failover injected — rerouting to us-east"); }}
                    disabled={state.scenario?.name === "region_failover"} data-testid="console-failover-btn"
                    className="mt-3 w-full rounded-full border border-amber-400 py-1.5 text-[12.5px] font-600 text-amber-300 transition-opacity hover:opacity-80 disabled:opacity-40">
                    Simulate failover
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div className={card} data-testid="console-cognition-panel">
                <p className={label}><Activity size={12} /> Cognition distribution</p>
                <div className="mt-3 space-y-2">
                  {Object.entries(state.nodes || {}).map(([n, a]) => (
                    <p key={n} className="flex items-center gap-2 font-mono text-[12px] text-gray-400" data-testid={`cognition-bar-${n}`}>
                      <span className="w-16 truncate">{n}</span>
                      <span className="h-1.5 flex-1 rounded-full bg-white/10"><span className="block h-1.5 rounded-full bg-cyan-400" style={{ width: `${a * 100}%` }} /></span>
                      <span className="w-8 text-right text-cyan-200">{Math.round(a * 100)}</span>
                    </p>
                  ))}
                </div>
              </div>
              <div className={card} data-testid="console-federation-panel">
                <p className={label}><Network size={12} /> Federation sync</p>
                <div className="mt-3 space-y-2.5">
                  {pairs.map(([a, b]) => {
                    const ok = a.status === "healthy" && b.status === "healthy";
                    return (
                      <p key={`${a.id}-${b.id}`} className="flex items-center justify-between font-mono text-[12px]" data-testid={`federation-${a.id}-${b.id}`}>
                        <span className="text-gray-300">{a.id} ⇄ {b.id}</span>
                        <span style={{ color: ok ? "#34D399" : "#FBBF24" }}>{ok ? "handshake verified" : "resyncing"}</span>
                      </p>
                    );
                  })}
                </div>
              </div>
              <div className={card} data-testid="console-deploy-panel">
                <p className={label}><Rocket size={12} /> Deploy</p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-gray-300">Ship an agent through the safety validator to any healthy region.</p>
                <Link to="/marketplace/deploy" data-testid="console-deploy-link"
                  className="mt-4 block w-full rounded-full py-2 text-center text-[13.5px] font-700 text-black transition-opacity hover:opacity-85"
                  style={{ backgroundImage: "linear-gradient(90deg,#4A6CF7,#00D1FF)" }}>
                  Open deploy wizard
                </Link>
                <p className="mt-3 font-mono text-[11.5px] text-gray-500">kernel v{state.kernel.version.replace("v", "")} · tick {state.kernel.tick} · load {Math.round(state.kernel.load * 100)}%</p>
              </div>
            </div>

            <div className="mt-5"><RegionCards regions={regions} /></div>

            <div className={`${card} mt-5`} data-testid="console-event-panel">
              <p className={label}>Mesh event stream</p>
              <div className="mt-2 max-h-44 space-y-1 overflow-y-auto font-mono text-[12.5px] text-gray-300">
                {(state.events || []).map((e, i) => <p key={i}><span className="text-cyan-300/70">[t{e.tick}]</span> {e.text}</p>)}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
