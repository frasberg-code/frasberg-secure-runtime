import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Zap, ChevronDown } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AscensionLadder = ({ layers, onRefresh }) => {
  const [running, setRunning] = useState(null);
  const [open, setOpen] = useState(null);
  const [artifact, setArtifact] = useState(null);

  const runLayer = async (num) => {
    setRunning(num);
    try {
      const { data } = await axios.post(`${API}/linq/layers/${num}/run`, {}, { withCredentials: true });
      setArtifact(data);
      setOpen(num);
      toast.success(`Layer ${data.roman} activated — ${data.tag || data.layerName}`);
      onRefresh?.();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Layer run failed");
    } finally {
      setRunning(null);
    }
  };

  const tiers = [
    { key: "foundation", label: "Foundation Layers I–XIX", items: layers.filter((l) => l.tier === "foundation") },
    { key: "ascension", label: "Ascension Layers XX–XLV", items: layers.filter((l) => l.tier === "ascension") },
  ];

  return (
    <div className="space-y-8" data-testid="ascension-ladder">
      {tiers.map((tier) => (
        <div key={tier.key}>
          <h3 className="text-[#94a3b8] text-sm uppercase tracking-[0.2em] mb-3">{tier.label}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {tier.items.map((l) => (
              <div key={l.number} className="bg-[#0f172a] border border-[#1e293b] rounded-lg overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                  <span className={`text-sm font-mono w-12 shrink-0 ${l.artifacts > 0 ? "text-[#4ade80]" : "text-[#64748b]"}`}>{l.roman}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#f8fafc] truncate">{l.name}</div>
                    <div className="text-sm text-[#64748b] truncate">{l.description}</div>
                  </div>
                  {l.artifacts > 0 && <span className="text-[13px] text-[#4ade80] border border-[#4ade80]/40 rounded-full px-2 py-0.5">{l.artifacts}</span>}
                  <button
                    data-testid={`run-layer-${l.number}-btn`}
                    onClick={() => runLayer(l.number)}
                    disabled={running !== null}
                    className="shrink-0 bg-[#ef4444] hover:bg-[#dc2626] disabled:opacity-40 text-white text-sm rounded-full px-3 py-1.5 flex items-center gap-1 transition-colors"
                  >
                    {running === l.number ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                    Run
                  </button>
                  {open === l.number && artifact && (
                    <button onClick={() => setOpen(null)} className="text-[#64748b]"><ChevronDown size={14} /></button>
                  )}
                </div>
                {open === l.number && artifact && artifact.layer === l.number && (
                  <div className="border-t border-[#1e293b] p-3 text-sm space-y-2" data-testid={`layer-artifact-${l.number}`}>
                    <div className="text-[#ef4444] font-mono">{artifact.tag}</div>
                    <p className="text-[#cbd5e1]">{artifact.narrative}</p>
                    {(artifact.transformations || []).map((t, i) => (
                      <div key={i} className="text-[#94a3b8]">• [{t.domain}] {t.change} <span className="text-[#64748b]">(epoch {t.epoch})</span></div>
                    ))}
                    <div className="text-[#64748b]">Epoch horizon: {artifact.epochHorizonYears} years</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
