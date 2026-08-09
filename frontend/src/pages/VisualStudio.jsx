import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, User, Skull, Loader2, Sparkles, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { WeatherOverlay } from "../components/WeatherOverlay";
import { DayNightOverlay } from "../components/DayNightOverlay";
import { ParallaxSky } from "../components/site/ParallaxSky";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const B = process.env.REACT_APP_BACKEND_URL;

const TIER_LABELS = { 1: "Common", 2: "Elite", 3: "Boss", 4: "Legendary" };
const TIER_COLORS = { 1: "#6b7280", 2: "#3b82f6", 3: "#8b5cf6", 4: "#ef4444" };
const CHAR_OPTS = {
  character_type: ["hero", "npc", "boss", "villain", "ally"],
  gender: ["male", "female", "non-binary"],
  ethnicity: ["Black", "White", "Latino", "Asian", "Middle Eastern", "Indigenous", "Mixed", "South Asian"],
  build: ["slim", "athletic", "muscular", "heavy"],
  style: ["streetwear", "military", "fantasy armor", "sci-fi suit", "gang leader", "detective", "rogue assassin", "royal guard", "post-apocalyptic survivor", "undercover agent"],
};

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    credentials: "include", body: JSON.stringify(body),
  });
  if (res.status === 401) throw new Error("Please log in to generate assets");
  if (res.status === 429) throw new Error((await res.json()).detail);
  if (!res.ok) throw new Error("Generation failed — please try again");
  return res.json();
}

const sel = "w-full rounded-lg border border-[#2d2d4a] bg-[#1a1a2e] px-3 py-2.5 text-sm text-white outline-none focus:border-[#7c3aed]";
const label = "mb-1.5 block text-[11px] uppercase tracking-[0.15em] text-[#9ca3af]";
const genBtn = "inline-flex items-center justify-center gap-2 rounded-lg bg-[#7c3aed] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#8f5cf7] disabled:opacity-50";

function Result({ r }) {
  if (!r) return null;
  return (
    <div className="mt-6" data-testid="studio-result">
      <img src={`${B}${r.image_url}`} alt="Generated" className="w-full max-w-2xl rounded-xl border border-[#1f1f3a]" />
      <p className="mt-2 text-xs text-[#6b7280]">Generated in {(r.generation_time_ms / 1000).toFixed(1)}s · gpt-image-1</p>
    </div>
  );
}

