import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, ArrowLeft, Gavel, Loader2, Sparkles } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import Starfield from "../components/site/Starfield";
import { COURT_CASES } from "../data/content";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function Ruling({ text }) {
  const lines = text.split("\n").filter(Boolean);
  return (
    <div className="space-y-3" data-testid="court-ruling">
      {lines.map((line, i) => {
        const m = line.match(/^([A-Z ]+):\s*(.*)$/);
        if (m) {
          return (
            <p key={i}>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-lux-accent">{m[1]}</span>
              {m[2] && <span className="ml-2 text-lux-text">{m[2]}</span>}
            </p>
          );
        }
        return <p key={i} className="pl-1 text-sm text-lux-text2">{line}</p>;
      })}
    </div>
  );
}

export default function Court() {
  const { theme, toggle } = useTheme();
  const [input, setInput] = useState("");
  const [verdict, setVerdict] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState("");
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [verdict]);

  async function tryCase(text) {
    const c = (text ?? input).trim();
    if (!c || busy) return;
    setSubmitted(c);
    setInput("");
    setVerdict("");
    setBusy(true);
    try {
      const res = await fetch(`${API}/court`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: c }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();
        for (const part of parts) {
          const l = part.trim();
          if (!l.startsWith("data:")) continue;
          let d; try { d = JSON.parse(l.slice(5).trim()); } catch { continue; }
          if (d.delta) setVerdict((v) => v + d.delta);
        }
      }
    } catch {
      setVerdict("VERDICT: The court is momentarily in recess. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative z-10 min-h-screen bg-lux-bg text-lux-text">
      <div className="pointer-events-none absolute inset-0 opacity-50"><Starfield /></div>

      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" data-testid="court-home-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <img src="/luchii-logo.webp" alt="Frasberg Luchii" className="h-8 w-8 rounded-full ring-1 ring-lux-accent/40" />
            <span className="font-display text-lg font-700 tracking-tight">Luchii Court</span>
          </Link>
          <button onClick={toggle} aria-label="Toggle theme" data-testid="court-theme-toggle"
            className="grid h-10 w-10 place-items-center rounded-full border border-lux-border transition-colors hover:border-lux-accent hover:text-lux-accent">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      <div className="relative mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-lux-accent/50 text-lux-accent" style={{ boxShadow: "0 0 44px var(--lux-glow)" }}>
            <Gavel size={26} />
          </span>
          <h1 className="mt-6 font-display text-4xl font-700 tracking-tighter sm:text-5xl">The AI Court</h1>
          <p className="mx-auto mt-4 max-w-xl text-lux-text2">
            Bring a case before the Judge. Luchii weighs both sides through the
            Guardian Mesh — balance, harmony, integrity — and returns a ruling.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); tryCase(); }} className="mt-10">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="State your case… e.g. 'Should we ship the beta this Friday despite two open bugs?'"
            data-testid="court-input"
            rows={3}
            className="w-full resize-none rounded-2xl border border-lux-border bg-lux-surface p-5 text-sm outline-none focus:border-lux-accent"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {COURT_CASES.slice(0, 2).map((c) => (
                <button key={c} type="button" onClick={() => tryCase(c)} data-testid="court-sample"
                  className="rounded-full border border-lux-border px-3 py-1.5 text-xs text-lux-text2 transition-colors hover:border-lux-accent hover:text-lux-text">
                  {c.length > 40 ? c.slice(0, 40) + "…" : c}
                </button>
              ))}
            </div>
            <button type="submit" disabled={busy} data-testid="court-submit"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-lux-accent px-6 py-3 text-sm font-600 text-lux-bg transition-transform hover:-translate-y-0.5 disabled:opacity-40">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Gavel size={16} />} Rule on it
            </button>
          </div>
        </form>

        {(submitted || verdict) && (
          <div className="mt-10 space-y-4">
            {submitted && (
              <div className="rounded-2xl border border-lux-border bg-lux-surface/60 p-5">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-lux-text2">The case</span>
                <p className="mt-2 text-lux-text">{submitted}</p>
              </div>
            )}
            <div className="glass rounded-2xl p-6">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles size={15} className="text-lux-accent" />
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-lux-text2">Ruling of the Court</span>
              </div>
              {verdict ? <Ruling text={verdict} /> : <Loader2 size={18} className="animate-spin text-lux-text2" />}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </main>
  );
}
