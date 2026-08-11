import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Terminal, GraduationCap, Award, Cpu, ShieldCheck, GitBranch, Network, Globe, Database } from "lucide-react";
import { ParallaxSky } from "../components/site/ParallaxSky";

const card = "rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur";
const grad = { backgroundImage: "linear-gradient(90deg,#4A6CF7,#00D1FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" };

const CONCEPTS = [
  [Cpu, "Cognition Graph v2", "Deterministic P→I→R→D→A pipelines with formal node and edge semantics."],
  [ShieldCheck, "Safety Suite v3", "Membrane, hinge logic, Classifier v3 and the ethics engine — governed autonomy."],
  [GitBranch, "Evolution Engine v3", "Validated mutation pipelines, PR generation, rollback and lineage tracking."],
  [Network, "ACP Collaboration", "Signed multi-agent messaging, delegation governance and consensus clusters."],
  [Globe, "Region Routing", "AIM v2 health-aware routing, failover orchestration and federation."],
  [Database, "MemoryFS v4", "Episodic and semantic stores with region-aware snapshot replication."],
];

const COURSE = [
  ["Foundation", "Weeks 1–2", ["Kernel architecture overview", "Cognition Graph v2 fundamentals", "Safety Suite v3 concepts", "MemoryFS v4 deep dive", "Region routing basics", "ACP collaboration model"]],
  ["Cognition", "Weeks 3–4", ["Node semantics", "Edge types & invariants", "Determinism guarantees", "Graph optimization", "Safety propagation", "Evolution constraints"]],
  ["Safety", "Weeks 5–6", ["Membrane protocol", "Hinge logic", "Classifier v3", "Ethics engine", "Unsafe action prevention", "Delegation safety"]],
  ["Evolution", "Weeks 7–8", ["Mutation system", "PR generation", "Rollback mechanics", "Lineage tracking", "Evolution governance"]],
  ["Deployment", "Weeks 9–10", ["Region orchestration", "Failover logic", "Autoscaling", "Federation", "Multi-region deployment", "Production hardening"]],
];

const CERT = [
  ["Complete Kernel v4 Foundations", "Learn the core architecture: cognition, safety, evolution, ACP, region routing and MemoryFS through the official training modules."],
  ["Pass the Cognition Graph v2 Exam", "Demonstrate mastery of perception, interpretation, reasoning, decision and action flows, including safety and evolution overlays."],
  ["Complete Hands-On Agent Lab", "Build, test and deploy a fully governed agent using the Kernel v4 SDK and pass all safety and determinism checks."],
  ["Pass the Multi-Region Deployment Exam", "Show proficiency in AIM v2 routing, failover, autoscaling, federation and global mesh orchestration."],
  ["Submit Final Capstone Project", "Deliver a production-ready agent with full cognition graph documentation, safety compliance and a multi-region deployment strategy."],
  ["Earn Kernel v4 Certification", "Receive official accreditation and gain access to advanced FrasbergAI development tracks and partner-level privileges."],
];

