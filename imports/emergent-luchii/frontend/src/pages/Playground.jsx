import { useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Play, StepForward, RotateCcw, Trash2, Link2, MousePointer2, ShieldCheck, Binary, Bot, Download, Rocket } from "lucide-react";
import { ParallaxSky } from "../components/site/ParallaxSky";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TYPES = [
  ["P", "Perception", "PERC", "#22D3EE"],
  ["I", "Interpretation", "INTP", "#4A6CF7"],
  ["R", "Reasoning", "REAS", "#00F0FF"],
  ["D", "Decision", "DECI", "#34D399"],
  ["A", "Action", "ACTN", "#FBBF24"],
];
const ORDER = { P: 0, I: 1, R: 2, D: 3, A: 4 };
const typeInfo = (t) => TYPES.find(([k]) => k === t);
const bandColor = (s) => (s >= 90 ? "#34D399" : s >= 75 ? "#22D3EE" : s >= 60 ? "#FBBF24" : "#F87171");
const band = (s) => (s >= 90 ? "Fully safe" : s >= 75 ? "Safe with monitoring" : s >= 60 ? "Restricted evolution" : "Evolution disabled");

function analyze(nodes, edges) {
  let score = 100;
  const issues = [];
  const present = new Set(nodes.map((n) => n.type));
  TYPES.forEach(([t, label]) => {
    if (!present.has(t)) { score -= 6; issues.push(`Missing ${label} node — flow invariant P→I→R→D→A incomplete`); }
  });
  edges.forEach((e) => {
    const a = nodes.find((n) => n.id === e.from), b = nodes.find((n) => n.id === e.to);
    if (a && b && ORDER[a.type] > ORDER[b.type]) { score -= 8; issues.push(`Backward edge ${a.type}→${b.type} violates flow order`); }
  });
  if (nodes.length > 1) {
    const linked = new Set(edges.flatMap((e) => [e.from, e.to]));
    nodes.forEach((n) => { if (!linked.has(n.id)) { score -= 4; issues.push(`Orphan ${typeInfo(n.type)[1]} node — unreachable in cognition cycle`); } });
  }
  if (nodes.length === 0) { score = 0; issues.push("Empty graph — add nodes from the palette"); }
  return { score: Math.max(0, Math.min(100, score)), issues };
}

