import { Link, useLocation } from "react-router-dom";
import { Mountain, CalendarCheck, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const TrekNav = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-40 border-b border-[#e4ddd0] bg-[#f6f3ec]/90 backdrop-blur-md" data-testid="trek-nav">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-8">
        <Link to="/trek" className="flex items-center gap-2.5" data-testid="trek-nav-brand">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#2d5a3d] text-[#f6f3ec]">
            <Mountain size={17} />
          </span>
          <span className="font-display text-lg font-700 tracking-tight text-[#1f2a24]">
            Frasberg <span className="text-[#2d5a3d]">Treks</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/trek"
            data-testid="trek-nav-treks"
            className={`rounded-full px-3.5 py-2 text-sm font-600 transition-colors ${pathname === "/trek" ? "bg-[#2d5a3d] text-[#f6f3ec]" : "text-[#4a5a50] hover:text-[#1f2a24]"}`}
          >
            Treks
          </Link>
          <Link
            to="/trek/bookings"
            data-testid="trek-nav-bookings"
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-600 transition-colors ${pathname === "/trek/bookings" ? "bg-[#2d5a3d] text-[#f6f3ec]" : "text-[#4a5a50] hover:text-[#1f2a24]"}`}
          >
            <CalendarCheck size={15} /> <span className="hidden sm:inline">My Bookings</span><span className="sm:hidden">Bookings</span>
          </Link>
          {!user && (
            <Link to="/auth" data-testid="trek-nav-signin"
              className="rounded-full border border-[#2d5a3d] px-3.5 py-2 text-sm font-600 text-[#2d5a3d] transition-colors hover:bg-[#2d5a3d] hover:text-[#f6f3ec]">
              Sign in
            </Link>
          )}
          <Link to="/" data-testid="trek-nav-luchii" title="Back to Luchii"
            className="hidden items-center gap-1.5 rounded-full border border-[#e4ddd0] px-3.5 py-2 text-sm text-[#4a5a50] transition-colors hover:border-[#c2701e] hover:text-[#c2701e] sm:inline-flex">
            <Sparkles size={14} /> Luchii
          </Link>
        </nav>
      </div>
    </header>
  );
};

export const TrekFooter = () => (
  <footer className="border-t border-[#e4ddd0] bg-[#efeadf] py-10" data-testid="trek-footer">
    <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 font-mono text-xs text-[#7a8a80] sm:flex-row sm:items-center sm:px-8">
      <span>Frasberg Treks — an expedition division of FRASBERG, INC.</span>
      <span>Copyright © 2003-2026 FRASBERG, INC.</span>
    </div>
  </footer>
);
