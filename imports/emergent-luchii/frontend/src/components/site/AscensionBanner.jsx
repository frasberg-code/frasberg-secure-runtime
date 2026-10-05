import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AscensionBanner = () => {
  const [ann, setAnn] = useState(null);

  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`${API}/marketplace/announcements/latest`);
        const d = await r.json();
        const latest = (d.announcements || [])[0];
        if (!latest) return;
        if (latest.id !== localStorage.getItem("frasberg_seen_announcement")) setAnn(latest);
      } catch (e) { /* offline */ }
    };
    check();
    const t = setInterval(check, 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!ann) return;
    const t = setTimeout(() => {
      localStorage.setItem("frasberg_seen_announcement", ann.id);
      setAnn(null);
    }, 12000);
    return () => clearTimeout(t);
  }, [ann]);

  if (!ann) return null;
  const dismiss = () => { localStorage.setItem("frasberg_seen_announcement", ann.id); setAnn(null); };
  return (
    <div data-testid="ascension-banner"
      className="fixed inset-x-0 top-0 z-[90] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-purple-400/40 bg-[#14081f]/95 px-4 py-2.5 backdrop-blur"
      style={{ animation: "annSlide 0.5s ease both", boxShadow: "0 8px 40px rgba(192,132,252,0.25)" }}>
      <style>{`@keyframes annSlide { from { transform: translateY(-100%); } to { transform: none; } }`}</style>
      <span className="font-mono text-[14px] uppercase tracking-[0.25em] text-purple-300">⟐ Ascension</span>
      <span className="text-[15px] text-white" data-testid="ascension-banner-text">{ann.text}</span>
      <Link to="/marketplace" onClick={dismiss} data-testid="ascension-banner-link"
        className="font-mono text-[14px] text-cyan-300 underline underline-offset-4 hover:text-cyan-200">view hall →</Link>
      <button onClick={dismiss} aria-label="Dismiss announcement" data-testid="ascension-banner-dismiss"
        className="ml-1 grid h-8 w-8 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"><X size={15} /></button>
    </div>
  );
};
