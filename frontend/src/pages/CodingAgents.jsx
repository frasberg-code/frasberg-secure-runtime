import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Moon, Sun, ArrowLeft, Bot } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import Starfield from "../components/site/Starfield";
import Footer from "../components/site/Footer";
import Seo from "../components/site/Seo";
import Reveal, { Overline } from "../components/site/Reveal";

const AGENTS = [
  { name: "Luchii", slug: "architect", tier: "luchii-70b", role: "FRASBERG", desc: "Plans services, data models and APIs before a single line is written." },
  { name: "Luchii Builder", slug: "builder", tier: "luchii-7b", role: "Code generation", desc: "Writes production-ready TypeScript, Python and Go from plain instructions." },
  { name: "Luchii Reviewer", slug: "reviewer", tier: "luchii-7b", role: "Code review & refactor", desc: "Audits diffs, flags risks and proposes cleaner, safer implementations." },
  { name: "Luchii Debugger", slug: "debugger", tier: "luchii-1b", role: "Bug hunting & fixes", desc: "Traces stack traces to root cause and drafts the minimal fix, fast." },
];

export default function CodingAgents() {
  const { theme, toggle } = useTheme();

  return (
    <main className="console-dark relative z-10 min-h-screen bg-lux-bg text-lux-text" data-testid="coding-agents-page">
      <Seo
        title="AI Coding Agents — Luchii by Frasberg, Inc."
        description="Specialized Luchii coding agents that plan, write, review and debug code with you."
      />
      <div className="pointer-events-none absolute inset-0 opacity-50"><Starfield /></div>

      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" data-testid="coding-agents-home-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <img src="/luchii-mark-circle.png" alt="Frasberg Luchii" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">Luchii</span>
          </Link>
          <button onClick={toggle} aria-label="Toggle theme" data-testid="coding-agents-theme-toggle"
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
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-lux-accent/50 text-lux-accent" style={{ boxShadow: "0 0 44px var(--lux-glow)" }}>
            <Bot size={26} />
          </span>
          <h1 className="mt-6 font-display text-4xl font-700 tracking-tighter sm:text-5xl">AI Coding Agents</h1>
          <p className="mx-auto mt-4 max-w-xl text-lux-text2">
            Specialized coding modes of the Luchii family. Launch any agent in chat and it will
            plan, write, review and debug code with you.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/chat" data-testid="coding-agents-chat-cta"
              className="rounded-full bg-lux-text px-7 py-3 text-sm font-500 text-lux-bg transition-transform duration-200 hover:-translate-y-0.5">
              Open Luchii Chat
            </Link>
            <Link to="/luchii-code" data-testid="coding-agents-quickstart-cta"
              className="rounded-full border border-lux-border px-7 py-3 text-sm text-lux-text2 transition-colors hover:border-lux-accent hover:text-lux-text">
              Luchii Code quickstarts →
            </Link>
          </div>
        </motion.div>

        <Reveal delay={0.1}>
          <div className="mx-auto mt-16 max-w-3xl">
            <Overline>Luchii Coder</Overline>
            <h2 className="mt-3 font-display text-2xl font-700 tracking-tight sm:text-3xl">Agents that build with you</h2>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2" id="agents" data-testid="coding-agents-grid">
              {AGENTS.map((a) => (
                <div key={a.name} className="rounded-2xl border border-lux-border bg-lux-surface p-6" data-testid={`coding-agent-${a.slug}`}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-display text-lg font-600 tracking-tight">{a.name}</h3>
                    <span className="font-mono text-[10px] text-lux-accent">{a.tier}</span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-lux-text2">{a.role}</p>
                  <p className="mt-3 text-sm leading-relaxed text-lux-text2">{a.desc}</p>
                  <Link to={`/chat?model=${a.tier}&agent=${a.slug}`} data-testid={`launch-${a.slug}`}
                    className="mt-4 inline-block rounded-full border border-lux-border px-5 py-2 text-xs text-lux-text2 transition-colors hover:border-lux-accent hover:text-lux-text">
                    Launch in Chat →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
