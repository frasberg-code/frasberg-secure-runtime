import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const LINKS = [
  { label: "Models", href: "#models" },
  { label: "Benchmarks", href: "#benchmarks" },
  { label: "Realms", href: "#realms" },
  { label: "Mythos", href: "#mythos" },
  { label: "API", href: "#api" },
];

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background,border] duration-500 ${
        scrolled ? "glass" : "border-b border-transparent"
      }`}
      data-testid="site-navbar"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5" data-testid="brand-logo">
          <img src="/luchii-logo.webp" alt="Frasberg Luchii" className="h-9 w-9 rounded-full ring-1 ring-lux-accent/40" />
          <span className="font-display text-lg font-700 tracking-tight text-lux-text">Luchii</span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-lux-text2 sm:inline">
            by Frasberg
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-lux-text2 transition-colors duration-200 hover:text-lux-text"
              data-testid={`nav-${l.label.toLowerCase()}`}
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/court"
            className="text-sm text-lux-text2 transition-colors duration-200 hover:text-lux-text"
            data-testid="nav-court"
          >
            The AI World Court
          </Link>
          <Link
            to="/dashboard"
            className="text-sm text-lux-text2 transition-colors duration-200 hover:text-lux-text"
            data-testid="nav-developers"
          >
            Developers
          </Link>
          <Link
            to="/about"
            className="text-sm text-lux-text2 transition-colors duration-200 hover:text-lux-text"
            data-testid="nav-about"
          >
            About
          </Link>
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
        <div className="glass border-t border-lux-border md:hidden" data-testid="mobile-menu">
          <div className="flex flex-col gap-1 px-6 py-4">
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
            <Link to="/court" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">The AI World Court</Link>
            <Link to="/dashboard" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">Developers</Link>
            <Link to="/brand" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">Brand</Link>
            <Link to="/about" onClick={() => setOpen(false)} className="py-2 text-sm text-lux-text2 hover:text-lux-text">About</Link>
          </div>
        </div>
      )}
    </header>
  );
}
