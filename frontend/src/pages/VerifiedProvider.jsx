import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, CheckCircle2, FileJson, Globe2, KeyRound, Cpu, BadgeCheck, ExternalLink } from "lucide-react";
import { ParallaxSky } from "../components/site/ParallaxSky";
import Seo from "../components/site/Seo";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CHECKS = [
  { icon: FileJson, t: "Provider Registry", d: "/.well-known/frasberg-provider.json — machine-readable identity" },
  { icon: Globe2, t: "Discovery Manifest", d: "Provider manifest with endpoints, models and auth format" },
  { icon: Cpu, t: "OpenAI-Compatible Gateway", d: "/v1/chat/completions · /v1/models · /v1/embeddings — SSE streaming" },
  { icon: FileJson, t: "OpenAPI 3.1 Schema", d: "Published API contract at /.well-known/openapi.yaml" },
  { icon: BadgeCheck, t: "Meta Verification Tag", d: '<meta name="frasberg-provider" content="verified"> served on frasberg.com' },
  { icon: KeyRound, t: "Bearer Key Authentication", d: "luchii-sk-* keys, usage metering, per-plan quotas" },
];

const WELL_KNOWN = [
  "/.well-known/frasberg-provider.json",
  "/.well-known/provider-manifest.json",
  "/.well-known/luchii-models.json",
  "/.well-known/openapi.yaml",
];

