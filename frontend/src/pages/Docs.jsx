import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Copy, Check, KeyRound, Zap, ShieldCheck, Radio } from "lucide-react";

const BASE = "https://api.frasberg.com/v1";

const SNIPPETS = {
  curl: `curl ${BASE}/chat/completions \\
  -H "Authorization: Bearer $FRASBERG_LLM_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "luchii-6-plus",
    "messages": [{"role": "user", "content": "Hello Luchii"}],
    "stream": true
  }'`,
  python: `# pip install openai — Frasberg is OpenAI-compatible
from openai import OpenAI

client = OpenAI(
    base_url="${BASE}",
    api_key="luchii-sk-...",  # your Frasberg key
)

stream = client.chat.completions.create(
    model="luchii-6-plus",
    messages=[{"role": "user", "content": "Hello Luchii"}],
    stream=True,
)
for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="")`,
  javascript: `// npm i openai — works with Vercel AI SDK & LangChain too
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${BASE}",
  apiKey: process.env.FRASBERG_LLM_KEY,
});

const stream = await client.chat.completions.create({
  model: "luchii-6-plus",
  messages: [{ role: "user", content: "Hello Luchii" }],
  stream: true,
});
for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}`,
  embeddings: `curl ${BASE}/embeddings \\
  -H "Authorization: Bearer $FRASBERG_LLM_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "luchii-6-embed", "input": "Intelligence, harmonized."}'`,
};

const MODELS = [
  { id: "luchii-6-plus", kind: "chat", desc: "Flagship frontier reasoning — deepest cognition tier" },
  { id: "luchii-6-mini", kind: "chat", desc: "Fast, balanced everyday reasoning" },
  { id: "luchii-6-embed", kind: "embed", desc: "384-dim text embeddings for search & RAG" },
  { id: "luchii-70b / 7b / 1b / 200m", kind: "chat", desc: "Legacy tier names — fully supported aliases" },
];

const Code = ({ id, code }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div className="relative rounded-2xl border border-lux-border bg-[#0b0e14]">
      <button onClick={copy} data-testid={`docs-copy-${id}`}
        className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/75 hover:text-white">
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
      <pre className="overflow-x-auto p-5 font-mono text-[13.5px] leading-relaxed text-[#c8d3f5]">{code}</pre>
    </div>
  );
};