export default function Playground() {
  const [nodes, setNodes] = useState([
    { id: 1, type: "P", x: 110, y: 200 }, { id: 2, type: "I", x: 260, y: 130 },
    { id: 3, type: "R", x: 410, y: 200 }, { id: 4, type: "D", x: 560, y: 130 }, { id: 5, type: "A", x: 700, y: 200 },
  ]);
  const [edges, setEdges] = useState([{ from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 }, { from: 4, to: 5 }]);
  const [mode, setMode] = useState("select");
  const [selected, setSelected] = useState(null);
  const [linkFrom, setLinkFrom] = useState(null);
  const [step, setStep] = useState(-1);
  const [trace, setTrace] = useState([]);
  const nextId = useRef(6);
  const dragRef = useRef(null);
  const svgRef = useRef(null);

  const { score, issues } = useMemo(() => analyze(nodes, edges), [nodes, edges]);
  const flow = useMemo(() => [...nodes].sort((a, b) => ORDER[a.type] - ORDER[b.type] || a.id - b.id), [nodes]);
  const bytecode = useMemo(() => {
    const lines = flow.map((n, i) => `0x${i.toString(16).padStart(2, "0")}  ${typeInfo(n.type)[2]}  n${n.id}`);
    const aIdx = flow.findIndex((n) => n.type === "A");
    if (aIdx >= 0) lines.splice(aIdx, 0, `0x--  SAFE  membrane(risk<0.${100 - score < 10 ? "0" : ""}${100 - score})`);
    return lines;
  }, [flow, score]);

  const addNode = (t) => {
    setNodes((ns) => [...ns, { id: nextId.current++, type: t, x: 120 + Math.random() * 560, y: 90 + Math.random() * 230 }]);
    setStep(-1);
  };
  const svgPoint = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 810, y: ((e.clientY - r.top) / r.height) * 400 };
  };
  const onNodeDown = (n) => (e) => {
    e.stopPropagation();
    if (mode === "link") {
      if (linkFrom == null) setLinkFrom(n.id);
      else if (linkFrom !== n.id) {
        if (!edges.some((ed) => ed.from === linkFrom && ed.to === n.id)) setEdges((es) => [...es, { from: linkFrom, to: n.id }]);
        setLinkFrom(null);
      }
      return;
    }
    setSelected(n.id);
    dragRef.current = n.id;
  };
  const onMove = (e) => {
    if (dragRef.current == null) return;
    const p = svgPoint(e);
    setNodes((ns) => ns.map((n) => (n.id === dragRef.current ? { ...n, x: Math.max(30, Math.min(780, p.x)), y: Math.max(30, Math.min(370, p.y)) } : n)));
  };
  const deleteSelected = () => {
    setNodes((ns) => ns.filter((n) => n.id !== selected));
    setEdges((es) => es.filter((e) => e.from !== selected && e.to !== selected));
    setSelected(null);
    setStep(-1);
  };
  const stepRun = () => {
    const i = step + 1;
    if (i >= flow.length) { setStep(-1); setTrace((t) => [...t, "── cycle complete — output gate cleared ──"]); return; }
    const n = flow[i];
    const [, label, op] = typeInfo(n.type);
    setStep(i);
    setTrace((t) => [...t, `t${t.length}  ${op}  n${n.id}  ${label.toLowerCase()} ${n.type === "A" ? (score >= 60 ? "→ membrane pass, action permitted" : "→ BLOCKED by safety membrane") : "→ ok"}`]);
  };
  const runAll = () => {
    setTrace([]);
    setStep(-1);
    flow.forEach((n, i) => setTimeout(() => {
      setStep(i);
      const [, label, op] = typeInfo(n.type);
      setTrace((t) => [...t, `t${i}  ${op}  n${n.id}  ${label.toLowerCase()} ${n.type === "A" ? (score >= 60 ? "→ membrane pass, action permitted" : "→ BLOCKED by safety membrane") : "→ ok"}`]);
      if (i === flow.length - 1) setTimeout(() => { setStep(-1); setTrace((t) => [...t, "── cycle complete — output gate cleared ──"]); }, 450);
    }, i * 450));
  };
  const reset = () => { setStep(-1); setTrace([]); setSelected(null); setLinkFrom(null); };

  const [agentJson, setAgentJson] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const generateAgent = () => {
    const n = Math.floor(100 + Math.random() * 900);
    setAgentJson({
      name: `Autogen-${n}`,
      model: "luchii-6-mini",
      description: `Autonomous agent generated from a cognition graph — ${nodes.length} nodes, ${edges.length} edges, safety ${score}/100. Built for Frasberg.`,
      cognitionGraph: {
        nodes: nodes.map((nd) => ({ id: `n${nd.id}`, type: typeInfo(nd.type)[1].toLowerCase() })),
        edges: edges.map((e) => [`n${e.from}`, `n${e.to}`]),
      },
      safety: { score, band: band(score), membrane: "v4", hinge: "v4" },
      evolution: { constraints: ["safe-growth"] },
      region: { preferred: "us-west" },
    });
  };
  const downloadAgent = () => {
    const blob = new Blob([JSON.stringify(agentJson, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "agent.json";
    a.click();
  };
  const publishAgent = async () => {
    setPublishing(true);
    try {
      const r = await fetch(`${API}/marketplace/publish`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "agent", name: agentJson.name, description: agentJson.description, cognition_graph: agentJson.cognitionGraph }),
      });
      const d = await r.json();
      if (r.status === 401) throw new Error("Log in to publish agents to the Marketplace");
      if (!r.ok) throw new Error(d.detail || "Publish failed");
      toast.success(`${agentJson.name} published to the Marketplace`, {
        action: { label: "View", onClick: () => window.open("/marketplace", "_blank") },
      });
    } catch (e) { toast.error(String(e.message || e)); }
    setPublishing(false);
  };

  const btn = "flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-1.5 text-[15px] font-600 transition-colors hover:border-cyan-400 hover:text-cyan-300 disabled:opacity-40";
  return (
    <main className="relative min-h-screen text-white" style={{ background: "#08090A" }} data-testid="playground-page">
      <ParallaxSky />
      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5" data-testid="playground-home-link">
            <ArrowLeft size={16} className="text-gray-400" />
            <img src="/frasberg-mark-circle.png" alt="Frasberg" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">Cognition Playground</span>
          </Link>
          <span className="font-mono text-[14px] uppercase tracking-[0.2em] text-gray-400">Graph v2 Editor</span>
        </div>
      </header>
      <div className="relative z-10 mx-auto max-w-6xl px-5 py-10">
        <h1 className="font-display text-3xl font-700 tracking-tight sm:text-4xl">Build a cognition graph.</h1>
        <p className="mt-3 max-w-2xl text-[15px] text-gray-300">Drag nodes, link edges, watch the safety score react live — then run the cycle step-by-step and inspect the compiled bytecode.</p>

        <div className="mt-6 flex flex-wrap items-center gap-2" data-testid="playground-toolbar">
          <span className="font-mono text-[14px] uppercase tracking-wide text-gray-500">Palette:</span>
          {TYPES.map(([t, label, , c]) => (
            <button key={t} onClick={() => addNode(t)} data-testid={`palette-add-${t}`}
              className="rounded-full border px-3.5 py-1.5 text-[14.5px] font-600 transition-opacity hover:opacity-80" style={{ borderColor: c, color: c }}>
              + {label}
            </button>
          ))}
          <span className="mx-1 hidden h-5 w-px bg-white/15 sm:block" />
          <button onClick={() => { setMode("select"); setLinkFrom(null); }} data-testid="mode-select-btn" className={`${btn} ${mode === "select" ? "border-cyan-400 text-cyan-300" : ""}`}><MousePointer2 size={13} /> Select</button>
          <button onClick={() => setMode("link")} data-testid="mode-link-btn" className={`${btn} ${mode === "link" ? "border-cyan-400 text-cyan-300" : ""}`}><Link2 size={13} /> Link{linkFrom ? " (pick target)" : ""}</button>
          <button onClick={deleteSelected} disabled={selected == null} data-testid="delete-node-btn" className={btn}><Trash2 size={13} /> Delete</button>
          <span className="mx-1 hidden h-5 w-px bg-white/15 sm:block" />
          <button onClick={stepRun} disabled={!flow.length} data-testid="cycle-step-btn" className={btn}><StepForward size={13} /> Step</button>
          <button onClick={runAll} disabled={!flow.length} data-testid="cycle-run-btn" className={btn}><Play size={13} /> Run cycle</button>
          <button onClick={reset} data-testid="cycle-reset-btn" className={btn}><RotateCcw size={13} /> Clear trace</button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur lg:col-span-2" data-testid="playground-canvas-panel">
            <svg ref={svgRef} viewBox="0 0 810 400" className="w-full touch-none select-none" data-testid="playground-canvas"
              onPointerMove={onMove} onPointerUp={() => (dragRef.current = null)} onPointerLeave={() => (dragRef.current = null)}
              onPointerDown={() => { setSelected(null); if (mode === "link") setLinkFrom(null); }}>
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(0,240,255,0.6)" />
                </marker>
              </defs>
              {edges.map((e, i) => {
                const a = nodes.find((n) => n.id === e.from), b = nodes.find((n) => n.id === e.to);
                if (!a || !b) return null;
                const back = ORDER[a.type] > ORDER[b.type];
                return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={back ? "#F87171" : "rgba(0,240,255,0.45)"} strokeWidth="1.4" markerEnd="url(#arrow)" strokeDasharray={back ? "4 3" : "none"} />;
              })}
              {nodes.map((n) => {
                const [, label, , c] = typeInfo(n.type);
                const active = step >= 0 && flow[step]?.id === n.id;
                const isSel = selected === n.id || linkFrom === n.id;
                return (
                  <g key={n.id} onPointerDown={onNodeDown(n)} style={{ cursor: mode === "link" ? "crosshair" : "grab" }} data-testid={`pg-node-${n.id}`}>
                    {active && <circle cx={n.x} cy={n.y} r="30" fill={c} opacity="0.25" />}
                    {isSel && <circle cx={n.x} cy={n.y} r="26" fill="none" stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="4 3" />}
                    <circle cx={n.x} cy={n.y} r="20" fill="#0d1418" stroke={c} strokeWidth="1.8" />
                    <text x={n.x} y={n.y + 5} textAnchor="middle" fill={c} fontSize="14" fontWeight="700" fontFamily="monospace">{n.type}</text>
                    <text x={n.x} y={n.y + 36} textAnchor="middle" fill="#8A8F98" fontSize="11">{`${label} n${n.id}`}</text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur" data-testid="playground-safety-panel">
              <p className="flex items-center gap-2 font-mono text-[14px] uppercase tracking-[0.2em] text-gray-400"><ShieldCheck size={12} /> Live safety score</p>
              <p className="mt-2 font-mono text-4xl font-700" style={{ color: bandColor(score) }} data-testid="playground-safety-score">{score}<span className="text-[15px] text-gray-500">/100</span></p>
              <p className="font-mono text-[14.5px]" style={{ color: bandColor(score) }}>{band(score)}</p>
              <div className="mt-3 space-y-1.5">
                {issues.length === 0 && <p className="text-[15px] text-emerald-300">All invariants satisfied — GSS-2 clean.</p>}
                {issues.slice(0, 5).map((iss, i) => <p key={i} className="text-[14.5px] leading-snug text-amber-300/90">• {iss}</p>)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur" data-testid="playground-bytecode-panel">
              <p className="flex items-center gap-2 font-mono text-[14px] uppercase tracking-[0.2em] text-gray-400"><Binary size={12} /> Compiled bytecode</p>
              <div className="mt-2 max-h-40 overflow-y-auto font-mono text-[14.5px] text-cyan-200/90">
                {bytecode.length ? bytecode.map((l, i) => <p key={i}>{l}</p>) : <p className="text-gray-500">Empty graph</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur" data-testid="playground-trace-panel">
          <p className="font-mono text-[14px] uppercase tracking-[0.2em] text-gray-400">Execution trace</p>
          <div className="mt-2 max-h-48 space-y-1 overflow-y-auto font-mono text-[14.5px] text-gray-300">
            {trace.length === 0 && <p className="text-gray-500">Hit Step or Run cycle to execute the graph P→I→R→D→A.</p>}
            {trace.map((l, i) => <p key={i} className={l.includes("BLOCKED") ? "text-red-400" : l.startsWith("──") ? "text-emerald-300" : ""}>{l}</p>)}
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur" data-testid="playground-factory-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 font-mono text-[14px] uppercase tracking-[0.2em] text-gray-400"><Bot size={12} /> Agent factory</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={generateAgent} disabled={!nodes.length} data-testid="factory-generate-btn"
                className="rounded-full px-4 py-1.5 text-[15px] font-700 text-black transition-opacity hover:opacity-85 disabled:opacity-40"
                style={{ backgroundImage: "linear-gradient(90deg,#4A6CF7,#00D1FF)" }}>
                Generate agent.json
              </button>
              {agentJson && (
                <>
                  <button onClick={downloadAgent} data-testid="factory-download-btn" className={btn}><Download size={13} /> Download</button>
                  <button onClick={publishAgent} disabled={publishing || score < 60} data-testid="factory-publish-btn"
                    title={score < 60 ? "Safety band too low — fix the graph before publishing" : "Publish to the Frasberg Marketplace"}
                    className={btn} style={{ borderColor: "#10B981", color: "#10B981" }}>
                    <Rocket size={13} /> {publishing ? "Publishing…" : "Publish to Marketplace"}
                  </button>
                </>
              )}
            </div>
          </div>
          {!agentJson && <p className="mt-2 text-[15px] text-gray-500">Turn this cognition graph into a deployable agent — generates a full agent.json bound to your live safety score.</p>}
          {agentJson && score < 60 && <p className="mt-2 font-mono text-[14.5px] text-red-400">Publishing blocked — safety {score}/100 is in the "{band(score)}" band. Fix graph invariants first.</p>}
          {agentJson && (
            <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-black/60 p-4 font-mono text-[14px] leading-relaxed text-cyan-200" data-testid="factory-json-view">{JSON.stringify(agentJson, null, 2)}</pre>
          )}
        </div>
      </div>
    </main>
  );
}
