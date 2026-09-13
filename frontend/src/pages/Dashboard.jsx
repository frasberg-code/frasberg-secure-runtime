import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Key, Plus, Copy, Trash2, Activity, Cpu, Terminal, ArrowLeft, Check, Mail, Wallet, Gauge, Zap, ShieldCheck, RefreshCw, Pencil, X, Link2,
} from "lucide-react";
import { Sun, Moon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useAuth } from "../context/AuthContext";
import ChatDemo from "../components/site/ChatDemo";
import CodeTabs from "../components/site/CodeTabs";
import Pricing from "../components/site/Pricing";
import { MODELS } from "../data/content";
import { TrialBanner } from "../components/site/TrialBanner";
import UpgradePlanModal from "../components/site/UpgradePlanModal";
import { NativeApps } from "../components/site/NativeApps";
import { ParallaxSky } from "../components/site/ParallaxSky";
import { FrasbergGiftCard } from "../components/site/FrasbergGiftCard";
import { ApiKeyForge } from "../components/site/ApiKeyForge";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

import { T, applyDashTheme, isLightSaved } from "../lib/dashTheme";

function Panel({ children, className = "", ...rest }) {
  return (
    <div className={`rounded-sm border ${className}`} style={{ borderColor: T.border, background: T.surface }} {...rest}>
      {children}
    </div>
  );
}

function Metric({ label, value, icon: Icon, testid }) {
  return (
    <Panel className="p-5" data-testid={testid}>
      <div className="flex items-center gap-2" style={{ color: T.text2 }}>
        <Icon size={13} style={{ color: T.accent }} />
        <span className="font-mono text-[13.5px] uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-3 font-mono text-3xl font-500 tracking-tighter" style={{ color: T.text }}>{value}</p>
    </Panel>
  );
}

function SectionTitle({ children, right }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-3" style={{ borderColor: T.borderSubtle }}>
      <h2 className="text-[15px] font-700 tracking-tight" style={{ color: T.text }}>{children}</h2>
      <div className="flex flex-wrap items-center gap-2">{right}</div>
    </div>
  );
}

const ghostBtn = "inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 font-mono text-[13px] transition-colors";

