import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SEEN_KEY = "frsb_notif_seen";

export const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [seenTs, setSeenTs] = useState(() => localStorage.getItem(SEEN_KEY) || "");
  const ref = useRef(null);

  const load = useCallback(() => {
    if (!user) return;
    fetch(`${API}/auth/notifications`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => Array.isArray(d) && setItems(d))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!user) return null;
  const unread = items.filter((n) => !seenTs || n.ts > seenTs).length;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      const now = new Date().toISOString();
      localStorage.setItem(SEEN_KEY, now);
      setSeenTs(now);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} title="Notifications" aria-label="Notifications" data-testid="notification-bell"
        className="relative rounded-md p-2 text-gray-300 transition-colors hover:bg-white/[0.06]">
        <Bell size={15} />
        {unread > 0 && (
          <span data-testid="notification-badge"
            className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 font-mono text-[9.5px] font-700 text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div data-testid="notification-panel"
          className="absolute right-0 top-10 z-[90] w-80 rounded-2xl border border-white/12 p-2 shadow-2xl"
          style={{ background: "rgba(10,14,22,0.98)" }}>
          <p className="px-3 pt-2 font-mono text-[13.5px] uppercase tracking-[0.25em] text-gray-500">Notifications</p>
          <div className="mt-1 max-h-72 overflow-y-auto">
            {items.length === 0 && <p className="px-3 py-5 text-center text-[14.5px] text-gray-500" data-testid="notification-empty">Nothing yet — gifts and daily grants show up here.</p>}
            {items.map((n, i) => (
              <div key={n.id} className="border-b border-white/[0.06] px-3 py-2.5 last:border-0" data-testid={`notification-item-${i}`}>
                <p className="text-[15px] text-gray-100">{n.title}</p>
                <p className="mt-0.5 truncate font-mono text-[13.5px] text-gray-500">{n.detail} · {(n.ts || "").slice(0, 10)}</p>
              </div>
            ))}
          </div>
          <button onClick={() => { setOpen(false); navigate("/dashboard"); }} data-testid="notification-view-console"
            className="mt-1 w-full rounded-xl py-2 text-center font-mono text-[14px] text-cyan-300 hover:bg-white/[0.05]">
            Open Frasberg Gift card →
          </button>
        </div>
      )}
    </div>
  );
};
