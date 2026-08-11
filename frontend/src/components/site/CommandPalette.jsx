import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CornerDownLeft } from "lucide-react";

const PAGES = [
  { label: "Home", to: "/", hint: "landing" },
  { label: "Developer Console", to: "/dashboard", hint: "api keys · usage · wallet" },
  { label: "Frasberg Gift & Tokens", to: "/dashboard", hint: "balance · buy · send" },
  { label: "Workspace Home", to: "/apps", hint: "published apps" },
  { label: "Luchii Builder", to: "/chat?agent=architect", hint: "build with Luchii-70b" },
  { label: "Luchii Chat", to: "/chat", hint: "talk to Luchii" },
  { label: "Singularity Codex", to: "/codex", hint: "17 books · lore" },
  { label: "FrasbergOS Simulator", to: "/os", hint: "eternal cycle" },
  { label: "Agent Marketplace", to: "/marketplace", hint: "agents · ascension" },
  { label: "Verified LLM Provider", to: "/verified-provider", hint: "certification" },
  { label: "Kernel Stack", to: "/kernels", hint: "cosmogenic → alpha-omega" },
  { label: "Tier Benchmark Arena", to: "/benchmark", hint: "1B vs 7B vs 70B vs X" },
  { label: "Ops Center", to: "/ops", hint: "cycle alerts" },
  { label: "Ascension History", to: "/ascensions", hint: "leaderboard" },
  { label: "Constellation Map", to: "/constellation", hint: "glyphs" },
  { label: "API Docs", to: "/docs", hint: "openai-compatible" },
  { label: "Games Portal", to: "/games", hint: "street vybz" },
  { label: "Profile", to: "/profile", hint: "account" },
];

export const CommandPalette = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);

  const results = q.trim()
    ? PAGES.filter((p) => (p.label + " " + p.hint).toLowerCase().includes(q.toLowerCase()))
    : PAGES;

  const close = useCallback(() => { setOpen(false); setQ(""); setIdx(0); }, []);

  useEffect(() => {
    const onKey = (e) => {
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
      if (!open && ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"))) {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 30);
      } else if (open && e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  const go = (to) => { close(); navigate(to); };

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center px-4 pt-[14vh]" data-testid="command-palette">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 shadow-2xl" style={{ background: "rgba(10,14,22,0.98)" }}>
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
          <Search size={15} className="text-cyan-300" />
          <input ref={inputRef} value={q} data-testid="command-palette-input"
            onChange={(e) => { setQ(e.target.value); setIdx(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
              else if (e.key === "Enter" && results[idx]) go(results[idx].to);
            }}
            placeholder="Jump to any page…"
            className="flex-1 bg-transparent text-[14.5px] text-white outline-none placeholder:text-gray-500" />
          <kbd className="rounded border border-white/15 px-1.5 py-0.5 font-mono text-[10px] text-gray-500">esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2" data-testid="command-palette-results">
          {results.map((p, i) => (
            <button key={p.label} onClick={() => go(p.to)} onMouseEnter={() => setIdx(i)}
              data-testid={`command-palette-item-${i}`}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-colors ${i === idx ? "bg-cyan-400/[0.1]" : "hover:bg-white/[0.05]"}`}>
              <span>
                <span className="text-[13.5px] text-white">{p.label}</span>
                <span className="ml-2.5 font-mono text-[11px] text-gray-500">{p.hint}</span>
              </span>
              {i === idx && <CornerDownLeft size={13} className="text-cyan-300" />}
            </button>
          ))}
          {results.length === 0 && <p className="px-4 py-6 text-center text-[13px] text-gray-500" data-testid="command-palette-empty">No pages match "{q}"</p>}
        </div>
        <div className="border-t border-white/10 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-gray-600">
          ↑↓ navigate · enter open · / or ctrl-k anywhere
        </div>
      </div>
    </div>
  );
};
