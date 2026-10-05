import { Link } from "react-router-dom";
import { Moon, Sun, ArrowLeft, MessageSquare, Hammer, Gamepad2, Mic2, Brain, ShieldCheck, Code2, KeyRound, ArrowUpRight } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { ParallaxSky } from "../components/site/ParallaxSky";
import Seo from "../components/site/Seo";
import Footer from "../components/site/Footer";

const PRODUCTS = [
  { id: "chat", icon: MessageSquare, name: "Luchii Chat", to: "/chat", big: true,
    tag: "Multi-tier intelligence",
    desc: "Converse with the Luchii family — 200M to 70B — with unlimited long-term memory, attachments, live voice and image creation. Every reply is grounded by the Frasberg ontology and signed by the mesh." },
  { id: "builder", icon: Hammer, name: "Luchii Builder", to: "/website-builder", big: true,
    tag: "Websites · games · apps",
    desc: "Describe it in one sentence — Luchii writes the complete code and renders it live. Publish to the Gallery with one tap, remix anything, attach your own domain with Pro." },
  { id: "gallery", icon: Gamepad2, name: "Public Gallery", to: "/gallery",
    tag: "Playable builds",
    desc: "Every published build, instantly playable in the browser with live play counters and a weekly spotlight." },
  { id: "voice", icon: Mic2, name: "Sovereign Voice", to: "/chat",
    tag: "Self-hosted speech",
    desc: "Whisper-class speech-to-text, eight named Frasberg voices and full voice cloning — zero third-party voice APIs." },
  { id: "memory", icon: Brain, name: "Memory Vault", to: "/profile",
    tag: "Unlimited semantic memory",
    desc: "Luchii remembers everything that matters about you across every session. View, edit or delete any fact." },
  { id: "mesh", icon: ShieldCheck, name: "Luchii Mesh", to: "/dashboard",
    tag: "frasberg-secure-v1",
    desc: "Tamper-proof HMAC-signed responses, resilient auto-reconnect streaming and a standalone WebSocket layer." },
  { id: "code", icon: Code2, name: "Luchii Code", to: "/luchii-code",
    tag: "Coding intelligence",
    desc: "The 7B and 70B tiers tuned for real engineering — code, refactors and technical reasoning." },
  { id: "api", icon: KeyRound, name: "Developer API", to: "/dashboard",
    tag: "POST /v1/chat",
    desc: "Ship Luchii inside your own product with luchii-sk API keys, streaming responses and mesh signatures." },
];

export default function Software() {
  const { theme, toggle } = useTheme();
  return (
    <main className="relative z-10 min-h-screen bg-lux-bg text-lux-text" data-testid="software-page">
      <Seo title="Frasberg Software — everything Luchii ships" description="Luchii Chat, Builder, Gallery, Sovereign Voice, Memory Vault, Mesh and the Developer API — real products, live now." />
      <ParallaxSky />

      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" data-testid="software-back-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <img src="/luchii-mark-circle.png" alt="Frasberg" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">Frasberg Software</span>
          </Link>
          <button onClick={toggle} aria-label="Toggle theme" data-testid="software-theme-toggle"
            className="grid h-10 w-10 place-items-center rounded-full border border-lux-border transition-colors hover:border-lux-accent hover:text-lux-accent">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      <div className="relative mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <p className="font-mono text-[15px] uppercase tracking-[0.3em] text-lux-accent">Shipping, not slides</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-700 tracking-tighter sm:text-5xl lg:text-6xl">
          Everything Frasberg ships. All real. All live.
        </h1>
        <p className="mt-5 max-w-2xl text-lux-text2">
          Eight products running on sovereign infrastructure right now — tap any of them and use it this second.
        </p>

        <div className="mt-12 grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map((p) => (
            <Link key={p.id} to={p.to} data-testid={`software-card-${p.id}`}
              className={`group relative flex flex-col rounded-3xl border border-lux-border bg-lux-surface/60 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-lux-accent ${p.big ? "sm:col-span-2" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-full border border-lux-accent/40 text-lux-accent" style={{ boxShadow: "0 0 26px var(--lux-glow)" }}>
                  <p.icon size={18} />
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 px-2.5 py-1 font-mono text-[15.5px] uppercase tracking-wide text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live
                </span>
              </div>
              <h2 className="mt-5 font-display text-xl font-700 tracking-tight">{p.name}</h2>
              <p className="mt-1 font-mono text-[15.5px] uppercase tracking-[0.2em] text-lux-accent">{p.tag}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-lux-text2">{p.desc}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-[15px] font-600 text-lux-text transition-transform duration-200 group-hover:translate-x-1">
                Use it now <ArrowUpRight size={13} />
              </span>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
