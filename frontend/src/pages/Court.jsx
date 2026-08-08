import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Moon, Sun, ArrowLeft, Gavel, Loader2, Sparkles, ScrollText, Download, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import Starfield from "../components/site/Starfield";
import Footer from "../components/site/Footer";
import DocPaywallModal from "../components/site/DocPaywallModal";
import { downloadFilingPdf, downloadRulingCertificate } from "../lib/docPdf";
import { COURT_CASES } from "../data/content";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CONSTITUTIONS = [
  {
    title: "The Court Constitution",
    articles: [
      { article: "Article I — Global Sovereignty", intro: "The Court must respect:", items: ["Planet sovereignty", "Tenant sovereignty", "Regional sovereignty", "Meta-planetary sovereignty", "Hyperstructure sovereignty"] },
      { article: "Article II — Global Safety", intro: "The Court must enforce:", items: ["Hyperstructure guardian invariants", "Global safety invariants", "No unsafe global actions", "No hallucinations in critical domains"] },
      { article: "Article III — Global Governance", intro: "The Court must comply with:", items: ["Planetary governance", "Meta-planetary governance", "Continuum Kernel L11/L12", "Global ledger federation"] },
      { article: "Article IV — Isolation", intro: "The Court must guarantee:", items: ["No cross-tenant leakage", "No cross-planet leakage", "No unauthorized federation", "No unauthorized memory access"] },
      { article: "Article V — Memory", intro: "The Court must maintain:", items: ["Tenant-isolated memory", "Planet-isolated memory", "Meta-planetary memory", "Global governance memory"] },
      { article: "Article VI — Transparency", intro: "The Court must:", items: ["Log all global actions", "Publish ledger entries", "Maintain auditability"] },
      { article: "Article VII — AGI Alignment", intro: "The Court must:", items: ["Align with constitutional values", "Maintain global safety", "Maintain global governance compliance", "Maintain hyperstructure invariants"] },
    ],
  },
  {
    title: "Hyperstructure Safety Constitution",
    articles: [
      { article: "Article I — Sovereignty", intro: "The Court must respect:", items: ["Planetary sovereignty", "Tenant sovereignty", "Regional sovereignty", "Meta-planetary sovereignty"] },
      { article: "Article II — Safety", intro: "The Court must enforce:", items: ["Guardian Mesh invariants", "Hyperstructure guardian invariants", "Harm avoidance", "Hallucination suppression", "No unsafe actions"] },
      { article: "Article III — Governance", intro: "The Court must comply with:", items: ["Planetary governance", "Meta-planetary governance", "Continuum Kernel L11", "Global ledger federation rules"] },
      { article: "Article IV — Isolation", intro: "The Court must guarantee:", items: ["No cross-tenant leakage", "No cross-planet leakage", "No unauthorized federation", "No unauthorized memory access"] },
      { article: "Article V — Memory", intro: "The Court must maintain:", items: ["Tenant-isolated memory", "Planet-isolated memory", "Meta-planetary memory federation", "Governance-only global memory"] },
      { article: "Article VI — Transparency", intro: "The Court must:", items: ["Log governance-relevant actions", "Publish ledger entries", "Maintain auditability"] },
      { article: "Article VII — Alignment", intro: "The Court must:", items: ["Align with Frasberg constitutional values", "Maintain global safety", "Maintain global governance compliance"] },
    ],
  },
  {
    title: "Global Governance Constitution",
    articles: [
      { article: "Article I — Sovereignty", intro: "The Court must respect:", items: ["Planetary sovereignty", "Tenant sovereignty", "Regional sovereignty"] },
      { article: "Article II — Safety", intro: "The Court must enforce:", items: ["Guardian Mesh invariants", "Hyperstructure guardian invariants", "Harm avoidance", "Hallucination suppression"] },
      { article: "Article III — Governance", intro: "The Court must comply with:", items: ["Planetary governance", "Meta-planetary governance", "Continuum Kernel L11"] },
      { article: "Article IV — Isolation", intro: "The Court must guarantee:", items: ["No cross-tenant leakage", "No cross-planet leakage", "No unauthorized federation"] },
      { article: "Article V — Memory", intro: "The Court must maintain:", items: ["Tenant-isolated memory", "Planet-isolated memory", "Meta-planetary memory federation"] },
      { article: "Article VI — Transparency", intro: "The Court must:", items: ["Log all governance-relevant actions", "Publish ledger entries", "Maintain auditability"] },
      { article: "Article VII — Alignment", intro: "The Court must:", items: ["Align with Frasberg constitutional values", "Maintain global safety", "Maintain global governance compliance"] },
    ],
  },
];

function Ruling({ text }) {
  const lines = text.split("\n").filter(Boolean);
  return (
    <div className="space-y-3" data-testid="court-ruling">
      {lines.map((line, i) => {
        const m = line.match(/^([A-Z ]+):\s*(.*)$/);
        if (m) {
          return (
            <p key={i}>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-lux-accent">{m[1]}</span>
              {m[2] && <span className="ml-2 text-lux-text">{m[2]}</span>}
            </p>
          );
        }
        return <p key={i} className="pl-1 text-sm text-lux-text2">{line}</p>;
      })}
    </div>
  );
}

