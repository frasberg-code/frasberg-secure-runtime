import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Database, Eye, EyeOff, ArrowRight, Trash2, ChevronLeft, ChevronRight, RefreshCw, Info, ArrowLeft } from "lucide-react";
import { ParallaxSky } from "../components/site/ParallaxSky";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DatabaseManager() {
  const [appName, setAppName] = useState("");
  const [mongoUrl, setMongoUrl] = useState("");
  const [showUrl, setShowUrl] = useState(false);
  const [me, setMe] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [conn, setConn] = useState(null); // {db, collections}
  const [sel, setSel] = useState(null);
  const [docs, setDocs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const LIMIT = 10;

  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: "include" }).then((r) => (r.ok ? r.json() : null)).then(setMe).catch(() => setMe(null));
  }, []);

  const body = (extra = {}) => JSON.stringify({ app_name: appName, mongo_url: mongoUrl, ...extra });
  const post = async (path, extra) => {
    const r = await fetch(`${API}/dbm/${path}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: body(extra),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || "Request failed");
    return d;
  };

  const connect = async () => {
    setBusy(true);
    try {
      const d = await post("connect");
      setConn(d);
      setSel(null);
      toast.success(`Connected to ${d.db} — ${d.collections.length} collections`);
    } catch (e) { toast.error(String(e.message || e)); }
    setBusy(false);
  };

  const loadDocs = async (name, pg = 0) => {
    setSel(name);
    setPage(pg);
    try {
      const d = await post("docs", { collection: name, skip: pg * LIMIT, limit: LIMIT });
      setDocs(d.docs);
      setTotal(d.total);
    } catch (e) { toast.error(String(e.message || e)); }
  };

  const delDoc = async (id) => {
    try {
      await post("delete", { collection: sel, doc_id: id });
      toast.success("Document deleted");
      loadDocs(sel, page);
    } catch (e) { toast.error(String(e.message || e)); }
  };

  const canSubmit = (appName.trim() || mongoUrl.trim()) && !busy;
  const input = "w-full rounded-lg border border-white/20 bg-white/[0.06] px-4 py-3 text-[14.5px] text-white outline-none transition-colors focus:border-cyan-400";

  return (
    <main className="relative min-h-screen text-white" style={{ background: "#08090A" }} data-testid="database-manager-page">
      <ParallaxSky />
      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5" data-testid="dbm-home-link">
            <ArrowLeft size={16} className="text-gray-400" />
            <img src="/luchii-mark-circle.png" alt="Frasberg Luchii" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">Data Manager</span>
          </Link>
          <Link to="/" className="text-[13.5px] text-gray-300 transition-colors hover:text-white" data-testid="dbm-home-text-link">Home</Link>
        </div>
      </header>
      <div className="relative z-10 mx-auto max-w-xl px-5 py-14">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10">
          <Database size={26} className="text-cyan-300" />
        </div>
        <h1 className="mt-5 text-center font-display text-3xl font-700 tracking-tight">Database Manager</h1>
        <p className="mt-2 text-center text-[15px] text-gray-300">View, edit, and manage your app's live data</p>

        {!conn && (
          <div className="mt-9 rounded-2xl border border-white/10 bg-black/30 p-7 backdrop-blur-md" data-testid="dbm-connect-card">
            <label className="block">
              <span className="mb-2 block text-[13.5px] font-600 text-gray-100">App Name</span>
              <input value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="e.g. your-app-name" className={input} data-testid="dbm-app-name" />
              <span className="mt-2 block text-[13.5px] text-gray-400">Copy app name from database details on Frasberg to access preview data</span>
            </label>
            <label className="mt-6 block">
              <span className="mb-2 block text-[13.5px] font-600 text-gray-100">MongoDB URL</span>
              <span className="relative block">
                <input value={mongoUrl} onChange={(e) => setMongoUrl(e.target.value)} type={showUrl ? "text" : "password"}
                  placeholder="mongodb+srv://..." className={`${input} pr-11`} data-testid="dbm-mongo-url" />
                <button type="button" onClick={() => setShowUrl((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" aria-label="Toggle URL visibility" data-testid="dbm-url-toggle">
                  {showUrl ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
              <span className="mt-2 block text-[13.5px] text-gray-400">Copy MongoDB URL from database details on Frasberg to access live data.</span>
            </label>
            <button onClick={connect} disabled={!canSubmit} data-testid="dbm-connect-btn"
              className={`mt-7 flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-[14.5px] font-600 transition-colors ${canSubmit ? "bg-cyan-400 text-black hover:bg-cyan-300" : "bg-white/10 text-gray-500"}`}>
              {busy ? "Connecting…" : "Access Database Securely"} <ArrowRight size={15} />
            </button>
            <p className="mt-4 text-center text-[13.5px] text-gray-400">Provide at least one: App Name or MongoDB URL.</p>
            <div className={`mt-5 flex items-center gap-2 rounded-lg px-4 py-3 text-[13.5px] ${me ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`} data-testid="dbm-auth-note">
              <Info size={14} />
              {me === undefined ? "Checking session…" : me ? `Signed in as ${me.email} — preview and live databases unlocked` : "You can access both preview and live database after logging in"}
            </div>
          </div>
        )}

        {conn && (
          <div className="mt-9 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md" data-testid="dbm-browser">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <p className="text-[14px] font-600">Connected · <span className="font-mono text-cyan-300">{conn.db}</span></p>
              <div className="flex gap-2">
                <button onClick={connect} className="flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-[13.5px] text-gray-300 hover:border-white/40" data-testid="dbm-refresh"><RefreshCw size={12} /> Refresh</button>
                <button onClick={() => { setConn(null); setSel(null); }} className="rounded-md border border-white/15 px-3 py-1.5 text-[13.5px] text-gray-300 hover:border-white/40" data-testid="dbm-disconnect">Disconnect</button>
              </div>
            </div>
            <div className="grid sm:grid-cols-[200px,1fr]">
              <div className="max-h-[480px] overflow-y-auto border-b border-white/10 sm:border-b-0 sm:border-r" data-testid="dbm-collections">
                {conn.collections.map((c) => (
                  <button key={c.name} onClick={() => loadDocs(c.name)} data-testid={`dbm-col-${c.name}`}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] transition-colors ${sel === c.name ? "bg-cyan-400/10 font-600 text-cyan-300" : "text-gray-300 hover:bg-white/[0.04]"}`}>
                    <span className="truncate">{c.name}</span>
                    <span className="ml-2 shrink-0 rounded-full bg-white/10 px-2 py-0.5 font-mono text-[13.5px] text-gray-300">{c.count}</span>
                  </button>
                ))}
              </div>
              <div className="max-h-[480px] overflow-y-auto p-4" data-testid="dbm-docs">
                {!sel && <p className="p-6 text-center text-[14px] text-gray-400">Select a collection to browse its documents</p>}
                {sel && docs.map((d, i) => (
                  <div key={i} className="group mb-3 rounded-lg border border-white/10 bg-white/[0.04] p-3" data-testid={`dbm-doc-${i}`}>
                    <div className="flex items-start justify-between gap-2">
                      <pre className="min-w-0 flex-1 overflow-x-auto whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-gray-300">{JSON.stringify(d, null, 1)}</pre>
                      <button onClick={() => delDoc(String(d._id))} className="shrink-0 rounded-md border border-white/15 p-1.5 text-gray-500 opacity-0 transition-opacity hover:border-red-400 hover:text-red-400 group-hover:opacity-100" aria-label="Delete document" data-testid={`dbm-del-${i}`}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {sel && (
                  <div className="mt-2 flex items-center justify-between text-[13.5px] text-gray-400" data-testid="dbm-pagination">
                    <span>{total} documents · page {page + 1}</span>
                    <span className="flex gap-1">
                      <button disabled={page === 0} onClick={() => loadDocs(sel, page - 1)} className="rounded border border-white/15 p-1.5 disabled:opacity-30" aria-label="Previous page"><ChevronLeft size={13} /></button>
                      <button disabled={(page + 1) * LIMIT >= total} onClick={() => loadDocs(sel, page + 1)} className="rounded border border-white/15 p-1.5 disabled:opacity-30" aria-label="Next page"><ChevronRight size={13} /></button>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
