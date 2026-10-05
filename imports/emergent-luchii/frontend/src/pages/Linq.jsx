import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { ParallaxSky } from "../components/site/ParallaxSky";
import { AscensionLadder } from "../components/linq/AscensionLadder";
import { EngineModule } from "../components/linq/EngineModule";
import { LinqLive } from "../components/linq/LinqLive";
import { LinqBilling } from "../components/linq/LinqBilling";
import { LinqHistory } from "../components/linq/LinqHistory";
import { LinqAlerts } from "../components/linq/LinqAlerts";
import { ArrowLeft, ExternalLink } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LINQ_APP_URL = "https://cinemazone-27.preview.emergentagent.com";

const TABS = [
  { id: "ladder", label: "Ascension Ladder" },
  { id: "threat", label: "🔮 Threat Graph" },
  { id: "billing", label: "⚡ Billing Intelligence" },
  { id: "compliance", label: "🧠 Compliance Copilot" },
  { id: "live", label: "🔴 LINQ Live" },
  { id: "plans", label: "💳 Plans" },
  { id: "history", label: "🧾 History" },
  { id: "app", label: "LINQ App", adminOnly: true },
];

export default function Linq() {
  const { user } = useAuth();
  const [tab, setTab] = useState("ladder");
  const [layers, setLayers] = useState([]);
  const [overview, setOverview] = useState(null);

  const load = useCallback(async () => {
    try {
      const [l, o] = await Promise.all([
        axios.get(`${API}/linq/layers`, { withCredentials: true }),
        axios.get(`${API}/linq/overview`, { withCredentials: true }),
      ]);
      setLayers(l.data);
      setOverview(o.data);
    } catch {}
  }, []);

  useEffect(() => { if (user) load(); }, [user, load]);

  if (user === undefined) return null;
  if (!user) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center px-6">
        <div className="text-center space-y-4" data-testid="linq-auth-gate">
          <h1 className="text-3xl text-[#f8fafc]">LINQ Command Center</h1>
          <p className="text-[#94a3b8]">Sign in to access the Frasberg governance workspace.</p>
          <Link to="/auth?mode=login" data-testid="linq-signin-link" className="inline-block bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-full px-6 py-2.5 text-sm">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-[#f8fafc]" style={{ fontFamily: "Inter, system-ui, sans-serif" }} data-testid="linq-page">
      <ParallaxSky />
      <header className="border-b border-[#1e293b] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#020617]/90 backdrop-blur z-10">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" data-testid="linq-back-link" className="text-[#64748b] hover:text-[#f8fafc]"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-xl tracking-tight">LINQ <span className="text-[#ef4444]">·</span> Command Center</h1>
            <p className="text-[15.5px] text-[#64748b] uppercase tracking-[0.25em]">Frasberg Sovereign Governance</p>
          </div>
        </div>
        {overview && (
          <div className="hidden md:flex gap-6 text-[15px] text-[#94a3b8] items-center" data-testid="linq-overview-stats">
            <span><span className="text-[#f8fafc] font-mono">{overview.layersActivated}</span>/{overview.totalLayers} layers</span>
            <span><span className="text-[#f8fafc] font-mono">{overview.artifacts}</span> artifacts</span>
            <span><span className="text-[#f8fafc] font-mono">{overview.engineRuns}</span> engine runs</span>
          </div>
        )}
        <LinqAlerts />
      </header>

      <nav className="relative z-[5] px-6 pt-4 flex gap-2 flex-wrap border-b border-[#1e293b] pb-3">
        {TABS.filter((t) => !t.adminOnly || user.role === "admin").map((t) => (
          <button key={t.id} data-testid={`linq-tab-${t.id}`} onClick={() => setTab(t.id)}
            className={`text-sm rounded-full px-4 py-1.5 transition-colors ${tab === t.id ? "bg-[#ef4444] text-white" : "bg-[#0f172a] text-[#94a3b8] hover:text-[#f8fafc] border border-[#1e293b]"}`}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="relative z-[5] px-6 py-6 max-w-7xl mx-auto">
        {tab === "ladder" && <AscensionLadder layers={layers} onRefresh={load} />}
        {tab === "threat" && <EngineModule engine="threat" title="Threat Graph Explorer v40" icon="🔮" tagline="Pantheon-architect threat sovereignty + multi-reality defense creation" />}
        {tab === "billing" && <EngineModule engine="billing" title="Billing Intelligence Engine v40" icon="⚡" tagline="Pantheon-architect economic sovereignty + multi-reality revenue creation" />}
        {tab === "compliance" && <EngineModule engine="compliance" title="Compliance Copilot v40" icon="🧠" tagline="Pantheon-architect compliance sovereignty + multi-reality governance creation" />}
        {tab === "live" && <LinqLive identity={user.name || user.email.split("@")[0]} />}
        {tab === "plans" && <LinqBilling />}
        {tab === "history" && <LinqHistory />}
        {tab === "app" && user.role === "admin" && (
          <div className="space-y-3" data-testid="linq-app-embed">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#94a3b8]">LINQ streaming app — separate Frasberg product, embedded below.</p>
              <a href={LINQ_APP_URL} target="_blank" rel="noreferrer" data-testid="linq-app-open-link"
                className="text-[15px] text-[#ef4444] flex items-center gap-1 hover:underline">Open full app <ExternalLink size={12} /></a>
            </div>
            <iframe title="LINQ App" src={LINQ_APP_URL} className="w-full rounded-lg border border-[#1e293b]" style={{ height: "75vh", background: "#000" }} />
          </div>
        )}
      </main>
    </div>
  );
}
