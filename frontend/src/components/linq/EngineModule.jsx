import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Play } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const EngineModule = ({ engine, title, icon, tagline }) => {
  const [runs, setRuns] = useState([]);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/linq/engines/${engine}`, { withCredentials: true });
      setRuns(data);
    } catch {}
  }, [engine]);

  useEffect(() => { load(); }, [load]);

  const run = async () => {
    setRunning(true);
    try {
      await axios.post(`${API}/linq/engines/${engine}/run`, {}, { withCredentials: true });
      toast.success(`${title} run complete`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Engine run failed");
    } finally {
      setRunning(false);
    }
  };

  const latest = runs[0];

  return (
    <div data-testid={`engine-${engine}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[#f8fafc] text-lg">{icon} {title}</h3>
          <p className="text-[#64748b] text-xs">{tagline}</p>
        </div>
        <button
          data-testid={`run-engine-${engine}-btn`}
          onClick={run}
          disabled={running}
          className="bg-[#ef4444] hover:bg-[#dc2626] disabled:opacity-40 text-white text-sm rounded-full px-4 py-2 flex items-center gap-2 transition-colors"
        >
          {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {running ? "Running…" : "Run Engine"}
        </button>
      </div>

      {!latest && <div className="text-[#64748b] text-sm border border-dashed border-[#1e293b] rounded-lg p-6 text-center">No runs yet. Run the engine to generate its first artifact.</div>}

      {latest && (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-4 space-y-3" data-testid={`engine-${engine}-latest`}>
          <div className="flex items-center justify-between">
            <span className="text-[#ef4444] font-mono text-sm">{latest.tag}</span>
            {typeof latest.score === "number" && (
              <span className="text-[#4ade80] text-sm font-mono">score {Math.round(latest.score)}/100</span>
            )}
          </div>
          <p className="text-[#cbd5e1] text-sm">{latest.narrative}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(latest.cognition || []).map((c, i) => (
              <div key={i} className="bg-[#020617] rounded p-2 text-xs">
                <div className="text-[#f8fafc]">{c.concept}</div>
                <div className="text-[#64748b]">{c.role} · epoch {c.epoch}</div>
              </div>
            ))}
          </div>
          {(latest.recommendations || []).length > 0 && (
            <div className="text-xs space-y-1">
              <div className="text-[#94a3b8] uppercase tracking-widest text-[10px]">Recommendations</div>
              {latest.recommendations.map((r, i) => <div key={i} className="text-[#cbd5e1]">→ {r}</div>)}
            </div>
          )}
          {latest.stats && (
            <div className="text-[10px] text-[#64748b] font-mono">live inputs: {latest.stats.users} users · {latest.stats.builds} builds · {latest.stats.rooms} rooms</div>
          )}
        </div>
      )}

      {runs.length > 1 && (
        <div className="mt-3 text-xs text-[#64748b]">{runs.length - 1} earlier run(s) stored</div>
      )}
    </div>
  );
};