function CityTab() {
  const [cities, setCities] = useState([]);
  const [f, setF] = useState({ city_slug: "las_vegas", zone: "The Strip", hour: 22, weather: "clear", crowd_density: "normal" });
  const [busy, setBusy] = useState(false);
  const [r, setR] = useState(null);
  useEffect(() => { fetch(`${API}/studio/cities`).then((x) => x.json()).then((d) => setCities(d.cities)); }, []);
  const zones = cities.find((c) => c.slug === f.city_slug)?.zones || [];
  const phase = f.hour >= 5 && f.hour < 10 ? "dawn" : f.hour >= 10 && f.hour < 17 ? "day" : f.hour >= 17 && f.hour < 21 ? "dusk" : "night";
  const go = async () => {
    setBusy(true); setR(null);
    try { setR(await post("/studio/environment/render", f)); toast.success("Environment rendered"); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <div>
      <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <div><span className={label}>City</span>
          <select data-testid="studio-city-select" className={sel} value={f.city_slug}
            onChange={(e) => { const c = cities.find((x) => x.slug === e.target.value); setF({ ...f, city_slug: e.target.value, zone: c?.zones[0] || "" }); }}>
            {cities.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select></div>
        <div><span className={label}>Zone</span>
          <select data-testid="studio-zone-select" className={sel} value={f.zone} onChange={(e) => setF({ ...f, zone: e.target.value })}>
            {zones.map((z) => <option key={z}>{z}</option>)}
          </select></div>
        <div><span className={label}>Game hour: {String(f.hour).padStart(2, "0")}:00 — {phase.toUpperCase()}</span>
          <input type="range" min={0} max={23} value={f.hour} data-testid="studio-hour-slider"
            onChange={(e) => setF({ ...f, hour: Number(e.target.value) })} className="w-full accent-[#7c3aed]" /></div>
        <div><span className={label}>Weather</span>
          <select data-testid="studio-weather-select" className={sel} value={f.weather} onChange={(e) => setF({ ...f, weather: e.target.value })}>
            {["clear", "rain", "fog", "heat_haze", "stormy"].map((w) => <option key={w}>{w}</option>)}
          </select></div>
        <div><span className={label}>Crowd density</span>
          <select data-testid="studio-crowd-select" className={sel} value={f.crowd_density} onChange={(e) => setF({ ...f, crowd_density: e.target.value })}>
            {["empty", "sparse", "normal", "packed"].map((c) => <option key={c}>{c}</option>)}
          </select></div>
      </div>
      <button data-testid="studio-city-generate" onClick={go} disabled={busy} className={`${genBtn} mt-5`}>
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} {busy ? "Rendering environment…" : "Render Environment"}
      </button>
      {r && (
        <div className="relative mt-6 max-w-2xl overflow-hidden rounded-xl" data-testid="studio-result">
          <img src={`${B}${r.image_url}`} alt="Environment" className="w-full rounded-xl border border-[#1f1f3a]" />
          <DayNightOverlay hour={f.hour} />
          <WeatherOverlay weather={f.weather} />
          <p className="mt-2 text-xs text-[#6b7280]">
            {r.time_of_day} · {r.weather} · crowd {r.crowd_density} · neon {Math.round(r.neon_intensity * 100)}% · {(r.generation_time_ms / 1000).toFixed(1)}s
          </p>
        </div>
      )}
    </div>
  );
}

function CharacterTab() {
  const [f, setF] = useState({ character_type: "hero", gender: "male", ethnicity: "Black", build: "athletic", style: "streetwear", level: 1 });
  const [busy, setBusy] = useState(false);
  const [r, setR] = useState(null);
  const go = async () => {
    setBusy(true); setR(null);
    try { setR(await post("/studio/characters/generate", f)); toast.success("Character rendered"); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <div>
      <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
        {Object.entries(CHAR_OPTS).map(([k, opts]) => (
          <div key={k}><span className={label}>{k.replace("_", " ")}</span>
            <select data-testid={`studio-char-${k}`} className={sel} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}>
              {opts.map((o) => <option key={o}>{o}</option>)}
            </select></div>
        ))}
        <div><span className={label}>Level: {f.level} {f.level > 66 ? "— Legend" : f.level > 33 ? "— Seasoned" : "— Rookie"}</span>
          <input type="range" min={1} max={100} value={f.level} data-testid="studio-char-level"
            onChange={(e) => setF({ ...f, level: Number(e.target.value) })}
            className="w-full accent-[#7c3aed]" /></div>
      </div>
      <button data-testid="studio-char-generate" onClick={go} disabled={busy} className={`${genBtn} mt-5`}>
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} {busy ? "Rendering character…" : "Generate Character"}
      </button>
      <Result r={r} />
    </div>
  );
}

