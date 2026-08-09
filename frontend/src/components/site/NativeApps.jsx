import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Smartphone, Download, Trash2, RefreshCw, Play, Sparkles, Upload, X } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BASE = process.env.REACT_APP_BACKEND_URL;

const T = {
  surface: "#121316", inset: "#050505",
  border: "rgba(255,255,255,0.08)", borderSubtle: "rgba(255,255,255,0.04)",
  text: "#EDEDED", text2: "#8A8F98", muted: "#525860", accent: "#00F0FF",
};

const input = "rounded-sm border px-3 py-2 font-mono text-[12px] outline-none";
const inputStyle = { borderColor: T.border, background: T.inset, color: T.text };

function StatusChip({ s, ios }) {
  const store = ios ? "App Store" : "Google Play";
  const map = {
    built: { c: "#00F0FF", label: "Built" },
    in_review: { c: "#F59E0B", label: `In review · ${store}` },
    published: { c: "#10B981", label: `Published · ${store}` },
  };
  const m = map[s] || map.built;
  return (
    <span className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide"
      style={{ borderColor: `${m.c}66`, color: m.c }}>
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: m.c }} /> {m.label}
    </span>
  );
}

function StoreListingPreview({ b, title, desc, onChanged }) {
  const ios = b.platform === "ios";
  const shot = `${BASE}/api/workspace/publishes/${b.publish_id}/view`;
  const delShot = async (i) => {
    await fetch(`${API}/native/builds/${b.id}/screenshots/${i}`, { method: "DELETE", credentials: "include" });
    toast.success("Screenshot removed");
    onChanged?.();
  };
  return (
    <div className="w-full max-w-md shrink-0 rounded-xl border p-4" style={{ borderColor: T.border, background: "#0C0D10" }} data-testid={`store-preview-${b.id}`}>
      <p className="mb-3 font-mono text-[9.5px] uppercase tracking-[0.2em]" style={{ color: ios ? "#0A84FF" : "#01B47A" }}>
        {ios ? " App Store — listing preview" : "▶ Google Play — listing preview"}
      </p>
      <div className="flex items-center gap-3">
        {b.has_icon ? (
          <img src={`${BASE}/api/native/builds/${b.id}/icon`} alt="" className={`h-16 w-16 border object-cover ${ios ? "rounded-2xl" : "rounded-xl"}`} style={{ borderColor: T.borderSubtle }} />
        ) : (
          <span className="grid h-16 w-16 place-items-center rounded-xl border text-2xl" style={{ borderColor: T.border }}>{ios ? "" : "🤖"}</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-700" style={{ color: T.text }} data-testid={`store-preview-title-${b.id}`}>{title || b.app_name}</p>
          <p className="truncate text-[12px]" style={{ color: ios ? T.text2 : "#01B47A" }}>{ios ? (desc || "Frasberg Inc.") : "Frasberg Inc."}</p>
          <p className="mt-0.5 text-[10.5px]" style={{ color: T.muted }}>{ios ? "Designed for iPhone" : "Contains no ads · Free"}</p>
        </div>
        <span className="rounded-full px-5 py-1.5 text-[12.5px] font-700" style={{ background: ios ? "#0A84FF" : "#01875F", color: "#fff" }}>
          {ios ? "GET" : "Install"}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 border-y py-2.5 text-center" style={{ borderColor: T.borderSubtle }}>
        {[["4.8 ★", `${(123 + b.version * 7)} ratings`], [ios ? "#12" : "10K+", ios ? "Productivity" : "Downloads"], [ios ? "4+" : "E", ios ? "Age" : "Everyone"]].map(([v, l]) => (
          <div key={l}>
            <p className="text-[13px] font-700" style={{ color: T.text }}>{v}</p>
            <p className="font-mono text-[9px] uppercase" style={{ color: T.muted }}>{l}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1" data-testid={`store-preview-gallery-${b.id}`}>
        {Array.from({ length: b.screenshots || 0 }).map((_, i) => (
          <div key={`up-${i}`} className="relative h-[170px] w-[96px] shrink-0 overflow-hidden rounded-lg border" style={{ borderColor: T.borderSubtle }}>
            <img src={`${BASE}/api/native/builds/${b.id}/screenshots/${i}?n=${b.screenshots}`} alt={`Screenshot ${i + 1}`} className="h-full w-full object-cover" data-testid={`store-shot-${b.id}-${i}`} />
            <button onClick={() => delShot(i)} aria-label="Remove screenshot" data-testid={`store-shot-remove-${b.id}-${i}`}
              className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full" style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}>
              <X size={10} />
            </button>
          </div>
        ))}
        {[0, 1, 2].map((i) => (
          <div key={`auto-${i}`} className="relative h-[170px] w-[96px] shrink-0 overflow-hidden rounded-lg border" style={{ borderColor: T.borderSubtle, background: "#fff" }}>
            <iframe title={`auto-shot-${i}`} src={shot} loading="lazy" sandbox="" className="pointer-events-none absolute left-0 origin-top-left"
              style={{ top: -(i * 170), width: 390, height: 2070, transform: "scale(0.246)" }} />
            <span className="absolute bottom-1 right-1 rounded px-1 font-mono text-[7px] uppercase" style={{ background: "rgba(0,0,0,0.65)", color: "#9aa0a6" }}>live</span>
          </div>
        ))}
        <div className="grid h-[170px] w-[96px] shrink-0 place-items-center rounded-lg border p-2 text-center" style={{ borderColor: T.borderSubtle, background: "linear-gradient(160deg, #101B2E, #06131F)" }}>
          <div>
            {b.has_icon && <img src={`${BASE}/api/native/builds/${b.id}/icon`} alt="" className="mx-auto h-9 w-9 rounded-lg" />}
            <p className="mt-2 text-[10px] font-700 leading-tight" style={{ color: T.text }}>{title || b.app_name}</p>
            <p className="mt-1 text-[7.5px] leading-snug" style={{ color: T.text2 }}>{desc || "Built with Luchii"}</p>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <p className="font-mono text-[9px] uppercase tracking-wide" style={{ color: T.muted }}>About this app</p>
        <p className="mt-1 text-[11px] leading-relaxed" style={{ color: T.text2 }} data-testid={`store-preview-desc-${b.id}`}>
          {desc || "Add a short description to see it here — this is exactly how your listing card will read in the store."}
        </p>
      </div>
    </div>
  );
}

export const NativeApps = () => {
  const [apps, setApps] = useState([]);
  const [builds, setBuilds] = useState(null);
  const [sel, setSel] = useState("");
  const [name, setName] = useState("");
  const [pkg, setPkg] = useState("");
  const [building, setBuilding] = useState(false);
  const [platform, setPlatform] = useState("android");
  const [icon, setIcon] = useState(null);
  const [iconStyle, setIconStyle] = useState("minimal");
  const [genBusy, setGenBusy] = useState(false);
  const iconRef = useRef(null);
  const shotRef = useRef(null);
  const [autoBusy, setAutoBusy] = useState(false);
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

  const onIconFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Icon must be an image (PNG/JPG)"); return; }
    if (f.size > 4_000_000) { toast.error("Icon too large — 4MB max"); return; }
    const reader = new FileReader();
    reader.onload = () => { setIcon(String(reader.result)); toast.success("Icon attached"); };
    reader.readAsDataURL(f);
  };

  const generateIcon = async () => {
    if (!name.trim()) { toast.error("Enter an app name first — the icon is designed around it"); return; }
    setGenBusy(true);
    toast(icon ? "Re-rolling a fresh icon…" : "Designing your launcher icon…", { duration: 8000 });
    try {
      const r = await fetch(`${API}/native/icons/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ app_name: name, style: iconStyle }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Generation failed");
      setIcon(`data:image/png;base64,${d.icon_b64}`);
      toast.success("Launcher icon generated");
    } catch (e) { toast.error(String(e.message || e)); }
    setGenBusy(false);
  };

  const build = async () => {
    if (!sel) { toast.error("Pick a published app first"); return; }
    setBuilding(true);
    try {
      const r = await fetch(`${API}/native/builds`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ publish_id: sel, app_name: name, package_id: pkg, platform, icon_b64: icon || undefined }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Build failed");
      toast.success(`${platform === "ios" ? "Xcode" : "Android"} package built — ${d.app_name} v${d.version}`);
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

  const onShotFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length || !publishing) return;
    for (const f of files.slice(0, 5)) {
      if (!f.type.startsWith("image/")) { toast.error(`${f.name} is not an image`); continue; }
      const b64 = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(f); });
      const r = await fetch(`${API}/native/builds/${publishing}/screenshots`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ image_b64: b64 }),
      });
      if (!r.ok) { toast.error((await r.json()).detail || "Upload failed"); break; }
    }
    toast.success("Screenshots added to the listing");
    load();
  };

  const autowrite = async (bid) => {
    setAutoBusy(true);
    toast("Luchii is reading your app's code…", { duration: 8000 });
    try {
      const r = await fetch(`${API}/native/builds/${bid}/autowrite`, { method: "POST", credentials: "include" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Autowrite failed");
      setListTitle(d.title);
      setListDesc(d.short_desc);
      toast.success("Listing written by Luchii — tweak it or submit");
    } catch (e) { toast.error(String(e.message || e)); }
    setAutoBusy(false);
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
          <Smartphone size={14} style={{ color: T.accent }} /> Native apps · Android & iOS
        </h2>
        <button onClick={load} className="flex items-center gap-1.5 rounded-sm border px-3 py-1.5 font-mono text-[11px]"
          style={{ borderColor: T.border, color: T.text2 }} data-testid="native-refresh-btn">
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {/* Build form */}
      <div className="rounded-sm border p-5" style={{ borderColor: T.border, background: T.surface }} data-testid="native-build-form">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: T.text2 }}>Package a published app</p>
        <div className="mt-3 flex rounded-sm border p-0.5" style={{ borderColor: T.border, width: "fit-content" }} data-testid="native-platform-toggle">
          {[["android", "🤖 Android"], ["ios", " iOS"]].map(([k, label]) => (
            <button key={k} onClick={() => { setPlatform(k); if (sel) { const a = apps.find((x) => x.id === sel); if (a) setPkg((p) => p); } }}
              data-testid={`native-platform-${k}`}
              className="rounded-sm px-4 py-1.5 font-mono text-[11px] transition-colors"
              style={platform === k ? { background: "rgba(255,255,255,0.1)", color: T.text } : { color: T.text2 }}>
              {label}
            </button>
          ))}
        </div>
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
            <span className="font-mono text-[10px] uppercase" style={{ color: T.muted }}>{platform === "ios" ? "Bundle ID" : "Package ID"}</span>
            <input value={pkg} onChange={(e) => setPkg(e.target.value)} placeholder="com.frasberg.myapp" className={input} style={{ ...inputStyle, minWidth: 220 }} data-testid="native-package-input" />
          </label>
          <button onClick={build} disabled={building} data-testid="native-build-btn"
            className="rounded-sm px-5 py-2 font-mono text-[12px] font-600 transition-opacity hover:opacity-85 disabled:opacity-50"
            style={{ background: T.accent, color: "#08090A" }}>
            {building ? "Building…" : platform === "ios" ? "⚒ Build iOS package" : "⚒ Build Android package"}
          </button>
        </div>
        {/* Launcher icon */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4" style={{ borderColor: T.borderSubtle }} data-testid="native-icon-row">
          <span className="font-mono text-[10px] uppercase" style={{ color: T.muted }}>Launcher icon</span>
          {icon ? (
            <span className="relative inline-block">
              <img src={icon} alt="App icon" className="h-12 w-12 rounded-xl border object-cover" style={{ borderColor: T.border }} data-testid="native-icon-preview" />
              <button onClick={() => setIcon(null)} aria-label="Remove icon" data-testid="native-icon-remove"
                className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full border"
                style={{ background: T.inset, borderColor: T.border, color: T.text2 }}>
                <X size={10} />
              </button>
            </span>
          ) : (
            <span className="grid h-12 w-12 place-items-center rounded-xl border font-mono text-[9px]" style={{ borderColor: T.border, color: T.muted }}>none</span>
          )}
          <input ref={iconRef} type="file" hidden accept="image/*" onChange={onIconFile} data-testid="native-icon-file-input" />
          <button onClick={() => iconRef.current?.click()} data-testid="native-icon-upload-btn"
            className="flex items-center gap-1.5 rounded-sm border px-3.5 py-1.5 font-mono text-[11px]"
            style={{ borderColor: T.border, color: T.text2 }}>
            <Upload size={11} /> Upload
          </button>
          <select value={iconStyle} onChange={(e) => setIconStyle(e.target.value)} data-testid="native-icon-style-select"
            className={input} style={inputStyle}>
            <option value="minimal">Minimal</option>
            <option value="playful">Playful</option>
            <option value="gradient">Gradient</option>
          </select>
          <button onClick={generateIcon} disabled={genBusy} data-testid="native-icon-generate-btn"
            className="flex items-center gap-1.5 rounded-sm border px-3.5 py-1.5 font-mono text-[11px] transition-colors hover:border-[#00F0FF] disabled:opacity-50"
            style={{ borderColor: T.border, color: T.accent }}>
            <Sparkles size={11} /> {genBusy ? "Designing…" : icon ? "Re-roll icon" : "Auto-generate with AI"}
          </button>
          <span className="font-mono text-[10.5px]" style={{ color: T.muted }}>Bundled at every density (Android mipmaps / iOS AppIcon 1024)</span>
        </div>
        <p className="mt-3 font-mono text-[10.5px]" style={{ color: T.muted }}>
          {platform === "ios"
            ? <>Produces a complete Xcode project (WKWebView shell + your app bundled) — open in Xcode 15+ and press Run.</>
            : <>Produces a complete Android Studio project (WebView shell + your app bundled) — run <code style={{ color: T.text2 }}>./gradlew assembleDebug</code> to get the installable APK.</>}
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
              {b.has_icon ? (
                <img src={`${BASE}/api/native/builds/${b.id}/icon`} alt="" className="h-10 w-10 rounded-lg border object-cover" style={{ borderColor: T.border }} data-testid={`native-build-icon-${b.id}`} />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-lg border text-[15px]" style={{ borderColor: T.border }}>{b.platform === "ios" ? "" : "🤖"}</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-600" style={{ color: T.text }}>{b.app_name} <span className="font-mono text-[11px]" style={{ color: T.muted }}>v{b.version}</span></p>
                <p className="mt-0.5 font-mono text-[11px]" style={{ color: T.muted }}>{b.platform === "ios" ? " iOS" : "🤖 Android"} · {b.package_id} · {b.size_kb} KB · {new Date(b.created).toLocaleString()}</p>
              </div>
              <StatusChip s={b.play_status || b.status} ios={b.platform === "ios"} />
              <div className="flex items-center gap-2">
                <a href={`${BASE}${b.download_url}`} data-testid={`native-download-${b.id}`}
                  className="flex items-center gap-1.5 rounded-sm border px-3.5 py-1.5 font-mono text-[11px] transition-colors hover:border-[#00F0FF]"
                  style={{ borderColor: T.border, color: T.text }}>
                  <Download size={12} /> {b.platform === "ios" ? "Xcode project (.zip)" : "APK project (.zip)"}
                </a>
                {b.play_status === "published" ? (
                  <a href={b.play_url} target="_blank" rel="noreferrer" data-testid={`native-play-link-${b.id}`}
                    className="flex items-center gap-1.5 rounded-sm px-3.5 py-1.5 font-mono text-[11px] font-600"
                    style={{ background: b.platform === "ios" ? "#3B82F6" : "#10B981", color: "#08090A" }}>
                    <Play size={11} fill="currentColor" /> {b.platform === "ios" ? "View on the App Store" : "View on Google Play"}
                  </a>
                ) : b.play_status !== "in_review" && (
                  <button onClick={() => { setPublishing(publishing === b.id ? null : b.id); setListTitle(b.app_name); setListDesc(""); }}
                    data-testid={`native-publish-${b.id}`}
                    className="flex items-center gap-1.5 rounded-sm px-3.5 py-1.5 font-mono text-[11px] font-600 transition-opacity hover:opacity-85"
                    style={{ background: T.text, color: "#08090A" }}>
                    ▶ {b.platform === "ios" ? "Publish to App Store" : "Publish to Google Play"}
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
              <div className="mt-4 flex flex-wrap gap-5 border-t pt-4" style={{ borderColor: T.borderSubtle }} data-testid={`native-listing-form-${b.id}`}>
                <StoreListingPreview b={b} title={listTitle} desc={listDesc} onChanged={load} />
                <div className="flex min-w-[240px] flex-1 flex-col justify-center gap-3">
                  <button onClick={() => autowrite(b.id)} disabled={autoBusy} data-testid={`native-autowrite-${b.id}`}
                    className="flex w-fit items-center gap-1.5 rounded-sm border px-3.5 py-1.5 font-mono text-[11px] transition-colors hover:border-[#00F0FF] disabled:opacity-50"
                    style={{ borderColor: T.border, color: T.accent }}>
                    <Sparkles size={11} /> {autoBusy ? "Luchii is writing…" : "Autowrite with Luchii"}
                  </button>
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono text-[10px] uppercase" style={{ color: T.muted }}>Store listing title</span>
                    <input value={listTitle} onChange={(e) => setListTitle(e.target.value)} className={input} style={inputStyle} data-testid="native-listing-title" />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono text-[10px] uppercase" style={{ color: T.muted }}>Short description</span>
                    <input value={listDesc} onChange={(e) => setListDesc(e.target.value)} placeholder="One line about your app" className={input} style={inputStyle} data-testid="native-listing-desc" />
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input ref={shotRef} type="file" hidden multiple accept="image/*" onChange={onShotFiles} data-testid="native-shot-file-input" />
                    <button onClick={() => shotRef.current?.click()} data-testid={`native-add-shots-${b.id}`}
                      className="flex items-center gap-1.5 rounded-sm border px-3.5 py-1.5 font-mono text-[11px]"
                      style={{ borderColor: T.border, color: T.text2 }}>
                      <Upload size={11} /> Add screenshots ({b.screenshots || 0}/5)
                    </button>
                    <span className="font-mono text-[9.5px]" style={{ color: T.muted }}>The live frames are captured from your running app automatically</span>
                  </div>
                  <p className="font-mono text-[10px]" style={{ color: T.muted }}>The preview updates live — this is how your card appears {b.platform === "ios" ? "on the App Store" : "on Google Play"}.</p>
                  <button onClick={() => submitPlay(b.id)} data-testid={`native-submit-play-${b.id}`}
                    className="rounded-sm px-5 py-2 font-mono text-[12px] font-600" style={{ background: T.accent, color: "#08090A", width: "fit-content" }}>
                    Submit for review
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
