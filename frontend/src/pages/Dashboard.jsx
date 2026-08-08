import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Key, Plus, Copy, Trash2, Activity, Cpu, Terminal, ArrowLeft, Moon, Sun, Check, BarChart3, Mail,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import ChatDemo from "../components/site/ChatDemo";
import CodeTabs from "../components/site/CodeTabs";
import Pricing from "../components/site/Pricing";
import { MODELS } from "../data/content";
import { TrialBanner } from "../components/site/TrialBanner";

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
  const { user } = useAuth();
  const [keys, setKeys] = useState([]);
  const [usage, setUsage] = useState({ total_requests: 0, total_tokens: 0, keys: 0, rate_limit: 60 });
  const [newKey, setNewKey] = useState(null);
  const [name, setName] = useState("");
  const [expiresDays, setExpiresDays] = useState("");
  const [daily, setDaily] = useState([]);
  const [copied, setCopied] = useState(false);
  const [wallet, setWallet] = useState(0);
  const [sendingStatement, setSendingStatement] = useState(false);

  const emailStatement = async () => {
    setSendingStatement(true);
    try {
      const res = await fetch(`${API}/receipts/send-now`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      toast.success(`Usage statement sent to ${data.sent_to}`);
    } catch (e) {
      toast.error(e.message || "Could not send statement");
    } finally {
      setSendingStatement(false);
    }
  };

  const refresh = useCallback(async () => {
    try {
      const [k, u, d, w] = await Promise.all([
        fetch(`${API}/keys`, { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API}/usage`, { credentials: "include" }).then((r) => (r.ok ? r.json() : null)),
        fetch(`${API}/keys/usage/daily`, { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API}/wallet`, { credentials: "include" }).then((r) => (r.ok ? r.json() : null)),
      ]);
      setKeys(Array.isArray(k) ? k : []);
      if (u) setUsage(u);
      setDaily(Array.isArray(d) ? d : []);
      if (w) setWallet(w.balance);
    } catch {
      toast.error("Failed to load dashboard");
    }
  }, []);

  const toggleAutoTopup = async (k) => {
    const enabled = !(k.autotopup && k.autotopup.enabled);
    try {
      const res = await fetch(`${API}/keys/${k.id}/autotopup`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled, threshold: k.autotopup?.threshold || 500, amount: k.autotopup?.amount || 5000 }),
      });
      if (!res.ok) throw new Error();
      toast.success(enabled ? "Auto top-up enabled — refills +5,000 tokens from your wallet when below 500" : "Auto top-up disabled");
      refresh();
    } catch {
      toast.error("Could not update auto top-up");
    }
  };

  useEffect(() => { if (user) refresh(); }, [refresh, user]);

  useEffect(() => {
    if (!user) return;
    const id = setInterval(refresh, 12000);
    return () => clearInterval(id);
  }, [user, refresh]);

  const generate = async () => {
    try {
      const res = await fetch(`${API}/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name || "Default key", expires_days: expiresDays ? Number(expiresDays) : null }),
      });
      if (res.status === 401) { toast.error("Please sign in to generate keys"); return; }
      if (res.status === 402) {
        toast.error("Free accounts include 3 API keys — upgrade from $5/mo for unlimited keys");
        setTimeout(() => window.location.assign("/pay"), 1500);
        return;
      }
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
            <img src="/luchii-mark-circle.png" alt="Frasberg Luchii" className="h-8 w-8 rounded-full" />
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
      <TrialBanner />

      <div className="mx-auto max-w-[1600px] px-5 py-10 sm:px-8">
        <h1 className="font-display text-4xl font-700 tracking-tighter sm:text-5xl">Developer Dashboard</h1>
        <p className="mt-3 max-w-xl text-lux-text2">
          Generate keys, monitor usage, and try the models. Public tier is capped
          at {usage.rate_limit} requests/min.
        </p>

        {!user && (
          <div className="mt-10 rounded-3xl border border-lux-border bg-lux-surface p-10 text-center" data-testid="dashboard-signin-prompt">
            <h2 className="font-display text-2xl font-700 tracking-tight">Sign in to request API keys</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-lux-text2">
              A free Frasberg account is required to generate API or LLM keys, track usage and purchase credits.
            </p>
            <Link
              to={`/auth?next=${encodeURIComponent("/dashboard")}`}
              data-testid="dashboard-signin-cta"
              className="mt-6 inline-block rounded-full bg-lux-text px-7 py-3 text-sm font-600 text-lux-bg transition-transform duration-200 hover:-translate-y-0.5"
            >
              Sign in / Create account
            </Link>
          </div>
        )}

        {user && (
        <>
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-0" data-testid="dashboard-split">
        {/* LEFT — Control center */}
        <div className="min-w-0 lg:h-[calc(100vh-230px)] lg:overflow-y-auto lg:pr-8" data-testid="dashboard-left-pane">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" data-testid="usage-stats">
          <Stat label="Requests" value={usage.total_requests} icon={Activity} />
          <Stat label="Tokens" value={usage.total_tokens} icon={Terminal} />
          <Stat label="Active keys" value={usage.keys} icon={Key} />
        </div>

        {/* Usage graph */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 font-display text-2xl font-600 tracking-tight">
            <BarChart3 size={20} className="text-lux-accent" /> Usage — last 14 days
            <span className="ml-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-lux-text2" data-testid="usage-live-badge">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> live
            </span>
            <span className="ml-auto rounded-full border border-lux-border px-3 py-1 font-mono text-[11px] text-lux-text2" data-testid="wallet-balance">
              💰 Wallet: {wallet.toLocaleString()} tokens
            </span>
            <button
              onClick={emailStatement}
              disabled={sendingStatement}
              data-testid="email-statement-btn"
              className="flex items-center gap-1.5 rounded-full border border-lux-border px-3 py-1 font-mono text-[11px] text-lux-text2 transition-colors hover:border-lux-accent hover:text-lux-accent disabled:opacity-50"
            >
              <Mail size={12} /> {sendingStatement ? "Sending…" : "Email me my statement"}
            </button>
          </h2>
          <div className="mt-5 rounded-2xl border border-lux-border bg-lux-surface p-5" style={{ height: 240 }} data-testid="key-usage-graph">
            {daily.every((d) => d.requests === 0) ? (
              <div className="grid h-full place-items-center font-mono text-xs uppercase tracking-wide text-lux-text2">
                No API requests yet — call the gateway with your key to see traffic here
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(140,140,170,0.15)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#8a86a3" />
                  <YAxis yAxisId="req" tick={{ fontSize: 10 }} stroke="#8a86a3" allowDecimals={false} width={40} />
                  <YAxis yAxisId="tok" orientation="right" tick={{ fontSize: 10 }} stroke="#8a86a3" allowDecimals={false} width={44} />
                  <Tooltip
                    cursor={{ fill: "rgba(140,140,170,0.08)" }}
                    contentStyle={{ background: "#111018", border: "1px solid #2a2740", borderRadius: 12, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="req" dataKey="requests" name="Requests" fill="#7c6cf0" radius={[5, 5, 0, 0]} maxBarSize={28} />
                  <Bar yAxisId="tok" dataKey="tokens" name="Tokens" fill="#22d3ee" radius={[5, 5, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

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
            <select
              value={expiresDays}
              onChange={(e) => setExpiresDays(e.target.value)}
              data-testid="key-expiry-select"
              className="rounded-full border border-lux-border bg-lux-surface px-5 py-3 text-sm text-lux-text outline-none focus:border-lux-accent"
            >
              <option value="">Never expires</option>
              <option value="30">Expires in 30 days</option>
              <option value="60">Expires in 60 days</option>
              <option value="90">Expires in 90 days</option>
            </select>
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
              keys.map((k) => {
                const credits = k.credits ?? 0;
                const low = credits < 500;
                const pct = Math.max(2, Math.min(100, (credits / 5000) * 100));
                const atOn = k.autotopup && k.autotopup.enabled;
                return (
                <div
                  key={k.id}
                  className="border-b border-lux-border px-5 py-4 last:border-0"
                  data-testid={`key-row-${k.id}`}
                >
                  <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-500 text-lux-text">{k.name}</p>
                    <code className="font-mono text-xs text-lux-text2">{k.key}</code>
                    {k.expires_at && (
                      k.expires_at < new Date().toISOString() ? (
                        <span className="ml-3 rounded-full border border-red-500/50 bg-red-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-red-400" data-testid={`key-expired-${k.id}`}>Expired</span>
                      ) : (
                        <span className="ml-3 font-mono text-[10px] text-lux-text2" data-testid={`key-expires-${k.id}`}>expires {k.expires_at.slice(0, 10)}</span>
                      )
                    )}
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
                  <div className="mt-3 flex flex-wrap items-center gap-3" data-testid={`key-credits-${k.id}`}>
                    <div className="h-1.5 w-40 overflow-hidden rounded-full bg-lux-surface2">
                      <div className={`h-full rounded-full transition-all ${low ? "bg-red-500" : credits < 1500 ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={`font-mono text-[11px] ${low ? "text-red-400" : "text-lux-text2"}`}>
                      {credits.toLocaleString()} credits
                    </span>
                    {low && (
                      <span className="rounded-full border border-red-500/50 bg-red-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-red-400" data-testid={`key-low-${k.id}`}>
                        Low — top up
                      </span>
                    )}
                    <button
                      onClick={() => toggleAutoTopup(k)}
                      data-testid={`key-autotopup-${k.id}`}
                      className={`rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wide transition-colors ${atOn ? "border-emerald-400/60 text-emerald-400" : "border-lux-border text-lux-text2 hover:text-lux-text"}`}
                    >
                      Auto top-up {atOn ? "on" : "off"}
                    </button>
                    {atOn && <span className="font-mono text-[10px] text-lux-text2">+{(k.autotopup.amount || 5000).toLocaleString()} @ &lt;{k.autotopup.threshold || 500}</span>}
                  </div>
                </div>
                );
              })
            )}
          </div>
        </section>

        </div>

        {/* RIGHT — Live workspace */}
        <div className="min-w-0 lg:h-[calc(100vh-230px)] lg:overflow-y-auto lg:border-l lg:border-lux-border lg:pl-8" data-testid="dashboard-right-pane">
          <section>
            <h2 className="flex items-center gap-2 font-display text-2xl font-600 tracking-tight">
              <Terminal size={20} className="text-lux-accent" /> Playground
            </h2>
            <div className="mt-5 h-[440px]">
              <ChatDemo />
            </div>
          </section>

          <section className="mt-12">
            <h2 className="flex items-center gap-2 font-display text-2xl font-600 tracking-tight">
              <Terminal size={20} className="text-lux-accent" /> Quickstart
            </h2>
            <p className="mt-2 text-sm text-lux-text2">
              Copy, paste, and run against the live gateway. Snippets auto-fill your
              newest key.
            </p>
            <div className="mt-5">
              <CodeTabs apiKey={newKey?.key} />
            </div>
          </section>

          <section className="mt-12">
            <h2 className="flex items-center gap-2 font-display text-2xl font-600 tracking-tight">
              <Cpu size={20} className="text-lux-accent" /> Models
            </h2>
            <div className="mt-5 space-y-3" data-testid="dashboard-models">
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
        </div>
        </div>

        {/* Pricing / Credits */}
        <Pricing keys={keys} onPurchased={refresh} walletId={user?.id} />
        </>
        )}
      </div>
    </main>
  );
}
