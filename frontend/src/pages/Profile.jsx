import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import { Moon, Sun, ArrowLeft, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "../context/ThemeContext";
import { useAuth, formatApiErrorDetail } from "../context/AuthContext";
import Starfield from "../components/site/Starfield";
import Seo from "../components/site/Seo";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Profile() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const [name, setName] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busyName, setBusyName] = useState(false);
  const [busyPw, setBusyPw] = useState(false);

  useEffect(() => { if (user) setName(user.name || ""); }, [user]);

  if (user === false) return <Navigate to="/auth?mode=login&next=%2Fprofile" replace />;

  async function saveName(e) {
    e.preventDefault();
    setBusyName(true);
    try {
      await axios.patch(`${API}/auth/profile`, { name }, { withCredentials: true });
      toast.success("Name updated");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally { setBusyName(false); }
  }

  async function changePw(e) {
    e.preventDefault();
    setBusyPw(true);
    try {
      await axios.post(`${API}/auth/change-password`, { current_password: current, new_password: next }, { withCredentials: true });
      toast.success("Password changed");
      setCurrent(""); setNext("");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally { setBusyPw(false); }
  }

  return (
    <main className="relative z-10 min-h-screen bg-lux-bg text-lux-text" data-testid="profile-page">
      <Seo title="Your Profile — Luchii by Frasberg" description="Manage your Frasberg account: name, password and plan." />
      <div className="pointer-events-none absolute inset-0 opacity-40"><Starfield /></div>

      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/chat" className="flex items-center gap-2.5" data-testid="profile-back-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <img src="/luchii-logo.webp" alt="Frasberg Luchii" className="h-8 w-8 rounded-full ring-1 ring-lux-accent/40" />
            <span className="font-display text-lg font-700 tracking-tight">Profile</span>
          </Link>
          <button onClick={toggle} aria-label="Toggle theme" data-testid="profile-theme-toggle"
            className="grid h-10 w-10 place-items-center rounded-full border border-lux-border transition-colors hover:border-lux-accent hover:text-lux-accent">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      <div className="relative mx-auto max-w-3xl px-5 py-12 sm:px-8">
        {!user ? (
          <div className="grid h-64 place-items-center"><Loader2 size={26} className="animate-spin text-lux-accent" /></div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-full border border-lux-accent/50 text-lux-accent" style={{ boxShadow: "0 0 34px var(--lux-glow)" }}>
                <User size={22} />
              </span>
              <div>
                <h1 className="font-display text-3xl font-700 tracking-tighter" data-testid="profile-name-display">{user.name}</h1>
                <p className="font-mono text-xs text-lux-text2">{user.email} · <span className="uppercase text-lux-accent">{user.plan} plan</span></p>
              </div>
            </div>

            <form onSubmit={saveName} className="mt-10 rounded-2xl border border-lux-border bg-lux-surface p-7">
              <h2 className="font-display text-xl font-600 tracking-tight">Display name</h2>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input value={name} onChange={(e) => setName(e.target.value)} data-testid="profile-name-input"
                  className="flex-1 rounded-full border border-lux-border bg-lux-bg px-5 py-3 text-sm outline-none focus:border-lux-accent" />
                <button type="submit" disabled={busyName} data-testid="profile-save-name-btn"
                  className="rounded-full bg-lux-text px-6 py-3 text-sm font-600 text-lux-bg transition-transform hover:-translate-y-0.5 disabled:opacity-50">
                  {busyName ? "Saving…" : "Save"}
                </button>
              </div>
            </form>

            <form onSubmit={changePw} className="mt-6 rounded-2xl border border-lux-border bg-lux-surface p-7">
              <h2 className="font-display text-xl font-600 tracking-tight">Change password</h2>
              <div className="mt-4 space-y-3">
                <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)}
                  placeholder="Current password" data-testid="profile-current-password"
                  className="w-full rounded-full border border-lux-border bg-lux-bg px-5 py-3 text-sm outline-none focus:border-lux-accent" />
                <input type="password" required value={next} onChange={(e) => setNext(e.target.value)}
                  placeholder="New password (min 6 characters)" data-testid="profile-new-password"
                  className="w-full rounded-full border border-lux-border bg-lux-bg px-5 py-3 text-sm outline-none focus:border-lux-accent" />
                <button type="submit" disabled={busyPw} data-testid="profile-change-password-btn"
                  className="rounded-full bg-lux-text px-6 py-3 text-sm font-600 text-lux-bg transition-transform hover:-translate-y-0.5 disabled:opacity-50">
                  {busyPw ? "Updating…" : "Update password"}
                </button>
              </div>
            </form>

            <button onClick={logout} data-testid="profile-signout-btn"
              className="mt-8 rounded-full border border-lux-border px-6 py-3 text-sm text-lux-text2 transition-colors hover:border-red-400 hover:text-red-400">
              Sign out
            </button>
          </>
        )}
      </div>
    </main>
  );
}
