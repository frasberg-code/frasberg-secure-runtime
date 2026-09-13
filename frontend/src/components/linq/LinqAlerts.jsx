import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Bell, Play, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const LinqAlerts = () => {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [unread, setUnread] = useState(0);
  const [sched, setSched] = useState(null);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);

  const load = useCallback(async () => {
    try {
      const [a, s] = await Promise.all([
        axios.get(`${API}/linq/alerts`, { withCredentials: true }),
        axios.get(`${API}/linq/scheduler`, { withCredentials: true }),
      ]);
      setAlerts(a.data.alerts);
      setUnread(a.data.unread);
      setSched(s.data);
    } catch {}
  }, []);

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

  const openPanel = async () => {
    setOpen((o) => !o);
    if (!open && unread > 0) {
      try { await axios.post(`${API}/linq/alerts/read`, {}, { withCredentials: true }); setUnread(0); } catch {}
    }
  };

  const toggleSched = async () => {
    try {
      const { data } = await axios.post(`${API}/linq/scheduler/toggle`, {}, { withCredentials: true });
      setSched((s) => ({ ...s, enabled: data.enabled }));
      toast.success(`Daily scans ${data.enabled ? "enabled" : "disabled"}`);
    } catch { toast.error("Could not toggle scheduler"); }
  };

  const runNow = async () => {
    setRunning(true);
    try {
      const { data } = await axios.post(`${API}/linq/scheduler/run-now`, {}, { withCredentials: true, timeout: 120000 });
      toast.success(`Scans complete — ${data.results.length} engines, ${data.alertsCreated} alert(s)`);
      load();
    } catch { toast.error("Scheduled run failed"); }
    finally { setRunning(false); }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={openPanel} data-testid="linq-alerts-bell"
        className="relative grid h-9 w-9 place-items-center rounded-full border border-[#1e293b] text-[#94a3b8] hover:text-[#f8fafc] hover:border-[#ef4444] transition-colors">
        <Bell size={15} />
        {unread > 0 && (
          <span data-testid="linq-alerts-badge"
            className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#ef4444] px-1 text-[9px] text-white">{unread}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-[#1e293b] bg-[#0f172a] p-3 shadow-2xl space-y-3" data-testid="linq-alerts-panel">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#f8fafc]">Engine Scheduler</span>
            <button onClick={toggleSched} data-testid="linq-sched-toggle"
              className={`text-[13px] rounded-full px-2.5 py-1 border ${sched?.enabled ? "border-[#4ade80]/50 text-[#4ade80]" : "border-[#64748b]/50 text-[#64748b]"}`}>
              {sched?.enabled ? "Daily scans ON" : "Daily scans OFF"}
            </button>
          </div>
          <div className="flex items-center justify-between text-[13.5px] text-[#94a3b8]">
            <span>Last run: {sched?.last_run_at ? sched.last_run_at.slice(0, 16).replace("T", " ") : "never"}</span>
            <button onClick={runNow} disabled={running} data-testid="linq-sched-run-now"
              className="flex items-center gap-1 rounded-full border border-[#ef4444]/50 text-[#ef4444] px-2.5 py-1 text-[13px] hover:bg-[#ef4444]/10 disabled:opacity-40">
              {running ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />} Run now
            </button>
          </div>
          <div className="border-t border-[#1e293b] pt-2 max-h-64 overflow-y-auto space-y-2" data-testid="linq-alerts-list">
            {alerts.length === 0 && <div className="text-[13.5px] text-[#64748b]">No alerts — scores are holding steady.</div>}
            {alerts.map((a) => (
              <div key={a.id} className="rounded-lg border border-[#1e293b] bg-[#020617] p-2" data-testid={`linq-alert-${a.id}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] uppercase tracking-widest text-[#f87171]">{a.engine} drop</span>
                  <span className="font-mono text-[13px] text-[#f87171]">{a.delta}</span>
                </div>
                <p className="text-[13.5px] text-[#cbd5e1] mt-0.5">{a.message}</p>
                <span className="text-[9px] text-[#64748b] font-mono">{(a.createdAt || "").slice(0, 16).replace("T", " ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
