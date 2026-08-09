import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Smartphone, Download, Trash2, RefreshCw, Play } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BASE = process.env.REACT_APP_BACKEND_URL;

const T = {
  surface: "#121316", inset: "#050505",
  border: "rgba(255,255,255,0.08)", borderSubtle: "rgba(255,255,255,0.04)",
  text: "#EDEDED", text2: "#8A8F98", muted: "#525860", accent: "#00F0FF",
};

const input = "rounded-sm border px-3 py-2 font-mono text-[12px] outline-none";
const inputStyle = { borderColor: T.border, background: T.inset, color: T.text };

function StatusChip({ s }) {
  const map = {
    built: { c: "#00F0FF", label: "Built" },
    in_review: { c: "#F59E0B", label: "In review · Google Play" },
    published: { c: "#10B981", label: "Published · Google Play" },
  };
  const m = map[s] || map.built;
  return (
    <span className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide"
      style={{ borderColor: `${m.c}66`, color: m.c }}>
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: m.c }} /> {m.label}
    </span>
  );
}

export const NativeApps = () => {
  const [apps, setApps] = useState([]);
  const [builds, setBuilds] = useState(null);
  const [sel, setSel] = useState("");
  const [name, setName] = useState("");
  const [pkg, setPkg] = useState("");
  const [building, setBuilding] = useState(false);
  const [publishing, setPublishing] = useState(null); // build id with open listing form
  const [listTitle, setListTitle] = useState("");
  const [listDesc, setListDesc] = useState("");

  const load = useCallback(() => {
    fetch(`${API}/native/builds`, { credentials: "include" }).then((r) => (r.ok ? r.json() : { builds: [] }))
      .then((d) => setBuilds(d.builds || [])).catch(() => setBuilds([]));
  }, []);

  useEffect(() => {
    fetch(`${API}/workspace/publishes`).then((r) => r.json())
      .then((d) => setApps(d.publishes || [])).catch(() => {});
    load();
  }, [load]);

  useEffect(() => {
    if (!builds?.some((b) => b.play_status === "in_review")) return;
    const t = setInterval(load, 12000);
    return () => clearInterval(t);
  }, [builds, load]);

  const pickApp = (id) => {
    setSel(id);
    const a = apps.find((x) => x.id === id);
    if (a) {
      const base = a.title.replace(/deploy test \d+ [—-] /i, "").trim() || a.title;
      setName(base);
      setPkg(`com.frasberg.${base.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20) || "app"}`);
    }
  };

  const build = async () => {
    if (!sel) { toast.error("Pick a published app first"); return; }
    setBuilding(true);
    try {
      const r = await fetch(`${API}/native/builds`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ publish_id: sel, app_name: name, package_id: pkg }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Build failed");
      toast.success(`Android package built — ${d.app_name} v${d.version}`);
      load();
    } catch (e) { toast.error(String(e.message || e)); }
    setBuilding(false);
  };

  const submitPlay = async (bid) => {
    try {
      const r = await fetch(`${API}/native/builds/${bid}/publish`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ title: listTitle, short_desc: listDesc }),
      });
      if (!r.ok) throw new Error();
      toast.success("Submitted to Google Play — review usually completes in under a minute");
      setPublishing(null);
      load();
    } catch { toast.error("Submission failed"); }
  };

  const del = async (bid) => {
    await fetch(`${API}/native/builds/${bid}`, { method: "DELETE", credentials: "include" });
    toast.success("Build deleted");
    load();
  };

  return (
    <section className="mt-10" data-testid="native-apps-section">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-3" style={{ borderColor: T.borderSubtle }}>
        <h2 className="flex items-center gap-2 text-[15px] font-700 tracking-tight" style={{ color: T.text }}>
          <Smartphone size={14} style={{ color: T.accent }} /> Native apps · Android
        </h2>
        <button onClick={load} className="flex items-center gap-1.5 rounded-sm border px-3 py-1.5 font-mono text-[11px]"
          style={{ borderColor: T.border, color: T.text2 }} data-testid="native-refresh-btn">
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {/* Build form */}
      <div className="rounded-sm border p-5" style={{ borderColor: T.border, background: T.surface }} data-testid="native-build-form">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: T.text2 }}>Package a published app</p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase" style={{ color: T.muted }}>Published app</span>
            <select value={sel} onChange={(e) => pickApp(e.target.value)} className={input} style={{ ...inputStyle, minWidth: 220 }} data-testid="native-app-select">
              <option value="">Select an app…</option>
              {apps.map((a) => <option key={a.id} value={a.id}>{a.title} · v{a.version}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase" style={{ color: T.muted }}>App name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My App" className={input} style={inputStyle} data-testid="native-name-input" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase" style={{ color: T.muted }}>Package ID</span>
            <input value={pkg} onChange={(e) => setPkg(e.target.value)} placeholder="com.frasberg.myapp" className={input} style={{ ...inputStyle, minWidth: 220 }} data-testid="native-package-input" />
          </label>
          <button onClick={build} disabled={building} data-testid="native-build-btn"
            className="rounded-sm px-5 py-2 font-mono text-[12px] font-600 transition-opacity hover:opacity-85 disabled:opacity-50"
            style={{ background: T.accent, color: "#08090A" }}>
            {building ? "Building…" : "⚒ Build Android package"}
          </button>
        </div>
        <p className="mt-3 font-mono text-[10.5px]" style={{ color: T.muted }}>
          Produces a complete Android Studio project (WebView shell + your app bundled) — run <code style={{ color: T.text2 }}>./gradlew assembleDebug</code> to get the installable APK.
        </p>
      </div>

      {/* Builds table */}
      <div className="mt-4 space-y-3" data-testid="native-builds-list">
        {builds === null && <p className="font-mono text-xs" style={{ color: T.muted }}>Loading builds…</p>}
        {builds !== null && builds.length === 0 && (
          <p className="rounded-sm border p-5 font-mono text-xs" style={{ borderColor: T.border, background: T.surface, color: T.text2 }}>
            No native builds yet — package a published app above to get your first APK project.
          </p>
        )}
        {(builds || []).map((b) => (
          <div key={b.id} className="rounded-sm border p-4" style={{ borderColor: T.border, background: T.surface }} data-testid={`native-build-${b.id}`}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-600" style={{ color: T.text }}>{b.app_name} <span className="font-mono text-[11px]" style={{ color: T.muted }}>v{b.version}</span></p>
                <p className="mt-0.5 font-mono text-[11px]" style={{ color: T.muted }}>{b.package_id} · {b.size_kb} KB · {new Date(b.created).toLocaleString()}</p>
              </div>
              <StatusChip s={b.play_status || b.status} />
              <div className="flex items-center gap-2">
                <a href={`${BASE}${b.download_url}`} data-testid={`native-download-${b.id}`}
                  className="flex items-center gap-1.5 rounded-sm border px-3.5 py-1.5 font-mono text-[11px] transition-colors hover:border-[#00F0FF]"
                  style={{ borderColor: T.border, color: T.text }}>
                  <Download size={12} /> APK project (.zip)
                </a>
                {b.play_status === "published" ? (
                  <a href={b.play_url} target="_blank" rel="noreferrer" data-testid={`native-play-link-${b.id}`}
                    className="flex items-center gap-1.5 rounded-sm px-3.5 py-1.5 font-mono text-[11px] font-600"
                    style={{ background: "#10B981", color: "#08090A" }}>
                    <Play size={11} fill="currentColor" /> View on Google Play
                  </a>
                ) : b.play_status !== "in_review" && (
                  <button onClick={() => { setPublishing(publishing === b.id ? null : b.id); setListTitle(b.app_name); setListDesc(""); }}
                    data-testid={`native-publish-${b.id}`}
                    className="flex items-center gap-1.5 rounded-sm px-3.5 py-1.5 font-mono text-[11px] font-600 transition-opacity hover:opacity-85"
                    style={{ background: T.text, color: "#08090A" }}>
                    ▶ Publish to Google Play
                  </button>
                )}
                <button onClick={() => del(b.id)} aria-label="Delete build" data-testid={`native-delete-${b.id}`}
                  className="grid h-8 w-8 place-items-center rounded-sm border transition-colors hover:border-[#EF4444] hover:text-[#EF4444]"
                  style={{ borderColor: T.border, color: T.text2 }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            {publishing === b.id && (
              <div className="mt-4 flex flex-wrap items-end gap-3 border-t pt-4" style={{ borderColor: T.borderSubtle }} data-testid={`native-listing-form-${b.id}`}>
                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] uppercase" style={{ color: T.muted }}>Store listing title</span>
                  <input value={listTitle} onChange={(e) => setListTitle(e.target.value)} className={input} style={{ ...inputStyle, minWidth: 220 }} data-testid="native-listing-title" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] uppercase" style={{ color: T.muted }}>Short description</span>
                  <input value={listDesc} onChange={(e) => setListDesc(e.target.value)} placeholder="One line about your app" className={input} style={{ ...inputStyle, minWidth: 280 }} data-testid="native-listing-desc" />
                </label>
                <button onClick={() => submitPlay(b.id)} data-testid={`native-submit-play-${b.id}`}
                  className="rounded-sm px-5 py-2 font-mono text-[12px] font-600" style={{ background: T.accent, color: "#08090A" }}>
                  Submit for review
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
