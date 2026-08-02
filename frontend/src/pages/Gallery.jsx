import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, ArrowLeft, Globe, Gamepad2, AppWindow, ExternalLink, Play, Sparkles, GitFork, Trophy, Star } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import Starfield from "../components/site/Starfield";
import Seo from "../components/site/Seo";
import Footer from "../components/site/Footer";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TABS = [
  { id: "all", label: "All builds" },
  { id: "website", label: "Websites" },
  { id: "app", label: "Apps" },
  { id: "game", label: "Games" },
  { id: "landing", label: "Landing pages" },
];

export default function Gallery() {
  const { theme, toggle } = useTheme();
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState(null);
  const [board, setBoard] = useState(null);

  useEffect(() => {
    fetch(`${API}/builder/leaderboard`).then((r) => r.json()).then(setBoard).catch(() => {});
  }, []);

  useEffect(() => {
    const q = tab === "all" ? "" : `?type=${tab}`;
    fetch(`${API}/builder/gallery${q}`).then((r) => r.json()).then(setItems).catch(() => setItems([]));
  }, [tab]);

  return (
    <main className="relative z-10 min-h-screen bg-lux-bg text-lux-text" data-testid="gallery-page">
      <Seo title="Builder Gallery — Luchii by Frasberg" description="Explore websites and games built with the Luchii Website & Game Builders on Frasberg infrastructure." />
      <div className="pointer-events-none absolute inset-0 opacity-40"><Starfield /></div>

      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" data-testid="gallery-home-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <img src="/luchii-logo.webp" alt="Frasberg Luchii" className="h-8 w-8 rounded-full ring-1 ring-lux-accent/40" />
            <span className="font-display text-lg font-700 tracking-tight">Builder Gallery</span>
          </Link>
          <button onClick={toggle} aria-label="Toggle theme" data-testid="gallery-theme-toggle"
            className="grid h-10 w-10 place-items-center rounded-full border border-lux-border transition-colors hover:border-lux-accent hover:text-lux-accent">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      <div className="relative mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="text-center">
          <img src="/luchii-logo.webp" alt="Luchii" className="mx-auto h-16 w-16 rounded-full ring-1 ring-lux-accent/40" style={{ boxShadow: "0 0 44px var(--lux-glow)" }} />
          <h1 className="mt-6 font-display text-4xl font-700 tracking-tighter sm:text-5xl">Built with Luchii</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lux-text2">
            A public gallery of websites and games created with the Luchii Builders on Frasberg infrastructure.
            Explore, play, get inspired — then build your own.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link to="/website-builder" data-testid="gallery-cta-website"
              className="inline-flex items-center gap-2 rounded-full bg-lux-accent px-6 py-3 text-sm font-600 text-lux-bg transition-transform hover:-translate-y-0.5">
              <Globe size={15} /> Build a website
            </Link>
            <Link to="/game-builder" data-testid="gallery-cta-game"
              className="inline-flex items-center gap-2 rounded-full border border-lux-accent px-6 py-3 text-sm font-600 text-lux-accent transition-transform hover:-translate-y-0.5">
              <Gamepad2 size={15} /> Build a game
            </Link>
          </div>
        </div>

        <div className="mt-10 flex justify-center gap-2" data-testid="gallery-tabs">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} data-testid={`gallery-tab-${t.id}`}
              className={`rounded-full border px-5 py-2 text-sm transition-colors ${tab === t.id ? "border-lux-accent bg-lux-surface text-lux-text" : "border-lux-border text-lux-text2 hover:text-lux-text"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8 pb-16">
          {items === null ? (
            <p className="text-center font-mono text-xs uppercase tracking-[0.2em] text-lux-text2">Loading gallery…</p>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-lux-border bg-lux-surface/60 p-10 text-center" data-testid="gallery-empty">
              <Sparkles size={22} className="mx-auto text-lux-accent" />
              <p className="mt-3 font-display text-lg font-600">Nothing published here yet</p>
              <p className="mt-1 text-sm text-lux-text2">Be the first — build and publish with Luchii Pro.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="gallery-grid">
              {items.map((p) => (
                <div key={p.id} className="relative overflow-hidden rounded-2xl border border-lux-border bg-lux-surface/60 transition-transform hover:-translate-y-1" data-testid={`gallery-card-${p.slug}`}>
                  {p.featured && (
                    <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-lux-accent px-2.5 py-1 font-mono text-[9px] font-600 uppercase tracking-wide text-lux-bg" data-testid={`gallery-featured-${p.slug}`}>
                      <Star size={10} /> Featured
                    </span>
                  )}
                  <div className="relative h-44 overflow-hidden border-b border-lux-border bg-white">
                    <iframe
                      src={`${process.env.REACT_APP_BACKEND_URL}/api/p/${p.slug}`}
                      title={p.title}
                      sandbox="allow-scripts"
                      loading="lazy"
                      scrolling="no"
                      className="pointer-events-none absolute left-0 top-0 h-[400%] w-[400%] origin-top-left scale-[0.25] border-0"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate font-display text-base font-600 tracking-tight">{p.title}</p>
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-lux-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-lux-text2">
                        {p.type === "game" ? <Gamepad2 size={11} /> : p.type === "app" ? <AppWindow size={11} /> : <Globe size={11} />} {p.type}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {p.type === "game" ? (
                          <Link to={`/play/${p.slug}`} data-testid={`gallery-play-${p.slug}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-lux-accent px-4 py-2 text-xs font-600 text-lux-bg transition-transform hover:-translate-y-0.5">
                            <Play size={12} /> Play
                          </Link>
                        ) : (
                          <a href={`${process.env.REACT_APP_BACKEND_URL}/api/p/${p.slug}`} target="_blank" rel="noreferrer" data-testid={`gallery-visit-${p.slug}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-lux-accent px-4 py-2 text-xs font-600 text-lux-bg transition-transform hover:-translate-y-0.5">
                            <ExternalLink size={12} /> {p.type === "app" ? "Open app" : "Visit site"}
                          </a>
                        )}
                        <Link to={`/${p.type}-builder?remix=${p.slug}`} data-testid={`gallery-remix-${p.slug}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-lux-border px-4 py-2 text-xs text-lux-text2 transition-colors hover:border-lux-accent hover:text-lux-text">
                          <GitFork size={12} /> Remix
                        </Link>
                      </div>
                      {p.type === "game" && (
                        <span className="font-mono text-[11px] uppercase tracking-wide text-lux-text2" data-testid={`gallery-plays-${p.slug}`}>
                          {p.plays || 0} play{(p.plays || 0) === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {board?.top?.length > 0 && (
          <section className="mt-4 pb-16" data-testid="gallery-leaderboard">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-lux-accent/50 text-lux-accent"><Trophy size={17} /></span>
              <h2 className="font-display text-2xl font-700 tracking-tight">Game leaderboard</h2>
            </div>
            {board.spotlight && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-lux-accent/50 bg-lux-accent/5 p-6" data-testid="leaderboard-spotlight">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-lux-accent">Most played this week · {board.week}</p>
                  <p className="mt-2 font-display text-xl font-700 tracking-tight">{board.spotlight.title}</p>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-lux-text2">{board.spotlight.weekly_plays} play{board.spotlight.weekly_plays === 1 ? "" : "s"} this week · {board.spotlight.plays} all-time</p>
                </div>
                <Link to={`/play/${board.spotlight.slug}`} data-testid="leaderboard-spotlight-play"
                  className="inline-flex items-center gap-2 rounded-full bg-lux-accent px-6 py-3 text-sm font-600 text-lux-bg transition-transform hover:-translate-y-0.5">
                  <Play size={14} /> Play now
                </Link>
              </div>
            )}
            <div className="mt-4 space-y-2" data-testid="leaderboard-list">
              {board.top.map((g, i) => (
                <div key={g.slug} className="flex items-center justify-between gap-4 rounded-xl border border-lux-border bg-lux-surface/60 px-5 py-3">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className={`font-display text-lg font-700 ${i === 0 ? "text-lux-accent" : "text-lux-text2"}`}>#{i + 1}</span>
                    <p className="truncate text-sm text-lux-text">{g.title}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="font-mono text-[11px] uppercase tracking-wide text-lux-text2">{g.plays} plays</span>
                    <Link to={`/play/${g.slug}`} className="rounded-full border border-lux-accent px-4 py-1.5 text-xs font-600 text-lux-accent" data-testid={`leaderboard-play-${g.slug}`}>Play</Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </main>
  );
}
