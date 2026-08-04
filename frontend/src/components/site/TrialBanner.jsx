import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const TrialBanner = () => {
  const { user } = useAuth();
  if (!user || user.plan !== "trial" || !user.plan_expires) return null;
  const ms = new Date(user.plan_expires) - Date.now();
  if (ms <= 0) return null;
  const days = Math.ceil(ms / 86400000);
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 border-b border-lux-accent/30 bg-lux-accent/10 px-4 py-2 text-center text-xs text-lux-text" data-testid="trial-banner">
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
};
