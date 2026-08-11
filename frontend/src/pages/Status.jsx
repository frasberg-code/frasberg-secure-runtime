import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { Moon, Sun, ArrowLeft, Activity, RefreshCw, ShieldAlert } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import Starfield from "../components/site/Starfield";
import Seo from "../components/site/Seo";
import Footer from "../components/site/Footer";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DOT = {
  operational: "bg-emerald-400",
  warming: "bg-amber-400",
  standby: "bg-amber-400",
  degraded: "bg-orange-500",
  outage: "bg-red-500",
};
const LABEL = {
  operational: "Operational",
  warming: "Warming up",
  standby: "Standby — loads on first use",
  degraded: "Degraded",
  outage: "Outage",
};
const OVERALL = {
  operational: "All systems operational",
  warming: "Systems warming up",
  degraded: "Partial degradation",
  outage: "Service disruption",
};

function fmtUptime(s) {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function Status() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [uptime, setUptime] = useState(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetch(`${API}/system/uptime`).then((r) => r.json()).then(setUptime).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(`${API}/system/status`, { credentials: "include" });
        if (!res.ok) throw new Error();
        const d = await res.json();
        if (alive) { setData(d); setError(false); }
      } catch {
        if (alive) setError(true);
      }
    };
    load();
    const t = setInterval(load, 10000);
    return () => { alive = false; clearInterval(t); };
  }, [isAdmin]);

  if (user === false) return <Navigate to="/auth?mode=login&next=%2Fstatus" replace />;
  if (user && !isAdmin) {
    return (
      <main className="grid min-h-screen place-items-center bg-lux-bg text-lux-text" data-testid="status-denied">
        <div className="text-center">
          <ShieldAlert size={28} className="mx-auto text-lux-accent" />
          <p className="mt-4 font-display text-xl font-700 tracking-tight">Admin access required</p>
          <p className="mt-2 text-sm text-lux-text2">System status is restricted to the Frasberg admin console.</p>
          <Link to="/" className="mt-4 inline-block text-sm text-lux-accent underline">Back to Luchii</Link>
        </div>
      </main>
    );
  }

  const overall = error ? "outage" : data?.overall;

  return (
    <main className="relative z-10 min-h-screen bg-lux-bg text-lux-text" data-testid="status-page">
      <Seo title="System Status — Luchii by Frasberg" description="Live health of the Luchii Intelligence Mesh, Sovereign Voice Engines, Builder and AI World Court." />
      <div className="pointer-events-none absolute inset-0 opacity-40"><Starfield /></div>

      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/admin" className="flex items-center gap-2.5" data-testid="status-back-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <img src="/frasberg-mark-circle.png" alt="Frasberg" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">System Status</span>
          </Link>
          <button onClick={toggle} aria-label="Toggle theme" data-testid="status-theme-toggle"
            className="grid h-10 w-10 place-items-center rounded-full border border-lux-border transition-colors hover:border-lux-accent hover:text-lux-accent">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      <div className="relative mx-auto max-w-4xl px-5 py-12 sm:px-8">
        <span className="grid h-14 w-14 place-items-center rounded-full border border-lux-accent/50 text-lux-accent" style={{ boxShadow: "0 0 40px var(--lux-glow)" }}>
          <Activity size={22} />
        </span>
        <h1 className="mt-6 font-display text-4xl font-700 tracking-tighter sm:text-5xl">Frasberg systems</h1>
        <p className="mt-4 max-w-2xl text-lux-text2">
          Live health of the sovereign infrastructure — the Intelligence Mesh, Voice Engines,
          Builder, Memory Vault and AI World Court. Refreshes every 10 seconds.
        </p>

        {overall && (
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-lux-border bg-lux-surface/60 p-5" data-testid="status-overall">
            <span className={`relative flex h-3 w-3 shrink-0`}>
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${DOT[overall]}`} />
              <span className={`relative inline-flex h-3 w-3 rounded-full ${DOT[overall]}`} />
            </span>
            <span className="font-display text-lg font-700 tracking-tight">
              {error ? "Status feed unreachable" : OVERALL[overall]}
            </span>
            {data && (
              <span className="ml-auto hidden font-mono text-[13.5px] uppercase tracking-[0.2em] text-lux-text2 sm:block">
                Uptime {fmtUptime(data.uptime_seconds)}
              </span>
            )}
          </div>
        )}
        {!data && !error && (
          <div className="mt-8 flex items-center gap-2 text-sm text-lux-text2"><RefreshCw size={14} className="animate-spin" /> Checking systems…</div>
        )}

        {uptime && (
          <div className="mt-6 rounded-2xl border border-lux-border bg-lux-surface/60 p-5" data-testid="status-uptime">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[13.5px] uppercase tracking-[0.2em] text-lux-text2">Measured uptime — 30 days</span>
              <span className={`font-display text-2xl font-700 ${uptime.overall_30d >= uptime.sla_target ? "text-emerald-400" : "text-amber-400"}`} data-testid="uptime-percentage">
                {uptime.overall_30d}%
              </span>
              <span className="font-mono text-[13.5px] text-lux-text2">SLA target {uptime.sla_target}%</span>
              <span className={`rounded-full border px-2 py-0.5 font-mono text-[13.5px] uppercase tracking-widest ${uptime.overall_30d >= uptime.sla_target ? "border-emerald-400/50 text-emerald-400" : "border-amber-400/50 text-amber-400"}`}>
                {uptime.overall_30d >= uptime.sla_target ? "SLA met" : "Below target"}
              </span>
            </div>
            {uptime.days.length > 0 && (
              <div className="mt-4 flex items-end gap-1" data-testid="uptime-day-bars">
                {uptime.days.map((d) => (
                  <div key={d.day} title={`${d.day}: ${d.pct}% (${d.checks} checks)`}
                    className={`w-3 rounded-sm ${d.pct >= 99.9 ? "bg-emerald-400" : d.pct >= 99 ? "bg-amber-400" : "bg-red-500"}`}
                    style={{ height: `${Math.max(8, (d.pct / 100) * 40)}px` }} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 space-y-3 pb-16">
          {(data?.components || []).map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-4 rounded-2xl border border-lux-border bg-lux-surface/60 p-5" data-testid={`status-${c.id}`}>
              <div className="min-w-0">
                <p className="text-sm font-600 text-lux-text">{c.name}</p>
                <p className="mt-0.5 truncate font-mono text-[13.5px] uppercase tracking-wide text-lux-text2">{c.detail}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-lux-border px-3 py-1.5 font-mono text-[13.5px] uppercase tracking-[0.15em] text-lux-text2">
                <span className={`h-2 w-2 rounded-full ${DOT[c.status] || "bg-lux-text2"}`} />
                {LABEL[c.status] || c.status}
              </span>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
