import { useState } from "react";
import { motion } from "framer-motion";
import { Monitor, Smartphone, ArrowRight } from "lucide-react";
import Starfield from "./Starfield";
import ChatDemo from "./ChatDemo";
import { Overline } from "./Reveal";

const HEADLINE = ["Intelligence", "that learned", "to listen."];

function MaskLine({ children, delay }) {
  return (
    <span className="block overflow-hidden">
      <motion.span
        className="block"
        initial={{ y: "110%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export default function Hero() {
  const [view, setView] = useState("web");

  return (
    <section id="top" className="relative overflow-hidden pb-24 pt-32 sm:pt-40">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <Starfield />
      </div>
      <div
        className="pointer-events-none absolute left-1/2 top-24 h-[420px] w-[820px] -translate-x-1/2 rounded-full blur-[120px]"
        style={{ background: "var(--lux-glow)" }}
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <img
              src="/luchii-logo.webp"
              alt="Frasberg Luchii"
              data-testid="hero-logo"
              className="h-28 w-28 animate-float rounded-full sm:h-32 sm:w-32"
              style={{ boxShadow: "0 0 60px var(--lux-glow)" }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-lux-border px-4 py-1.5"
          >
            <span className="h-1.5 w-1.5 animate-pulseGlow rounded-full bg-lux-accent" />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-lux-text2">
              Luchii v12 · Constellation Layer live
            </span>
          </motion.div>

          <h1 className="font-display text-5xl font-700 leading-[0.95] tracking-tighter text-lux-text sm:text-6xl lg:text-7xl">
            {HEADLINE.map((line, i) => (
              <MaskLine key={i} delay={0.25 + i * 0.12}>
                {i === 2 ? <span className="accent-grad text-glow">{line}</span> : line}
              </MaskLine>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.7 }}
            className="mt-7 max-w-xl text-base leading-relaxed text-lux-text2 sm:text-lg"
          >
            A multi-tier transformer family by Frasberg — from the 200M draft
            model to 70B frontier reasoning. Where others process data, Luchii
            perceives meaning.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <a
              href="#api"
              data-testid="hero-cta-primary"
              className="group inline-flex items-center gap-2 rounded-full bg-lux-accent px-6 py-3 text-sm font-600 text-lux-bg transition-transform duration-200 hover:-translate-y-0.5"
            >
              Start building
              <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
            </a>
            <a
              href="#models"
              data-testid="hero-cta-secondary"
              className="inline-flex items-center gap-2 rounded-full border border-lux-border px-6 py-3 text-sm font-500 text-lux-text transition-colors duration-200 hover:border-lux-accent"
            >
              Explore the models
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="mt-10 flex items-center gap-6 font-mono text-xs text-lux-text2"
          >
            <span>4 tiers</span><span className="h-3 w-px bg-lux-border" />
            <span>32K context</span><span className="h-3 w-px bg-lux-border" />
            <span>Drop-in REST API</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.55, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-4 flex items-center justify-between">
            <Overline>Try it now</Overline>
            <div className="inline-flex rounded-full border border-lux-border p-1" data-testid="view-toggle">
              <button
                onClick={() => setView("web")}
                data-testid="view-toggle-web"
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors duration-200 ${
                  view === "web" ? "bg-lux-text text-lux-bg" : "text-lux-text2"
                }`}
              >
                <Monitor size={13} /> Web
              </button>
              <button
                onClick={() => setView("mobile")}
                data-testid="view-toggle-mobile"
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors duration-200 ${
                  view === "mobile" ? "bg-lux-text text-lux-bg" : "text-lux-text2"
                }`}
              >
                <Smartphone size={13} /> Mobile
              </button>
            </div>
          </div>

          <motion.div
            layout
            transition={{ type: "spring", stiffness: 200, damping: 26 }}
            className={`mx-auto ${view === "mobile" ? "max-w-[340px]" : "w-full"}`}
          >
            <div className={view === "mobile" ? "rounded-[2.2rem] border border-lux-border p-2" : ""}>
              <div className="h-[500px]">
                <ChatDemo compact={view === "mobile"} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
