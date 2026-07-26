import { useState, useEffect, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import { Moon, Sun, ArrowLeft, Loader2, Users, MessagesSquare, KeyRound, BookOpen, Gavel, Activity, Trash2, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
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
  const [editing, setEditing] = useState(null); // null | {id?, title, content, tags}

  const load = useCallback(async () => {
    try {
      const [s, u, c, k] = await Promise.all([
        axios.get(`${API}/admin/stats`, ax),
        axios.get(`${API}/admin/users`, ax),
        axios.get(`${API}/admin/conversations`, ax),
        axios.get(`${API}/admin/knowledge`, ax),
      ]);
      setStats(s.data); setUsers(u.data); setConvos(c.data); setKb(k.data);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    }
  }, []);

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

  const cards = stats ? [
    { icon: Users, label: "Users", value: stats.users },
    { icon: MessagesSquare, label: "Messages", value: stats.messages },
    { icon: Activity, label: "Sessions", value: stats.sessions },
    { icon: Gavel, label: "Court filings", value: stats.court_filings },
    { icon: KeyRound, label: "API keys", value: stats.api_keys },
    { icon: BookOpen, label: "Knowledge docs", value: stats.knowledge_docs },
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
          <button onClick={toggle} aria-label="Toggle theme" className="grid h-10 w-10 place-items-center rounded-full border border-lux-border hover:border-lux-accent hover:text-lux-accent">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
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
