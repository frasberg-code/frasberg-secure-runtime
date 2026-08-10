import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Rocket, ShieldCheck, GitBranch, Globe, CheckCircle2, Loader2, Zap } from "lucide-react";
import { ParallaxSky } from "../components/site/ParallaxSky";
import { RegionMap, RegionCards } from "../components/site/RegionMesh";
import { CognitionPreview } from "../components/site/CognitionPreview";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const PAGES = [
  ["deploy", "Deploy", Rocket], ["evolution", "Evolution", GitBranch],
  ["safety", "Safety", ShieldCheck], ["regions", "Regions", Globe],
];
const grad = { backgroundImage: "linear-gradient(90deg,#4A6CF7,#00D1FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" };
const card = "rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur";
const bandColor = (s) => (s >= 90 ? "#34D399" : s >= 75 ? "#22D3EE" : s >= 60 ? "#FBBF24" : "#F87171");

const VALIDATOR_STEPS = [
  "Static analysis — cognition graph invariants",
  "Membrane check — identity preservation",
  "Classifier v3 — tool & mutation risk scoring",
  "Hinge logic — intent gating simulation",
  "GSS-2 band certification",
];

function DeployPage({ regions }) {
  const [agents, setAgents] = useState([]);
  const [agent, setAgent] = useState(null);
  const [region, setRegion] = useState("us-west");
  const [step, setStep] = useState(-1);
  const [deployed, setDeployed] = useState(false);
  useEffect(() => {
    fetch(`${API}/marketplace?type=agent`).then((r) => r.json())
      .then((d) => { setAgents(d.items || []); setAgent((d.items || [])[0] || null); }).catch(() => {});
  }, []);
  const validate = () => {
    setDeployed(false);
    setStep(0);
    VALIDATOR_STEPS.forEach((_, i) => setTimeout(() => setStep(i + 1), (i + 1) * 700));
  };
  const done = step >= VALIDATOR_STEPS.length;
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className={card} data-testid="deploy-config-panel">
        <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-gray-400">Deployment configuration</p>
        <label className="mt-4 block text-[13px] text-gray-300">Agent
          <select value={agent?.id || ""} onChange={(e) => { setAgent(agents.find((a) => a.id === e.target.value)); setStep(-1); setDeployed(false); }}
            className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/[0.06] px-4 py-2.5 text-[14px] text-white outline-none focus:border-cyan-400" data-testid="deploy-agent-select">
            {agents.map((a) => <option key={a.id} value={a.id} className="bg-black">{a.name} — safety {a.safety_score}/100</option>)}
          </select>
        </label>
        <p className="mt-5 text-[13px] text-gray-300">Region selector</p>
        <div className="mt-2 grid grid-cols-2 gap-2" data-testid="deploy-region-selector">
          {regions.map((r) => (
            <button key={r.id} onClick={() => setRegion(r.id)} data-testid={`deploy-region-${r.id}`}
              className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${region === r.id ? "border-cyan-400 bg-cyan-400/10" : "border-white/15 hover:border-white/35"}`}>
              <p className="text-[13px] font-600">{r.name}</p>
              <p className="font-mono text-[11.5px] text-gray-400">{r.status} · load {Math.round(r.load * 100)}%</p>
            </button>
          ))}
        </div>
        {agent && (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="font-mono text-[11.5px] uppercase tracking-wide text-gray-500">Cognition inspector</p>
            <CognitionPreview seed={agent.id} labels />
          </div>
        )}
      </div>
      <div className={card} data-testid="deploy-validator-panel">
        <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-gray-400">Safety validator</p>
        <div className="mt-4 space-y-3">
          {VALIDATOR_STEPS.map((s, i) => (
            <p key={s} className="flex items-center gap-2.5 text-[13.5px]" data-testid={`validator-step-${i}`}>
              {step > i ? <CheckCircle2 size={15} className="text-emerald-400" />
                : step === i ? <Loader2 size={15} className="animate-spin text-cyan-300" />
                : <span className="grid h-[15px] w-[15px] place-items-center rounded-full border border-white/25" />}
              <span className={step > i ? "text-gray-200" : "text-gray-500"}>{s}</span>
            </p>
          ))}
        </div>
        {done && agent && (
          <div className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-400/[0.06] p-4" data-testid="deploy-summary">
            <p className="text-[13.5px] font-700 text-emerald-300">Validation passed — ready to deploy</p>
            <p className="mt-1 font-mono text-[12.5px] text-gray-300">{agent.name} v{agent.version} → {region} · GSS-2 band: {agent.safety_band || "verified"}</p>
          </div>
        )}
        <button onClick={() => { if (!done) { validate(); } else { setDeployed(true); toast.success(`${agent?.name} deployed to ${region} — governed autonomy active`); } }}
          disabled={!agent || (step >= 0 && !done)} data-testid="deploy-action-btn"
          className="mt-5 w-full rounded-full py-2.5 text-[14px] font-700 text-black transition-opacity hover:opacity-85 disabled:opacity-40"
          style={{ backgroundImage: "linear-gradient(90deg,#4A6CF7,#00D1FF)" }}>
          {deployed ? "Deployed ✓" : done ? `Deploy to ${region}` : step >= 0 ? "Validating…" : "Run safety validation"}
        </button>
      </div>
    </div>
  );
}

function EvolutionPage() {
  const [items, setItems] = useState([]);
  const [sel, setSel] = useState(null);
  useEffect(() => {
    fetch(`${API}/marketplace`).then((r) => r.json()).then((d) => {
      const withHist = (d.items || []).filter((i) => (i.history || []).length > 0);
      setItems(withHist);
      setSel(withHist[0] || null);
    }).catch(() => {});
  }, []);
  const hist = sel ? [...(sel.history || [])].reverse() : [];
  const first = hist[hist.length - 1], last = hist[0];
  const delta = first && last ? last.safety_score - first.safety_score : 0;
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className={card}>
        <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-gray-400">Lineages</p>
        <div className="mt-3 space-y-1.5">
          {items.map((i) => (
            <button key={i.id} onClick={() => setSel(i)} data-testid={`lineage-select-${i.id}`}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${sel?.id === i.id ? "border-cyan-400 bg-cyan-400/10" : "border-white/10 hover:border-white/30"}`}>
              <span className="text-[13.5px] font-600">{i.name}</span>
              <span className="font-mono text-[11.5px]" style={{ color: bandColor(i.safety_score) }}>{i.safety_score}/100</span>
            </button>
          ))}
        </div>
      </div>
      <div className={`${card} lg:col-span-2`} data-testid="evolution-detail">
        {sel && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[16px] font-700">{sel.name} — lineage timeline</p>
              <span className="flex items-center gap-1.5 font-mono text-[12px] text-emerald-300"><Zap size={12} /> {hist.length} validated cycle{hist.length === 1 ? "" : "s"}{delta > 0 ? ` · safety +${delta}` : ""}</span>
            </div>
            <div className="mt-5 space-y-0">
              {hist.map((h, idx) => {
                const prev = hist[idx + 1];
                const d = prev ? h.safety_score - prev.safety_score : 0;
                return (
                  <div key={h.version} className="relative border-l border-white/15 pb-5 pl-5">
                    <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full" style={{ background: bandColor(h.safety_score) }} />
                    <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-700">
                      v{h.version}
                      <span className="font-mono text-[11.5px] font-400 text-gray-400">{h.date}</span>
                      <span className="font-mono text-[11.5px] font-400" style={{ color: bandColor(h.safety_score) }}>safety {h.safety_score}{d > 0 ? ` (+${d})` : ""}</span>
                    </p>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-gray-300">{h.note}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-3 font-mono text-[12px]">
              {[["Mutations", hist.length], ["Benchmark Δ", delta > 0 ? `+${delta}%` : "—"], ["Band", sel.safety_band || "—"]].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
                  <p className="text-gray-500">{k}</p>
                  <p className="mt-1 text-[14px] text-cyan-200">{v}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const SAFETY_SECTIONS = [
  ["Membrane Protocol", "The identity membrane wraps every agent — preventing impersonation, identity drift and unauthorized delegation. If membrane(agent) is false, the action is blocked before it reaches the output gate."],
  ["Hinge Logic", "Dynamic safety gating based on intent, context, live safety score and region state. Hinges close instantly under anomalous delegation patterns, quarantining tool calls until cleared."],
  ["Classifier v3", "Every mutation, tool call, delegation and region route receives a live risk score. risk(action) ≥ threshold → denied. Scores feed the GSS-2 bands shown on every marketplace listing."],
  ["Safety Graph", "Safety constraints propagate structurally across cognition nodes — a constraint on Reasoning automatically bounds Decision and Action downstream. No node executes outside its inherited envelope."],
];

function SafetyPage() {
  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {SAFETY_SECTIONS.map(([t, body]) => (
          <div key={t} className={card} data-testid={`safety-section-${t.split(" ")[0].toLowerCase()}`}>
            <p className="flex items-center gap-2 text-[15px] font-700"><ShieldCheck size={15} className="text-cyan-300" /> {t}</p>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-gray-300">{body}</p>
          </div>
        ))}
      </div>
      <div className={`${card} mt-5`} data-testid="gss2-bands">
        <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-gray-400">GSS-2 scoring bands</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-4 font-mono text-[12.5px]">
          {[["90–100", "Fully safe", "#34D399"], ["75–89", "Safe with monitoring", "#22D3EE"], ["60–74", "Restricted evolution", "#FBBF24"], ["0–59", "Evolution disabled", "#F87171"]].map(([r, l, c]) => (
            <div key={r} className="rounded-lg border px-3 py-2.5" style={{ borderColor: c }}>
              <p style={{ color: c }}>{r}</p>
              <p className="mt-0.5 text-gray-300">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function RegionsPage({ regions, onFailover, failoverBusy, scenario }) {
  return (
    <>
      <div className={card} data-testid="regions-map-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-gray-400">AIM v2 — global mesh · live</p>
          <div className="flex items-center gap-3">
            {scenario?.name === "region_failover" && (
              <span className="flex items-center gap-1.5 font-mono text-[12px] text-amber-300" data-testid="regions-failover-active">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" /> failover active — {scenario.remaining} ticks
              </span>
            )}
            <button onClick={onFailover} disabled={failoverBusy || scenario?.name === "region_failover"} data-testid="simulate-failover-btn"
              className="rounded-full border border-amber-400 px-4 py-1.5 text-[12.5px] font-600 text-amber-300 transition-opacity hover:opacity-80 disabled:opacity-40">
              Simulate failover
            </button>
          </div>
        </div>
        <RegionMap regions={regions} />
      </div>
      <div className="mt-5"><RegionCards regions={regions} /></div>
    </>
  );
}

const HERO = {
  deploy: ["Deploy with confidence.", "Pick a region, run the safety validator, inspect the cognition graph — then ship."],
  evolution: ["Agents that grow.", "Every validated improvement cycle is tracked — lineage, mutations, safety and benchmarks."],
  safety: ["Governed autonomy.", "Membrane. Hinge. Classifier. Ethics. Safety isn't a feature — it's the foundation."],
  regions: ["Global intelligence. Local safety.", "Live health, load and failover status across the Frasberg region mesh."],
};

export default function MarketplaceV3() {
  const { page = "deploy" } = useParams();
  const active = PAGES.some(([k]) => k === page) ? page : "deploy";
  const [regions, setRegions] = useState([]);
  const [scenario, setScenario] = useState(null);
  const [failoverBusy, setFailoverBusy] = useState(false);
  const timer = useRef(null);

  const pull = useCallback(async (path = "state", method = "GET", body = null) => {
    try {
      const r = await fetch(`${API}/os/${path}`, {
        method, ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
      });
      const d = await r.json();
      if (r.ok) { setRegions(d.regions || []); setScenario(d.scenario); }
    } catch {}
  }, []);

  useEffect(() => {
    pull();
    if (active === "regions") {
      timer.current = setInterval(() => pull("tick", "POST"), 3000);
      return () => clearInterval(timer.current);
    }
  }, [active, pull]);

  const failover = async () => {
    setFailoverBusy(true);
    await pull("scenario", "POST", { name: "region_failover" });
    toast.warning("Region failover injected — us-west degraded, rerouting to us-east");
    setFailoverBusy(false);
  };

  const [title, sub] = HERO[active];
  return (
    <main className="relative min-h-screen text-white" style={{ background: "#08090A" }} data-testid={`marketplace-${active}-page`}>
      <ParallaxSky />
      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <Link to="/marketplace" className="flex items-center gap-2.5" data-testid="mv3-back-link">
            <ArrowLeft size={16} className="text-gray-400" />
            <img src="/luchii-mark-circle.png" alt="Frasberg" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">Marketplace</span>
          </Link>
          <nav className="flex flex-wrap gap-1.5" data-testid="mv3-subnav">
            {PAGES.map(([k, label, Icon]) => (
              <Link key={k} to={`/marketplace/${k}`} data-testid={`mv3-tab-${k}`}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[13px] transition-colors ${active === k ? "border-cyan-400 bg-cyan-400/10 text-cyan-300" : "border-white/15 text-gray-300 hover:border-white/40"}`}>
                <Icon size={12} /> {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="relative z-10 mx-auto max-w-6xl px-5 py-12">
        <h1 className="font-display text-3xl font-700 tracking-tight sm:text-4xl" style={grad}>{title}</h1>
        <p className="mt-3 max-w-2xl text-[15px] text-gray-300">{sub}</p>
        <div className="mt-8">
          {active === "deploy" && <DeployPage regions={regions} />}
          {active === "evolution" && <EvolutionPage />}
          {active === "safety" && <SafetyPage />}
          {active === "regions" && <RegionsPage regions={regions} onFailover={failover} failoverBusy={failoverBusy} scenario={scenario} />}
        </div>
      </div>
    </main>
  );
}
