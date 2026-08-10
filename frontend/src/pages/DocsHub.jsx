import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, FileText, Menu, X } from "lucide-react";
import { ParallaxSky } from "../components/site/ParallaxSky";

const DOCS = {
  handbook: {
    title: "Developer Handbook",
    subtitle: "Everything you need to build, deploy and maintain agents on Frasberg",
    sections: [
      { h: "1. Introduction", p: ["Frasberg is a multi-region agent platform integrating GitHub, realtime execution, memory, and tooling. This handbook covers everything developers need to build, deploy, and maintain agents."] },
      { h: "2. Platform Components", p: ["Agent Runtime — executes agent code, provides memory, tools and realtime streams, replicated across regions.", "GitHub Integration — OAuth login, repo forking, agent sync and webhook ingestion.", "Region Mesh — secret replication, token distribution and automatic failover.", "Dashboard — agent management, repo linking, region status and logs."] },
      { h: "3. Building Agents", p: ["Agents are defined by a file at the repo root: agent.json or luchii.yaml."],
        code: `// agent.json
{
  "id": "agent-id",
  "name": "Luchii",
  "model": "luchii-1.0",
  "entrypoint": "src/index.ts",
  "capabilities": { "realtime": true, "vision": true, "audio": true },
  "env": { "FRASBERG_REGION": "us-west" }
}` },
      { h: "3.1 Entrypoint", p: ["Every agent exports a main function that receives input, tools, memory, realtime and env."],
        code: `export default async function main({ input, tools, memory }) {
  await memory.set("lastMessage", input);
  return \`Hello from Luchii! You said: \${input}\`;
}` },
      { h: "3.2 Tools, Memory & Realtime", p: ["Tools are defined in the agent file and invoked as tools.<name>(...args).", "Memory is a key-value API: memory.get(key), memory.set(key, value), memory.delete(key).", "Realtime agents stream events with realtime.stream(handler)."] },
      { h: "4. GitHub Workflows", p: ["Build workflow — runs the build pipeline on every push.", "Sync workflow — notifies Frasberg when agent.json, luchii.yaml or src/** change.", "Deploy workflow — deploys the agent when a release is published."] },
      { h: "5. Multi-Region Deployment", p: ["Regions: us-west, us-east, eu-central, ap-south.", "Secrets and installation tokens are replicated across the region mesh.", "If a region fails, agents reroute automatically, memory syncs and tokens refresh."] },
      { h: "6. Security", p: ["Secrets live in the Frasberg Secrets Manager — never in repos or the frontend.", "All webhooks are verified with HMAC SHA-256 signatures.", "GitHub permissions are minimal: contents, metadata, actions, deployments, pull requests, members."] },
      { h: "7. Troubleshooting", p: ["OAuth fails → check the callback URL and client secret.", "Webhooks silent → verify the webhook URL, secret and subscribed events.", "Repo not syncing → ensure agent.json or luchii.yaml exists at the repo root.", "Forking fails → the app needs Contents: Write permission."] },
    ],
  },
  whitepaper: {
    title: "Platform V1 Whitepaper",
    subtitle: "Architecture and design of the Frasberg multi-region agent platform",
    sections: [
      { h: "Abstract", p: ["Frasberg is a multi-region agent platform integrating GitHub repositories, realtime execution, memory, and tooling. This whitepaper describes the architecture, security model, region mesh, and agent runtime."] },
      { h: "1. Introduction", p: ["Frasberg enables developers to build intelligent agents backed by GitHub repos, a multi-region runtime, and secure integration. Agents live in repos, sync via push and PR events, and evolve through versioned changes."] },
      { h: "2. Architecture Overview", p: ["Multi-Region Runtime — agents run across multiple regions with automatic failover.", "GitHub Integration Layer — OAuth, repo forking, installation tokens and webhooks.", "Region Mesh — replicates secrets and tokens across regions.", "Agent Runtime — executes agent code with memory, tools and realtime capabilities."],
        code: `+-----------------------------------------------+
|              Frasberg Platform                |
|  Dashboard UI  <-->  Integration Layer        |
|            Agent Runtime (Multi-Region)       |
|   Execution Core | Realtime Engine            |
|   Memory Service | Tooling Engine             |
|          GitHub Integration Layer             |
|  OAuth | Webhook Processor | Repo Sync        |
|        Region Mesh & Secret Manager           |
|  Replication | Token Distribution | Failover  |
+-----------------------------------------------+` },
      { h: "3. Security Model", p: ["Secrets — stored in an encrypted Secrets Manager, never persisted to repos or logs.", "JWT Signing — the App private key signs GitHub App JWTs in memory.", "Webhook Verification — every webhook is validated with HMAC SHA-256.", "Tenant Isolation — every installation maps to exactly one tenant; no cross-tenant token reuse, repo access or agent sync."] },
      { h: "4. GitHub Integration", p: ["OAuth login links GitHub identity to Frasberg accounts.", "Repo forking clones starter repos into user or organization accounts.", "Agent sync reads agent.json / luchii.yaml on every push.", "CI/CD workflows trigger builds, syncs and deployments."] },
      { h: "5. Agent Runtime", p: ["Execution Core — sandboxed, region-aware, usage-tracked.", "Memory Service — tenant-scoped key-value memory with region replication.", "Tooling Engine — permission-scoped tool invocation.", "Realtime Engine — audio, vision and multimodal event streams."] },
      { h: "6. Region Mesh", p: ["Replication — secrets and installation tokens replicate over encrypted internal channels.", "Failover — downed regions reroute traffic automatically.", "Token Distribution — short-lived installation tokens are requested via signed JWTs and never written to disk."] },
      { h: "7. Conclusion", p: ["Frasberg V1 provides a secure, scalable, multi-region agent platform tightly integrated with GitHub — the foundation for self-maintaining software."] },
    ],
  },
};