export default function DevPortal() {
  return (
    <main className="relative min-h-screen text-white" style={{ background: "#08090A" }} data-testid="devportal-page">
      <ParallaxSky />
      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5" data-testid="devportal-home-link">
            <ArrowLeft size={16} className="text-gray-400" />
            <img src="/frasberg-mark-circle.png" alt="Frasberg" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">Developer Portal</span>
          </Link>
          <nav className="flex gap-2 font-mono text-[12px]">
            <Link to="/developers/docs" className="rounded-full border border-white/15 px-3.5 py-1.5 text-gray-300 hover:border-cyan-400 hover:text-cyan-300" data-testid="devportal-docs-link">Docs</Link>
            <Link to="/playground" className="rounded-full border border-white/15 px-3.5 py-1.5 text-gray-300 hover:border-cyan-400 hover:text-cyan-300" data-testid="devportal-playground-link">Playground</Link>
          </nav>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-14">
        <h1 className="font-display text-4xl font-700 tracking-tight sm:text-5xl" style={grad}>FrasbergOS Kernel v4</h1>
        <p className="mt-2 font-display text-xl text-white/90">The Cognition-Native Operating System</p>
        <p className="mt-4 max-w-2xl text-[15px] text-gray-300">Build autonomous agents that think, evolve, collaborate and deploy safely.</p>

        <div className={`${card} mt-10`} data-testid="devportal-quickstart">
          <p className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.2em] text-gray-400"><Terminal size={12} /> Getting started</p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-black/60 p-4 font-mono text-[13px] leading-relaxed text-cyan-200">{`npm install @frasberg/kernel

import { Agent } from "@frasberg/kernel";

const agent = new Agent({
  name: "My-Agent",
  model: "luchii-6-mini",
  safety: 92
});

// deterministic cognition cycle
agent.cognition.perception.observe(input);
kernel.safety.enforce(agent, decision);`}</pre>
          <p className="mt-3 font-mono text-[12.5px] text-gray-400">CLI: <span className="text-cyan-200">frasberg build agent.json · frasberg deploy agent.json · frasberg simulate agent.json</span></p>
        </div>

        <h2 className="mt-14 flex items-center gap-2 font-display text-lg font-700"><BookOpen size={17} className="text-cyan-300" /> Core concepts</h2>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="devportal-concepts">
          {CONCEPTS.map(([Icon, t, body]) => (
            <div key={t} className={card}>
              <p className="flex items-center gap-2 text-[14.5px] font-700"><Icon size={15} className="text-cyan-300" /> {t}</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-gray-300">{body}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-14 flex items-center gap-2 font-display text-lg font-700"><GraduationCap size={17} className="text-cyan-300" /> Training course — 10 weeks</h2>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5" data-testid="devportal-course">
          {COURSE.map(([phase, weeks, items], i) => (
            <div key={phase} className={card} data-testid={`course-phase-${i}`}>
              <p className="font-mono text-[11.5px] uppercase tracking-wide text-cyan-300">{weeks}</p>
              <p className="mt-1 text-[15px] font-700">{phase}</p>
              <ul className="mt-3 space-y-1.5">
                {items.map((it) => <li key={it} className="text-[12.5px] leading-snug text-gray-300">• {it}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <h2 className="mt-14 flex items-center gap-2 font-display text-lg font-700"><Award size={17} className="text-cyan-300" /> Certification track</h2>
        <div className="mt-5 space-y-0" data-testid="devportal-certification">
          {CERT.map(([t, body], i) => (
            <div key={t} className="relative border-l border-white/15 pb-7 pl-7" data-testid={`cert-step-${i + 1}`}>
              <span className="absolute -left-[14px] top-0 grid h-7 w-7 place-items-center rounded-full border border-cyan-400/50 bg-[#0d1418] font-mono text-[11px] text-cyan-300">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-[14.5px] font-700">{t}</p>
              <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-gray-300">{body}</p>
            </div>
          ))}
        </div>

        <div className={`${card} mt-8 flex flex-wrap items-center justify-between gap-4`} data-testid="devportal-cta">
          <div>
            <p className="text-[15px] font-700">Ready to build on Kernel v4?</p>
            <p className="mt-1 text-[13.5px] text-gray-300">Open the cognition playground, read the handbook, or deploy your first agent.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/playground" className="rounded-full px-5 py-2 text-[13.5px] font-700 text-black transition-opacity hover:opacity-85" style={{ backgroundImage: "linear-gradient(90deg,#4A6CF7,#00D1FF)" }}>Open Playground</Link>
            <Link to="/marketplace/deploy" className="rounded-full border border-white/20 px-5 py-2 text-[13.5px] font-600 text-gray-200 hover:border-cyan-400 hover:text-cyan-300">Deploy an agent</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
