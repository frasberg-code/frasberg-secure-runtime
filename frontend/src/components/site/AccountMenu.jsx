import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Gift, CreditCard, Settings, LogOut, Github, BookOpen, LifeBuoy, Gauge, Layers, ExternalLink, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { AccountSettingsModal } from "./AccountSettingsModal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AccountMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [gift, setGift] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open && user && gift === null) {
      fetch(`${API}/auth/gift`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null)).then(setGift).catch(() => {});
    }
  }, [open, user, gift]);

  const go = (to) => { setOpen(false); navigate(to); };
  const initial = (user?.name || user?.email || "?").slice(0, 1).toUpperCase();

  const Item = ({ icon: Icon, label, onClick, badge, external, danger, testid }) => (
    <button onClick={onClick} data-testid={testid}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13.5px] transition-colors hover:bg-white/[0.06] ${danger ? "text-rose-400" : "text-gray-200"}`}>
      <Icon size={15} className={danger ? "text-rose-400" : "text-gray-400"} />
      <span className="flex-1">{label}</span>
      {badge && <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 font-mono text-[10.5px] uppercase text-amber-300">{badge}</span>}
      {external && <ExternalLink size={12} className="text-gray-500" />}
    </button>
  );

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} data-testid="account-menu-btn" aria-label="Account menu"
        className="grid h-8 w-8 place-items-center rounded-full border border-cyan-400/40 bg-cyan-400/10 font-mono text-[13px] font-600 text-cyan-200 transition-colors hover:border-cyan-300">
        {user ? initial : "?"}
      </button>

      {open && (
        <div data-testid="account-menu-panel"
          className="absolute right-0 top-11 z-[90] w-80 rounded-2xl border border-white/12 p-3 shadow-2xl backdrop-blur-xl"
          style={{ background: "rgba(10,14,22,0.97)" }}>
          {user ? (
            <>
              <p className="px-2 pt-1 font-mono text-[12px] text-gray-500" data-testid="account-menu-email">{user.email}</p>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <img src="/frasberg-mark-circle.png" alt="" className="h-9 w-9 rounded-full" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-600 text-white">{user.name || "Frasberg member"}</p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-gray-500">{user.role === "admin" ? "Admin" : "Owner"} · {user.plan || "free"} plan</p>
                </div>
                <ShieldCheck size={15} className="text-cyan-300" />
              </div>

              <div className="mt-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.04] p-3" data-testid="account-menu-tokens">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] uppercase tracking-[0.15em] text-gray-400">Tokens</span>
                  <span className="font-mono text-[15px] font-600 text-white">
                    {gift ? `${Number(gift.tokens).toLocaleString()} + ${Number(gift.paid_tokens).toLocaleString()}` : "…"}
                  </span>
                </div>
                <button onClick={() => go("/dashboard")} data-testid="account-menu-buy-tokens"
                  className="mt-2.5 w-full rounded-full bg-amber-300 py-2 font-mono text-[12.5px] font-600 text-[#0B1220] transition-opacity hover:opacity-85">
                  ⊕ Buy Tokens
                </button>
              </div>

              <div className="mt-2 space-y-0.5">
                <Item icon={Gift} label="Frasberg Gift" onClick={() => go("/dashboard")} testid="account-menu-gift" />
                <Item icon={CreditCard} label="Manage Plan" badge={user.plan || "free"} onClick={() => go("/profile")} testid="account-menu-plan" />
                <Item icon={Gauge} label="Tier Benchmark" onClick={() => go("/benchmark")} testid="account-menu-benchmark" />
                <Item icon={Layers} label="Kernel Stack" onClick={() => go("/kernels")} testid="account-menu-kernels" />
                <Item icon={Settings} label="Account Settings" onClick={() => { setOpen(false); setSettingsOpen(true); }} testid="account-menu-settings" />
                <div className="my-1.5 border-t border-white/10" />
                <Item icon={Github} label="GitHub" external onClick={() => { setOpen(false); window.open("https://github.com/frasberg", "_blank"); }} testid="account-menu-github" />
                <Item icon={BookOpen} label="Community Codex" onClick={() => go("/codex")} testid="account-menu-community" />
                <Item icon={LifeBuoy} label="Help Center" onClick={() => go("/docs")} testid="account-menu-help" />
                <div className="my-1.5 border-t border-white/10" />
                <Item icon={LogOut} label="Logout" danger testid="account-menu-logout"
                  onClick={async () => { setOpen(false); await logout(); toast.success("Signed out"); navigate("/"); }} />
              </div>
            </>
          ) : (
            <div className="p-2">
              <p className="text-[13.5px] text-gray-300">You're not signed in.</p>
              <button onClick={() => go("/auth?mode=login")} data-testid="account-menu-signin"
                className="mt-3 w-full rounded-full bg-cyan-300 py-2 font-mono text-[12.5px] font-600 text-[#05070C] hover:opacity-85">Sign in</button>
              <button onClick={() => go("/auth?mode=register")} data-testid="account-menu-register"
                className="mt-2 w-full rounded-full border border-white/20 py-2 font-mono text-[12.5px] text-gray-200 hover:border-cyan-400/50">Create account — 50 free tokens</button>
            </div>
          )}
        </div>
      )}

      <AccountSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};
