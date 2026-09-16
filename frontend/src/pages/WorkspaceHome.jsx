import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Home, Plus, ExternalLink, Download, Trash2, Sparkles, FolderKanban, ChevronDown, Check } from "lucide-react";
import { ParallaxSky } from "../components/site/ParallaxSky";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BASE = process.env.REACT_APP_BACKEND_URL;

const T = {
  bg: "var(--dash-bg)", surface: "var(--dash-surface)", inset: "var(--dash-inset)",
  border: "var(--dash-border)", borderSub: "var(--dash-border-sub)",
  text: "var(--dash-text)", text2: "var(--dash-text2)", muted: "var(--dash-muted)", accent: "var(--dash-accent)",
};

function timeAgo(iso) {
  const s = Math.max(1, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.floor(s)} seconds ago`;
  if (s < 3600) return `${Math.floor(s / 60)} minutes ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  return `${Math.floor(s / 86400)} days ago`;
}

export default function WorkspaceHome() {
  const navigate = useNavigate();
  const [apps, setApps] = useState(null);
  const [filter, setFilter] = useState("all");
  const [projects, setProjects] = useState(null);
  const [projMenu, setProjMenu] = useState(false);
  const [newName, setNewName] = useState("");
  const currentProj = (() => { try { return localStorage.getItem("luchii-ws-proj-builder") || null; } catch { return null; } })();

  const load = () => {
    fetch(`${API}/workspace/publishes`).then((r) => r.json())
      .then((d) => setApps(d.publishes || [])).catch(() => setApps([]));
    fetch(`${API}/workspace/projects`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { projects: null }))
      .then((d) => setProjects(d.projects ?? []))
      .catch(() => setProjects([]));
  };
  useEffect(load, []);

  const openProject = (p) => {
    try { localStorage.setItem(`luchii-ws-proj-${p.agent || "builder"}`, p.id); } catch {}
    navigate(`/chat?agent=${p.agent || "builder"}`);
  };

  const createProject = async () => {
    const name = newName.trim() || "New project";
    try {
      const r = await fetch(`${API}/workspace/projects`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: "builder", name }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Sign in to create projects");
      openProject(d);
    } catch (e) { toast.error(String(e.message || e)); }
  };

  const delProject = async (id, e) => {
    e.stopPropagation();
    await fetch(`${API}/workspace/projects/${id}`, { method: "DELETE", credentials: "include" });
    setProjects((p) => (p || []).filter((x) => x.id !== id));
    toast.success("Project deleted");
  };

  const del = async (id) => {
    await fetch(`${API}/workspace/publishes/${id}`, { method: "DELETE" });
    toast.success("App deleted");
    load();
  };

  const download = async (app) => {
    try {
      const html = await fetch(`${BASE}${app.url}`).then((r) => r.text());
      const blob = new Blob([html], { type: "text/html" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${app.title.toLowerCase().replace(/\s+/g, "-")}.html`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Build downloaded");
    } catch { toast.error("Download failed"); }
  };

  const list = (apps || []).filter(() => true);
  const shown = filter === "published" ? list.filter((a) => a.published) : list;

  return (
    <main className="min-h-screen" style={{ background: T.bg, color: T.text }} data-testid="workspace-home-page">
      <ParallaxSky />
      {/* Tab bar */}
      <div className="flex h-12 items-center gap-2 border-b px-3" style={{ borderColor: T.borderSub, background: T.inset }}>
        <Link to="/" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[15px] transition-colors hover:bg-white/[0.05]" style={{ color: T.text2 }} data-testid="apps-site-link">
          <Home size={14} /> Home
        </Link>
        <div className="flex items-center gap-2 rounded-t-md border border-b-0 px-3.5 py-2 text-[15px]" style={{ borderColor: T.border, background: T.surface }}>
          <Sparkles size={12} style={{ color: T.accent }} /> My Apps
        </div>
        <Link to="/chat?model=luchii-70b&agent=architect" className="rounded-md p-1.5 transition-colors hover:bg-white/[0.05]" style={{ color: T.text2 }} aria-label="New build" data-testid="apps-new-tab">
          <Plus size={15} />
        </Link>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-10">
        {/* Project switcher — like Emergent's home */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <button onClick={() => setProjMenu((o) => !o)} data-testid="home-project-switcher"
              className="flex items-center gap-2.5 rounded-full border px-5 py-2.5 text-[15px] font-600 transition-colors hover:bg-white/[0.05]"
              style={{ borderColor: projMenu ? T.accent : T.border, background: T.surface, color: T.text }}>
              <span className="inline-block h-4 w-4 rounded-full" style={{ background: "linear-gradient(135deg,#00f0ff,#6c63ff,#ff6ec7)" }} />
              {(projects || []).find((p) => p.id === currentProj)?.name || "Your Projects"}
              <ChevronDown size={14} style={{ color: T.text2, transform: projMenu ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
            </button>
            {projMenu && (
              <div className="absolute left-1/2 top-12 z-[90] w-80 -translate-x-1/2 rounded-2xl border p-2 shadow-2xl" style={{ borderColor: T.border, background: "rgba(10,14,22,0.98)" }} data-testid="home-project-menu">
                <div className="max-h-64 overflow-y-auto">
                  {projects === null && <p className="px-3 py-2.5 text-[14px]" style={{ color: T.muted }}>Loading…</p>}
                  {projects !== null && projects.length === 0 && (
                    <p className="px-3 py-2.5 text-[14px]" style={{ color: T.muted }}>No projects yet — create one below and every build saves to your account.</p>
                  )}
                  {(projects || []).map((p) => (
                    <button key={p.id} onClick={() => openProject(p)} data-testid={`home-project-row-${p.id}`}
                      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]">
                      <span className="inline-block h-7 w-7 shrink-0 rounded-full" style={{ background: "linear-gradient(135deg,#00f0ff,#6c63ff)" }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px]" style={{ color: T.text }}>{p.name}</span>
                        <span className="block text-[13px]" style={{ color: T.muted }}>
                          Owner · {p.has_build ? "has a build" : "no build yet"} · updated {timeAgo(p.updated_at)}
                        </span>
                      </span>
                      {p.id === currentProj && <Check size={14} style={{ color: T.accent }} />}
                      <button onClick={(e) => delProject(p.id, e)} aria-label="Delete project" data-testid={`home-project-delete-${p.id}`}
                        className="hidden rounded p-1 hover:bg-white/[0.1] group-hover:block" style={{ color: T.muted }}>
                        <Trash2 size={12} />
                      </button>
                    </button>
                  ))}
                </div>
                <div className="mt-1 flex items-center gap-1.5 border-t px-2 pt-2" style={{ borderColor: T.borderSub }}>
                  <FolderKanban size={13} style={{ color: T.text2 }} />
                  <input value={newName} onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") createProject(); }}
                    placeholder="Create new project…" data-testid="home-project-new-input"
                    className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-[14px] outline-none" style={{ color: T.text }} />
                  <button onClick={createProject} data-testid="home-project-create-btn"
                    className="flex items-center gap-1 rounded-md border px-2.5 py-1 text-[13.5px]" style={{ borderColor: T.accent, color: T.accent }}>
                    <Plus size={11} /> Create
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-700 tracking-tight">Your builds</h1>
          <Link to="/chat?model=luchii-70b&agent=architect" data-testid="apps-new-build-btn"
            className="flex items-center gap-1.5 rounded-full px-5 py-2 text-[15px] font-600" style={{ background: T.text, color: T.bg }}>
            <Plus size={14} /> New build
          </Link>
        </div>

        {/* Filter pills */}
        <div className="mt-5 flex gap-2" data-testid="apps-filters">
          {[["all", `All (${list.length})`], ["apps", "Apps"], ["published", "Published"]].map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)} data-testid={`apps-filter-${k}`}
              className="rounded-full border px-4 py-1.5 text-[15.5px] transition-colors"
              style={filter === k ? { background: "rgba(255,255,255,0.1)", borderColor: T.border, color: T.text } : { borderColor: T.border, color: T.text2 }}>
              {label}
            </button>
          ))}
        </div>

        {/* App list */}
        <div className="mt-6 space-y-3" data-testid="apps-list">
          {apps === null && <p className="font-mono text-[15px]" style={{ color: T.muted }}>Loading…</p>}
          {apps !== null && shown.length === 0 && (
            <div className="rounded-lg border p-10 text-center" style={{ borderColor: T.border, background: T.surface }}>
              <p className="text-sm" style={{ color: T.text2 }}>No published apps yet.</p>
              <Link to="/chat?model=luchii-7b&agent=builder" className="mt-4 inline-block rounded-full px-5 py-2 text-[15px] font-600" style={{ background: T.accent, color: T.bg }}>
                Build your first app →
              </Link>
            </div>
          )}
          {shown.map((a) => (
            <div key={a.id} className="flex items-center gap-4 rounded-lg border p-3.5 transition-colors hover:bg-white/[0.02]"
              style={{ borderColor: T.border, background: T.surface }} data-testid={`app-row-${a.id}`}>
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md border" style={{ borderColor: T.borderSub, background: "#fff" }}>
                <iframe title={a.title} src={`${BASE}${a.url}`} loading="lazy" sandbox=""
                  className="pointer-events-none origin-top-left" style={{ width: 480, height: 320, transform: "scale(0.2)" }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-600">{a.title}</p>
                <p className="mt-0.5 font-mono text-[15px]" style={{ color: T.muted }}>
                  Updated {timeAgo(a.updated)} · v{a.version} · {a.hash} · {a.agent}
                </p>
                {a.custom_url && (
                  <a href={`${BASE}${a.slug_url}`} target="_blank" rel="noreferrer" data-testid={`app-custom-url-${a.id}`}
                    className="mt-1 inline-flex items-center gap-1.5 font-mono text-[15px] hover:underline" style={{ color: T.accent }}>
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: T.accent }} />
                    {a.custom_url.replace("https://", "")}
                  </a>
                )}
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[15.5px] uppercase tracking-wide"
                style={{ borderColor: "rgba(16,185,129,0.5)", color: "#10B981" }}>
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#10B981" }} /> Published
              </span>
              <div className="flex shrink-0 gap-1.5">
                <a href={`${BASE}${a.slug_url || a.url}`} target="_blank" rel="noreferrer" aria-label="Open app" data-testid={`app-open-${a.id}`}
                  className="grid h-8 w-8 place-items-center rounded-md border transition-colors hover:border-[#00F0FF]" style={{ borderColor: T.border, color: T.text2 }}>
                  <ExternalLink size={13} />
                </a>
                <button onClick={() => download(a)} aria-label="Download build" data-testid={`app-download-${a.id}`}
                  className="grid h-8 w-8 place-items-center rounded-md border transition-colors hover:border-[#00F0FF]" style={{ borderColor: T.border, color: T.text2 }}>
                  <Download size={13} />
                </button>
                <button onClick={() => del(a.id)} aria-label="Delete app" data-testid={`app-delete-${a.id}`}
                  className="grid h-8 w-8 place-items-center rounded-md border transition-colors hover:border-[#EF4444] hover:text-[#EF4444]" style={{ borderColor: T.border, color: T.text2 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
