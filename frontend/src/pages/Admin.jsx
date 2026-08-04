import { useState, useEffect, useCallback, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import { Moon, Sun, ArrowLeft, Loader2, Users, MessagesSquare, KeyRound, BookOpen, Gavel, Activity, Trash2, Plus, Pencil, Star, EyeOff, Eye, Globe, Gamepad2, AppWindow, Brain, Hammer, Crown, Timer, Radio, ShieldAlert, RefreshCcw, Lock } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useTheme } from "../context/ThemeContext";
import { useAuth, formatApiErrorDetail } from "../context/AuthContext";
import Starfield from "../components/site/Starfield";
import Seo from "../components/site/Seo";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ax = { withCredentials: true };

export default function Admin() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [convos, setConvos] = useState([]);
  const [kb, setKb] = useState([]);
  const [payments, setPayments] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [editing, setEditing] = useState(null); // null | {id?, title, content, tags}
  const [ops, setOps] = useState(null);
  const lastAlertRef = useRef(null);

  useEffect(() => {
    async function poll() {
      try {
        const r = await axios.get(`${API}/admin/mesh/live`, ax);
        setOps(r.data);
        const newest = r.data.alerts?.[0];
        if (newest && lastAlertRef.current && newest.id !== lastAlertRef.current && newest.type === "tamper") {
          toast.error(`Mesh blocked a tampered message — client ${newest.client_id || "unknown"}`);
        }
        if (newest) lastAlertRef.current = newest.id;
      } catch { /* not admin yet / transient */ }
    }
    poll();
    const timer = setInterval(poll, 5000);
    return () => clearInterval(timer);
  }, []);

  async function rotateKey() {
    if (!window.confirm("Rotate the mesh E2E server key? Clients pick up the new key on their next connection.")) return;
    try {
      const r = await axios.post(`${API}/admin/mesh/rotate-key`, {}, ax);
      toast.success(`New mesh key live: ${r.data.pubkey.slice(0, 16)}…`);
    } catch {
      toast.error("Key rotation failed");
    }
  }

  const load = useCallback(async () => {
    try {
      const [s, u, c, k, p, b] = await Promise.all([
        axios.get(`${API}/admin/stats`, ax),
        axios.get(`${API}/admin/users`, ax),
        axios.get(`${API}/admin/conversations`, ax),
        axios.get(`${API}/admin/knowledge`, ax),
        axios.get(`${API}/admin/cashapp`, ax),
        axios.get(`${API}/admin/builder`, ax),
      ]);
      setStats(s.data); setUsers(u.data); setConvos(c.data); setKb(k.data); setPayments(p.data.payments || []); setBuilds(b.data);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    }
  }, []);

  async function decidePayment(reference, action) {
    try {
      await axios.post(`${API}/admin/cashapp/${reference}/${action}`, {}, ax);
      toast.success(action === "approve" ? "Payment approved — user upgraded to Pro" : "Payment rejected");
      load();
    } catch (err) { toast.error(formatApiErrorDetail(err.response?.data?.detail)); }
  }

  async function curateBuild(id, patch) {
    try {
      await axios.patch(`${API}/admin/builder/${id}`, patch, ax);
      setBuilds((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
      toast.success(patch.hidden === true ? "Build hidden from gallery" : patch.hidden === false ? "Build visible in gallery" : patch.featured ? "Build featured" : "Feature removed");
    } catch (err) { toast.error(formatApiErrorDetail(err.response?.data?.detail)); }
  }

  useEffect(() => { if (user?.role === "admin") load(); }, [user, load]);

  if (user === false) return <Navigate to="/auth?mode=login&next=%2Fadmin" replace />;
  if (user && user.role !== "admin") {
    return (
      <main className="grid min-h-screen place-items-center bg-lux-bg text-lux-text" data-testid="admin-denied">
        <div className="text-center">
          <p className="font-display text-2xl font-700">Admin access required</p>
          <Link to="/" className="mt-4 inline-block text-sm text-lux-accent underline">Back to Luchii</Link>
        </div>
      </main>
    );
  }

  async function saveKb(e) {
    e.preventDefault();
    try {
      const body = { title: editing.title, content: editing.content, tags: (editing.tagsText || "").split(",").map((t) => t.trim()).filter(Boolean) };
      if (editing.id) await axios.put(`${API}/admin/knowledge/${editing.id}`, body, ax);
      else await axios.post(`${API}/admin/knowledge`, body, ax);
      toast.success("Knowledge saved");
      setEditing(null);
      load();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    }
  }

  async function deleteKb(id) {
    try { await axios.delete(`${API}/admin/knowledge/${id}`, ax); load(); } catch { toast.error("Delete failed"); }
  }

  const fmtUptime = (s) => {
    if (s == null) return "—";
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const cards = stats ? [
    { icon: Users, label: "Users", value: stats.users },
    { icon: MessagesSquare, label: "Messages", value: stats.messages },
    { icon: Activity, label: "Sessions", value: stats.sessions },
    { icon: Gavel, label: "Court filings", value: stats.court_filings },
    { icon: KeyRound, label: "API keys", value: stats.api_keys },
    { icon: BookOpen, label: "Knowledge docs", value: stats.knowledge_docs },
    { icon: Brain, label: "Vault memories", value: stats.memories },
    { icon: Hammer, label: "Builds", value: stats.builds },
    { icon: Crown, label: "Paid users", value: stats.paid_users },
    { icon: Timer, label: "Mesh uptime", value: fmtUptime(stats.uptime_seconds) },
  ] : [];

  return (
    <main className="relative z-10 min-h-screen bg-lux-bg text-lux-text" data-testid="admin-page">
      <Seo title="Admin Console — Luchii by Frasberg" description="Frasberg admin control panel." />
      <div className="pointer-events-none absolute inset-0 opacity-40"><Starfield /></div>

      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" data-testid="admin-home-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <img src="/luchii-logo.webp" alt="Frasberg" className="h-8 w-8 rounded-full ring-1 ring-lux-accent/40" />
            <span className="font-display text-lg font-700 tracking-tight">Admin Console</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/status" data-testid="admin-status-link"
              className="rounded-full border border-lux-border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-lux-text2 transition-colors hover:border-lux-accent hover:text-lux-accent">
              System Status
            </Link>
            <button onClick={toggle} aria-label="Toggle theme" className="grid h-10 w-10 place-items-center rounded-full border border-lux-border hover:border-lux-accent hover:text-lux-accent">
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-8">
        {!stats ? (
          <div className="grid h-64 place-items-center"><Loader2 size={26} className="animate-spin text-lux-accent" /></div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h1 className="font-display text-3xl font-700 tracking-tighter sm:text-4xl">System health</h1>
              <span className={`rounded-full border px-4 py-1.5 font-mono text-xs ${stats.upstream_active ? "border-green-500 text-green-400" : "border-lux-border text-lux-text2"}`} data-testid="admin-upstream-status">
                Upstream: {stats.upstream_active ? "LIVE (frasberg servers)" : "fallback engine"}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6" data-testid="admin-stats">
              {cards.map((c) => (
                <div key={c.label} className="rounded-2xl border border-lux-border bg-lux-surface p-5">
                  <c.icon size={17} className="text-lux-accent" />
                  <p className="mt-3 font-display text-2xl font-700">{c.value}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-lux-text2">{c.label}</p>
                </div>
              ))}
            </div>

            <section className="mt-12" data-testid="admin-live-ops">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-2xl font-700 tracking-tight">Live Ops</h2>
                  <span className="flex items-center gap-1.5 rounded-full border border-green-500/40 px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-green-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" /> polling 5s
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Link to="/admin/mesh" data-testid="admin-mesh-center-link"
                    className="flex items-center gap-2 rounded-full border border-lux-accent/60 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-lux-accent transition-colors hover:bg-lux-accent hover:text-white">
                    <Radio size={13} /> Mesh Control Center
                  </Link>
                  <button onClick={rotateKey} data-testid="admin-rotate-key-btn"
                    className="flex items-center gap-2 rounded-full border border-lux-border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-lux-text2 transition-colors hover:border-lux-accent hover:text-lux-accent">
                    <RefreshCcw size={13} /> Rotate E2E Key
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { icon: Radio, label: "Active connections", value: ops?.active_clients ?? "—", tid: "ops-active" },
                  { icon: Lock, label: "E2E frames", value: ops?.stats?.e2e_frames ?? "—", tid: "ops-e2e" },
                  { icon: MessagesSquare, label: "Mesh messages", value: ops ? ops.stats.messages_in + ops.stats.messages_out : "—", tid: "ops-messages" },
                  { icon: ShieldAlert, label: "Tamper blocked", value: ops?.stats?.tamper_attempts ?? "—", tid: "ops-tamper" },
                ].map((c) => (
                  <div key={c.label} className="rounded-2xl border border-lux-border bg-lux-surface p-5" data-testid={c.tid}>
                    <c.icon size={17} className={c.tid === "ops-tamper" && ops?.stats?.tamper_attempts > 0 ? "text-red-400" : "text-lux-accent"} />
                    <p className="mt-3 font-display text-2xl font-700">{c.value}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-lux-text2">{c.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-lux-border bg-lux-surface p-5" data-testid="ops-clients">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-lux-text2">Connected mesh clients</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(ops?.client_ids || []).length === 0 ? (
                      <span className="font-mono text-xs text-lux-text2">No live WebSocket clients right now</span>
                    ) : ops.client_ids.map((id) => (
                      <span key={id} className="rounded-full border border-lux-border px-3 py-1 font-mono text-xs text-lux-text">{id}</span>
                    ))}
                  </div>
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-wide text-lux-text2">E2E public key</p>
                  <p className="mt-1 break-all font-mono text-xs text-lux-accent" data-testid="ops-pubkey">{ops?.e2e_pubkey || "—"}</p>
                </div>
                <div className="rounded-2xl border border-lux-border bg-lux-surface p-5" data-testid="ops-alerts">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-lux-text2">Security alerts</p>
                  <div className="mt-3 space-y-2">
                    {(ops?.alerts || []).length === 0 ? (
                      <span className="font-mono text-xs text-lux-text2">No alerts — mesh integrity clean</span>
                    ) : ops.alerts.slice(0, 6).map((a) => (
                      <div key={a.id} className="flex items-start gap-2.5 rounded-xl border border-lux-border p-3">
                        <ShieldAlert size={14} className={a.type === "tamper" ? "mt-0.5 shrink-0 text-red-400" : "mt-0.5 shrink-0 text-lux-accent"} />
                        <div className="min-w-0">
                          <p className="text-xs text-lux-text">{a.detail}</p>
                          <p className="mt-0.5 font-mono text-[10px] text-lux-text2">{a.type} · {a.client_id} · {(a.ts || "").slice(0, 19).replace("T", " ")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-12" data-testid="admin-revenue-panel">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-700 tracking-tight">Revenue</h2>
                <span className="rounded-full border border-lux-accent/40 px-4 py-1.5 font-mono text-xs text-lux-accent" data-testid="admin-revenue-total">
                  ${(stats.revenue_total ?? 0).toFixed(2)} all-time
                </span>
              </div>
              <div className="mt-4 rounded-2xl border border-lux-border bg-lux-surface p-5" style={{ height: 280 }} data-testid="admin-revenue-chart">
                {(stats.revenue_monthly || []).length === 0 ? (
                  <div className="grid h-full place-items-center font-mono text-xs uppercase tracking-wide text-lux-text2">
                    No confirmed payments yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.revenue_monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(140,140,170,0.15)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#8a86a3" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#8a86a3" tickFormatter={(v) => `$${v}`} width={54} />
                      <Tooltip
                        formatter={(v) => [`$${Number(v).toFixed(2)}`, "Revenue"]}
                        cursor={{ fill: "rgba(140,140,170,0.08)" }}
                        contentStyle={{ background: "#111018", border: "1px solid #2a2740", borderRadius: 12, fontSize: 12 }}
                      />
                      <Bar dataKey="revenue" fill="#7c6cf0" radius={[6, 6, 0, 0]} maxBarSize={56} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="mt-12">
              <h2 className="font-display text-2xl font-700 tracking-tight">Users</h2>
              <div className="mt-4 overflow-x-auto rounded-2xl border border-lux-border" data-testid="admin-users-table">
                <table className="w-full text-left text-sm">
                  <thead className="bg-lux-surface font-mono text-[10px] uppercase tracking-wide text-lux-text2">
                    <tr><th className="p-3">Email</th><th className="p-3">Name</th><th className="p-3">Plan</th><th className="p-3">Role</th><th className="p-3">Joined</th></tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-lux-border">
                        <td className="p-3 text-lux-text">{u.email}</td>
                        <td className="p-3 text-lux-text2">{u.name}</td>
                        <td className="p-3"><span className={u.plan === "pro" ? "text-lux-accent" : "text-lux-text2"}>{u.plan}</span></td>
                        <td className="p-3 text-lux-text2">{u.role}</td>
                        <td className="p-3 font-mono text-xs text-lux-text2">{(u.created_at || "").slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-12">
              <h2 className="font-display text-2xl font-700 tracking-tight">Recent conversations</h2>
              <div className="mt-4 space-y-2" data-testid="admin-conversations">
                {convos.map((c) => (
                  <div key={c.session_id} className="flex items-center justify-between gap-4 rounded-xl border border-lux-border bg-lux-surface/60 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{c.title}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-lux-text2">{c.user_email} · {c.count} msgs · {c.model}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-lux-text2">{(c.last_ts || "").slice(0, 16).replace("T", " ")}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-12">
              <h2 className="font-display text-2xl font-700 tracking-tight">Cash App payments</h2>
              <div className="mt-4 space-y-2" data-testid="admin-cashapp">
                {payments.length === 0 && <p className="text-sm text-lux-text2">No Cash App payments yet.</p>}
                {payments.map((p) => (
                  <div key={p.reference} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-lux-border bg-lux-surface/60 px-4 py-3" data-testid={`admin-cashapp-${p.reference}`}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-600">{p.plan_name} · ${p.amount} <span className="font-mono text-[11px] text-lux-accent">{p.reference}</span></p>
                      <p className="mt-0.5 font-mono text-[10px] text-lux-text2">{p.user_email} · from {p.sender_cashtag || "—"} {p.note ? `· "${p.note}"` : ""}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase ${
                        p.status === "approved" ? "border-green-500 text-green-400" :
                        p.status === "pending_review" ? "border-amber-500 text-amber-400" :
                        p.status === "rejected" ? "border-red-500 text-red-400" : "border-lux-border text-lux-text2"}`}>
                        {p.status.replace("_", " ")}
                      </span>
                      {p.status === "pending_review" && (
                        <>
                          <button onClick={() => decidePayment(p.reference, "approve")} data-testid={`admin-cashapp-approve-${p.reference}`}
                            className="rounded-full bg-green-500/90 px-4 py-1.5 text-xs font-600 text-black hover:bg-green-400">Approve</button>
                          <button onClick={() => decidePayment(p.reference, "reject")} data-testid={`admin-cashapp-reject-${p.reference}`}
                            className="rounded-full border border-lux-border px-4 py-1.5 text-xs text-lux-text2 hover:border-red-400 hover:text-red-400">Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-12">
              <h2 className="font-display text-2xl font-700 tracking-tight">Builder gallery curation</h2>
              <p className="mt-1 text-sm text-lux-text2">Feature the best builds or hide ones that shouldn't appear in the public gallery.</p>
              <div className="mt-4 space-y-2" data-testid="admin-gallery">
                {builds.length === 0 && <p className="text-sm text-lux-text2">No published builds yet.</p>}
                {builds.map((b) => (
                  <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-lux-border bg-lux-surface/60 px-4 py-3" data-testid={`admin-build-${b.slug}`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="text-lux-text2">{b.type === "game" ? <Gamepad2 size={15} /> : b.type === "app" ? <AppWindow size={15} /> : <Globe size={15} />}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-600">{b.title}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-lux-text2">/{b.slug} · {b.plays || 0} plays{b.custom_domain ? ` · ${b.custom_domain}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {b.hidden && <span className="rounded-full border border-red-500 px-3 py-1 font-mono text-[10px] uppercase text-red-400">hidden</span>}
                      {b.featured && !b.hidden && <span className="rounded-full border border-lux-accent px-3 py-1 font-mono text-[10px] uppercase text-lux-accent">featured</span>}
                      <button onClick={() => curateBuild(b.id, { featured: !b.featured })} data-testid={`admin-build-feature-${b.slug}`}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs ${b.featured ? "border-lux-accent text-lux-accent" : "border-lux-border text-lux-text2 hover:border-lux-accent hover:text-lux-text"}`}>
                        <Star size={12} /> {b.featured ? "Unfeature" : "Feature"}
                      </button>
                      <button onClick={() => curateBuild(b.id, { hidden: !b.hidden })} data-testid={`admin-build-hide-${b.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-lux-border px-4 py-1.5 text-xs text-lux-text2 hover:border-red-400 hover:text-red-400">
                        {b.hidden ? <><Eye size={12} /> Show</> : <><EyeOff size={12} /> Hide</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-12 pb-16">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-700 tracking-tight">Knowledge base</h2>
                <button onClick={() => setEditing({ title: "", content: "", tagsText: "" })} data-testid="admin-kb-add-btn"
                  className="inline-flex items-center gap-2 rounded-full bg-lux-text px-5 py-2 text-sm font-600 text-lux-bg hover:-translate-y-0.5 transition-transform">
                  <Plus size={15} /> Add document
                </button>
              </div>
              <p className="mt-2 text-sm text-lux-text2">Luchii answers from these documents first (RAG). Edit them to teach her.</p>

              {editing && (
                <form onSubmit={saveKb} className="mt-5 space-y-3 rounded-2xl border border-lux-accent/50 bg-lux-surface p-6" data-testid="admin-kb-form">
                  <input required value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    placeholder="Title" data-testid="admin-kb-title"
                    className="w-full rounded-xl border border-lux-border bg-lux-bg px-4 py-2.5 text-sm outline-none focus:border-lux-accent" />
                  <textarea required rows={6} value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                    placeholder="Content Luchii should know…" data-testid="admin-kb-content"
                    className="w-full rounded-xl border border-lux-border bg-lux-bg px-4 py-2.5 text-sm outline-none focus:border-lux-accent" />
                  <input value={editing.tagsText} onChange={(e) => setEditing({ ...editing, tagsText: e.target.value })}
                    placeholder="tags, comma, separated" data-testid="admin-kb-tags"
                    className="w-full rounded-xl border border-lux-border bg-lux-bg px-4 py-2.5 text-sm outline-none focus:border-lux-accent" />
                  <div className="flex gap-3">
                    <button type="submit" data-testid="admin-kb-save" className="rounded-full bg-lux-text px-6 py-2.5 text-sm font-600 text-lux-bg">Save</button>
                    <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-lux-border px-6 py-2.5 text-sm text-lux-text2">Cancel</button>
                  </div>
                </form>
              )}

              <div className="mt-5 space-y-2" data-testid="admin-kb-list">
                {kb.map((d) => (
                  <div key={d.id} className="flex items-start justify-between gap-4 rounded-xl border border-lux-border bg-lux-surface/60 p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-600 text-lux-text">{d.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-lux-text2">{d.content}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button onClick={() => setEditing({ id: d.id, title: d.title, content: d.content, tagsText: (d.tags || []).join(", ") })}
                        aria-label="Edit" data-testid={`admin-kb-edit-${d.id}`}
                        className="grid h-8 w-8 place-items-center rounded-full border border-lux-border text-lux-text2 hover:border-lux-accent hover:text-lux-accent">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteKb(d.id)} aria-label="Delete" data-testid={`admin-kb-delete-${d.id}`}
                        className="grid h-8 w-8 place-items-center rounded-full border border-lux-border text-lux-text2 hover:border-red-400 hover:text-red-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
