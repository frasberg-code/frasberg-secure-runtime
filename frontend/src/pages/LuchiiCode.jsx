import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Moon, Sun, ArrowLeft, Github, Terminal } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import Starfield from "../components/site/Starfield";
import Footer from "../components/site/Footer";
import Seo from "../components/site/Seo";
import Reveal, { Overline } from "../components/site/Reveal";
import CodeTabs from "../components/site/CodeTabs";

export default function LuchiiCode() {
  const { theme, toggle } = useTheme();

  return (
    <main className="relative z-10 min-h-screen bg-lux-bg text-lux-text" data-testid="luchii-code-page">
      <Seo
        title="Luchii Code — Open Development by Frasberg, Inc."
        description="Luchii Code: quickstarts, SDK snippets and the official Luchii repository by Frasberg, Inc. Clone from GitHub and start building with the Luchii model family."
      />
      <div className="pointer-events-none absolute inset-0 opacity-50"><Starfield /></div>

      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" data-testid="luchii-code-home-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <img src="/luchii-logo.webp" alt="Frasberg Luchii" className="h-8 w-8 rounded-full ring-1 ring-lux-accent/40" />
            <span className="font-display text-lg font-700 tracking-tight">Luchii Code</span>
          </Link>
          <button onClick={toggle} aria-label="Toggle theme" data-testid="luchii-code-theme-toggle"
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
            <Terminal size={26} />
          </span>
          <h1 className="mt-6 font-display text-4xl font-700 tracking-tighter sm:text-5xl">Luchii Code</h1>
          <p className="mx-auto mt-4 max-w-xl text-lux-text2">
            The official Luchii repository, quickstarts and SDK snippets.
            Clone, build and ship with the Luchii model family.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com/frasbergai/luchii"
              target="_blank"
              rel="noreferrer"
              data-testid="luchii-github-link"
              className="inline-flex items-center gap-2.5 rounded-full bg-lux-text px-7 py-3 text-sm font-500 text-lux-bg transition-transform duration-200 hover:-translate-y-0.5"
            >
              <Github size={17} /> github.com/frasbergai/luchii
            </a>
            <Link to="/dashboard" data-testid="luchii-code-key-cta"
              className="rounded-full border border-lux-border px-7 py-3 text-sm text-lux-text2 transition-colors duration-200 hover:border-lux-accent hover:text-lux-text">
              Get API Key
            </Link>
          </div>
        </motion.div>

        <Reveal delay={0.1}>
          <div className="mx-auto mt-14 max-w-2xl rounded-2xl border border-lux-border bg-lux-surface p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-lux-accent">Clone the repository</p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-lux-bg p-4 font-mono text-xs text-lux-text2">
{`git clone https://github.com/frasbergai/luchii.git
cd luchii`}
            </pre>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mx-auto mt-10 max-w-2xl">
            <Overline>Quickstart</Overline>
            <div className="mt-4">
              <CodeTabs />
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
