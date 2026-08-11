import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Moon, Sun, ArrowLeft, Gamepad2, Share2, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "../context/ThemeContext";
import Starfield from "../components/site/Starfield";
import Seo from "../components/site/Seo";
import Footer from "../components/site/Footer";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PlayGame() {
  const { theme, toggle } = useTheme();
  const { slug } = useParams();
  const [meta, setMeta] = useState(undefined);
  const [plays, setPlays] = useState(null);
  const counted = useRef(false);

  useEffect(() => {
    fetch(`${API}/builder/site/${slug}/meta`)
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        setMeta(m);
        if (m && !counted.current) {
          counted.current = true;
          fetch(`${API}/builder/site/${slug}/play`, { method: "POST" })
            .then((r) => r.json())
            .then((d) => setPlays(d.plays))
            .catch(() => setPlays(m.plays));
        }
      })
      .catch(() => setMeta(null));
  }, [slug]);

  const share = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    toast.success("Play link copied — share it anywhere");
  };

  return (
    <main className="relative z-10 min-h-screen bg-lux-bg text-lux-text" data-testid="play-page">
      <Seo title={`${meta?.title || "Play"} — Built with Luchii`} description="Play a game built with the Luchii Game Builder by Frasberg." />
      <div className="pointer-events-none absolute inset-0 opacity-40"><Starfield /></div>

      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/gallery" className="flex items-center gap-2.5" data-testid="play-back-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <img src="/frasberg-mark-circle.png" alt="Frasberg" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">Built with Luchii</span>
          </Link>
          <button onClick={toggle} aria-label="Toggle theme" data-testid="play-theme-toggle"
            className="grid h-10 w-10 place-items-center rounded-full border border-lux-border transition-colors hover:border-lux-accent hover:text-lux-accent">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      <div className="relative mx-auto max-w-5xl px-5 py-10 sm:px-8">
        {meta === undefined ? (
          <div className="grid place-items-center py-24"><Loader2 size={24} className="animate-spin text-lux-accent" /></div>
        ) : meta === null ? (
          <div className="rounded-2xl border border-lux-border bg-lux-surface/60 p-10 text-center" data-testid="play-not-found">
            <p className="font-display text-xl font-700">This build is no longer live</p>
            <Link to="/gallery" className="mt-4 inline-block rounded-full bg-lux-accent px-6 py-3 text-sm font-600 text-lux-bg">Explore the gallery</Link>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full border border-lux-accent/50 text-lux-accent"><Gamepad2 size={18} /></span>
                <div>
                  <h1 className="font-display text-2xl font-700 tracking-tight sm:text-3xl" data-testid="play-title">{meta.title}</h1>
                  <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-lux-text2" data-testid="play-counter">
                    {plays === null ? "…" : plays} play{plays === 1 ? "" : "s"} · built with Luchii
                  </p>
                </div>
              </div>
              <button onClick={share} data-testid="play-share-btn"
                className="inline-flex items-center gap-2 rounded-full bg-lux-accent px-5 py-2.5 text-sm font-600 text-lux-bg transition-transform hover:-translate-y-0.5">
                <Share2 size={14} /> Share play link
              </button>
            </div>

            <iframe
              src={`${API}/p/${slug}`}
              title={meta.title}
              sandbox="allow-scripts allow-modals allow-popups"
              data-testid="play-iframe"
              className="mt-6 h-[72vh] w-full rounded-2xl border border-lux-border bg-white"
            />

            <div className="mt-8 rounded-2xl border border-lux-border bg-lux-surface/60 p-6 text-center">
              <Sparkles size={18} className="mx-auto text-lux-accent" />
              <p className="mt-2 font-display text-lg font-600">Make your own game in minutes</p>
              <Link to="/game-builder" data-testid="play-build-cta"
                className="mt-4 inline-block rounded-full bg-lux-text px-6 py-3 text-sm font-600 text-lux-bg transition-transform hover:-translate-y-0.5">
                Open the Luchii Game Builder
              </Link>
            </div>
          </>
        )}
      </div>
      <Footer />
    </main>
  );
}
