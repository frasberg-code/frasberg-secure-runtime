import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Key, Plus, Copy, Trash2, Activity, Cpu, Terminal, ArrowLeft, Moon, Sun, Check,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import ChatDemo from "../components/site/ChatDemo";
import CodeTabs from "../components/site/CodeTabs";
import { MODELS } from "../data/content";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-lux-border bg-lux-surface p-6">
      <div className="flex items-center gap-2 text-lux-text2">
        <Icon size={15} className="text-lux-accent" />
        <span className="font-mono text-[11px] uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-600 text-lux-text">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { theme, toggle } = useTheme();
  const [keys, setKeys] = useState([]);
  const [usage, setUsage] = useState({ total_requests: 0, total_tokens: 0, keys: 0, rate_limit: 60 });
  const [newKey, setNewKey] = useState(null);
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [k, u] = await Promise.all([
        fetch(`${API}/keys`).then((r) => r.json()),
        fetch(`${API}/usage`).then((r) => r.json()),
      ]);
      setKeys(Array.isArray(k) ? k : []);
      setUsage(u);
    } catch {
      toast.error("Failed to load dashboard");
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const generate = async () => {
    try {
      const res = await fetch(`${API}/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || "Default key" }),
      });
      const data = await res.json();
      setNewKey(data);
      setName("");
      toast.success("API key generated");
      refresh();
    } catch {
      toast.error("Could not generate key");
    }
  };

  const copyKey = async (val) => {
    try { await navigator.clipboard.writeText(val); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = val; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch {} ta.remove();
    }
    setCopied(true); toast.success("Copied"); setTimeout(() => setCopied(false), 1500);
  };

  const revoke = async (id) => {
    await fetch(`${API}/keys/${id}`, { method: "DELETE" });
    toast.success("Key revoked");
    refresh();
  };

  return (
    <main className="relative z-10 min-h-screen bg-lux-bg text-lux-text">
      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" data-testid="dashboard-home-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <span className="font-display text-lg font-700 tracking-tight">Luchii</span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-lux-text2 sm:inline">
              Developer Console
            </span>
          </Link>
          <button
            onClick={toggle}
            data-testid="dashboard-theme-toggle"
            aria-label="Toggle theme"
            className="grid h-10 w-10 place-items-center rounded-full border border-lux-border transition-colors hover:border-lux-accent hover:text-lux-accent"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <h1 className="font-display text-4xl font-700 tracking-tighter sm:text-5xl">Developer Dashboard</h1>
        <p className="mt-3 max-w-xl text-lux-text2">
          Generate keys, monitor usage, and try the models. Public tier is capped
          at {usage.rate_limit} requests/min.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3" data-testid="usage-stats">
          <Stat label="Requests" value={usage.total_requests} icon={Activity} />
          <Stat label="Tokens" value={usage.total_tokens} icon={Terminal} />
          <Stat label="Active keys" value={usage.keys} icon={Key} />
        </div>

        {/* API Keys */}
        <section className="mt-14">
          <h2 className="flex items-center gap-2 font-display text-2xl font-600 tracking-tight">
            <Key size={20} className="text-lux-accent" /> API Keys
          </h2>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Key name (e.g. Production)"
              data-testid="key-name-input"
              className="flex-1 rounded-full border border-lux-border bg-lux-surface px-5 py-3 text-sm outline-none focus:border-lux-accent"
            />
            <button
              onClick={generate}
              data-testid="generate-key-btn"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-lux-accent px-6 py-3 text-sm font-600 text-lux-bg transition-transform hover:-translate-y-0.5"
            >
              <Plus size={16} /> Generate key
            </button>
          </div>

          {newKey && (
            <div className="mt-4 rounded-2xl border border-lux-accent/40 bg-lux-surface p-5" data-testid="new-key-banner">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-lux-accent">
                Copy this now — it won't be shown in full again
              </p>
              <div className="mt-3 flex items-center justify-between gap-4">
                <code className="truncate font-mono text-sm text-lux-text">{newKey.key}</code>
                <button
                  onClick={() => copyKey(newKey.key)}
                  data-testid="copy-new-key"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-lux-border px-4 py-2 text-xs hover:border-lux-accent"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 overflow-hidden rounded-2xl border border-lux-border" data-testid="keys-table">
            {keys.length === 0 ? (
              <p className="p-6 text-sm text-lux-text2">No keys yet. Generate your first key above.</p>
            ) : (
              keys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between gap-4 border-b border-lux-border px-5 py-4 last:border-0"
                  data-testid={`key-row-${k.id}`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-500 text-lux-text">{k.name}</p>
                    <code className="font-mono text-xs text-lux-text2">{k.key}</code>
                  </div>
                  <div className="flex shrink-0 items-center gap-6">
                    <span className="hidden font-mono text-xs text-lux-text2 sm:inline">
                      {k.request_count} req · {k.token_count} tok
                    </span>
                    <button
                      onClick={() => revoke(k.id)}
                      data-testid={`revoke-key-${k.id}`}
                      aria-label="Revoke key"
                      className="grid h-9 w-9 place-items-center rounded-full border border-lux-border text-lux-text2 transition-colors hover:border-destructive hover:text-destructive"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Quickstart */}
        <section className="mt-14">
          <h2 className="flex items-center gap-2 font-display text-2xl font-600 tracking-tight">
            <Terminal size={20} className="text-lux-accent" /> Quickstart
          </h2>
          <p className="mt-2 text-sm text-lux-text2">
            Copy, paste, and run against the live gateway. Snippets auto-fill your
            newest key.
          </p>
          <div className="mt-6">
            <CodeTabs apiKey={newKey?.key} />
          </div>
        </section>

        {/* Models + Playground */}
        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <section>
            <h2 className="flex items-center gap-2 font-display text-2xl font-600 tracking-tight">
              <Cpu size={20} className="text-lux-accent" /> Models
            </h2>
            <div className="mt-6 space-y-3" data-testid="dashboard-models">
              {MODELS.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-xl border border-lux-border bg-lux-surface px-5 py-4">
                  <div>
                    <p className="font-500">{m.name}</p>
                    <p className="font-mono text-xs text-lux-text2">{m.tier} · {m.ctx} ctx</p>
                  </div>
                  <code className="font-mono text-xs text-lux-accent">{m.id}</code>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-2 font-display text-2xl font-600 tracking-tight">
              <Terminal size={20} className="text-lux-accent" /> Playground
            </h2>
            <div className="mt-6 h-[440px]">
              <ChatDemo />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
