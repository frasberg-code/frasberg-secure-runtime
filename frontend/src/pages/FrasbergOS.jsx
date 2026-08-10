import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, Pause, StepForward, RotateCcw, Cpu, Activity } from "lucide-react";
import { ParallaxSky } from "../components/site/ParallaxSky";

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

function CognitionGraph({ nodes, edges, pulses }) {
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
        return (
          <g key={id} data-testid={`cog-node-${id}`}>
            <circle cx={p.x} cy={p.y} r={r + 7} fill="#00F0FF" opacity={act * 0.18} />
            <circle cx={p.x} cy={p.y} r={r} fill="#0d1418" stroke="#00F0FF" strokeWidth="1.4" strokeOpacity={0.35 + act * 0.65} />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fill="#EDEDED" fontSize="11" fontFamily="monospace">{Math.round(act * 100)}</text>
            <text x={p.x} y={p.y + r + 16} textAnchor="middle" fill="#8A8F98" fontSize="11.5">{p.label}</text>
          </g>
        );
      })}
    </svg>
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
  const timer = useRef(null);

  const call = useCallback(async (path, method = "GET") => {
    try {
      const r = await fetch(`${API}/os/${path}`, { method });
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

        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={() => setRunning(!running)} data-testid="os-run-btn"
            className={`${btn} ${running ? "border-emerald-400 text-emerald-300" : ""}`}>
            {running ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Run</>}
          </button>
          <button onClick={() => call("tick", "POST")} data-testid="os-step-btn" className={btn}><StepForward size={13} /> Step</button>
          <button onClick={() => { setRunning(false); call("reset", "POST"); }} data-testid="os-reset-btn" className={btn}><RotateCcw size={13} /> Reset</button>
        </div>

        {!state ? (
          <p className="mt-10 font-mono text-[13px] text-gray-400">Booting kernel…</p>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur lg:col-span-2" data-testid="os-graph-panel">
                <p className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.2em] text-gray-400"><Activity size={12} /> Cognition Graph v2 — node activations</p>
                <CognitionGraph nodes={state.nodes} edges={state.edges} pulses={state.pulses} />
              </div>
              <AgentTable agents={state.agents} />
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
