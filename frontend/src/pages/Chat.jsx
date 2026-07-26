import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Moon, Sun, ArrowLeft, Loader2, LogOut, Plus, MessagesSquare, User, MoreVertical } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import Starfield from "../components/site/Starfield";
import Seo from "../components/site/Seo";
import ChatDemo from "../components/site/ChatDemo";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Chat() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const [params] = useSearchParams();
  const initialModel = params.get("model") || "luchii-70b";
  const agent = params.get("agent") || null;
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null); // null = latest, "new" = fresh
  const [showList, setShowList] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API}/chat/sessions`, { credentials: "include" });
      if (res.ok) setSessions(await res.json());
    } catch {}
  }, []);

  useEffect(() => { if (user) loadSessions(); }, [user, loadSessions]);

  return (
    <main className="relative z-10 flex min-h-screen flex-col overflow-x-hidden bg-lux-bg text-lux-text" data-testid="chat-page">
      <Seo title="Luchii Chat — Talk to the Constellation" description="Chat with Luchii, Frasberg's multi-tier intelligence. Unlimited free conversation, image creation, voice and attachments for signed-in users." />
      <div className="pointer-events-none absolute inset-0 opacity-40"><Starfield /></div>

      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" data-testid="chat-home-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <img src="/luchii-logo.webp" alt="Frasberg Luchii" className="h-8 w-8 rounded-full ring-1 ring-lux-accent/40" />
            <span className="font-display text-lg font-700 tracking-tight" data-testid="chat-header-title">Luchii</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowList((s) => !s)}
              data-testid="chat-sessions-toggle"
              aria-label="Conversations"
              className="grid h-10 w-10 place-items-center rounded-full border border-lux-border text-lux-text2 transition-colors hover:border-lux-accent hover:text-lux-accent lg:hidden"
            >
              <MessagesSquare size={16} />
            </button>
            <div className="hidden items-center gap-2 sm:flex">
              {user && (
                <Link to="/profile" data-testid="chat-profile-link" aria-label="Profile"
                  className="grid h-10 w-10 place-items-center rounded-full border border-lux-border text-lux-text2 transition-colors hover:border-lux-accent hover:text-lux-accent">
                  <User size={16} />
                </Link>
              )}
              {user && (
                <button onClick={logout} data-testid="chat-logout-btn" aria-label="Sign out"
                  className="grid h-10 w-10 place-items-center rounded-full border border-lux-border text-lux-text2 transition-colors hover:border-lux-accent hover:text-lux-accent">
                  <LogOut size={16} />
                </button>
              )}
              <button onClick={toggle} aria-label="Toggle theme" data-testid="chat-theme-toggle"
                className="grid h-10 w-10 place-items-center rounded-full border border-lux-border transition-colors hover:border-lux-accent hover:text-lux-accent">
                {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            </div>
            <div className="relative sm:hidden">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Menu"
                data-testid="chat-header-menu-btn"
                className={`grid h-10 w-10 place-items-center rounded-full border transition-colors ${menuOpen ? "border-lux-accent text-lux-accent" : "border-lux-border text-lux-text2"}`}
              >
                <MoreVertical size={16} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-12 z-50 w-48 space-y-1 rounded-2xl border border-lux-border bg-lux-surface p-2 shadow-2xl" data-testid="chat-header-menu">
                  {user && (
                    <Link to="/profile" onClick={() => setMenuOpen(false)} data-testid="chat-profile-link-mobile"
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-lux-text transition-colors hover:bg-lux-surface2">
                      <User size={15} className="text-lux-text2" /> Profile
                    </Link>
                  )}
                  <button onClick={() => { toggle(); setMenuOpen(false); }} data-testid="chat-theme-toggle-mobile"
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-lux-text transition-colors hover:bg-lux-surface2">
                    {theme === "dark" ? <Sun size={15} className="text-lux-text2" /> : <Moon size={15} className="text-lux-text2" />}
                    {theme === "dark" ? "Light theme" : "Dark theme"}
                  </button>
                  {user && (
                    <button onClick={() => { setMenuOpen(false); logout(); }} data-testid="chat-logout-btn-mobile"
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-lux-text transition-colors hover:bg-lux-surface2">
                      <LogOut size={15} className="text-lux-text2" /> Sign out
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 gap-6 px-3 py-4 sm:px-8 sm:py-8">
        {user === undefined ? (
          <div className="grid flex-1 place-items-center">
            <Loader2 size={26} className="animate-spin text-lux-accent" />
          </div>
        ) : (
          <>
            {/* Sessions sidebar */}
            <aside className={`${showList ? "block" : "hidden"} w-full shrink-0 lg:block lg:w-64`} data-testid="chat-sessions-sidebar">
              {user ? (
                <>
                  <button
                    onClick={() => { setSelected("new"); setShowList(false); }}
                    data-testid="chat-new-session-btn"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-lux-text px-5 py-2.5 text-sm font-600 text-lux-bg transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <Plus size={15} /> New chat
                  </button>
                  <p className="mt-6 px-1 font-mono text-[11px] uppercase tracking-[0.2em] text-lux-text2">Conversations</p>
                  <div className="mt-3 max-h-[60vh] space-y-1.5 overflow-y-auto pr-1" data-testid="chat-sessions-list">
                    {sessions.length === 0 && (
                      <p className="px-1 text-xs text-lux-text2">No conversations yet — Luchii remembers every chat you have.</p>
                    )}
                    {sessions.map((s) => (
                      <button
                        key={s.session_id}
                        onClick={() => { setSelected(s.session_id); setShowList(false); }}
                        data-testid={`chat-session-${s.session_id}`}
                        className={`block w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                          selected === s.session_id
                            ? "border-lux-accent bg-lux-surface text-lux-text"
                            : "border-lux-border bg-lux-surface/60 text-lux-text2 hover:border-lux-accent/50 hover:text-lux-text"
                        }`}
                      >
                        <p className="truncate text-sm">{s.title}</p>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-wide opacity-70">
                          {s.count} msgs{s.model ? ` · ${s.model}` : ""}
                        </p>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-lux-border bg-lux-surface p-6" data-testid="chat-guest-sidebar">
                  <p className="font-display text-lg font-700 tracking-tight">Guest mode</p>
                  <p className="mt-2 text-xs leading-relaxed text-lux-text2">
                    You can chat freely, but conversations are deleted when you leave.
                    Sign up free to save every chat, create images (20/day free) and use voice & attachments.
                  </p>
                  <Link to="/auth" data-testid="chat-sidebar-signup-cta"
                    className="mt-4 inline-block w-full rounded-full bg-lux-text px-5 py-2.5 text-center text-sm font-600 text-lux-bg transition-transform duration-200 hover:-translate-y-0.5">
                    Sign up free
                  </Link>
                </div>
              )}
            </aside>

            <div className={`${showList ? "hidden lg:block" : "block"} min-w-0 flex-1`}>
              <ChatDemo
                key={(selected || "latest") + (agent || "")}
                initialModel={initialModel}
                tall
                loadHistory
                sessionOverride={selected}
                onNewMessage={loadSessions}
                agent={agent}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
