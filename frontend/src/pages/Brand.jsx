import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Moon, Sun, ArrowLeft, Download, Copy, Check } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { BRAND_COLORS } from "../data/content";

const LOGOS = [
  { label: "Primary (WEBP)", href: "/luchii-logo.webp" },
  { label: "512px PNG", href: "/favicon-512.png" },
  { label: "192px PNG", href: "/favicon-192.png" },
  { label: "OG image", href: "/og-image.png" },
];

function Swatch({ c }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(c.hex); } catch {}
    setCopied(true); toast.success(`${c.hex} copied`); setTimeout(() => setCopied(false), 1400);
  };
  return (
    <button onClick={copy} data-testid={`swatch-${c.hex}`}
      className="group overflow-hidden rounded-2xl border border-lux-border text-left transition-transform hover:-translate-y-1">
      <div className="h-24 w-full" style={{ background: c.hex }} />
      <div className="flex items-center justify-between p-4">
        <div>
          <p className="font-500 text-lux-text">{c.name}</p>
          <p className="font-mono text-xs text-lux-text2">{c.hex} · {c.use}</p>
        </div>
        {copied ? <Check size={15} className="text-lux-accent" /> : <Copy size={15} className="text-lux-text2 opacity-0 transition-opacity group-hover:opacity-100" />}
      </div>
    </button>
  );
}

export default function Brand() {
  const { theme, toggle } = useTheme();
  return (
    <main className="relative z-10 min-h-screen bg-lux-bg text-lux-text">
      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" data-testid="brand-home-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <img src="/luchii-logo.webp" alt="Frasberg Luchii" className="h-8 w-8 rounded-full ring-1 ring-lux-accent/40" />
            <span className="font-display text-lg font-700 tracking-tight">Brand</span>
          </Link>
          <button onClick={toggle} aria-label="Toggle theme" data-testid="brand-theme-toggle"
            className="grid h-10 w-10 place-items-center rounded-full border border-lux-border transition-colors hover:border-lux-accent hover:text-lux-accent">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
        <div className="flex items-center gap-4" data-testid="brand-spin-logos">
          <img src="/luchii-logo.webp" alt="Luchii" className="h-14 w-14 rounded-full ring-1 ring-lux-accent/40" />
          <img src="/frasberg-emblem.png" alt="Frasberg AI" className="h-14 w-14 rounded-full" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-700 tracking-tighter sm:text-5xl">Brand Kit</h1>
        <p className="mt-3 max-w-xl text-lux-text2">The Luchii by Frasberg identity system — logo, palette, and type.</p>

        {/* Logo */}
        <section className="mt-14">
          <h2 className="font-display text-2xl font-600 tracking-tight">Logo</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="grid place-items-center rounded-2xl border border-lux-border bg-[#0d1013] p-12">
              <img src="/luchii-logo.webp" alt="Frasberg Luchii logo" className="h-44 w-44 rounded-full" style={{ boxShadow: "0 0 60px rgba(0,150,255,0.35)" }} />
            </div>
            <div className="flex flex-col justify-center gap-3">
              {LOGOS.map((l) => (
                <a key={l.href} href={l.href} download data-testid={`download-${l.label}`}
                  className="flex items-center justify-between rounded-xl border border-lux-border bg-lux-surface px-5 py-4 transition-colors hover:border-lux-accent">
                  <span className="text-sm text-lux-text">{l.label}</span>
                  <Download size={16} className="text-lux-text2" />
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Colors */}
        <section className="mt-16">
          <h2 className="font-display text-2xl font-600 tracking-tight">Colors</h2>
          <p className="mt-2 text-sm text-lux-text2">Tap any swatch to copy the hex.</p>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="brand-colors">
            {BRAND_COLORS.map((c) => <Swatch key={c.hex} c={c} />)}
          </div>
        </section>

        {/* Typography */}
        <section className="mt-16">
          <h2 className="font-display text-2xl font-600 tracking-tight">Typography</h2>
          <div className="mt-6 space-y-5">
            <div className="rounded-2xl border border-lux-border bg-lux-surface p-8">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-lux-accent">Display · Unbounded</span>
              <p className="mt-3 font-display text-4xl font-700 tracking-tighter">Intelligence, Harmonized.</p>
            </div>
            <div className="rounded-2xl border border-lux-border bg-lux-surface p-8">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-lux-accent">Body · Satoshi</span>
              <p className="mt-3 text-lg text-lux-text2">Where others process data, Luchii perceives meaning. A multi-tier intelligence for reasoning, clarity and synthesis.</p>
            </div>
            <div className="rounded-2xl border border-lux-border bg-lux-surface p-8">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-lux-accent">Mono · JetBrains Mono</span>
              <p className="mt-3 font-mono text-lg text-lux-text">luchii-70b · 32K ctx · bearer auth</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
