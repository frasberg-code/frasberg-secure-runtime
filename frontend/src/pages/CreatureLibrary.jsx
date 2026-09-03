import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const B = process.env.REACT_APP_BACKEND_URL;

const TIER_COLORS = { 1: "#6b7280", 2: "#2563eb", 3: "#7c3aed", 4: "#dc2626" };
const TIER_LABELS = { 1: "Common", 2: "Elite", 3: "Boss", 4: "Legendary" };

export default function CreatureLibrary() {
  const [creatures, setCreatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(null);
  const [filterTier, setFilterTier] = useState("all");
  const [filterClass, setFilterClass] = useState("all");

  const [form, setForm] = useState({
    name: "",
    creature_class: "beast",
    tier: 1,
    description: "",
    behavior_tags: "",
  });
  const [customResult, setCustomResult] = useState(null);

  const fetchCreatures = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/studio/creatures/list`);
      const data = await res.json();
      setCreatures(data.creatures || []);
    } catch (e) {
      console.error("Failed to load creatures:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Dungeon Creature Library — Luchii Games";
    fetchCreatures();
  }, []);

  const callGenerate = async (body) => {
    const res = await fetch(`${API}/studio/creatures/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (res.status === 401) throw new Error("Please log in to generate creatures");
    if (res.status === 429) throw new Error((await res.json()).detail);
    if (!res.ok) throw new Error("Generation failed — please try again");
    return res.json();
  };

  const generateImage = async (creature) => {
    setGenerating(creature.id);
    try {
      const data = await callGenerate({
        name: creature.name,
        creature_class: creature.creature_class,
        tier: creature.tier,
        description: creature.description,
        behavior_tags: creature.behavior_tags,
        creature_id: creature.id,
      });
      setCreatures((prev) =>
        prev.map((c) => (c.id === creature.id ? { ...c, generated_image_url: data.image_url } : c))
      );
      toast.success(`${creature.name} rendered`);
    } catch (e) {
      console.error("Generation failed:", e);
      toast.error(e.message);
    }
    setGenerating(null);
  };

  const generateCustom = async () => {
    setCustomResult(null);
    setGenerating("custom");
    try {
      const data = await callGenerate({
        name: form.name,
        creature_class: form.creature_class,
        tier: form.tier,
        description: form.description,
        behavior_tags: form.behavior_tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      setCustomResult(data.image_url);
      toast.success(`${form.name} rendered`);
    } catch (e) {
      console.error("Custom generation failed:", e);
      toast.error(e.message);
    }
    setGenerating(null);
  };

  const classes = ["all", "beast", "undead", "demon", "elemental"];

  const filtered = creatures.filter((c) => {
    const tierMatch = filterTier === "all" || c.tier === filterTier;
    const classMatch = filterClass === "all" || c.creature_class === filterClass;
    return tierMatch && classMatch;
  });

  return (
    <div style={styles.page} data-testid="creature-library-page">
      <Link to="/visual-studio" style={styles.backLink} data-testid="creature-library-back">
        ← Back to Visual Studio
      </Link>
      <h1 style={styles.title}>⚔️ Dungeon Creature Library</h1>
      <p style={styles.subtitle}>Luchii Games — FRASBERG INC.</p>

      {/* Filters */}
      <div style={styles.filterRow}>
        <div>
          <label style={styles.label}>Tier</label>
          <select
            style={styles.select}
            value={filterTier}
            data-testid="creature-filter-tier"
            onChange={(e) => setFilterTier(e.target.value === "all" ? "all" : Number(e.target.value))}
          >
            <option value="all">All Tiers</option>
            {[1, 2, 3, 4].map((t) => (
              <option key={t} value={t}>
                Tier {t} — {TIER_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={styles.label}>Class</label>
          <select
            style={styles.select}
            value={filterClass}
            data-testid="creature-filter-class"
            onChange={(e) => setFilterClass(e.target.value)}
          >
            {classes.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Creature Grid */}
      {loading ? (
        <p style={{ color: "#9ca3af", marginTop: 32 }}>Loading creatures...</p>
      ) : (
        <div style={styles.grid} data-testid="creature-library-grid">
          {filtered.map((creature) => (
            <div key={creature.id} style={styles.card} data-testid={`creature-card-${creature.id}`}>
              <div style={{ ...styles.tierBadge, background: TIER_COLORS[creature.tier] }}>
                Tier {creature.tier} — {TIER_LABELS[creature.tier]}
              </div>

              {creature.generated_image_url ? (
                <img src={`${B}${creature.generated_image_url}`} alt={creature.name} style={styles.creatureImage} />
              ) : (
                <div style={styles.imagePlaceholder}>
                  <span style={{ fontSize: 48 }}>🐉</span>
                  <p style={{ color: "#6b7280", fontSize: 12 }}>No image yet</p>
                </div>
              )}

              <h3 style={styles.creatureName}>{creature.name}</h3>
              <p style={styles.creatureClass}>Class: {creature.creature_class}</p>
              <p style={styles.creatureDesc}>{creature.description}</p>

              <div style={styles.tagRow}>
                {(creature.behavior_tags || []).map((tag) => (
                  <span key={tag} style={styles.tag}>{tag}</span>
                ))}
              </div>

              <button
                onClick={() => generateImage(creature)}
                disabled={generating === creature.id}
                data-testid={`creature-generate-${creature.id}`}
                style={{ ...styles.btn, marginTop: 12, opacity: generating === creature.id ? 0.6 : 1 }}
              >
                {generating === creature.id ? "Generating..." : creature.generated_image_url ? "Regenerate Image" : "Generate Image"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Custom Creature Generator */}
      <div style={styles.customSection}>
        <h2 style={styles.sectionTitle}>🧪 Create Custom Creature</h2>
        <div style={styles.formGrid}>
          <div>
            <label style={styles.label}>Name</label>
            <input
              style={styles.input}
              value={form.name}
              data-testid="creature-custom-name"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Bone Colossus"
            />
          </div>
          <div>
            <label style={styles.label}>Class</label>
            <select
              style={styles.select}
              value={form.creature_class}
              data-testid="creature-custom-class"
              onChange={(e) => setForm({ ...form, creature_class: e.target.value })}
            >
              {["beast", "undead", "demon", "elemental"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={styles.label}>Tier (1–4)</label>
            <select
              style={styles.select}
              value={form.tier}
              data-testid="creature-custom-tier"
              onChange={(e) => setForm({ ...form, tier: Number(e.target.value) })}
            >
              {[1, 2, 3, 4].map((t) => (
                <option key={t} value={t}>Tier {t}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={styles.label}>Description</label>
            <input
              style={styles.input}
              value={form.description}
              data-testid="creature-custom-description"
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Giant skeleton fused with stone armor"
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={styles.label}>Behavior Tags (comma-separated)</label>
            <input
              style={styles.input}
              value={form.behavior_tags}
              data-testid="creature-custom-tags"
              onChange={(e) => setForm({ ...form, behavior_tags: e.target.value })}
              placeholder="e.g. aggressive, territorial, fire_immune"
            />
          </div>
        </div>

        <button
          onClick={generateCustom}
          disabled={generating === "custom" || !form.name}
          data-testid="creature-custom-generate"
          style={{ ...styles.btn, marginTop: 16, padding: "12px 40px", fontSize: 16, opacity: generating === "custom" || !form.name ? 0.6 : 1 }}
        >
          {generating === "custom" ? "Generating..." : "Generate Custom Creature"}
        </button>

        {customResult && (
          <div style={{ marginTop: 24 }} data-testid="creature-custom-result">
            <h3 style={{ color: "#e5e7eb" }}>Result: {form.name}</h3>
            <img
              src={`${B}${customResult}`}
              alt={form.name}
              style={{ width: "100%", maxWidth: 600, borderRadius: 12, marginTop: 8 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 40, fontFamily: "'Inter', sans-serif", background: "#080810", minHeight: "100vh", color: "#fff" },
  backLink: { color: "#6b7280", fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 700, margin: 0 },
  subtitle: { color: "#6b7280", marginBottom: 32 },
  filterRow: { display: "flex", gap: 24, marginBottom: 32, flexWrap: "wrap" },
  label: { display: "block", fontSize: 12, color: "#9ca3af", marginBottom: 4, textTransform: "uppercase" },
  select: { padding: "8px 12px", background: "#1a1a2e", border: "1px solid #374151", borderRadius: 6, color: "#fff", minWidth: 180 },
  input: { padding: "8px 12px", background: "#1a1a2e", border: "1px solid #374151", borderRadius: 6, color: "#fff", width: "100%", boxSizing: "border-box" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 },
  card: { background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column" },
  tierBadge: { display: "inline-block", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, marginBottom: 12, alignSelf: "flex-start" },
  creatureImage: { width: "100%", height: 200, objectFit: "cover", borderRadius: 8, marginBottom: 12 },
  imagePlaceholder: { width: "100%", height: 200, background: "#1f2937", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  creatureName: { fontSize: 18, fontWeight: 700, margin: "0 0 4px" },
  creatureClass: { color: "#9ca3af", fontSize: 13, margin: "0 0 8px", textTransform: "capitalize" },
  creatureDesc: { color: "#d1d5db", fontSize: 13, lineHeight: 1.5, margin: "0 0 12px" },
  tagRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  tag: { background: "#1f2937", border: "1px solid #374151", borderRadius: 12, padding: "3px 10px", fontSize: 11, color: "#9ca3af" },
  btn: { background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600 },
  customSection: { marginTop: 64, borderTop: "1px solid #1f2937", paddingTop: 40 },
  sectionTitle: { fontSize: 24, fontWeight: 700, marginBottom: 24 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
};