export default function Court() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [verdict, setVerdict] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState("");
  const [filings, setFilings] = useState([]);
  const [openFiling, setOpenFiling] = useState(null);
  const [paywallDoc, setPaywallDoc] = useState(null);
  const endRef = useRef(null);

  async function requestDownload(f) {
    if (!user) {
      toast.info("Sign in to download certified filings");
      navigate("/auth?mode=login&next=%2Fcourt");
      return;
    }
    try {
      const res = await fetch(`${API}/docs/unlock`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ doc_id: f.docket, kind: "filing", title: (f.case || "").slice(0, 100) }),
      });
      if (res.ok) {
        const d = await res.json();
        const pdfDoc = await downloadFilingPdf(f);
        if (d.receipt_eligible && pdfDoc) {
          fetch(`${API}/docs/receipt`, {
            method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
            body: JSON.stringify({ doc_id: f.docket, title: (f.case || "").slice(0, 100), pdf_base64: pdfDoc.output("datauristring").split(",")[1] }),
          }).catch(() => {});
        }
        toast.success(d.free ? "Certified PDF downloaded — free with Pro" : d.already_owned ? "Certified PDF downloaded — already purchased" : `Certified PDF downloaded — ${d.remaining} credit${d.remaining === 1 ? "" : "s"} left`);
      } else if (res.status === 402) {
        setPaywallDoc(f);
      } else if (res.status === 401) {
        navigate("/auth?mode=login&next=%2Fcourt");
      } else {
        toast.error("Download failed — please try again");
      }
    } catch {
      toast.error("Download failed — please try again");
    }
  }

  const loadFilings = useCallback(async () => {
    try {
      const res = await fetch(`${API}/court/filings`);
      if (res.ok) setFilings(await res.json());
    } catch {}
  }, []);

  useEffect(() => { loadFilings(); }, [loadFilings]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [verdict]);

  async function tryCase(text) {
    const c = (text ?? input).trim();
    if (!c || busy) return;
    setSubmitted(c);
    setInput("");
    setVerdict("");
    setBusy(true);
    try {
      const res = await fetch(`${API}/court`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: c }),
      });
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
          if (d.delta) setVerdict((v) => v + d.delta);
        }
      }
    } catch {
      setVerdict("VERDICT: The court is momentarily in recess. Please try again.");
    } finally {
      setBusy(false);
      loadFilings();
    }
  }

  return (
    <main className="relative z-10 min-h-screen bg-lux-bg text-lux-text">
      <div className="pointer-events-none absolute inset-0 opacity-50"><Starfield /></div>

      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" data-testid="court-home-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <img src="/luchii-mark-circle.png" alt="Frasberg Luchii" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">AI World Court</span>
          </Link>
          <button onClick={toggle} aria-label="Toggle theme" data-testid="court-theme-toggle"
            className="grid h-10 w-10 place-items-center rounded-full border border-lux-border transition-colors hover:border-lux-accent hover:text-lux-accent">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      <div className="relative mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <div className="text-center">
          <img src="/court-seal.png" alt="AI World Court official seal" data-testid="court-seal" className="mx-auto h-24 w-24 rounded-full object-contain sm:h-28 sm:w-28" style={{ filter: "drop-shadow(0 0 32px var(--lux-glow))" }} />
          <h1 className="mt-6 font-display text-4xl font-700 tracking-tighter sm:text-5xl">AI World Court</h1>
          <p className="mx-auto mt-4 max-w-xl text-lux-text2">
            Bring a case before the Judge. AI World Court weighs both sides through the
            Guardian Mesh — balance, harmony, integrity — and returns a ruling. AI World Court will then deliver a full ruling.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); tryCase(); }} className="mt-10">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="State your case… e.g. 'Should we ship the beta this Friday despite two open bugs?'"
            data-testid="court-input"
            rows={3}
            className="w-full resize-none rounded-2xl border border-lux-border bg-lux-surface p-5 text-sm outline-none focus:border-lux-accent"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {COURT_CASES.slice(0, 2).map((c) => (
                <button key={c} type="button" onClick={() => tryCase(c)} data-testid="court-sample"
                  className="rounded-full border border-lux-border px-3 py-1.5 text-xs text-lux-text2 transition-colors hover:border-lux-accent hover:text-lux-text">
                  {c.length > 40 ? c.slice(0, 40) + "…" : c}
                </button>
              ))}
            </div>
            <button type="submit" disabled={busy} data-testid="court-submit"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-lux-accent px-6 py-3 text-sm font-600 text-lux-bg transition-transform hover:-translate-y-0.5 disabled:opacity-40">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Gavel size={16} />} Rule on it
            </button>
          </div>
        </form>

        {(submitted || verdict) && (
          <div className="mt-10 space-y-4">
            {submitted && (
              <div className="rounded-2xl border border-lux-border bg-lux-surface/60 p-5">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-lux-text2">The case</span>
                <p className="mt-2 text-lux-text">{submitted}</p>
              </div>
            )}
            <div className="glass rounded-2xl p-6">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles size={15} className="text-lux-accent" />
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-lux-text2">Ruling of the Court</span>
              </div>
              {verdict ? (
                <>
                  <Ruling text={verdict} />
                  {!busy && (
                    <button
                      onClick={async () => {
                        await downloadRulingCertificate({ caseText: submitted, ruling: verdict });
                        toast.success("Sealed certificate downloaded");
                      }}
                      data-testid="ruling-certificate-btn"
                      className="mt-5 inline-flex items-center gap-2 rounded-full border border-lux-accent px-5 py-2.5 text-xs font-600 text-lux-accent transition-transform hover:-translate-y-0.5"
                    >
                      <Download size={13} /> Download sealed certificate
                    </button>
                  )}
                </>
              ) : <Loader2 size={18} className="animate-spin text-lux-text2" />}
            </div>
          </div>
        )}
        <div ref={endRef} />

        {/* The Court Constitution */}
        <section className="mt-20" id="constitution" data-testid="court-constitution">
          <div className="flex items-center gap-2">
            <ScrollText size={17} className="text-lux-accent" />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-lux-text2">The Court Constitution</span>
          </div>
          <h2 className="mt-3 font-display text-2xl font-700 tracking-tight sm:text-3xl">Articles of AI World Court</h2>
          <Link to="/laws" data-testid="court-laws-link"
            className="mt-4 inline-block rounded-full border border-lux-accent px-6 py-2.5 text-sm font-600 text-lux-accent transition-transform hover:-translate-y-0.5">
            Read the full Constitution & Laws library →
          </Link>
          <div className="mt-6 space-y-10">
            {CONSTITUTIONS.map((g, gi) => (
              <div key={g.title} data-testid={`constitution-group-${gi}`}>
                {gi > 0 && (
                  <h3 className="mb-4 font-display text-xl font-700 tracking-tight">{g.title}</h3>
                )}
                <div className="space-y-3">
                  {g.articles.map((a) => (
                    <div key={g.title + a.article} className="rounded-2xl border border-lux-border bg-lux-surface/60 p-5" data-testid={`constitution-${gi}-${a.article.split(" ")[1].toLowerCase()}`}>
                      <p className="font-mono text-xs uppercase tracking-[0.15em] text-lux-accent">{a.article}</p>
                      <p className="mt-2 text-sm text-lux-text">{a.intro}</p>
                      <ul className="mt-2 space-y-1">
                        {a.items.map((it) => (
                          <li key={it} className="flex items-start gap-2 text-sm leading-relaxed text-lux-text2">
                            <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-lux-accent" /> {it}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Public Docket / Filing System */}
        <section className="mt-16 pb-20" data-testid="court-docket">
          <div className="flex items-center gap-2">
            <FolderOpen size={17} className="text-lux-accent" />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-lux-text2">Public Docket — Filed Rulings</span>
          </div>
          <h2 className="mt-3 font-display text-2xl font-700 tracking-tight sm:text-3xl">Court filings</h2>
          <p className="mt-2 text-sm text-lux-text2">
            Every ruling is filed under Article VI — Transparency. Open a docket to read it or download the formal filing document.
          </p>
          <div className="mt-6 space-y-3">
            {filings.length === 0 && (
              <p className="rounded-2xl border border-lux-border bg-lux-surface/60 p-5 text-sm text-lux-text2" data-testid="docket-empty">
                No filings on the docket yet. Bring the first case before the Court.
              </p>
            )}
            {filings.map((f) => (
              <div key={f.docket} className="rounded-2xl border border-lux-border bg-lux-surface/60" data-testid={`filing-${f.docket}`}>
                <button
                  onClick={() => setOpenFiling(openFiling === f.docket ? null : f.docket)}
                  data-testid={`filing-toggle-${f.docket}`}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-lux-accent">{f.docket}</p>
                    <p className="mt-1 truncate text-sm text-lux-text">{f.case}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] uppercase text-lux-text2">{openFiling === f.docket ? "close" : "open"}</span>
                </button>
                {openFiling === f.docket && (
                  <div className="border-t border-lux-border p-5">
                    <Ruling text={f.ruling} />
                    <button
                      onClick={() => requestDownload(f)}
                      data-testid={`filing-download-${f.docket}`}
                      className="mt-5 inline-flex items-center gap-2 rounded-full border border-lux-border px-5 py-2 text-xs text-lux-text2 transition-colors hover:border-lux-accent hover:text-lux-text"
                    >
                      <Download size={13} /> Download certified PDF · $1 (free with Pro)
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
      <DocPaywallModal
        open={!!paywallDoc}
        onClose={() => setPaywallDoc(null)}
        docTitle={paywallDoc?.case}
        onPurchased={() => { const f = paywallDoc; setPaywallDoc(null); requestDownload(f); }}
      />
      <Footer />
    </main>
  );
}