function EditKeyModal({ k, onClose, onSaved }) {
  const [name, setName] = useState(k.name || "");
  const [expireAfter, setExpireAfter] = useState("keep");
  const [restrict, setRestrict] = useState(!!k.restrict_key);
  const [limit, setLimit] = useState(k.usage_limit_credits || "");
  const [period, setPeriod] = useState(k.credit_refresh_period || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/keys/${k.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          name, expire_after: expireAfter, restrict_key: restrict,
          usage_limit_credits: restrict && limit ? Number(limit) : null,
          credit_refresh_period: restrict && period ? period : null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Key updated");
      onSaved();
      onClose();
    } catch { toast.error("Could not update key"); }
    finally { setSaving(false); }
  };

  const fieldCls = "mt-1.5 w-full rounded-sm border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-[#00F0FF]";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose} data-testid="edit-key-modal">
      <div className="w-full max-w-md rounded-sm border p-5" style={{ background: T.surface, borderColor: T.border }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: T.borderSubtle }}>
          <p className="flex items-center gap-2 text-[15px] font-700" style={{ color: T.text }}>
            <Link2 size={15} style={{ color: T.accent }} /> Edit API Key
          </p>
          <button onClick={onClose} aria-label="Close" data-testid="edit-key-close"
            className="grid h-7 w-7 place-items-center rounded-sm border" style={{ borderColor: T.border, color: T.text2 }}>
            <X size={13} />
          </button>
        </div>

        <label className="mt-4 block font-mono text-[12px] uppercase tracking-[0.16em]" style={{ color: T.text2 }}>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} data-testid="edit-key-name"
          className={fieldCls} style={{ borderColor: T.border, color: T.text }} />

        <label className="mt-4 block font-mono text-[12px] uppercase tracking-[0.16em]" style={{ color: T.text2 }}>Expire After</label>
        <select value={expireAfter} onChange={(e) => setExpireAfter(e.target.value)} data-testid="edit-key-expire"
          className={fieldCls} style={{ borderColor: T.border, background: T.surface, color: T.text }}>
          <option value="keep">Keep current</option>
          <option value="never">Never expires</option>
          <option value="30">30 days</option>
          <option value="60">60 days</option>
          <option value="90">90 days</option>
        </select>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm font-500" style={{ color: T.text }}>Restrict Key</span>
          <button onClick={() => setRestrict((v) => !v)} data-testid="restrict-key-toggle" aria-label="Restrict key"
            className="relative h-6 w-11 rounded-full transition-colors"
            style={{ background: restrict ? T.accent : "rgba(255,255,255,0.12)" }}>
            <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
              style={{ left: restrict ? 22 : 2 }} />
          </button>
        </div>

        <label className="mt-4 block font-mono text-[12px] uppercase tracking-[0.16em]"
          style={{ color: restrict ? T.text2 : T.muted }}>Usage Limits (Credits)</label>
        <input type="number" min="1" value={limit} disabled={!restrict} placeholder="Unlimited"
          onChange={(e) => setLimit(e.target.value)} data-testid="usage-limit-input"
          className={`${fieldCls} disabled:opacity-40`} style={{ borderColor: T.border, color: T.text }} />

        <label className="mt-4 block font-mono text-[12px] uppercase tracking-[0.16em]"
          style={{ color: restrict ? T.text2 : T.muted }}>Per credit refresh period</label>
        <select value={period} disabled={!restrict} onChange={(e) => setPeriod(e.target.value)} data-testid="refresh-period-select"
          className={`${fieldCls} disabled:opacity-40`} style={{ borderColor: T.border, background: T.surface, color: T.text }}>
          <option value="">Unlimited</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>

        <div className="mt-6 flex justify-end gap-2 border-t pt-4" style={{ borderColor: T.borderSubtle }}>
          <button onClick={onClose} className={ghostBtn} style={{ borderColor: T.border, color: T.text2 }}>Cancel</button>
          <button onClick={save} disabled={saving} data-testid="edit-key-save"
            className="rounded-sm px-4 py-1.5 font-mono text-[13px] font-700 text-black transition-opacity hover:opacity-85 disabled:opacity-50"
            style={{ background: T.accent }}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [keys, setKeys] = useState([]);
  const [usage, setUsage] = useState({ total_requests: 0, total_tokens: 0, keys: 0, rate_limit: 60 });
  const [newKey, setNewKey] = useState(null);
  const [name, setName] = useState("");
  const [expiresDays, setExpiresDays] = useState("");
  const [daily, setDaily] = useState([]);
  const [copied, setCopied] = useState(false);
  const [wallet, setWallet] = useState(0);
  const [emails, setEmails] = useState([]);
  const [quota, setQuota] = useState(null);
  const [lightMode, setLightMode] = useState(isLightSaved());
  const toggleTheme = () => {
    const nl = !lightMode;
    try { localStorage.setItem("dash-theme", nl ? "light" : "dark"); } catch {}
    applyDashTheme(nl);
    setLightMode(nl);
  };
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [editKey, setEditKey] = useState(null);
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
      const [k, u, d, w, e] = await Promise.all([
        fetch(`${API}/keys`, { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API}/usage`, { credentials: "include" }).then((r) => (r.ok ? r.json() : null)),
        fetch(`${API}/keys/usage/daily`, { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API}/wallet`, { credentials: "include" }).then((r) => (r.ok ? r.json() : null)),
        fetch(`${API}/emails/history`, { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
      ]);
      setKeys(Array.isArray(k) ? k : []);
      if (u) setUsage(u);
      setDaily(Array.isArray(d) ? d : []);
      if (w) setWallet(w.balance);
      setEmails(Array.isArray(e) ? e : []);
      fetch(`${API}/quotas`, { credentials: "include" }).then((r) => (r.ok ? r.json() : null)).then((q) => q && setQuota(q)).catch(() => {});
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

  const setAlertThreshold = async (k, threshold) => {
    try {
      const res = await fetch(`${API}/keys/${k.id}/alert-threshold`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ threshold: Number(threshold) }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Low-credit email alert set to ${Number(threshold).toLocaleString()} credits`);
      refresh();
    } catch {
      toast.error("Could not update alert threshold");
    }
  };

  useEffect(() => { if (user) refresh(); }, [refresh, user]);

  useEffect(() => {
    if (!user) return;
    const id = setInterval(refresh, 12000);
    return () => clearInterval(id);
  }, [user, refresh]);

  const revoke = async (id) => {
    await fetch(`${API}/keys/${id}`, { method: "DELETE" });
    toast.success("Key revoked");
    refresh();
  };

  const rotate = async (id) => {
    try {
      const res = await fetch(`${API}/keys/${id}/rotate`, { method: "POST", credentials: "include" });
      if (!res.ok) { toast.error("Could not rotate key"); return; }
      const data = await res.json();
      setNewKey(data);
      toast.success("Key rotated — permissions and credits preserved");
      refresh();
    } catch { toast.error("Could not rotate key"); }
  };

  const quotaPct = quota && !quota.unlimited ? Math.min(100, (quota.monthly_tokens_used / Math.max(1, quota.monthly_token_limit)) * 100) : 0;

  return (
    <main className="relative z-10 min-h-screen" style={{ background: T.bg, color: T.text }}>
      <ParallaxSky />
      {/* Top navigation — 64px, minimal */}
      <header className="sticky top-0 z-40 border-b backdrop-blur-md" style={{ borderColor: T.borderSubtle, background: T.headerBg, height: 64 }}>
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3" data-testid="dashboard-home-link">
            <ArrowLeft size={15} style={{ color: T.text2 }} />
            <img src="/frasberg-mark-circle.png" alt="Frasberg" className="h-7 w-7 rounded-full" />
            <span className="font-display text-[15px] font-700 tracking-tight">Frasberg</span>
            <span className="hidden text-[13px] sm:inline" style={{ color: T.text2 }}>/ Developer Console</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/verified-provider" data-testid="verified-provider-badge"
              className="hidden items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[12px] transition-colors sm:flex"
              style={{ borderColor: `${T.accent}66`, background: `${T.accent}10`, color: T.accent }}>
              <ShieldCheck size={12} /> Verified LLM Provider
            </Link>
            <button onClick={toggleTheme} aria-label="Toggle theme" data-testid="dashboard-theme-toggle"
              className="grid h-8 w-8 place-items-center rounded-sm border transition-colors"
              style={{ borderColor: T.border, color: T.text2 }}>
              {lightMode ? <Moon size={13} /> : <Sun size={13} />}
            </button>
            {user && quota && (
              <button onClick={() => setShowUpgrade(true)} data-testid="quota-chip"
                title={quota.unlimited ? "Frasberg team — unlimited access" : `${quota.rpm_limit} req/min · ${quota.monthly_token_limit.toLocaleString()} tokens/month — click to upgrade`}
                className="hidden items-center gap-2 rounded-sm border px-3 py-1.5 font-mono text-[13px] transition-colors sm:flex"
                style={{ borderColor: quotaPct > 80 ? "rgba(245,158,11,0.6)" : T.border, color: quotaPct > 80 ? "#F59E0B" : T.text2 }}>
                <Gauge size={12} />
                {quota.plan} · {quota.unlimited ? "Unlimited" : `${quota.monthly_tokens_used.toLocaleString()}/${quota.monthly_token_limit.toLocaleString()}`}
                {!quota.unlimited && <span style={{ color: T.accent }}>↑ Upgrade</span>}
              </button>
            )}
            {user && <span className="hidden font-mono text-[13px] md:inline" style={{ color: T.muted }}>{user.email}</span>}
          </div>
        </div>
      </header>
      <TrialBanner />
      <UpgradePlanModal open={showUpgrade} onClose={() => setShowUpgrade(false)} quota={quota} onUpgraded={refresh} />

      <div className="mx-auto max-w-[1200px] px-5 pt-12 pb-16 sm:px-8">
        <h1 className="text-2xl font-700 tracking-tighter sm:text-3xl">Overview</h1>
        <p className="mt-1.5 text-sm" style={{ color: T.text2 }}>
          Keys, usage and billing for the Frasberg gateway. Public tier is capped at 60 requests/min.
        </p>

        {!user && (
          <Panel className="mt-10 p-10 text-center" data-testid="dashboard-signin-prompt">
            <h2 className="text-xl font-700 tracking-tight">Sign in to request API keys</h2>
            <p className="mx-auto mt-3 max-w-md text-sm" style={{ color: T.text2 }}>
              A free Frasberg account is required to generate API or LLM keys, track usage and purchase credits.
            </p>
            <Link to={`/auth?next=${encodeURIComponent("/dashboard")}`} data-testid="dashboard-signin-cta"
              className="mt-6 inline-block rounded-sm px-7 py-3 text-sm font-600 transition-opacity hover:opacity-85"
              style={{ background: T.accent, color: "#08090A" }}>
              Sign in / Create account
            </Link>
          </Panel>
        )}

        {user && (
        <>
        {/* Bento overview */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4" data-testid="usage-stats">
          <Metric label="Requests" value={usage.total_requests.toLocaleString()} icon={Activity} />
          <Metric label="Tokens" value={usage.total_tokens.toLocaleString()} icon={Terminal} />
          <Metric label="Active keys" value={usage.keys} icon={Key} />
          <Panel className="p-5" data-testid="wallet-balance">
            <div className="flex items-center gap-2" style={{ color: T.text2 }}>
              <Wallet size={13} style={{ color: T.accent }} />
              <span className="font-mono text-[13.5px] uppercase tracking-[0.18em]">Wallet · auto top-up pool</span>
            </div>
            <p className="mt-3 font-mono text-3xl font-500 tracking-tighter" style={{ color: T.text }}>
              {wallet.toLocaleString()}<span className="ml-1 text-sm" style={{ color: T.muted }}>tok</span>
            </p>
          </Panel>
        </div>

        <FrasbergGiftCard className="mt-4" />

        {/* Quota bar */}
        {quota && (
          <Panel className="mt-4 p-5" data-testid="quota-panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2" style={{ color: T.text2 }}>
                <Zap size={13} style={{ color: T.accent }} />
                <span className="font-mono text-[13.5px] uppercase tracking-[0.18em]">
                  Plan: {quota.plan} · {quota.unlimited ? "unlimited req/min · unlimited tokens" : `${quota.rpm_limit} req/min · monthly quota`}
                </span>
              </div>
              {!quota.unlimited && (
              <button onClick={() => setShowUpgrade(true)} data-testid="quota-upgrade-btn"
                className="rounded-sm px-4 py-1.5 font-mono text-[13px] font-600 transition-opacity hover:opacity-85"
                style={{ background: T.accent, color: "#08090A" }}>
                Upgrade plan
              </button>
              )}
            </div>
            <div className="mt-3 h-1 w-full overflow-hidden rounded-sm" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full transition-all" style={{ width: `${Math.max(1, quotaPct)}%`, background: quotaPct > 80 ? "#F59E0B" : T.accent }} />
            </div>
            <p className="mt-2 font-mono text-[13px]" style={{ color: T.text2 }}>
              {quota.unlimited
                ? `${quota.monthly_tokens_used.toLocaleString()} tokens used · Unlimited quota (Frasberg team)`
                : `${quota.monthly_tokens_used.toLocaleString()} / ${quota.monthly_token_limit.toLocaleString()} tokens used (${quotaPct.toFixed(1)}%)`}
            </p>
          </Panel>
        )}

        <NativeApps />

        {/* Usage chart */}
        <section className="mt-10">
          <SectionTitle right={
            <>
              <span className="flex items-center gap-1.5 font-mono text-[13.5px] uppercase tracking-widest" style={{ color: T.text2 }} data-testid="usage-live-badge">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "#10B981" }} /> live
              </span>
              <button onClick={emailStatement} disabled={sendingStatement} data-testid="email-statement-btn"
                className={ghostBtn} style={{ borderColor: T.border, color: T.text2 }}>
                <Mail size={12} /> {sendingStatement ? "Sending…" : "Email me my statement"}
              </button>
            </>
          }>
            Usage — last 14 days
          </SectionTitle>
          <Panel className="p-4" style={{ height: 230 }} data-testid="key-usage-graph">
            {daily.every((d) => d.requests === 0) ? (
              <div className="grid h-full place-items-center font-mono text-[13px] uppercase tracking-wide" style={{ color: T.muted }}>
                No API requests yet — call the gateway with your key to see traffic here
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: T.muted, fontFamily: "JetBrains Mono" }} stroke="transparent" />
                  <YAxis yAxisId="req" tick={{ fontSize: 10, fill: T.muted, fontFamily: "JetBrains Mono" }} stroke="transparent" allowDecimals={false} width={38} />
                  <YAxis yAxisId="tok" orientation="right" tick={{ fontSize: 10, fill: T.muted, fontFamily: "JetBrains Mono" }} stroke="transparent" allowDecimals={false} width={44} />
                  <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    contentStyle={{ background: T.inset, border: `1px solid ${T.border}`, borderRadius: 2, fontSize: 11, fontFamily: "JetBrains Mono" }} />
                  <Bar yAxisId="req" dataKey="requests" name="Requests" fill={T.accent} radius={[1, 1, 0, 0]} maxBarSize={22} />
                  <Bar yAxisId="tok" dataKey="tokens" name="Tokens" fill="#525860" radius={[1, 1, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </section>

        {/* API keys */}
        <section className="mt-12">
          <SectionTitle>API Key Forge</SectionTitle>
          <ApiKeyForge onCreated={(d) => { setNewKey(d); refresh(); }} />

          {newKey?.rotated_at && (
            <div className="mt-3 rounded-sm border p-4" style={{ borderColor: "rgba(0,240,255,0.4)", background: "rgba(0,240,255,0.04)" }} data-testid="rotated-key-banner">
              <p className="font-mono text-[13.5px] uppercase tracking-[0.18em]" style={{ color: T.accent }}>
                Key rotated — copy the new value now, it won't be shown in full again
              </p>
              <div className="mt-2.5 flex items-center justify-between gap-4">
                <code className="truncate font-mono text-sm" style={{ color: T.text }}>{newKey.key}</code>
                <button onClick={() => { navigator.clipboard.writeText(newKey.key).catch(() => {}); toast.success("Copied"); }}
                  data-testid="copy-rotated-key"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-3 py-1.5 font-mono text-[12px]"
                  style={{ borderColor: T.border, color: T.text2 }}>
                  <Copy size={12} /> Copy
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-sm border" style={{ borderColor: T.border }} data-testid="keys-table">
            {keys.length === 0 ? (
              <p className="p-5 text-sm" style={{ color: T.text2 }}>No keys yet. Generate your first key above.</p>
            ) : (
              keys.map((k) => {
                const credits = k.credits ?? 0;
                const low = credits < 500;
                const pct = Math.max(2, Math.min(100, (credits / 5000) * 100));
                const atOn = k.autotopup && k.autotopup.enabled;
                return (
                <div key={k.id} className="border-b px-4 py-3.5 transition-colors last:border-0 hover:bg-white/[0.02]"
                  style={{ borderColor: T.borderSubtle }} data-testid={`key-row-${k.id}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-500" style={{ color: T.text }}>{k.name}</p>
                      <code className="font-mono text-[13px]" style={{ color: T.text2 }}>{k.key}</code>
                      {k.expires_at && (
                        k.expires_at < new Date().toISOString() ? (
                          <span className="ml-3 rounded-sm border px-2 py-0.5 font-mono text-[13.5px] uppercase tracking-wide"
                            style={{ borderColor: "rgba(239,68,68,0.5)", color: "#EF4444" }} data-testid={`key-expired-${k.id}`}>Expired</span>
                        ) : (
                          <span className="ml-3 font-mono text-[13.5px]" style={{ color: T.muted }} data-testid={`key-expires-${k.id}`}>expires {k.expires_at.slice(0, 10)}</span>
                        )
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-5">
                      <span className="hidden font-mono text-[13px] sm:inline" style={{ color: T.text2 }}>
                        {k.request_count} req · {k.token_count} tok
                      </span>
                      <button onClick={() => setEditKey(k)} data-testid={`edit-key-btn-${k.id}`} aria-label="Edit key" title="Edit key — name, expiry, restrictions"
                        className="grid h-8 w-8 place-items-center rounded-sm border transition-colors hover:border-[#00F0FF] hover:text-[#00F0FF]"
                        style={{ borderColor: T.border, color: T.text2 }}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => rotate(k.id)} data-testid={`rotate-key-${k.id}`} aria-label="Rotate key" title="Rotate key — keeps permissions & credits"
                        className="grid h-8 w-8 place-items-center rounded-sm border transition-colors hover:border-[#00F0FF] hover:text-[#00F0FF]"
                        style={{ borderColor: T.border, color: T.text2 }}>
                        <RefreshCw size={13} />
                      </button>
                      <button onClick={() => revoke(k.id)} data-testid={`revoke-key-${k.id}`} aria-label="Revoke key"
                        className="grid h-8 w-8 place-items-center rounded-sm border transition-colors hover:border-[#EF4444] hover:text-[#EF4444]"
                        style={{ borderColor: T.border, color: T.text2 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-3" data-testid={`key-credits-${k.id}`}>
                    <div className="h-1 w-36 overflow-hidden rounded-sm" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full transition-all" style={{ width: `${pct}%`, background: low ? "#EF4444" : credits < 1500 ? "#F59E0B" : "#10B981" }} />
                    </div>
                    <span className="font-mono text-[13px]" style={{ color: low ? "#EF4444" : T.text2 }}>
                      {credits.toLocaleString()} credits
                    </span>
                    {low && (
                      <span className="rounded-sm border px-2 py-0.5 font-mono text-[13.5px] uppercase tracking-wide"
                        style={{ borderColor: "rgba(239,68,68,0.5)", color: "#EF4444" }} data-testid={`key-low-${k.id}`}>
                        Low — top up
                      </span>
                    )}
                    {k.restrict_key && (
                      <span className="rounded-sm border px-2 py-0.5 font-mono text-[13.5px] uppercase tracking-wide"
                        style={{ borderColor: "rgba(0,240,255,0.5)", color: T.accent }} data-testid={`key-restricted-${k.id}`}>
                        Restricted{k.usage_limit_credits ? ` · ${Number(k.usage_limit_credits).toLocaleString()}/${k.credit_refresh_period || "lifetime"}` : ""}
                      </span>
                    )}
                    <button onClick={() => toggleAutoTopup(k)} data-testid={`key-autotopup-${k.id}`}
                      className="rounded-sm border px-2.5 py-0.5 font-mono text-[13.5px] uppercase tracking-wide transition-colors"
                      style={atOn ? { borderColor: "rgba(16,185,129,0.6)", color: "#10B981" } : { borderColor: T.border, color: T.text2 }}>
                      Auto top-up {atOn ? "on" : "off"}
                    </button>
                    {atOn && <span className="font-mono text-[13.5px]" style={{ color: T.muted }}>+{(k.autotopup.amount || 5000).toLocaleString()} @ &lt;{k.autotopup.threshold || 500}</span>}
                    <select value={k.alert_threshold || 500} onChange={(e) => setAlertThreshold(k, e.target.value)}
                      data-testid={`key-alert-threshold-${k.id}`}
                      className="rounded-sm border px-2 py-0.5 font-mono text-[13.5px] uppercase tracking-wide outline-none focus:border-[#00F0FF]"
                      style={{ borderColor: T.border, background: T.surface, color: T.text2 }}>
                      <option value="250">Email alert @ 250</option>
                      <option value="500">Email alert @ 500</option>
                      <option value="1000">Email alert @ 1,000</option>
                      <option value="2500">Email alert @ 2,500</option>
                      <option value="5000">Email alert @ 5,000</option>
                    </select>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </section>

        {/* Quickstart + Playground + Models */}
        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-2" data-testid="dashboard-split">
          <div className="min-w-0" data-testid="dashboard-left-pane">
            <SectionTitle>Playground</SectionTitle>
            <div className="h-[440px]">
              <ChatDemo />
            </div>
          </div>
          <div className="min-w-0" data-testid="dashboard-right-pane">
            <SectionTitle>Quickstart</SectionTitle>
            <p className="-mt-1 mb-4 text-sm" style={{ color: T.text2 }}>
              Copy, paste, and run against the live gateway. Snippets auto-fill your newest key.
            </p>
            <div className="rounded-sm border p-1" style={{ borderColor: T.borderSubtle, background: T.inset }}>
              <CodeTabs apiKey={newKey?.key} />
            </div>
            <div className="mt-8">
              <SectionTitle>Models</SectionTitle>
              <div className="overflow-hidden rounded-sm border" style={{ borderColor: T.border }} data-testid="dashboard-models">
                {MODELS.map((m) => (
                  <div key={m.id} className="flex items-center justify-between border-b px-4 py-3 transition-colors last:border-0 hover:bg-white/[0.02]"
                    style={{ borderColor: T.borderSubtle }}>
                    <div>
                      <p className="text-sm font-500" style={{ color: T.text }}>{m.name}</p>
                      <p className="font-mono text-[13px]" style={{ color: T.muted }}>{m.tier} · {m.ctx} ctx</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <code className="font-mono text-[13px]" style={{ color: T.accent }}>{m.id}</code>
                      <Cpu size={13} style={{ color: T.muted }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Email history */}
        <section className="mt-12">
          <SectionTitle>Email history</SectionTitle>
          <p className="-mt-1 mb-4 text-sm" style={{ color: T.text2 }}>Receipts, alerts and notifications sent to your inbox.</p>
          <div className="overflow-hidden rounded-sm border" style={{ borderColor: T.border }} data-testid="email-history">
            {emails.length === 0 ? (
              <p className="p-5 text-sm" style={{ color: T.text2 }}>No emails yet — statements and low-credit alerts will appear here.</p>
            ) : (
              emails.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-4 border-b px-4 py-2.5 transition-colors last:border-0 hover:bg-white/[0.02]"
                  style={{ borderColor: T.borderSubtle }} data-testid={`email-row-${e.id}`}>
                  <div className="min-w-0">
                    <p className="truncate text-sm" style={{ color: T.text }}>{e.subject}</p>
                    <p className="font-mono text-[13.5px]" style={{ color: T.muted }}>
                      {(e.kind || "").replace(/_/g, " ")} · {(e.ts || "").slice(0, 16).replace("T", " ")}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-sm border px-2.5 py-0.5 font-mono text-[13.5px] uppercase tracking-wide"
                    style={e.ok ? { borderColor: "rgba(16,185,129,0.6)", color: "#10B981" } : { borderColor: "rgba(245,158,11,0.6)", color: "#F59E0B" }}>
                    {e.ok ? "Sent" : "Pending domain"}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Pricing / Credits */}
        <Pricing keys={keys} onPurchased={refresh} walletId={user?.id} />
        </>
        )}
      </div>
      {editKey && <EditKeyModal k={editKey} onClose={() => setEditKey(null)} onSaved={refresh} />}
    </main>
  );
}