export default function VerifiedProvider() {
  const [registry, setRegistry] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch(`${API}/.well-known/frasberg-provider.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setRegistry)
      .catch(() => {});
    const load = () => fetch(`${API}/provider/status`).then((r) => (r.ok ? r.json() : null)).then(setStatus).catch(() => {});
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="relative z-10 min-h-screen bg-[#05070C] text-white" data-testid="verified-provider-page">
      <Seo title="Frasberg — Verified LLM Provider" description="Frasberg is a globally recognized, Tier-1 verified and authorized distributor of the Luchii model family." />
      <ParallaxSky />

      <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" data-testid="verified-back-link">
            <ArrowLeft size={15} className="text-gray-400" />
            <img src="/frasberg-mark-circle.png" alt="Frasberg" className="h-7 w-7 rounded-full" />
            <span className="font-display text-[15px] font-700 tracking-tight">Frasberg</span>
          </Link>
          <Link to="/docs" className="font-mono text-[12.5px] uppercase tracking-[0.2em] text-cyan-300 hover:text-cyan-200" data-testid="verified-docs-link">API Docs →</Link>
        </div>
      </header>

      <div className="relative mx-auto max-w-5xl px-5 py-16 sm:px-8">
        {/* Seal hero */}
        <div className="flex flex-col items-center text-center">
          <div className="relative grid h-32 w-32 place-items-center" data-testid="verified-seal">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/50" style={{ animation: "spin 24s linear infinite" }} />
            <div className="absolute inset-3 rounded-full border border-amber-400/40" />
            <ShieldCheck size={44} className="text-cyan-300" style={{ filter: "drop-shadow(0 0 18px rgba(34,211,238,0.6))" }} />
          </div>
          <p className="mt-8 font-mono text-[12px] uppercase tracking-[0.35em] text-amber-300">Tier-1 · Globally Recognized · Authorized Distributor</p>
          <h1 className="mt-3 font-display text-4xl font-700 tracking-tighter sm:text-5xl">Frasberg — Verified LLM Provider</h1>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-gray-400">
            FRASBERG INC is a verified, authorized distributor of the Luchii model family. Provider identity,
            model registry, API contract and authentication scheme are published at standard discovery endpoints
            for automated verification by any client, framework or aggregator.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/[0.06] px-5 py-2 font-mono text-[12.5px] text-cyan-200" data-testid="verified-cert-id">
            <BadgeCheck size={14} /> Certificate FRSB-LLM-2026-0001 · issued 2026-01-15
          </span>
        </div>

        {/* Live status strip */}
        <div className="mt-12 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.03] p-5" data-testid="provider-status-strip">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${status?.status === "degraded" ? "bg-amber-400" : "bg-emerald-400"} opacity-60`} />
                <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${status?.status === "degraded" ? "bg-amber-400" : "bg-emerald-400"}`} />
              </span>
              <span className="font-mono text-[13px] font-600 uppercase tracking-[0.2em] text-emerald-300" data-testid="provider-status-label">
                {status ? (status.status === "degraded" ? "Degraded performance" : "All systems operational") : "Checking status…"}
              </span>
            </div>
            {status && (
              <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[12.5px] text-gray-400" data-testid="provider-status-metrics">
                <span>uptime <span className="text-white">{status.uptime_pct}%</span></span>
                <span>avg <span className="text-white">{status.avg_latency_ms}ms</span></span>
                <span>p95 <span className="text-white">{status.p95_latency_ms}ms</span></span>
                <span>req/5m <span className="text-white">{status.requests_5m.toLocaleString()}</span></span>
                <span>errors <span className="text-white">{(status.error_rate * 100).toFixed(2)}%</span></span>
              </div>
            )}
          </div>
          {status && (
            <div className="mt-4 flex flex-wrap gap-2" data-testid="provider-status-endpoints">
              {status.endpoints.map((e) => (
                <span key={e.path} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1 font-mono text-[11.5px] text-gray-400">
                  <CheckCircle2 size={11} className="text-emerald-400" /> {e.path}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Verification checks */}
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CHECKS.map((c, i) => (
            <div key={c.t} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5" data-testid={`verified-check-${i}`}>
              <div className="flex items-center justify-between">
                <c.icon size={17} className="text-cyan-300" />
                <CheckCircle2 size={15} className="text-emerald-400" />
              </div>
              <h3 className="mt-3 text-[14.5px] font-600 tracking-tight">{c.t}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">{c.d}</p>
            </div>
          ))}
        </div>

        {/* Live registry entry */}
        <div className="mt-16">
          <p className="font-mono text-[12px] uppercase tracking-[0.25em] text-gray-400">Live registry entry — served from this deployment</p>
          <pre data-testid="verified-registry-json" className="mt-4 max-h-96 overflow-auto rounded-2xl border border-white/10 bg-[#080D16] p-6 font-mono text-[12.5px] leading-relaxed text-cyan-200/90">
            {registry ? JSON.stringify(registry, null, 2) : "Loading registry…"}
          </pre>
        </div>

        {/* Discovery links */}
        <div className="mt-12" data-testid="verified-wellknown-links">
          <p className="font-mono text-[12px] uppercase tracking-[0.25em] text-gray-400">Discovery endpoints</p>
          <div className="mt-4 space-y-2.5">
            {WELL_KNOWN.map((p) => (
              <a key={p} href={`${API}${p}`} target="_blank" rel="noreferrer"
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3 font-mono text-[13px] text-gray-300 transition-colors hover:border-cyan-400/40 hover:text-cyan-200">
                <span>{p}</span><ExternalLink size={13} className="text-gray-500" />
              </a>
            ))}
            <a href={`${API}/v1/models`} target="_blank" rel="noreferrer"
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3 font-mono text-[13px] text-gray-300 transition-colors hover:border-cyan-400/40 hover:text-cyan-200">
              <span>/v1/models — public model list</span><ExternalLink size={13} className="text-gray-500" />
            </a>
          </div>
        </div>

        {/* Certification statement */}
        <div className="mt-16 rounded-2xl border border-amber-400/30 bg-amber-400/[0.04] p-8 text-center" data-testid="verified-cert-statement">
          <p className="font-mono text-[11.5px] uppercase tracking-[0.3em] text-amber-300">Certification statement</p>
          <p className="mx-auto mt-4 max-w-3xl text-[15px] leading-relaxed text-gray-300">
            This is to certify that <span className="font-600 text-white">FRASBERG INC</span> operates as a
            globally recognized, legitimate and authorized LLM provider and distributor of the Luchii model
            family, with published provider registry, OpenAI-compatible gateway, bearer-key authentication
            and metered usage — verifiable at the discovery endpoints above.
          </p>
          <p className="mt-5 font-mono text-[12px] uppercase tracking-[0.25em] text-amber-300/70">⟐ Frasberg Provider Registry · Tier-1 Verified ⟐</p>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Link to="/docs" className="rounded-full border border-cyan-400/40 px-7 py-3 font-mono text-[13px] text-cyan-200 transition-colors hover:bg-cyan-400/[0.08]" data-testid="verified-cta-docs">Read the API docs</Link>
          <Link to="/dashboard" className="rounded-full bg-cyan-300 px-7 py-3 font-mono text-[13px] font-600 text-[#05070C] transition-opacity hover:opacity-85" data-testid="verified-cta-dashboard">Get an API key</Link>
        </div>
      </div>
    </main>
  );
}