export default function Docs() {
  const [lang, setLang] = useState("curl");
  return (
    <main className="min-h-screen bg-lux-bg text-lux-text">
      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" data-testid="docs-home-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <img src="/frasberg-mark-circle.png" alt="Frasberg" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">Luchii API Docs</span>
          </Link>
          <Link to="/dashboard" data-testid="docs-get-key"
            className="rounded-full bg-lux-text px-5 py-2 text-sm font-500 text-lux-bg transition-transform hover:-translate-y-0.5">
            Get API Key
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8" data-testid="docs-page">
        <p className="font-mono text-[13.5px] uppercase tracking-[0.3em] text-lux-accent">Frasberg — Verified LLM Provider</p>
        <h1 className="mt-3 font-display text-4xl font-700 tracking-tighter sm:text-5xl">Call Luchii in 60 seconds.</h1>
        <p className="mt-4 max-w-2xl text-lux-text2">
          Frasberg is an OpenAI-compatible provider with Bearer authentication and SSE streaming.
          Point any OpenAI SDK, Vercel AI SDK, or LangChain at <span className="font-mono text-lux-text">{BASE}</span> and it just works.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3" data-testid="docs-feature-cards">
          {[{ icon: KeyRound, t: "Bearer auth", d: "Authorization: Bearer luchii-sk-…" },
            { icon: Radio, t: "SSE streaming", d: "stream: true — chat.completion.chunk" },
            { icon: ShieldCheck, t: "Verified provider", d: "/.well-known discovery manifests" }].map((c) => (
            <div key={c.t} className="rounded-2xl border border-lux-border bg-lux-surface p-5">
              <c.icon size={18} className="text-lux-accent" />
              <p className="mt-2 font-display font-600">{c.t}</p>
              <p className="mt-1 font-mono text-[13px] text-lux-text2">{c.d}</p>
            </div>
          ))}
        </div>

        <section className="mt-14">
          <h2 className="flex items-center gap-2 font-display text-2xl font-600"><KeyRound size={18} className="text-lux-accent" /> 1. Get your key</h2>
          <p className="mt-2 text-sm text-lux-text2">
            Create a free account and mint a <span className="font-mono text-lux-text">luchii-sk</span> key from the{" "}
            <Link to="/dashboard" className="text-lux-accent underline">Developer Dashboard</Link>.
            Every key ships with <span className="text-lux-text">2,500 trial tokens</span> — then top up with credit packs at{" "}
            <span className="text-lux-text">half the price of other providers</span> (from $5 / 10k tokens), or subscribe for unmetered usage.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="flex items-center gap-2 font-display text-2xl font-600"><Zap size={18} className="text-lux-accent" /> 2. Make your first call</h2>
          <div className="mt-4 flex gap-2">
            {["curl", "python", "javascript"].map((l) => (
              <button key={l} onClick={() => setLang(l)} data-testid={`docs-lang-${l}`}
                className={`rounded-full px-4 py-1.5 font-mono text-[13px] transition-colors ${lang === l ? "bg-lux-text text-lux-bg" : "border border-lux-border text-lux-text2 hover:text-lux-text"}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="mt-4"><Code id={lang} code={SNIPPETS[lang]} /></div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-600">3. Embeddings</h2>
          <div className="mt-4"><Code id="embeddings" code={SNIPPETS.embeddings} /></div>
        </section>

        <section className="mt-10" data-testid="docs-models-table">
          <h2 className="font-display text-2xl font-600">Models</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-lux-border">
            {MODELS.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-3 border-b border-lux-border bg-lux-surface px-5 py-3.5 last:border-0">
                <span className="font-mono text-sm text-lux-text">{m.id}</span>
                <span className={`rounded-full px-2 py-0.5 font-mono text-[13.5px] uppercase tracking-widest ${m.kind === "embed" ? "bg-emerald-400/15 text-emerald-400" : "bg-lux-accent/15 text-lux-accent"}`}>{m.kind}</span>
                <span className="flex-1 text-right text-[13px] text-lux-text2">{m.desc}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10" data-testid="docs-legal">
          <h2 className="font-display text-2xl font-600">Legal & compliance</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/legal?doc=partner" data-testid="docs-legal-partner" className="rounded-full border border-lux-border px-4 py-2 text-sm text-lux-text2 hover:border-lux-accent hover:text-lux-text">Partner API Agreement</Link>
            <Link to="/legal?doc=sla" data-testid="docs-legal-sla" className="rounded-full border border-lux-border px-4 py-2 text-sm text-lux-text2 hover:border-lux-accent hover:text-lux-text">Provider SLA</Link>
            <Link to="/legal?doc=compliance" data-testid="docs-legal-compliance" className="rounded-full border border-lux-border px-4 py-2 text-sm text-lux-text2 hover:border-lux-accent hover:text-lux-text">Compliance Packet</Link>
          </div>
        </section>

        <section className="mt-10" data-testid="docs-discovery">
          <h2 className="font-display text-2xl font-600">Provider verification</h2>
          <p className="mt-2 text-sm text-lux-text2">Standard discovery documents used by registries, routers and agent frameworks:</p>
          <ul className="mt-3 space-y-1.5 font-mono text-[13.5px] text-lux-accent">
            <li><a className="hover:underline" href="/.well-known/frasberg-provider.json" target="_blank" rel="noreferrer">/.well-known/frasberg-provider.json</a></li>
            <li><a className="hover:underline" href="/.well-known/provider-manifest.json" target="_blank" rel="noreferrer">/.well-known/provider-manifest.json</a></li>
            <li><a className="hover:underline" href="/api/.well-known/openapi.yaml" target="_blank" rel="noreferrer">/.well-known/openapi.yaml</a></li>
            <li><a className="hover:underline" href="/api/v1/models" target="_blank" rel="noreferrer">GET /v1/models</a></li>
            <li><a className="hover:underline" href="/api/v1/provider" target="_blank" rel="noreferrer">GET /v1/provider</a></li>
          </ul>
        </section>
      </div>
    </main>
  );
}
