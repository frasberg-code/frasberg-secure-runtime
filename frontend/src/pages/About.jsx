import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Moon, Sun, ArrowLeft, Compass, Target, Users, Leaf, Shield, Globe2 } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import Starfield from "../components/site/Starfield";
import Footer from "../components/site/Footer";
import Reveal, { Overline } from "../components/site/Reveal";

const PILLARS = [
  {
    icon: Compass,
    title: "Vision",
    body: "A world where intelligence is harmonized — where every person, team and institution can reach for reasoning that resonates. Frasberg exists to make advanced intelligence feel less like a tool and more like a trusted counterpart.",
  },
  {
    icon: Target,
    title: "Mission",
    body: "To design, train and steward the Luchii model family — a multi-tier continuum from 200M to 70B — and deliver it through an API that any builder can adopt in minutes, backed by the Guardian Mesh for balance, harmony and integrity.",
  },
  {
    icon: Users,
    title: "Culture",
    body: "We are craftspeople of the Constellation Layer. Small teams, deep ownership, long horizons. We debate in the open, decide with evidence, and ship with pride. Every voice at Frasberg carries weight — the best argument wins, not the loudest.",
  },
  {
    icon: Leaf,
    title: "Sustainability",
    body: "Intelligence should not cost the Earth. Our tiered architecture routes each request to the smallest capable model, cutting energy per token dramatically. We invest in efficient training, renewable compute partnerships and transparent reporting.",
  },
  {
    icon: Shield,
    title: "Integrity & Safety",
    body: "The Guardian Mesh is not a feature — it is a covenant. Every ruling, every response, every API call passes through layered checks for balance, harmony and integrity. We publish our safety posture and hold ourselves to it publicly.",
  },
  {
    icon: Globe2,
    title: "Global Stewardship",
    body: "Frasberg, Inc. serves builders across every continent. We believe access to capable intelligence is a lever for human progress, and we price, license and localize the Luchii family so no serious builder is left outside the constellation.",
  },
];

const TIMELINE = [
  { year: "2003", text: "Frasberg, Inc. is founded — decades before the model era, as a studio obsessed with systems that think." },
  { year: "2019", text: "The Constellation research program begins: multi-tier intelligence as a continuum, not a monolith." },
  { year: "2024", text: "The Guardian Mesh is formalized — balance, harmony, integrity as enforceable properties." },
  { year: "2025", text: "Luchii 200M · 1B · 7B · 70B reach internal parity targets across reasoning benchmarks." },
  { year: "2026", text: "Luchii v12 launches publicly with the Developer Gateway, the AI World Court, and Continuum L12." },
];

const VALUES = [
  "Reasoning that resonates",
  "The smallest capable model wins",
  "Safety is a covenant, not a checkbox",
  "Long horizons, deep ownership",
  "Access is a lever for progress",
  "Ship with pride",
];

export default function About() {
  const { theme, toggle } = useTheme();

  return (
    <main className="relative z-10 min-h-screen bg-lux-bg text-lux-text" data-testid="about-page">
      <div className="pointer-events-none absolute inset-0 opacity-50"><Starfield /></div>

      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" data-testid="about-home-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <img src="/luchii-logo.webp" alt="Frasberg Luchii" className="h-8 w-8 rounded-full ring-1 ring-lux-accent/40" />
            <span className="font-display text-lg font-700 tracking-tight">Frasberg, Inc.</span>
          </Link>
          <button onClick={toggle} aria-label="Toggle theme" data-testid="about-theme-toggle"
            className="grid h-10 w-10 place-items-center rounded-full border border-lux-border transition-colors hover:border-lux-accent hover:text-lux-accent">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-5 pb-10 pt-20 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Overline>About the company</Overline>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-700 tracking-tighter sm:text-5xl lg:text-6xl">
            Frasberg, Inc.
            <span className="block accent-grad">Intelligence, Harmonized.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-lux-text2 sm:text-lg">
            Frasberg is the company behind Luchii — a multi-tier intelligence model
            family spanning 200M, 1B, 7B and 70B parameters. We build reasoning
            systems governed by the Guardian Mesh and delivered through a single,
            drop-in Developer Gateway.
          </p>
        </motion.div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.06}>
              <div className="h-full rounded-2xl border border-lux-border bg-lux-surface p-8" data-testid={`about-pillar-${p.title.toLowerCase().split(" ")[0]}`}>
                <span className="grid h-11 w-11 place-items-center rounded-full border border-lux-accent/40 text-lux-accent" style={{ boxShadow: "0 0 26px var(--lux-glow)" }}>
                  <p.icon size={19} />
                </span>
                <h2 className="mt-5 font-display text-xl font-600 tracking-tight text-lux-text">{p.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-lux-text2">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative border-y border-lux-border bg-lux-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <Reveal>
            <Overline>Our story</Overline>
            <h2 className="mt-4 font-display text-3xl font-700 tracking-tighter sm:text-4xl">Two decades toward the Constellation</h2>
          </Reveal>
          <div className="mt-12 space-y-0">
            {TIMELINE.map((t, i) => (
              <Reveal key={t.year} delay={i * 0.05}>
                <div className="flex gap-6 border-l border-lux-border pb-10 pl-6 last:pb-0 sm:gap-10" data-testid={`about-timeline-${t.year}`}>
                  <span className="-ml-[31px] mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-lux-accent" style={{ boxShadow: "0 0 14px var(--lux-glow)" }} />
                  <span className="w-16 shrink-0 font-mono text-sm text-lux-accent">{t.year}</span>
                  <p className="text-sm leading-relaxed text-lux-text2 sm:text-base">{t.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <Reveal>
          <Overline>What we hold true</Overline>
          <h2 className="mt-4 font-display text-3xl font-700 tracking-tighter sm:text-4xl">Values of the house</h2>
        </Reveal>
        <div className="mt-10 flex flex-wrap gap-3" data-testid="about-values">
          {VALUES.map((v) => (
            <span key={v} className="rounded-full border border-lux-border bg-lux-surface px-5 py-2.5 font-mono text-xs text-lux-text2 transition-colors duration-200 hover:border-lux-accent hover:text-lux-text">
              {v}
            </span>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-16 rounded-2xl border border-lux-border bg-lux-surface p-10 text-center">
            <h3 className="font-display text-2xl font-700 tracking-tight sm:text-3xl">Build with the constellation</h3>
            <p className="mx-auto mt-3 max-w-md text-sm text-lux-text2">
              Generate an API key and put the Luchii family to work in minutes.
            </p>
            <Link to="/dashboard" data-testid="about-cta"
              className="mt-7 inline-block rounded-full bg-lux-text px-7 py-3 text-sm font-500 text-lux-bg transition-transform duration-200 hover:-translate-y-0.5">
              Get API Key
            </Link>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
