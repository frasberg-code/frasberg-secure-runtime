import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, Pause, StepForward, RotateCcw, Cpu, Activity, Globe } from "lucide-react";
import { ParallaxSky } from "../components/site/ParallaxSky";
import { RegionMap, RegionCards } from "../components/site/RegionMesh";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LAYOUT = {
  percept: { x: 70, y: 240, label: "Perception" },
  ctx: { x: 205, y: 150, label: "Context" },
  mem: { x: 205, y: 340, label: "Memory Vault" },
  plan: { x: 340, y: 245, label: "Planner" },
  reason: { x: 475, y: 150, label: "Constellation" },
  safety: { x: 610, y: 245, label: "Safety Membrane" },
  tools: { x: 610, y: 85, label: "Tool Executor" },
  mutate: { x: 475, y: 340, label: "Mutation Classifier" },
  evolve: { x: 340, y: 415, label: "Evolution Engine" },
  out: { x: 740, y: 150, label: "Output Gate" },
};
const STATE_COLOR = { running: "#34D399", waiting: "#8A8F98", evolving: "#22D3EE", sandboxed: "#FBBF24" };
const SCENARIOS = [
  ["threat_surge", "Threat surge", "#F87171"],
  ["evolution_burst", "Evolution burst", "#22D3EE"],
  ["region_failover", "Region failover", "#FBBF24"],
];
const NODE_INFO = {
  percept: "Ingests multimodal frames — text, audio, vision — and normalizes them for the context assembler.",
  ctx: "Assembles working context from perception and memory under identity-membrane constraints.",
  mem: "MemoryFS v4 — episodic and semantic stores with cross-region replication.",
  plan: "Decomposes goals into cognition steps following the P→I→R→D→A flow invariant.",
  reason: "Constellation reasoning layer — deterministic decision core of Kernel v4.",
  safety: "Safety Suite v3 — hinge logic, Classifier v3 risk scoring and the GSS-2 membrane.",
  tools: "Sandboxed tool execution with side-effect auditing and delegation limits.",
  mutate: "Mutation Classifier — scores every evolution candidate against safety invariants.",
  evolve: "Evolution Engine v3 — validated improvement cycles with lineage checkpoints.",
  out: "Output Gate — final membrane check before any action leaves the kernel.",
};
const safetyColor = (s) => (s >= 90 ? "#34D399" : s >= 75 ? "#22D3EE" : s >= 60 ? "#FBBF24" : "#F87171");