function CreatureTab() {
  const [creatures, setCreatures] = useState([]);
  const [busy, setBusy] = useState(null);
  const load = () => fetch(`${API}/studio/creatures/list`).then((x) => x.json()).then((d) => setCreatures(d.creatures));
  useEffect(() => { load(); }, []);
  const go = async (c) => {
    setBusy(c.id);
    try {
      await post("/studio/creatures/generate", { name: c.name, creature_class: c.creature_class, tier: c.tier, description: c.description, behavior_tags: c.behavior_tags, creature_id: c.id });
      toast.success(`${c.name} rendered`); load();
    } catch (e) { toast.error(e.message); } finally { setBusy(null); }
  };
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="studio-creature-grid">
      {creatures.map((c) => (
        <div key={c.id} className="rounded-2xl border border-[#1f1f3a] bg-[#12121e] p-5" data-testid={`studio-creature-${c.id}`}>
          <div className="flex items-center justify-between">
            <span className="rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ background: TIER_COLORS[c.tier] }}>
              Tier {c.tier} — {TIER_LABELS[c.tier]}</span>
            <span className="rounded-full bg-[#1f1f3a] px-2.5 py-1 text-[11px] capitalize text-[#a78bfa]">{c.creature_class}</span>
          </div>
          {c.generated_image_url ? (
            <img src={`${B}${c.generated_image_url}`} alt={c.name} className="mt-3 h-44 w-full rounded-xl object-cover" />
          ) : (
            <div className="mt-3 grid h-44 place-items-center rounded-xl bg-[#1a1a2e] text-xs text-[#4b5563]">No render yet</div>
          )}
          <h3 className="mt-3 text-lg font-bold text-white">{c.name}</h3>
          <p className="mt-1 text-[13px] text-[#9ca3af]">{c.description}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(c.behavior_tags || []).map((t) => <span key={t} className="rounded-lg bg-[#1e1e3a] px-2 py-0.5 text-[11px] text-[#c4b5fd]">{t.replace(/_/g, " ")}</span>)}
          </div>
          <button onClick={() => go(c)} disabled={busy === c.id} data-testid={`studio-creature-gen-${c.id}`}
            className="mt-4 w-full rounded-lg border border-[#7c3aed] bg-[#1f1f3a] py-2.5 text-sm font-semibold text-[#a78bfa] transition-colors hover:bg-[#7c3aed] hover:text-white disabled:opacity-50">
            {busy === c.id ? "Rendering…" : c.generated_image_url ? "Regenerate Render" : "Generate Render"}
          </button>
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { id: "cities", label: "City Builder", icon: Building2, el: <CityTab /> },
  { id: "characters", label: "Character Creator", icon: User, el: <CharacterTab />, href: "/studio/characters" },
  { id: "creatures", label: "Creature Library", icon: Skull, el: <CreatureTab />, href: "/studio/creatures" },
];

export default function VisualStudio() {
  const [tab, setTab] = useState("cities");
  const navigate = useNavigate();
  useEffect(() => { document.title = "Visual Studio — Frasberg"; }, []);
  const active = TABS.find((t) => t.id === tab);
  return (
    <div className="min-h-screen bg-[#08080f] px-5 py-10 font-mono text-white sm:px-10" data-testid="visual-studio-page">
      <ParallaxSky />
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#888] hover:text-white" data-testid="studio-back-link">
        <ArrowLeft size={15} /> Back to Luchii
      </Link>
      <h1 className="mt-8 text-4xl font-bold tracking-tight text-[#a78bfa] sm:text-5xl">Visual Realism Studio</h1>
      <p className="mt-2 text-sm text-[#6b7280]">Phase 1 Foundation — photorealistic cities, characters &amp; creatures · FRASBERG INC.</p>
      <div className="mt-8 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} data-testid={`studio-tab-${t.id}`}
            className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm transition-colors ${tab === t.id ? "border-[#7c3aed] bg-[#7c3aed] text-white" : "border-[#2d2d4a] bg-[#12121e] text-[#9ca3af] hover:text-white"}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>
      {active?.href && (
        <button onClick={() => navigate(active.href)} data-testid={`studio-fullpage-${active.id}`}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[#2d2d4a] bg-[#12121e] px-4 py-2 text-xs text-[#a78bfa] transition-colors hover:border-[#7c3aed] hover:text-white">
          <ExternalLink size={13} /> Open full {active.label} studio
        </button>
      )}
      <div className="mt-8 pb-20">{active?.el}</div>
    </div>
  );
}