export default function DocsHub() {
  const { doc } = useParams();
  const navigate = useNavigate();
  const active = DOCS[doc] ? doc : "handbook";
  const d = DOCS[active];
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="relative min-h-screen text-white" style={{ background: "#08090A" }} data-testid="docs-page">
      <ParallaxSky />
      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5" data-testid="docs-home-link">
            <ArrowLeft size={16} className="text-gray-400" />
            <img src="/luchii-mark-circle.png" alt="Frasberg Luchii" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">Developer Docs</span>
          </Link>
          <button className="sm:hidden" onClick={() => setMenuOpen((o) => !o)} aria-label="Docs menu" data-testid="docs-menu-toggle">
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex max-w-6xl gap-8 px-5 py-10">
        <aside className={`${menuOpen ? "block" : "hidden"} w-full shrink-0 sm:block sm:w-56`} data-testid="docs-sidebar">
          <p className="mb-3 font-mono text-[12.5px] uppercase tracking-[0.2em] text-gray-400">Developers</p>
          {[["handbook", "Developer Handbook", BookOpen], ["whitepaper", "V1 Whitepaper", FileText]].map(([key, label, Icon]) => (
            <button key={key} onClick={() => { navigate(`/developers/docs/${key}`); setMenuOpen(false); }} data-testid={`docs-nav-${key}`}
              className={`mb-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[14px] transition-colors ${active === key ? "bg-cyan-400/10 font-600 text-cyan-300" : "text-gray-300 hover:bg-white/[0.05]"}`}>
              <Icon size={15} /> {label}
            </button>
          ))}
          <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="text-[13px] font-600">Build with Luchii</p>
            <p className="mt-1 text-[12.5px] text-gray-400">Open the workspace and start your first agent.</p>
            <Link to="/chat?model=luchii-70b&agent=architect" className="mt-3 inline-block rounded-full bg-cyan-400 px-4 py-1.5 text-[12.5px] font-700 text-black" data-testid="docs-workspace-link">Open Workspace</Link>
          </div>
        </aside>

        <article className="min-w-0 flex-1" data-testid="docs-content">
          <h1 className="font-display text-3xl font-700 tracking-tight sm:text-4xl">{d.title}</h1>
          <p className="mt-2 text-[16px] text-gray-300">{d.subtitle}</p>
          <div className="mt-8 space-y-8">
            {d.sections.map((s) => (
              <section key={s.h}>
                <h2 className="text-lg font-700 text-cyan-300">{s.h}</h2>
                {s.p.map((line, i) => (
                  <p key={i} className="mt-2.5 text-[15px] leading-relaxed text-gray-300">{line}</p>
                ))}
                {s.code && (
                  <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-[12.5px] leading-relaxed text-cyan-100">{s.code}</pre>
                )}
              </section>
            ))}
          </div>
          <p className="mt-14 border-t border-white/10 pt-6 font-mono text-[12.5px] text-gray-500">© 2003–2026 Frasberg, Inc. · All rights reserved.</p>
        </article>
      </div>
    </main>
  );
}
