import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, Menu, X, ChevronDown } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { AccountMenu } from "./AccountMenu";

const LINKS = [
  { label: "Models", href: "#models" },
  { label: "Benchmarks", href: "#benchmarks" },
  { label: "Realms", href: "#realms" },
  { label: "Mythos", href: "#mythos" },
  { label: "API", href: "#api" },
];

const EXPLORE_GROUPS = [
  {
    title: "Explore",
    items: [
      { label: "Chat", to: "/luchii" },
      { label: "Developer Console", to: "/dashboard" },
      { label: "Benchmark", href: "#benchmarks" },
      { label: "Realm", href: "#realms" },
      { label: "Mythos", href: "#mythos" },
      { label: "API", href: "#api" },
    ],
  },
  {
    title: "Build",
    items: [
      { label: "Creative Studio", to: "/studio" },
      { label: "Website Builder", to: "/website-builder" },
      { label: "App Builder", to: "/app-builder" },
      { label: "Game Builder", to: "/game-builder" },
      { label: "Builder Gallery", to: "/gallery" },
    ],
  },
  {
    title: "Products",
    items: [
      { label: "API Docs", to: "/docs" },
      { label: "AI Models", to: "/ai-models" },
      { label: "Games", to: "/games" },
      { label: "Marketplace", to: "/marketplace" },
      { label: "Launch — Marketplace v3", to: "/launch" },
      { label: "FrasbergOS", to: "/os" },
      { label: "Singularity Codex", to: "/codex" },
      { label: "Verified Provider", to: "/verified-provider" },
      { label: "Kernel Stack", to: "/kernels" },
      { label: "Tier Benchmark", to: "/benchmark" },
      { label: "Cognition Playground", to: "/playground" },
      { label: "Cloud Console", to: "/console" },
      { label: "Ops Center", to: "/ops" },
      { label: "Developer Portal", to: "/developers/portal" },
      { label: "Developer Docs", to: "/developers/docs" },
      { label: "Visual Studio", to: "/visual-studio" },
      { label: "Luchii Code", to: "/luchii-code" },
      { label: "Frasberg Software", to: "/software" },
      { label: "Security Shield", to: "/security-shield" },
      { label: "Shield Dashboard", to: "/shield-dashboard" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "Brand", to: "/brand" },
      { label: "About", to: "/about" },
    ],
  },
];

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const exploreRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!exploreOpen) return;
    const onDoc = (e) => { if (exploreRef.current && !exploreRef.current.contains(e.target)) setExploreOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [exploreOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background,border] duration-500 ${
        scrolled ? "glass" : "border-b border-transparent"
      }`}
      data-testid="site-navbar"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5" data-testid="brand-logo">
          <img src="/luchii-mark-circle.png" alt="Frasberg Luchii" className="h-9 w-9 rounded-full" />
          <span className="font-display text-lg font-700 tracking-tight text-lux-text">Luchii</span>
          <span className="hidden font-mono text-[15.5px] uppercase tracking-[0.2em] text-lux-text2 sm:inline">
            by Frasberg
          </span>
        </a>

        <div className="hidden items-center gap-4 lg:flex">
          {user ? (
            <button onClick={logout} data-testid="nav-signin" className="text-[15px] text-lux-text2 transition-colors duration-200 hover:text-lux-text">Sign out</button>
          ) : (
            <Link to="/auth?mode=login" className="text-[15px] text-lux-text2 transition-colors duration-200 hover:text-lux-text" data-testid="nav-signin">Sign In</Link>
          )}
          <Link to="/ai-models" className="text-[15px] text-lux-text2 transition-colors duration-200 hover:text-lux-text" data-testid="nav-ai-models">AI Models</Link>
          <a href="/#realms" className="text-[15px] text-lux-text2 transition-colors duration-200 hover:text-lux-text" data-testid="nav-realms">Realms</a>
          <a href="/#api" className="text-[15px] text-lux-text2 transition-colors duration-200 hover:text-lux-text" data-testid="nav-api">API</a>
          <Link to="/website-builder" className="text-[15px] text-lux-text2 transition-colors duration-200 hover:text-lux-text" data-testid="nav-website-builder">Website Builder</Link>
          <Link to="/game-builder" className="text-[15px] text-lux-text2 transition-colors duration-200 hover:text-lux-text" data-testid="nav-game-builder">Game Builder</Link>
          <Link to="/games" className="text-[15px] text-lux-text2 transition-colors duration-200 hover:text-lux-text" data-testid="nav-games">Games</Link>
          <Link to="/os" className="text-[15px] text-lux-text2 transition-colors duration-200 hover:text-lux-text" data-testid="nav-frasbergos">FrasbergOS</Link>
          <div className="relative" ref={exploreRef}>
            <button
              onClick={() => setExploreOpen((o) => !o)}
              data-testid="nav-explore-btn"
              className={`inline-flex items-center gap-1.5 text-sm transition-colors duration-200 ${exploreOpen ? "text-lux-text" : "text-lux-text2 hover:text-lux-text"}`}
            >
              Explore <ChevronDown size={13} className={`transition-transform duration-200 ${exploreOpen ? "rotate-180" : ""}`} />
            </button>
            {exploreOpen && (
              <div className="glass absolute left-1/2 top-10 z-50 w-[440px] max-h-[70vh] -translate-x-1/2 overflow-y-auto rounded-2xl border border-lux-border p-4 shadow-2xl" data-testid="nav-explore-menu">
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  {EXPLORE_GROUPS.map((g) => (
                    <div key={g.title}>
                      <div className="px-2 pb-1 font-mono text-[15.5px] uppercase tracking-[0.2em] text-lux-text2">{g.title}</div>
                      {g.items.map((l) =>
                        l.to ? (
                          <Link key={l.label} to={l.to} onClick={() => setExploreOpen(false)}
                            data-testid={`nav-explore-${l.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                            className="block rounded-lg px-2 py-1.5 text-sm text-lux-text2 transition-colors hover:bg-lux-surface2 hover:text-lux-text">
                            {l.label}
                          </Link>
                        ) : (
                          <a key={l.label} href={l.href} onClick={() => setExploreOpen(false)}
                            data-testid={`nav-explore-${l.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                            className="block rounded-lg px-2 py-1.5 text-sm text-lux-text2 transition-colors hover:bg-lux-surface2 hover:text-lux-text">
                            {l.label}
                          </a>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <AccountMenu />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            data-testid="theme-toggle"
            className="grid h-10 w-10 place-items-center rounded-full border border-lux-border text-lux-text transition-colors duration-200 hover:border-lux-accent hover:text-lux-accent"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Link
            to="/dashboard"
            className="hidden rounded-full bg-lux-text px-5 py-2.5 text-sm font-500 text-lux-bg transition-transform duration-200 hover:-translate-y-0.5 sm:inline-block"
            data-testid="nav-cta"
          >
            Get API Key
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="grid h-10 w-10 place-items-center rounded-full border border-lux-border text-lux-text lg:hidden"
            aria-label="Menu"
            data-testid="mobile-menu-toggle"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="glass max-h-[75vh] overflow-y-auto border-t border-lux-border lg:hidden" data-testid="mobile-menu">
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 gap-x-4">
              {user ? (
                <button onClick={() => { logout(); setOpen(false); }} className="py-2 text-left text-sm text-lux-text2 hover:text-lux-text">Sign out</button>
              ) : (
                <Link to="/auth?mode=login" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">Sign In</Link>
              )}
              <Link to="/ai-models" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">AI Models</Link>
              <a href="/#realms" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">Realms</a>
              <a href="/#api" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">API</a>
              <Link to="/website-builder" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">Website Builder</Link>
              <Link to="/game-builder" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">Game Builder</Link>
              <Link to="/games" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">Games</Link>
              <Link to="/os" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">FrasbergOS</Link>
              <Link to="/create" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">Creative Studio</Link>
              <Link to="/dashboard" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">Developers</Link>
            </div>
            {EXPLORE_GROUPS.map((g) => (
              <div key={g.title} className="mt-4 border-t border-lux-border pt-3" data-testid={`mobile-explore-${g.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-lux-text2">{g.title}</p>
                <div className="mt-1 grid grid-cols-2 gap-x-4">
                  {g.items.map((l) => l.to ? (
                    <Link key={l.label} to={l.to} onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">{l.label}</Link>
                  ) : (
                    <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">{l.label}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
