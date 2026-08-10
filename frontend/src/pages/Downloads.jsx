import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, ArrowLeft, Download, BadgeCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import Starfield from "../components/site/Starfield";
import Seo from "../components/site/Seo";
import Footer from "../components/site/Footer";
import { downloadLawPdf, downloadFilingPdf } from "../lib/docPdf";
import { LAW_DOCUMENTS } from "../data/laws";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LAW_BY_ID = Object.fromEntries(LAW_DOCUMENTS.map((d) => [d.id, d]));

export default function Downloads() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const [purchases, setPurchases] = useState(null);
  const [filings, setFilings] = useState([]);
  const [entitlement, setEntitlement] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetch(`${API}/docs/purchases`, { credentials: "include" }).then((r) => r.json()).then(setPurchases).catch(() => setPurchases([]));
    fetch(`${API}/docs/entitlement`, { credentials: "include" }).then((r) => r.json()).then(setEntitlement).catch(() => {});
    fetch(`${API}/court/filings`).then((r) => r.json()).then(setFilings).catch(() => {});
  }, [user]);

  const filingByDocket = Object.fromEntries(filings.map((f) => [f.docket, f]));

  async function redownload(p) {
    if (p.kind === "law" && LAW_BY_ID[p.doc_id]) {
      await downloadLawPdf(LAW_BY_ID[p.doc_id]);
      toast.success("Certified PDF downloaded");
    } else if (filingByDocket[p.doc_id]) {
      await downloadFilingPdf(filingByDocket[p.doc_id]);
      toast.success("Certified PDF downloaded");
    } else {
      toast.error("This document is no longer available");
    }
  }

  const available = (p) => (p.kind === "law" ? !!LAW_BY_ID[p.doc_id] : !!filingByDocket[p.doc_id]);

  return (
    <main className="relative z-10 min-h-screen bg-lux-bg text-lux-text" data-testid="downloads-page">
      <Seo title="My Downloads — Luchii by Frasberg" description="Every certified court PDF you own, ready to re-download." />
      <div className="pointer-events-none absolute inset-0 opacity-40"><Starfield /></div>

      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/profile" className="flex items-center gap-2.5" data-testid="downloads-back-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <img src="/luchii-mark-circle.png" alt="Frasberg Luchii" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">My Downloads</span>
          </Link>
          <button onClick={toggle} aria-label="Toggle theme" data-testid="downloads-theme-toggle"
            className="grid h-10 w-10 place-items-center rounded-full border border-lux-border transition-colors hover:border-lux-accent hover:text-lux-accent">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      <div className="relative mx-auto max-w-4xl px-5 py-12 sm:px-8">
        <img src="/court-seal.png" alt="AI World Court official seal" data-testid="downloads-court-seal" className="h-20 w-20 rounded-full object-contain sm:h-24 sm:w-24" style={{ filter: "drop-shadow(0 0 30px var(--lux-glow))" }} />
        <h1 className="mt-6 font-display text-4xl font-700 tracking-tighter sm:text-5xl">My certified downloads</h1>
        <p className="mt-4 max-w-2xl text-lux-text2">
          Every certified PDF you own from the Court docket and the Constitution & Laws library — re-download any of them, any time, at no extra cost.
        </p>

        {entitlement && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-lux-border px-4 py-2 font-mono text-[13px] uppercase tracking-[0.2em] text-lux-text2" data-testid="downloads-balance">
            {entitlement.pro ? (<><BadgeCheck size={13} className="text-lux-accent" /> Pro — unlimited downloads</>) : (<>{entitlement.doc_credits} download credit{entitlement.doc_credits === 1 ? "" : "s"} remaining</>)}
          </p>
        )}

        <div className="mt-8 space-y-3 pb-16">
          {!user ? (
            <div className="rounded-2xl border border-lux-border bg-lux-surface/60 p-8 text-center" data-testid="downloads-signin">
              <p className="font-display text-lg font-600">Sign in to see your downloads</p>
              <Link to="/auth?mode=login&next=%2Fdownloads" className="mt-4 inline-block rounded-full bg-lux-text px-6 py-3 text-sm font-600 text-lux-bg">Sign in</Link>
            </div>
          ) : purchases === null ? (
            <div className="grid place-items-center py-16"><Loader2 size={22} className="animate-spin text-lux-accent" /></div>
          ) : purchases.length === 0 ? (
            <div className="rounded-2xl border border-lux-border bg-lux-surface/60 p-8 text-center" data-testid="downloads-empty">
              <p className="font-display text-lg font-600">No certified downloads yet</p>
              <p className="mt-1 text-sm text-lux-text2">Documents you download from the Court or Laws library will appear here.</p>
              <div className="mt-4 flex justify-center gap-2">
                <Link to="/laws" className="rounded-full border border-lux-accent px-5 py-2.5 text-[13px] font-600 text-lux-accent">Laws library</Link>
                <Link to="/court" className="rounded-full border border-lux-border px-5 py-2.5 text-[13px] text-lux-text2">Court docket</Link>
              </div>
            </div>
          ) : (
            purchases.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 rounded-2xl border border-lux-border bg-lux-surface/60 p-5" data-testid={`download-item-${p.doc_id}`}>
                <div className="flex min-w-0 items-center gap-3">
                  <img src="/court-seal.png" alt="AI World Court seal" className="h-10 w-10 shrink-0 rounded-full object-contain" />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-lux-text">{p.title || (p.kind === "law" ? LAW_BY_ID[p.doc_id]?.title : p.doc_id) || p.doc_id}</p>
                    <p className="mt-0.5 font-mono text-[13.5px] uppercase tracking-wide text-lux-text2">
                      {p.kind === "law" ? "Laws library" : `Docket ${p.doc_id}`} · {(p.ts || "").slice(0, 10)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => redownload(p)}
                  disabled={!available(p)}
                  data-testid={`download-btn-${p.doc_id}`}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-lux-accent px-4 py-2 text-[13px] font-600 text-lux-accent transition-transform hover:-translate-y-0.5 disabled:opacity-40"
                >
                  <Download size={13} /> PDF
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
