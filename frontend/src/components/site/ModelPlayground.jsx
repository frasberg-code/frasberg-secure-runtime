import { useState, useRef } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import Reveal, { Overline } from "./Reveal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TIERS = [
  { id: "luchii-1b", label: "Luchii 1B", tag: "General reasoning" },
  { id: "luchii-7b", label: "Luchii 7B", tag: "Technical depth" },
  { id: "luchii-70b", label: "Luchii 70B", tag: "Frontier intelligence" },
];

export const ModelPlayground = () => {
  const [prompt, setPrompt] = useState("");
  const [out, setOut] = useState({});
  const [busy, setBusy] = useState(false);
  const runId = useRef(0);

  async function streamTier(tier, p, id) {
    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ message: p, session_id: null, model: tier.id }),
      });
      if (!res.ok || !res.body) throw new Error();
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const d = JSON.parse(line.slice(5));
            if (d.delta && runId.current === id) {
              setOut((o) => ({ ...o, [tier.id]: (o[tier.id] || "") + d.delta }));
            }
          } catch {}
        }
      }
    } catch {
      if (runId.current === id) setOut((o) => ({ ...o, [tier.id]: (o[tier.id] || "") || "Tier busy — try again." }));
    }
  }

  async function run() {
    const p = prompt.trim();
    if (!p || busy) return;
    const id = ++runId.current;
    setBusy(true);
    setOut({});
    await Promise.all(TIERS.map((t) => streamTier(t, p, id)));
    setBusy(false);
  }

  return (
    <section className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8" data-testid="model-playground">
      <Reveal>
        <Overline>Playground — same prompt, three minds</Overline>
        <h2 className="mt-5 max-w-2xl font-display text-3xl font-700 tracking-tighter sm:text-4xl">
          Try the tiers <span className="text-lux-accent">side by side.</span>
        </h2>
        <p className="mt-4 max-w-xl text-lux-text2">One question, answered live by Luchii 1B, 7B and 70B — watch the depth scale.</p>
      </Reveal>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder='Ask anything — e.g. "Explain black holes in two sentences"'
          data-testid="playground-input"
          className="w-full rounded-full border border-lux-border bg-lux-surface px-6 py-3.5 text-sm outline-none focus:border-lux-accent"
        />
        <button onClick={run} disabled={busy || !prompt.trim()} data-testid="playground-run-btn"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-lux-accent px-7 py-3.5 text-sm font-600 text-lux-bg transition-transform hover:-translate-y-0.5 disabled:opacity-40">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {busy ? "Thinking…" : "Compare"}
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {TIERS.map((t) => (
          <div key={t.id} className="flex flex-col rounded-3xl border border-lux-border bg-lux-surface/60 p-5" data-testid={`playground-col-${t.id}`}>
            <div className="flex items-center justify-between border-b border-lux-border pb-3">
              <p className="font-display text-sm font-700 tracking-tight">{t.label}</p>
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-lux-accent">{t.tag}</span>
            </div>
            <div className="mt-3 min-h-[140px] flex-1 whitespace-pre-wrap text-[13px] leading-relaxed text-lux-text2">
              {out[t.id] || (busy ? <Loader2 size={14} className="animate-spin text-lux-accent" /> : "Awaiting your prompt…")}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
