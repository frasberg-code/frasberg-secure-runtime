import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, Menu, X, ChevronDown } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

const LINKS = [
  { label: "Models", href: "#models" },
  { label: "Benchmarks", href: "#benchmarks" },
  { label: "Realms", href: "#realms" },
  { label: "Mythos", href: "#mythos" },
  { label: "API", href: "#api" },
];

const EXPLORE_GROUPS = [
  {
    title: "On this page",
    items: [
      { label: "Benchmarks", href: "#benchmarks" },
      { label: "Realms", href: "#realms" },
      { label: "Mythos", href: "#mythos" },
      { label: "API", href: "#api" },
    ],
  },
  {
    title: "Build",
    items: [
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
      { label: "Visual Studio", to: "/studio" },
      { label: "Luchii Code", to: "/luchii-code" },
      { label: "Frasberg Software", to: "/software" },
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
          <span className="hidden font-mono text-[13.5px] uppercase tracking-[0.2em] text-lux-text2 sm:inline">
            by Frasberg
          </span>
        </a>

        <div className="hidden items-center gap-7 md:flex">
          <a href="#models" className="text-sm text-lux-text2 transition-colors duration-200 hover:text-lux-text" data-testid="nav-models">Models</a>
          <Link
            to="/dashboard"
            className="text-sm text-lux-text2 transition-colors duration-200 hover:text-lux-text"
            data-testid="nav-developers"
          >
            Developers
          </Link>
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
                      <div className="px-2 pb-1 font-mono text-[13.5px] uppercase tracking-[0.2em] text-lux-text2">{g.title}</div>
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
          {user ? (
            <button
              onClick={logout}
              data-testid="nav-logout"
              className="text-sm text-lux-text2 transition-colors duration-200 hover:text-lux-text"
            >
              Sign out
            </button>
          ) : (
            <Link
              to="/auth?mode=login"
              className="text-sm text-lux-text2 transition-colors duration-200 hover:text-lux-text"
              data-testid="nav-signin"
            >
              Sign In
            </Link>
          )}
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
            className="grid h-10 w-10 place-items-center rounded-full border border-lux-border text-lux-text md:hidden"
            aria-label="Menu"
            data-testid="mobile-menu-toggle"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="glass max-h-[75vh] overflow-y-auto border-t border-lux-border md:hidden" data-testid="mobile-menu">
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 gap-x-4">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="py-2 text-sm text-lux-text2 hover:text-lux-text"
                >
                  {l.label}
                </a>
              ))}
              <Link to="/dashboard" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">Developers</Link>
              <Link to="/brand" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">Brand</Link>
              <Link to="/about" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">About</Link>
              <Link to="/ai-models" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">AI Models</Link>
              <Link to="/luchii-code" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">Luchii Code</Link>
              <Link to="/website-builder" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">Website Builder</Link>
              <Link to="/app-builder" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">App Builder</Link>
              <Link to="/game-builder" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">Game Builder</Link>
              <Link to="/gallery" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">Builder Gallery</Link>
              <Link to="/games" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">Games</Link>
              <Link to="/marketplace" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">Marketplace</Link>
            </div>
            {user ? (
              <button onClick={() => { logout(); setOpen(false); }} className="py-2 text-left text-sm text-lux-text2 hover:text-lux-text">Sign out</button>
            ) : (
              <Link to="/auth?mode=login" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">Sign In</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
