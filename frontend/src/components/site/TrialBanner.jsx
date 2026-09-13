import { Link } from "react-router-dom";
import { Zap, Clock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const PLAN_LABELS = { builder: "Builder", pro: "Luchii Pro", premium: "Luchii Premium" };

export const TrialBanner = () => {
  const { user } = useAuth();
  if (!user || !user.plan_expires) return null;
  const ms = new Date(user.plan_expires) - Date.now();
  if (ms <= 0) return null;
  const days = Math.ceil(ms / 86400000);

  if (user.plan === "trial") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-2.5 border-b border-lux-accent/30 bg-lux-accent/10 px-4 py-2 text-center text-[15px] text-lux-text" data-testid="trial-banner">
        <Zap size={12} className="shrink-0 text-lux-accent" />
        <span>
          <span className="font-700">{days} day{days === 1 ? "" : "s"}</span> left on your trial — keep your API keys, builders &amp; advanced tools.
        </span>
        <Link to="/pay" data-testid="trial-upgrade-link"
          className="rounded-full bg-lux-accent px-3.5 py-1 font-600 text-lux-bg transition-transform hover:-translate-y-0.5">
          Upgrade now
        </Link>
      </div>
    );
  }

  if (PLAN_LABELS[user.plan] && days <= 3) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-2.5 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-[15px] text-lux-text" data-testid="renewal-banner">
        <Clock size={12} className="shrink-0 text-amber-500" />
        <span>
          Your <span className="font-700">{PLAN_LABELS[user.plan]}</span> plan lapses in{" "}
          <span className="font-700">{days} day{days === 1 ? "" : "s"}</span> — renew to keep your keys, builds &amp; Pro features.
        </span>
        <Link to="/pay" data-testid="renewal-renew-link"
          className="rounded-full bg-amber-500 px-3.5 py-1 font-600 text-lux-bg transition-transform hover:-translate-y-0.5">
          Renew now
        </Link>
      </div>
    );
  }

  return null;
};
