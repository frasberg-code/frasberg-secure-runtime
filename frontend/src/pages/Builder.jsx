import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Moon, Sun, ArrowLeft, Loader2, Globe, Gamepad2, AppWindow, LayoutTemplate, Rocket, Download, Trash2, ExternalLink, Sparkles, X, Link2, BadgeCheck, Share2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import Starfield from "../components/site/Starfield";
import Seo from "../components/site/Seo";
import Footer from "../components/site/Footer";
import { BuilderShowreel } from "../components/site/BuilderShowreel";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SUB = "Describe your idea — build websites, games & apps with Luchii. Publish to the public Gallery with one tap; upgrade to Luchii Pro to attach your own domain and unlock more daily builds.";

const COPY = {
  website: {
    title: "Luchii Website Builder",
    Icon: Globe,
    sub: SUB,
    placeholder: "Describe the website you want… e.g. 'A dark portfolio site for a photographer named Aria with a gallery and contact form'",
    examples: ["A landing page for a coffee roastery called Ember & Oak", "A sleek SaaS homepage for an AI note-taking app"],
  },
  game: {
    title: "Luchii Game Builder",
    Icon: Gamepad2,
    sub: SUB,
    placeholder: "Describe the game you want… e.g. 'A neon space shooter where I dodge asteroids and collect stars'",
    examples: ["A snake game with a synthwave look", "A brick-breaker game with power-ups"],
  },
  app: {
    title: "Luchii App Builder",
    Icon: AppWindow,
    sub: SUB,
    placeholder: "Describe the mobile app you want… e.g. 'A budget tracker with categories, monthly totals and a spending chart'",
    examples: ["A todo app with projects, due dates and dark mode", "A pomodoro focus timer with session history"],
  },
  landing: {
    title: "Luchii",
    Icon: LayoutTemplate,
    sub: SUB,
    placeholder: "Describe the landing page you want… e.g. 'A launch page for a smart water bottle called Hydra with pre-order CTA'",
    examples: ["A waitlist landing page for an AI recipe app", "A launch page for a productivity course with pricing tiers"],
  },
};

const GAME_TEMPLATES = [
  { id: "fps", label: "FPS Arena", prompt: "A 3D first-person shooter arena game: WASD movement, mouse look with pointer lock, click to shoot glowing enemies that chase the player, waves that get progressively harder, score/health/ammo HUD, dark neon arena aesthetic with purple accents" },
  { id: "platformer", label: "Platformer", prompt: "A polished 2D side-scrolling platformer: arrow keys to run and jump between floating platforms, collect spinning coins, avoid spike traps and patrolling enemies, 3 increasingly difficult levels, lives and score HUD, bright colorful cartoon style with parallax background" },
  { id: "puzzle", label: "Puzzle", prompt: "A sliding-tile number puzzle game: 3x3 and 4x4 grid modes, click or arrow keys to slide tiles into the empty slot, move counter and timer, shuffle button, satisfying win celebration animation, clean minimal design with smooth tile transitions" },
];

const BUILDER_TYPES = [
  { id: "website", label: "Website", Icon: Globe },
  { id: "app", label: "Mobile App", Icon: AppWindow },
  { id: "game", label: "Game", Icon: Gamepad2 },
  { id: "landing", label: "Landing Page", Icon: LayoutTemplate },
];

function ProGateModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" data-testid="builder-pro-modal">
      <div className="glass w-full max-w-sm rounded-3xl border border-lux-border bg-lux-surface p-7 text-center">
        <button onClick={onClose} aria-label="Close" data-testid="builder-pro-modal-close" className="float-right text-lux-text2 hover:text-lux-text"><X size={17} /></button>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-lux-accent/50 text-lux-accent"><Rocket size={20} /></span>
        <p className="mt-4 font-display text-xl font-700 tracking-tight text-lux-text">Luchii Pro required</p>
        <p className="mt-2 text-sm leading-relaxed text-lux-text2">
          Attaching a custom domain and higher daily build limits are Luchii Pro features.
        </p>
        <Link to="/pay" data-testid="builder-pro-upgrade"
          className="mt-5 inline-block w-full rounded-full bg-lux-accent px-6 py-3 text-sm font-600 text-lux-bg transition-transform hover:-translate-y-0.5">
          Upgrade to Luchii Pro
        </Link>
      </div>
    </div>
  );
}