function CognitionGraph({ nodes, edges, pulses, selected, onSelect }) {
  return (
    <svg viewBox="0 0 810 470" className="w-full" data-testid="cognition-graph">
      {edges.map(([a, b], i) => {
        const A = LAYOUT[a], B = LAYOUT[b];
        const hot = pulses.includes(i);
        return (
          <g key={i}>
            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={hot ? "#00F0FF" : "rgba(255,255,255,0.14)"} strokeWidth={hot ? 2 : 1} />
            {hot && (
              <circle r="3.5" fill="#00F0FF">
                <animateMotion dur="1.4s" repeatCount="indefinite" path={`M${A.x},${A.y} L${B.x},${B.y}`} />
              </circle>
            )}
          </g>
        );
      })}
      {Object.entries(LAYOUT).map(([id, p]) => {
        const act = nodes[id] ?? 0.3;
        const r = 13 + act * 11;
        const isSel = selected === id;
        return (
          <g key={id} data-testid={`cog-node-${id}`} onClick={() => onSelect(isSel ? null : id)} style={{ cursor: "pointer" }}>
            <circle cx={p.x} cy={p.y} r={r + 7} fill="#00F0FF" opacity={act * 0.18} />
            {isSel && <circle cx={p.x} cy={p.y} r={r + 5} fill="none" stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="4 3" />}
            <circle cx={p.x} cy={p.y} r={r} fill="#0d1418" stroke={isSel ? "#FBBF24" : "#00F0FF"} strokeWidth="1.4" strokeOpacity={0.35 + act * 0.65} />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fill="#EDEDED" fontSize="11" fontFamily="monospace">{Math.round(act * 100)}</text>
            <text x={p.x} y={p.y + r + 16} textAnchor="middle" fill="#8A8F98" fontSize="11.5">{p.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function NodeDetail({ id, state, onClose }) {
  const p = LAYOUT[id];
  const st = state.node_stats?.[id] || {};
  const act = state.nodes[id] ?? 0;
  const inbound = state.edges.filter(([, b]) => b === id).map(([a]) => LAYOUT[a].label);
  const outbound = state.edges.filter(([a]) => a === id).map(([, b]) => LAYOUT[b].label);
  return (
    <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/[0.04] p-4" data-testid="node-detail-panel">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[14.5px] font-700 text-amber-200">{p.label}</p>
        <button onClick={onClose} className="font-mono text-[12px] text-gray-400 hover:text-white" data-testid="node-detail-close">close ✕</button>
      </div>
      <p className="mt-1 text-[13.5px] leading-relaxed text-gray-300">{NODE_INFO[id]}</p>
      <div className="mt-3 flex flex-wrap gap-2 font-mono text-[12px]">
        <span className="rounded-full border border-cyan-400/40 px-3 py-1 text-cyan-200">activation {Math.round(act * 100)}%</span>
        <span className="rounded-full border px-3 py-1" style={{ borderColor: safetyColor(st.safety ?? 80), color: safetyColor(st.safety ?? 80) }}>safety {st.safety ?? "—"}/100</span>
        <span className="rounded-full border border-white/20 px-3 py-1 text-gray-300">traffic {st.traffic ?? 0} pulses</span>
        {st.last_pulse_tick != null && <span className="rounded-full border border-white/20 px-3 py-1 text-gray-300">last pulse t{st.last_pulse_tick}</span>}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 font-mono text-[12px] text-gray-400 sm:grid-cols-2">
        <p><span className="text-gray-500">in ←</span> {inbound.length ? inbound.join(", ") : "—"}</p>
        <p><span className="text-gray-500">out →</span> {outbound.length ? outbound.join(", ") : "—"}</p>
      </div>
    </div>
  );
}

function AgentTable({ agents }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur" data-testid="os-agents-panel">
      <p className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.2em] text-gray-400"><Cpu size={12} /> Agent processes</p>
      <div className="mt-3 space-y-3">
        {agents.map((a) => (
          <div key={a.pid} className="border-b border-white/[0.06] pb-3 last:border-b-0 last:pb-0" data-testid={`os-agent-${a.pid}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-mono text-[13px] text-white">{a.pid} · {a.name}</p>
              <span className="rounded-full border px-2 py-0.5 font-mono text-[11px]" style={{ borderColor: STATE_COLOR[a.state], color: STATE_COLOR[a.state] }}>{a.state}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-3 font-mono text-[11.5px] text-gray-400">
              <span className="flex flex-1 items-center gap-1.5">cpu
                <span className="h-1 flex-1 rounded-full bg-white/10"><span className="block h-1 rounded-full bg-cyan-400" style={{ width: `${a.cpu}%` }} /></span>
                {a.cpu}%
              </span>
              <span>{a.mem}MB</span>
              <span>{a.msgs} msgs</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FrasbergOS() {
  const [state, setState] = useState(null);
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState(null);
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
    if (running) timer.current = setInterval(() => call("tick", "POST"), 2000);
    return () => clearInterval(timer.current);
  }, [running, call]);

  const k = state?.kernel;
  const btn = "flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-1.5 text-[13px] font-600 transition-colors hover:border-cyan-400 hover:text-cyan-300";
  return (
    <main className="relative min-h-screen text-white" style={{ background: "#08090A" }} data-testid="frasbergos-page">
      <ParallaxSky />
      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5" data-testid="os-home-link">
            <ArrowLeft size={16} className="text-gray-400" />
            <img src="/luchii-mark-circle.png" alt="Frasberg" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">FrasbergOS</span>
          </Link>
          <span className="font-mono text-[12px] uppercase tracking-[0.2em] text-gray-400">AIM v2 Simulator</span>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-10">
        <h1 className="font-display text-3xl font-700 tracking-tight sm:text-4xl">Kernel v4 — Cognition Graph v2</h1>
        <p className="mt-3 max-w-2xl text-[15px] text-gray-300">Live simulation of the FrasbergOS multi-agent orchestration kernel — agent scheduling, cognition node activations and validated evolution cycles under the GSS-2 safety membrane.</p>

        {k && (
          <div className="mt-6 flex flex-wrap gap-2 font-mono text-[12px]" data-testid="os-kernel-chips">
            {[`Kernel ${k.version}`, `tick ${k.tick}`, k.scheduler, k.membrane, k.region, `load ${Math.round(k.load * 100)}%`, `up ${k.uptime_s}s`].map((c) => (
              <span key={c} className="rounded-full border border-cyan-400/30 bg-cyan-400/[0.06] px-3 py-1 text-cyan-200">{c}</span>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button onClick={() => setRunning(!running)} data-testid="os-run-btn"
            className={`${btn} ${running ? "border-emerald-400 text-emerald-300" : ""}`}>
            {running ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Run</>}
          </button>
          <button onClick={() => call("tick", "POST")} data-testid="os-step-btn" className={btn}><StepForward size={13} /> Step</button>
          <button onClick={() => { setRunning(false); setSelected(null); call("reset", "POST"); }} data-testid="os-reset-btn" className={btn}><RotateCcw size={13} /> Reset</button>
          <span className="mx-1 hidden h-5 w-px bg-white/15 sm:block" />
          <span className="font-mono text-[11.5px] uppercase tracking-wide text-gray-500">Inject scenario:</span>
          {SCENARIOS.map(([key, label, color]) => (
            <button key={key} onClick={() => { call("scenario", "POST", { name: key }); if (!running) setRunning(true); }}
              data-testid={`os-scenario-${key}`}
              className="rounded-full border px-3.5 py-1.5 text-[12.5px] font-600 transition-opacity hover:opacity-80"
              style={{ borderColor: color, color }}>
              {label}
            </button>
          ))}
        </div>

        {state?.scenario && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/[0.07] px-4 py-2.5" data-testid="os-scenario-banner">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            <span className="font-mono text-[13px] uppercase tracking-wide text-amber-200">
              {state.scenario.label} active — {state.scenario.remaining} tick{state.scenario.remaining === 1 ? "" : "s"} remaining
            </span>
          </div>
        )}

        {!state ? (
          <p className="mt-10 font-mono text-[13px] text-gray-400">Booting kernel…</p>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur lg:col-span-2" data-testid="os-graph-panel">
                <p className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.2em] text-gray-400"><Activity size={12} /> Cognition Graph v2 — node activations · click a node for details</p>
                <CognitionGraph nodes={state.nodes} edges={state.edges} pulses={state.pulses} selected={selected} onSelect={setSelected} />
                {selected && <NodeDetail id={selected} state={state} onClose={() => setSelected(null)} />}
              </div>
              <AgentTable agents={state.agents} />
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur" data-testid="os-mesh-panel">
              <p className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.2em] text-gray-400"><Globe size={12} /> AIM v2 — global mesh</p>
              <RegionMap regions={state.regions || []} />
              <div className="mt-2"><RegionCards regions={state.regions || []} /></div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur" data-testid="os-event-log">
              <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-gray-400">Kernel event stream</p>
              <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto font-mono text-[12.5px]">
                {state.events.length === 0 && <p className="text-gray-500">No events yet — hit Run or Step to advance the simulation.</p>}
                {state.events.map((e, i) => (
                  <p key={`${e.tick}-${i}`} className="text-gray-300"><span className="text-cyan-300/70">[t{e.tick}]</span> {e.text}</p>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
