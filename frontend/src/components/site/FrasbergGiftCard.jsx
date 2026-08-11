import { useState, useEffect } from "react";
import { Gift, Sparkles } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const FrasbergGiftCard = ({ className = "" }) => {
  const [gift, setGift] = useState(null);

  useEffect(() => {
    fetch(`${API}/auth/gift`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((g) => {
        setGift(g);
        if (g?.granted_today > 0) toast.success(`Frasberg Gift — +${g.granted_today} free tokens claimed today`);
      })
      .catch(() => {});
  }, []);

  if (!gift) return null;
  const year = (gift.member_since || "2026").slice(0, 4);

  return (
    <div data-testid="frasberg-gift-card" className={`relative overflow-hidden rounded-2xl border border-cyan-400/25 p-6 sm:p-7 ${className}`}
      style={{ background: "linear-gradient(135deg,#0B1220 0%,#101B33 45%,#16264A 100%)", boxShadow: "0 0 50px rgba(34,211,238,0.08)" }}>
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full" style={{ background: "radial-gradient(circle,rgba(34,211,238,0.14),transparent 70%)" }} />
      <div className="pointer-events-none absolute -left-10 -bottom-24 h-52 w-52 rounded-full" style={{ background: "radial-gradient(circle,rgba(251,191,36,0.10),transparent 70%)" }} />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11.5px] uppercase tracking-[0.3em] text-amber-300">
            <Gift size={14} /> Frasberg Gift
          </div>
          <p className="mt-4 font-mono text-4xl font-600 tracking-tighter text-white" data-testid="gift-token-balance">
            {Number(gift.tokens).toLocaleString()}
            <span className="ml-2 text-sm text-cyan-300/80">Frasberg tokens</span>
          </p>
          {gift.granted_today > 0 && (
            <span data-testid="gift-daily-claimed" className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 font-mono text-[12px] text-emerald-300">
              <Sparkles size={12} /> +{gift.granted_today} daily tokens claimed
            </span>
          )}
        </div>
        <img src="/frasberg-mark-circle.png" alt="Frasberg" className="h-10 w-10 rounded-full opacity-90" />
      </div>

      <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-gray-400" data-testid="gift-card-terms">
          {gift.signup_grant} tokens on signup · {gift.daily_grant} free every day
        </p>
        <p className="font-mono text-[12px] tracking-[0.25em] text-cyan-300/70">FRSB •••• {year}</p>
      </div>
    </div>
  );
};
