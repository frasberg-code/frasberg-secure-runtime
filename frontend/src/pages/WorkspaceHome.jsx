import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Home, Plus, ExternalLink, Download, Trash2, Sparkles } from "lucide-react";
import { ParallaxSky } from "../components/site/ParallaxSky";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BASE = process.env.REACT_APP_BACKEND_URL;

const T = {
  bg: "#08090A", surface: "#121316", inset: "#050505",
  border: "rgba(255,255,255,0.08)", borderSub: "rgba(255,255,255,0.05)",
  text: "#EDEDED", text2: "#8A8F98", muted: "#525860", accent: "#00F0FF",
};

function timeAgo(iso) {
  const s = Math.max(1, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.floor(s)} seconds ago`;
  if (s < 3600) return `${Math.floor(s / 60)} minutes ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  return `${Math.floor(s / 86400)} days ago`;
}

export default function WorkspaceHome() {
  const [apps, setApps] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = () => {
    fetch(`${API}/workspace/publishes`).then((r) => r.json())
      .then((d) => setApps(d.publishes || [])).catch(() => setApps([]));
  };
  useEffect(load, []);

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
        <Link to="/" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors hover:bg-white/[0.05]" style={{ color: T.text2 }} data-testid="apps-site-link">
          <Home size={14} /> Home
        </Link>
        <div className="flex items-center gap-2 rounded-t-md border border-b-0 px-3.5 py-2 text-[13px]" style={{ borderColor: T.border, background: T.surface }}>
          <Sparkles size={12} style={{ color: T.accent }} /> My Apps
        </div>
        <Link to="/coding-agents" className="rounded-md p-1.5 transition-colors hover:bg-white/[0.05]" style={{ color: T.text2 }} aria-label="New build" data-testid="apps-new-tab">
          <Plus size={15} />
        </Link>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-700 tracking-tight">Your builds</h1>
          <Link to="/coding-agents" data-testid="apps-new-build-btn"
            className="flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-600" style={{ background: T.text, color: T.bg }}>
            <Plus size={14} /> New build
          </Link>
        </div>

        {/* Filter pills */}
        <div className="mt-5 flex gap-2" data-testid="apps-filters">
          {[["all", `All (${list.length})`], ["apps", "Apps"], ["published", "Published"]].map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)} data-testid={`apps-filter-${k}`}
              className="rounded-full border px-4 py-1.5 text-[13.5px] transition-colors"
              style={filter === k ? { background: "rgba(255,255,255,0.1)", borderColor: T.border, color: T.text } : { borderColor: T.border, color: T.text2 }}>
              {label}
            </button>
          ))}
        </div>

        {/* App list */}
        <div className="mt-6 space-y-3" data-testid="apps-list">
          {apps === null && <p className="font-mono text-[13px]" style={{ color: T.muted }}>Loading…</p>}
          {apps !== null && shown.length === 0 && (
            <div className="rounded-lg border p-10 text-center" style={{ borderColor: T.border, background: T.surface }}>
              <p className="text-sm" style={{ color: T.text2 }}>No published apps yet.</p>
              <Link to="/chat?model=luchii-7b&agent=builder" className="mt-4 inline-block rounded-full px-5 py-2 text-[13px] font-600" style={{ background: T.accent, color: T.bg }}>
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
                <p className="mt-0.5 font-mono text-[13px]" style={{ color: T.muted }}>
                  Updated {timeAgo(a.updated)} · v{a.version} · {a.hash} · {a.agent}
                </p>
                {a.custom_url && (
                  <a href={`${BASE}${a.slug_url}`} target="_blank" rel="noreferrer" data-testid={`app-custom-url-${a.id}`}
                    className="mt-1 inline-flex items-center gap-1.5 font-mono text-[13px] hover:underline" style={{ color: T.accent }}>
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: T.accent }} />
                    {a.custom_url.replace("https://", "")}
                  </a>
                )}
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[13.5px] uppercase tracking-wide"
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
