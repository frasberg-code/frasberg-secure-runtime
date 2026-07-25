import { Link, Navigate, useSearchParams } from "react-router-dom";
import { Moon, Sun, ArrowLeft, Loader2, LogOut } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import Starfield from "../components/site/Starfield";
import Seo from "../components/site/Seo";
import ChatDemo from "../components/site/ChatDemo";

export default function Chat() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const [params] = useSearchParams();
  const initialModel = params.get("model") || "luchii-70b";

  if (user === false) {
    return <Navigate to={`/auth?next=${encodeURIComponent(`/chat?model=${initialModel}`)}`} replace />;
  }

  return (
    <main className="relative z-10 flex min-h-screen flex-col bg-lux-bg text-lux-text" data-testid="chat-page">
      <Seo title="Luchii Chat — Talk to the Constellation" description="Chat with Luchii, Frasberg's multi-tier intelligence. Unlimited free conversation, image creation, voice and attachments for signed-in users." />
      <div className="pointer-events-none absolute inset-0 opacity-40"><Starfield /></div>

      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" data-testid="chat-home-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <img src="/luchii-logo.webp" alt="Frasberg Luchii" className="h-8 w-8 rounded-full ring-1 ring-lux-accent/40" />
            <span className="font-display text-lg font-700 tracking-tight">Luchii Chat</span>
          </Link>
          <div className="flex items-center gap-2">
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
        </div>
      </header>

      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 py-8 sm:px-8">
        {user === undefined ? (
          <div className="grid flex-1 place-items-center">
            <Loader2 size={26} className="animate-spin text-lux-accent" />
          </div>
        ) : (
          <div className="flex-1">
            <ChatDemo initialModel={initialModel} tall loadHistory />
          </div>
        )}
      </div>
    </main>
  );
}