export default function Builder({ type = "website" }) {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const c = COPY[type];
  const [prompt, setPrompt] = useState("");
  const [html, setHtml] = useState("");
  const [busy, setBusy] = useState(false);
  const [chars, setChars] = useState(0);
  const [current, setCurrent] = useState(null);
  const [projects, setProjects] = useState([]);
  const [quota, setQuota] = useState(null);
  const [proModal, setProModal] = useState(false);
  const [domainInput, setDomainInput] = useState("");
  const [dns, setDns] = useState(null);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyChecks, setVerifyChecks] = useState(null);
  const htmlRef = useRef("");
  const [searchParams, setSearchParams] = useSearchParams();
  const remixDone = useRef(false);
  const [demos, setDemos] = useState([]);
  const [demo, setDemo] = useState(null);

  useEffect(() => {
    fetch(`${API}/builder/gallery`).then((r) => r.json()).then((d) => setDemos([...d.filter((b) => b.featured), ...d.filter((b) => !b.featured)].slice(0, 8))).catch(() => {});
  }, []);

  async function openDemo(b) {
    try {
      const res = await fetch(`${API}/p/${b.slug}`);
      if (!res.ok) throw new Error();
      const code = await res.text();
      setCurrent(null); setDns(null); setDemo(b); setHtml(code);
      toast.success(`"${b.title}" loaded — it's live below, try it`);
    } catch { toast.error("Could not load this demo"); }
  }

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch(`${API}/builder/projects?type=${type}`, { credentials: "include" });
      if (res.ok) setProjects(await res.json());
    } catch {}
  }, [type]);

  const loadQuota = useCallback(async () => {
    try {
      const res = await fetch(`${API}/builder/quota`, { credentials: "include" });
      if (res.ok) setQuota(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    setHtml(""); setCurrent(null); setPrompt(""); setDns(null); setDemo(null);
    if (user) { loadProjects(); loadQuota(); }
  }, [user, type, loadProjects, loadQuota]);

  async function openProject(p) {
    try {
      const res = await fetch(`${API}/builder/projects/${p.id}`, { credentials: "include" });
      if (res.ok) {
        const d = await res.json();
        setCurrent(d); setHtml(d.html); setDns(null);
      }
    } catch {}
  }

  useEffect(() => {
    const slug = searchParams.get("remix");
    if (!slug || !user || remixDone.current) return;
    remixDone.current = true;
    (async () => {
      try {
        const res = await fetch(`${API}/builder/remix`, {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
          body: JSON.stringify({ slug }),
        });
        if (!res.ok) throw new Error();
        const d = await res.json();
        await openProject({ id: d.id });
        loadProjects();
        toast.success(`"${d.title}" is loaded — describe a change to make it yours`);
        setSearchParams({}, { replace: true });
      } catch { toast.error("Could not remix this build"); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, searchParams]);

  async function deleteProject(p, e) {
    e.stopPropagation();
    try {
      await fetch(`${API}/builder/projects/${p.id}`, { method: "DELETE", credentials: "include" });
      if (current?.id === p.id) { setCurrent(null); setHtml(""); }
      loadProjects();
      toast.success("Project deleted");
    } catch {}
  }

  async function generate(overridePrompt) {
    const p = (typeof overridePrompt === "string" ? overridePrompt : prompt).trim();
    if (!p || busy) return;
    if (!user) { navigate(`/auth?mode=login&next=%2F${type}-builder`); return; }
    setBusy(true); setChars(0);
    let receivedAny = false;
    const attempt = async () => {
      htmlRef.current = "";
      const res = await fetch(`${API}/builder/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ prompt: p, type, project_id: current?.id || null }),
      });
      if (res.status === 429) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.detail || "Daily build limit reached");
        setProModal(true);
        return;
      }
      if (res.status === 401) { navigate(`/auth?mode=login&next=%2F${type}-builder`); return; }
      if (!res.ok || !res.body) throw new Error("generate failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();
        for (const part of parts) {
          const l = part.trim();
          if (!l.startsWith("data:")) continue;
          let d; try { d = JSON.parse(l.slice(5).trim()); } catch { continue; }
          if (d.delta) { receivedAny = true; htmlRef.current += d.delta; setChars(htmlRef.current.length); }
          if (d.error) { toast.error(d.error); return; }
          if (d.done) {
            receivedAny = true;
            const projRes = await fetch(`${API}/builder/projects/${d.project.id}`, { credentials: "include" });
            if (projRes.ok) {
              const proj = await projRes.json();
              setCurrent(proj); setHtml(proj.html);
            }
            setQuota((q) => q ? { ...q, used: d.generations_used } : q);
            setPrompt("");
            loadProjects();
            toast.success(current ? "Build updated" : "Build complete");
          }
        }
      }
    };
    try {
      try {
        await attempt();
      } catch (e1) {
        if (receivedAny) throw e1;
        await new Promise((r) => setTimeout(r, 1500));
        await attempt();
      }
    } catch {
      toast.error("The Builder engine hit a snag — please try again");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!current) return;
    try {
      const res = await fetch(`${API}/builder/projects/${current.id}/publish`, { method: "POST", credentials: "include" });
      if (res.status === 402) { setProModal(true); return; }
      if (!res.ok) throw new Error();
      const d = await res.json();
      setCurrent((cur) => ({ ...cur, published: true, slug: d.slug }));
      loadProjects();
      toast.success("Published! Your build is live in the Gallery.");
    } catch { toast.error("Publish failed — please try again"); }
  }

  async function attachDomain() {
    if (!current || !domainInput.trim()) return;
    try {
      const res = await fetch(`${API}/builder/projects/${current.id}/domain`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ domain: domainInput.trim() }),
      });
      if (res.status === 402) { setProModal(true); return; }
      const d = await res.json();
      if (!res.ok) { toast.error(d.detail || "Invalid domain"); return; }
      setDns(d); setDomainInput("");
      setCurrent((cur) => ({ ...cur, custom_domain: d.domain }));
      toast.success(`Domain ${d.domain} attached — add the DNS records below`);
    } catch { toast.error("Domain attach failed"); }
  }

  async function verifyDomain() {
    if (!current || verifyBusy) return;
    setVerifyBusy(true);
    try {
      const res = await fetch(`${API}/builder/projects/${current.id}/domain/verify`, { method: "POST", credentials: "include" });
      if (res.status === 402) { setProModal(true); return; }
      const d = await res.json();
      if (!res.ok) { toast.error(d.detail || "Verification failed"); return; }
      setVerifyChecks(d.checks);
      setCurrent((c) => ({ ...c, domain_verified: d.verified }));
      if (d.verified) toast.success(`${current.custom_domain} verified — your build is live on your domain`);
      else toast.error("DNS records not found yet — propagation can take up to 24h");
    } catch { toast.error("Verification failed — please try again"); }
    finally { setVerifyBusy(false); }
  }

  function downloadHtml() {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(current?.title || "luchii-build").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function openFull() {
    const blob = new Blob([html], { type: "text/html" });
    window.open(URL.createObjectURL(blob), "_blank");
  }

  const liveUrl = current?.published && current?.slug ? `${process.env.REACT_APP_BACKEND_URL}/api/p/${current.slug}` : null;

  return (
    <main className="relative z-10 min-h-screen bg-lux-bg text-lux-text" data-testid={`${type}-builder-page`}>
      <Seo title={`${c.title} — Frasberg, Inc.`} description={c.sub} />
      <div className="pointer-events-none absolute inset-0 opacity-40"><Starfield /></div>

      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" data-testid="builder-home-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <img src="/luchii-logo.webp" alt="Frasberg Luchii" className="h-8 w-8 rounded-full ring-1 ring-lux-accent/40" />
            <span className="font-display text-lg font-700 tracking-tight">{c.title}</span>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={toggle} aria-label="Toggle theme" data-testid="builder-theme-toggle"
              className="grid h-10 w-10 place-items-center rounded-full border border-lux-border transition-colors hover:border-lux-accent hover:text-lux-accent">
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="text-center">
          <img src="/luchii-logo.webp" alt="Luchii" className="mx-auto h-16 w-16 rounded-full ring-1 ring-lux-accent/40" style={{ boxShadow: "0 0 44px var(--lux-glow)" }} />
          <h1 className="mt-6 font-display text-4xl font-700 tracking-tighter sm:text-5xl">{c.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lux-text2">{c.sub}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-2" data-testid="builder-tabs">
            {BUILDER_TYPES.map((t) => (
              <Link key={t.id} to={`/${t.id}-builder`} data-testid={`builder-tab-${t.id}`}
                className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm transition-colors ${t.id === type ? "border-lux-accent bg-lux-surface font-600 text-lux-text" : "border-lux-border text-lux-text2 hover:border-lux-accent/60 hover:text-lux-text"}`}>
                <t.Icon size={14} /> {t.label}
              </Link>
            ))}
          </div>
          {quota && (
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-lux-text2" data-testid="builder-quota">
              {quota.used} / {quota.limit} builds used today {quota.pro ? "· Pro" : ""}
            </p>
          )}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Projects sidebar */}
          <aside data-testid="builder-projects-sidebar">
            {user ? (
              <>
                <button onClick={() => { setCurrent(null); setHtml(""); setPrompt(""); setDns(null); }} data-testid="builder-new-project-btn"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-lux-text px-5 py-2.5 text-sm font-600 text-lux-bg transition-transform hover:-translate-y-0.5">
                  <Sparkles size={15} /> New build
                </button>
                <p className="mt-6 px-1 font-mono text-[11px] uppercase tracking-[0.2em] text-lux-text2">My {type === "website" ? "websites" : type === "game" ? "games" : type === "landing" ? "landing pages" : "apps"}</p>
                <div className="mt-3 max-h-[55vh] space-y-1.5 overflow-y-auto pr-1" data-testid="builder-projects-list">
                  {projects.length === 0 && <p className="px-1 text-xs text-lux-text2">Nothing built yet — describe your first {type} above.</p>}
                  {projects.map((p) => (
                    <div key={p.id} onClick={() => openProject(p)} data-testid={`builder-project-${p.id}`}
                      className={`cursor-pointer rounded-xl border px-4 py-3 transition-colors ${current?.id === p.id ? "border-lux-accent bg-lux-surface" : "border-lux-border bg-lux-surface/60 hover:border-lux-accent/50"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm text-lux-text">{p.title}</p>
                        <button onClick={(e) => deleteProject(p, e)} aria-label="Delete project" data-testid={`builder-delete-${p.id}`}
                          className="shrink-0 text-lux-text2 transition-colors hover:text-red-500"><Trash2 size={13} /></button>
                      </div>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-lux-text2">
                        {p.published ? "● live" : "draft"}{p.custom_domain ? ` · ${p.custom_domain}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-lux-border bg-lux-surface p-6" data-testid="builder-signin-card">
                <p className="font-display text-lg font-700 tracking-tight">Sign in to build</p>
                <p className="mt-2 text-xs leading-relaxed text-lux-text2">
                  Create a free account to build with Luchii, save your builds and publish them with Pro.
                </p>
                <Link to={`/auth?mode=login&next=%2F${type}-builder`} data-testid="builder-signin-cta"
                  className="mt-4 inline-block w-full rounded-full bg-lux-text px-5 py-2.5 text-center text-sm font-600 text-lux-bg transition-transform hover:-translate-y-0.5">
                  Sign in / Sign up free
                </Link>
              </div>
            )}
          </aside>

          {/* Composer + preview */}
          <div className="min-w-0">
            <div className="glass rounded-3xl p-5">
              {type === "game" && !current && !busy && (
                <div className="mb-3 flex flex-wrap items-center gap-2" data-testid="builder-game-templates">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-lux-text2">One-click starters:</span>
                  {GAME_TEMPLATES.map((t) => (
                    <button key={t.id} type="button" data-testid={`builder-template-${t.id}`}
                      onClick={() => { setPrompt(t.prompt); generate(t.prompt); }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-lux-accent/50 bg-lux-accent/10 px-3.5 py-1.5 text-xs font-600 text-lux-text transition-all hover:-translate-y-0.5 hover:border-lux-accent">
                      <Sparkles size={12} className="text-lux-accent" /> {t.label}
                    </button>
                  ))}
                </div>
              )}
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={current ? `Describe a change to "${current.title}"…` : c.placeholder}
                data-testid="builder-prompt-input"
                rows={3}
                className="w-full resize-none rounded-2xl border border-lux-border bg-lux-surface p-4 text-sm outline-none focus:border-lux-accent"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {c.examples.map((ex) => (
                    <button key={ex} type="button" onClick={() => setPrompt(ex)} data-testid="builder-example"
                      className="rounded-full border border-lux-border px-3 py-1.5 text-xs text-lux-text2 transition-colors hover:border-lux-accent hover:text-lux-text">
                      {ex.length > 44 ? ex.slice(0, 44) + "…" : ex}
                    </button>
                  ))}
                </div>
                <button onClick={() => generate()} disabled={busy || !prompt.trim()} data-testid="builder-generate-btn"
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-lux-accent px-6 py-3 text-sm font-600 text-lux-bg transition-transform hover:-translate-y-0.5 disabled:opacity-40">
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {busy ? "Luchii is building…" : current ? "Update build" : "Build it"}
                </button>
              </div>
              {busy && (
                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-lux-text2" data-testid="builder-progress">
                  Frasberg engine writing code · {chars.toLocaleString()} characters…
                </p>
              )}
            </div>

            {!html && !busy && <BuilderShowreel />}

            {demos.length > 0 && !busy && (
              <div className="mt-6" data-testid="builder-demos-strip">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-lux-text2">Real builds by Luchii — tap one to run it instantly</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[...demos.filter((b) => b.type === type), ...demos.filter((b) => b.type !== type)].slice(0, 6).map((b) => (
                    <button key={b.slug} type="button" onClick={() => openDemo(b)} data-testid={`builder-demo-${b.slug}`}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition-colors ${demo?.slug === b.slug ? "border-lux-accent text-lux-text" : "border-lux-border text-lux-text2 hover:border-lux-accent hover:text-lux-text"}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {b.title}
                      <span className="font-mono text-[9px] uppercase tracking-wide opacity-60">{b.type}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {html && !busy && (
              <div className="mt-6" data-testid="builder-preview-wrap">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-lux-text2">Live preview{current ? ` — ${current.title}` : demo ? ` — ${demo.title} (Luchii build)` : ""}</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={openFull} data-testid="builder-open-btn"
                      className="inline-flex items-center gap-1.5 rounded-full border border-lux-border px-4 py-2 text-xs text-lux-text2 transition-colors hover:border-lux-accent hover:text-lux-text">
                      <ExternalLink size={12} /> Open
                    </button>
                    <button onClick={downloadHtml} data-testid="builder-download-btn"
                      className="inline-flex items-center gap-1.5 rounded-full border border-lux-border px-4 py-2 text-xs text-lux-text2 transition-colors hover:border-lux-accent hover:text-lux-text">
                      <Download size={12} /> Download
                    </button>
                    {type === "game" && current?.published && current?.slug && (
                      <button
                        onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/play/${current.slug}`).catch(() => {}); toast.success("Play link copied — share it anywhere"); }}
                        data-testid="builder-share-play-btn"
                        className="inline-flex items-center gap-1.5 rounded-full border border-lux-accent px-4 py-2 text-xs text-lux-accent transition-colors hover:bg-lux-accent/10"
                      >
                        <Share2 size={12} /> Copy play link{typeof current.plays === "number" ? ` · ${current.plays} plays` : ""}
                      </button>
                    )}
                    {demo && !current ? (
                      <button
                        onClick={() => { if (!user) { navigate(`/auth?mode=login&next=%2F${type}-builder%3Fremix%3D${demo.slug}`); return; } remixDone.current = false; setSearchParams({ remix: demo.slug }); }}
                        data-testid="builder-remix-demo-btn"
                        className="inline-flex items-center gap-1.5 rounded-full bg-lux-text px-4 py-2 text-xs font-600 text-lux-bg transition-transform hover:-translate-y-0.5">
                        <Sparkles size={12} /> Remix this build
                      </button>
                    ) : current?.published && liveUrl ? (
                      <a href={liveUrl} target="_blank" rel="noreferrer" data-testid="builder-live-link"
                        className="inline-flex items-center gap-1.5 rounded-full border border-lux-accent px-4 py-2 text-xs text-lux-accent">
                        <BadgeCheck size={12} /> Live site
                      </a>
                    ) : (
                      <button onClick={publish} data-testid="builder-publish-btn"
                        className="inline-flex items-center gap-1.5 rounded-full bg-lux-text px-4 py-2 text-xs font-600 text-lux-bg transition-transform hover:-translate-y-0.5">
                        <Rocket size={12} /> Publish to Gallery
                      </button>
                    )}
                  </div>
                </div>
                <iframe
                  title="Luchii Builder preview"
                  srcDoc={html}
                  sandbox="allow-scripts allow-modals allow-popups"
                  data-testid="builder-preview-iframe"
                  className="mt-3 h-[70vh] w-full rounded-2xl border border-lux-border bg-white"
                />

                {current?.published && (
                  <div className="mt-4 rounded-2xl border border-lux-border bg-lux-surface/60 p-5" data-testid="builder-domain-card">
                    <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-lux-text2"><Link2 size={13} /> Custom domain (Pro)</p>
                    <div className="mt-3 flex gap-2">
                      <input value={domainInput} onChange={(e) => setDomainInput(e.target.value)} placeholder={current.custom_domain || "yourdomain.com"}
                        data-testid="builder-domain-input"
                        className="w-full rounded-xl border border-lux-border bg-lux-surface px-4 py-2.5 text-sm outline-none focus:border-lux-accent" />
                      <button onClick={attachDomain} data-testid="builder-domain-attach-btn"
                        className="shrink-0 rounded-full border border-lux-accent px-5 py-2 text-xs font-600 text-lux-accent transition-transform hover:-translate-y-0.5">
                        Attach
                      </button>
                    </div>
                    {current.custom_domain && (
                      <div className="mt-4 flex flex-wrap items-center gap-2" data-testid="builder-domain-status">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide ${current.domain_verified ? "border-lux-accent text-lux-accent" : "border-lux-border text-lux-text2"}`}>
                          <ShieldCheck size={11} /> {current.custom_domain} — {current.domain_verified ? "verified · live" : "pending verification"}
                        </span>
                        <button onClick={verifyDomain} disabled={verifyBusy} data-testid="builder-domain-verify-btn"
                          className="inline-flex items-center gap-1.5 rounded-full bg-lux-text px-4 py-1.5 text-xs font-600 text-lux-bg transition-transform hover:-translate-y-0.5 disabled:opacity-50">
                          {verifyBusy ? <Loader2 size={11} className="animate-spin" /> : <ShieldCheck size={11} />} Verify DNS
                        </button>
                      </div>
                    )}
                    {verifyChecks && (
                      <div className="mt-3 space-y-1.5" data-testid="builder-verify-results">
                        {verifyChecks.map((c) => (
                          <p key={c.type} className={`rounded-xl px-3 py-2 font-mono text-[11px] ${c.ok ? "bg-lux-accent/10 text-lux-accent" : "bg-lux-surface2 text-lux-text2"}`}>
                            {c.ok ? "✓" : "✗"} {c.type} {c.host} → expected {c.expected}{c.found?.length ? ` · found ${c.found.join(", ")}` : " · no record found"}
                          </p>
                        ))}
                      </div>
                    )}
                    {dns && (
                      <div className="mt-4 space-y-2" data-testid="builder-dns-records">
                        <p className="text-xs text-lux-text2">{dns.note}</p>
                        {dns.dns.map((r) => (
                          <p key={r.host} className="rounded-xl bg-lux-surface2 px-3 py-2 font-mono text-[11px] text-lux-text">
                            {r.type} · {r.host} → {r.value}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ProGateModal open={proModal} onClose={() => setProModal(false)} />
      <Footer />
    </main>
  );
}
