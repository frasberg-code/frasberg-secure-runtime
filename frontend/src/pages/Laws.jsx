import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Moon, Sun, ArrowLeft, Scale, Download, ChevronDown, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import Starfield from "../components/site/Starfield";
import Footer from "../components/site/Footer";
import Seo from "../components/site/Seo";
import DocPaywallModal from "../components/site/DocPaywallModal";
import { downloadLawPdf } from "../lib/docPdf";
import { LAW_DOCUMENTS, LAW_CATEGORIES } from "../data/laws";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Laws() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState("agi-constitution-v2");
  const [q, setQ] = useState("");
  const [paywallDoc, setPaywallDoc] = useState(null);

  async function requestDownload(d) {
    if (!user) {
      toast.info("Sign in to download certified documents");
      navigate("/auth?mode=login&next=%2Flaws");
      return;
    }
    try {
      const res = await fetch(`${API}/docs/unlock`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ doc_id: d.id, kind: "law", title: d.title }),
      });
      if (res.ok) {
        const resp = await res.json();
        const pdfDoc = downloadLawPdf(d);
        if (resp.receipt_eligible && pdfDoc) {
          fetch(`${API}/docs/receipt`, {
            method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
            body: JSON.stringify({ doc_id: d.id, title: d.title, pdf_base64: pdfDoc.output("datauristring").split(",")[1] }),
          }).catch(() => {});
        }
        toast.success(resp.free ? "Certified PDF downloaded — free with Pro" : resp.already_owned ? "Certified PDF downloaded — already purchased" : `Certified PDF downloaded — ${resp.remaining} credit${resp.remaining === 1 ? "" : "s"} left`);
      } else if (res.status === 402) {
        setPaywallDoc(d);
      } else if (res.status === 401) {
        navigate("/auth?mode=login&next=%2Flaws");
      } else {
        toast.error("Download failed — please try again");
      }
    } catch {
      toast.error("Download failed — please try again");
    }
  }
  const query = q.trim().toLowerCase();
  const matches = (d) => !query || d.title.toLowerCase().includes(query) || d.content.toLowerCase().includes(query);
  const citation = (d) => {
    if (!query) return null;
    const idx = d.content.toLowerCase().indexOf(query);
    if (idx < 0) return null;
    return "…" + d.content.slice(Math.max(0, idx - 60), idx + 90).replace(/\n/g, " ") + "…";
  };
  const results = LAW_DOCUMENTS.filter(matches);

  return (
    <main className="relative z-10 min-h-screen bg-lux-bg text-lux-text" data-testid="laws-page">
      <Seo title="AI Court Constitution and Laws — Frasberg, Inc." description="The complete constitutions, laws, protocols and public documents of the Luchii intelligence system and AI World Court by Frasberg, Inc." />
      <div className="pointer-events-none absolute inset-0 opacity-40"><Starfield /></div>

      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-8">
          <Link to="/court" className="flex items-center gap-2.5" data-testid="laws-back-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <img src="/luchii-logo.webp" alt="Frasberg" className="h-8 w-8 rounded-full ring-1 ring-lux-accent/40" />
            <span className="font-display text-lg font-700 tracking-tight">Constitution & Laws</span>
          </Link>
          <button onClick={toggle} aria-label="Toggle theme" className="grid h-10 w-10 place-items-center rounded-full border border-lux-border hover:border-lux-accent hover:text-lux-accent">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      <section className="relative mx-auto max-w-4xl px-4 py-14 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <span className="grid h-14 w-14 place-items-center rounded-full border border-lux-accent/50 text-lux-accent" style={{ boxShadow: "0 0 40px var(--lux-glow)" }}>
            <Scale size={22} />
          </span>
          <h1 className="mt-6 font-display text-4xl font-700 tracking-tighter sm:text-5xl">AI Court Constitution and Laws</h1>
          <p className="mt-4 max-w-2xl text-lux-text2">
            The complete legal corpus of the Luchii intelligence system — constitutions, federation
            protocols, kernel law and public documents. Every ruling of AI World Court is bound
            by these texts. Each document is downloadable.
          </p>
        </motion.div>

        <div className="mt-10">
          <div className="flex items-center gap-3 rounded-2xl border border-lux-border bg-lux-surface/60 px-5 py-1.5 transition-colors focus-within:border-lux-accent">
            <Search size={17} className="shrink-0 text-lux-text2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search the constitution, laws & protocols…"
              data-testid="laws-search-input"
              className="w-full bg-transparent py-3 text-base text-lux-text outline-none placeholder:text-lux-text2"
            />
            {q && (
              <button onClick={() => setQ("")} aria-label="Clear search" data-testid="laws-search-clear" className="text-lux-text2 hover:text-lux-text">
                <X size={15} />
              </button>
            )}
          </div>
          {query && (
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-lux-text2" data-testid="laws-search-count">
              {results.length} document{results.length === 1 ? "" : "s"} match “{q.trim()}”
            </p>
          )}
        </div>

        <div className="mt-8 space-y-10 pb-10">
          {query && results.length === 0 && (
            <div className="rounded-2xl border border-lux-border bg-lux-surface/60 p-8 text-center text-lux-text2" data-testid="laws-search-empty">
              No documents match your search.
            </div>
          )}
          {LAW_CATEGORIES.filter((cat) => results.some((d) => d.category === cat)).map((cat) => (
            <div key={cat} data-testid={`laws-category-${cat.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-lux-accent">{cat}</p>
              <div className="mt-4 space-y-3">
                {results.filter((d) => d.category === cat).map((d) => (
                  <div key={d.id} className="overflow-hidden rounded-2xl border border-lux-border bg-lux-surface/60" data-testid={`law-doc-${d.id}`}>
                    <button
                      onClick={() => setOpen(open === d.id ? null : d.id)}
                      data-testid={`law-toggle-${d.id}`}
                      className="flex w-full items-center justify-between gap-4 p-5 text-left"
                    >
                      <span className="min-w-0">
                        <span className="block font-display text-lg font-600 tracking-tight">{d.title}</span>
                        {citation(d) && (
                          <span className="mt-1 block truncate text-xs text-lux-text2" data-testid={`law-citation-${d.id}`}>{citation(d)}</span>
                        )}
                      </span>
                      <ChevronDown size={17} className={`shrink-0 text-lux-text2 transition-transform ${open === d.id ? "rotate-180" : ""}`} />
                    </button>
                    {open === d.id && (
                      <div className="border-t border-lux-border p-5">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-lux-text2">{d.content}</pre>
                        <button
                          onClick={() => requestDownload(d)}
                          data-testid={`law-download-${d.id}`}
                          className="mt-5 inline-flex items-center gap-2 rounded-full border border-lux-border px-5 py-2 text-xs text-lux-text2 transition-colors hover:border-lux-accent hover:text-lux-text"
                        >
                          <Download size={13} /> Download certified PDF · $1 (free with Pro)
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-lux-border bg-lux-surface p-8 text-center">
          <p className="font-display text-xl font-600 tracking-tight">Bring a case before the Court</p>
          <Link to="/court" data-testid="laws-court-cta"
            className="mt-5 inline-block rounded-full bg-lux-text px-7 py-3 text-sm font-600 text-lux-bg transition-transform hover:-translate-y-0.5">
            Enter AI World Court
          </Link>
        </div>
      </section>

      <DocPaywallModal
        open={!!paywallDoc}
        onClose={() => setPaywallDoc(null)}
        docTitle={paywallDoc?.title}
        onPurchased={() => { const d = paywallDoc; setPaywallDoc(null); requestDownload(d); }}
      />
      <Footer />
    </main>
  );
}
