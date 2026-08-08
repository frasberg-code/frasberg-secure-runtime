import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, ArrowLeft, ChevronDown, Cpu, Check } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import Starfield from "../components/site/Starfield";
import Footer from "../components/site/Footer";
import Seo from "../components/site/Seo";
import Reveal, { Overline } from "../components/site/Reveal";
import { ModelPlayground } from "../components/site/ModelPlayground";
import { MODELS } from "../data/content";

export default function AiModels() {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(MODELS[3]);
  const ddRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ddRef.current && !ddRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <main className="relative z-10 min-h-screen bg-lux-bg text-lux-text" data-testid="ai-models-page">
      <Seo
        title="Luchii Chat Models — AI Models by Frasberg, Inc."
        description="Explore the Luchii Chat Models by Frasberg, Inc. — a multi-tier multimodal foundation model family (200M · 1B · 7B · 70B) for conversational AI, reasoning, coding and enterprise intelligence."
      />
      <div className="pointer-events-none absolute inset-0 opacity-50"><Starfield /></div>

      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" data-testid="ai-models-home-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <img src="/luchii-mark.jpg" alt="Frasberg Luchii" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">AI Models</span>
          </Link>
          <button onClick={toggle} aria-label="Toggle theme" data-testid="ai-models-theme-toggle"
            className="grid h-10 w-10 place-items-center rounded-full border border-lux-border transition-colors hover:border-lux-accent hover:text-lux-accent">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      <section className="relative mx-auto max-w-5xl px-5 py-16 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <img src="/luchii-mark.jpg" alt="Luchii" data-testid="aimodels-spin-logo"
            className="mx-auto h-16 w-16 rounded-full ring-1 ring-lux-accent/50" style={{ boxShadow: "0 0 44px var(--lux-glow)" }} />
          <h1 className="mt-6 font-display text-4xl font-700 tracking-tighter sm:text-5xl">Luchii Chat Models</h1>
          <p className="mx-auto mt-4 max-w-xl text-lux-text2">
            Frasberg's family of proprietary multimodal foundation models. Pick a
            tier from the list to explore its specification.
          </p>
        </motion.div>

        <div className="mx-auto mt-12 max-w-xl" ref={ddRef}>
          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              data-testid="model-dropdown-trigger"
              className="flex w-full items-center justify-between rounded-2xl border border-lux-border bg-lux-surface px-6 py-4 text-left transition-colors hover:border-lux-accent"
            >
              <span>
                <span className="font-display text-lg font-600 tracking-tight">{selected.name}</span>
                <span className="ml-3 font-mono text-[11px] uppercase tracking-[0.2em] text-lux-accent">{selected.tier}</span>
              </span>
              <ChevronDown size={18} className={`text-lux-text2 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {open && (
                <motion.ul
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="glass absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-lux-border"
                  data-testid="model-dropdown-list"
                >
                  {MODELS.map((m) => (
                    <li key={m.id}>
                      <button
                        onClick={() => { setSelected(m); setOpen(false); }}
                        data-testid={`model-option-${m.id}`}
                        className={`flex w-full items-center justify-between px-6 py-3.5 text-left transition-colors hover:bg-lux-surface ${selected.id === m.id ? "text-lux-accent" : "text-lux-text"}`}
                      >
                        <span className="font-display font-600 tracking-tight">{m.name}</span>
                        <span className="flex items-center gap-3 font-mono text-xs text-lux-text2">
                          {m.tier}
                          {selected.id === m.id && <Check size={14} className="text-lux-accent" />}
                        </span>
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-8 rounded-2xl border border-lux-border bg-lux-surface p-8"
            data-testid="model-detail-card"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-2xl font-700 tracking-tight">{selected.name}</h2>
              <span className="font-mono text-xs text-lux-accent">{selected.id}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-lux-text2">{selected.blurb}</p>
            <Link
              to={`/chat?model=${selected.id}`}
              data-testid="model-try-chat-btn"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-lux-accent px-6 py-2.5 text-sm font-600 text-lux-bg transition-transform duration-200 hover:-translate-y-0.5"
            >
              Try {selected.name} in Chat →
            </Link>
            <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-lux-border bg-lux-border">
              <div className="bg-lux-bg p-5 text-center">
                <p className="font-display text-2xl font-700 accent-grad">{selected.params}</p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-lux-text2">Parameters</p>
              </div>
              <div className="bg-lux-bg p-5 text-center">
                <p className="font-display text-2xl font-700 accent-grad">{selected.ctx}</p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-lux-text2">Context</p>
              </div>
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-2 font-mono text-xs text-lux-text2">
              {selected.specs.map((s) => (
                <li key={s} className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-lux-accent" />{s}</li>
              ))}
            </ul>
          </motion.div>

          <Reveal delay={0.1}>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link to="/dashboard" data-testid="ai-models-cta"
                className="rounded-full bg-lux-text px-7 py-3 text-sm font-500 text-lux-bg transition-transform duration-200 hover:-translate-y-0.5">
                Get API Key
              </Link>
              <Link to="/luchii-code" data-testid="ai-models-code-link"
                className="rounded-full border border-lux-border px-7 py-3 text-sm text-lux-text2 transition-colors duration-200 hover:border-lux-accent hover:text-lux-text">
                Luchii →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <ModelPlayground />

      <Footer />
    </main>
  );
}
