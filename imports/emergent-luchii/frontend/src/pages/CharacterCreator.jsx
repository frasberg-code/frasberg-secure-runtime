import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const B = process.env.REACT_APP_BACKEND_URL;

const OPTIONS = {
  character_type: ["hero", "npc", "boss"],
  gender: ["male", "female", "non-binary"],
  ethnicity: ["Black", "Latino", "White", "Asian", "Middle Eastern", "Mixed"],
  build: ["slim", "athletic", "heavy", "muscular", "petite"],
  style: [
    "streetwear", "military", "fantasy armor", "business suit",
    "gang attire", "medieval knight", "assassin", "wizard robes",
    "cyberpunk", "bounty hunter",
  ],
};

export default function CharacterCreator() {
  const [form, setForm] = useState({
    character_type: "hero",
    gender: "male",
    ethnicity: "Black",
    build: "athletic",
    style: "streetwear",
    level: 1,
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    document.title = "Character Creator — Luchii Games";
  }, []);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/studio/characters/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (res.status === 401) throw new Error("Please log in to generate characters");
      if (res.status === 429) throw new Error((await res.json()).detail);
      if (!res.ok) throw new Error("Generation failed — please try again");
      const data = await res.json();
      setResult(data);
      setHistory((prev) => [data, ...prev].slice(0, 12));
    } catch (e) {
      console.error("Character generation failed:", e);
      toast.error(e.message);
    }
    setLoading(false);
  };

  const Field = ({ label, field, opts }) => (
    <div>
      <label style={styles.label}>{label}</label>
      <select
        style={styles.select}
        value={form[field]}
        data-testid={`character-field-${field}`}
        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
      >
        {opts.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div style={styles.page} data-testid="character-creator-page">
      <style>{`@keyframes cc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <Link to="/visual-studio" style={styles.backLink} data-testid="character-creator-back">
        ← Back to Visual Studio
      </Link>
      <h1 style={styles.title}>🧍 Character Creator</h1>
      <p style={styles.subtitle}>Luchii Games — FRASBERG INC.</p>

      <div style={styles.layout} className="cc-layout">
        {/* Form Panel */}
        <div style={styles.formPanel}>
          <h2 style={styles.panelTitle}>Configure Character</h2>

          <Field label="Type" field="character_type" opts={OPTIONS.character_type} />
          <Field label="Gender" field="gender" opts={OPTIONS.gender} />
          <Field label="Ethnicity" field="ethnicity" opts={OPTIONS.ethnicity} />
          <Field label="Build" field="build" opts={OPTIONS.build} />
          <Field label="Style" field="style" opts={OPTIONS.style} />

          <div>
            <label style={styles.label}>Level: {form.level}</label>
            <input
              type="range"
              min={1}
              max={100}
              value={form.level}
              data-testid="character-level-slider"
              onChange={(e) => setForm({ ...form, level: Number(e.target.value) })}
              style={{ width: "100%", marginTop: 4, accentColor: "#7c3aed" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280" }}>
              <span>1 (Recruit)</span>
              <span>50 (Veteran)</span>
              <span>100 (Legend)</span>
            </div>
          </div>

          <button onClick={generate} disabled={loading} style={{ ...styles.btn, opacity: loading ? 0.6 : 1 }} data-testid="character-generate-btn">
            {loading ? "⏳ Generating..." : "🎨 Generate Character"}
          </button>

          {result && (
            <div style={styles.statsBox} data-testid="character-stats-box">
              <p style={styles.statLine}>⚡ Generated in {(result.generation_time_ms / 1000).toFixed(1)}s</p>
              <p style={styles.statLine}>📋 Type: {result.character_type}</p>
              <details style={{ marginTop: 8 }}>
                <summary style={{ color: "#6b7280", fontSize: 12, cursor: "pointer" }}>View prompt</summary>
                <p style={{ color: "#4b5563", fontSize: 13, marginTop: 4 }}>{result.prompt_used}</p>
              </details>
            </div>
          )}
        </div>

        {/* Result Panel */}
        <div style={styles.resultPanel}>
          <h2 style={styles.panelTitle}>Preview</h2>

          {loading && (
            <div style={styles.loadingBox}>
              <div style={styles.spinner} />
              <p style={{ color: "#9ca3af", marginTop: 16 }}>Rendering character...</p>
            </div>
          )}

          {!loading && result && (
            <div style={styles.resultCard} data-testid="character-result">
              <img src={`${B}${result.image_url}`} alt="Generated Character" style={styles.characterImage} />
              <div style={styles.resultMeta}>
                <span style={styles.metaBadge}>{form.character_type.toUpperCase()}</span>
                <span style={styles.metaBadge}>LVL {form.level}</span>
                <span style={styles.metaBadge}>{form.style}</span>
              </div>
              <button
                onClick={() => window.open(`${B}${result.image_url}`, "_blank")}
                data-testid="character-download-btn"
                style={{ ...styles.btn, background: "#065f46", marginTop: 12, fontSize: 13 }}
              >
                Download / Open Full Size
              </button>
            </div>
          )}

          {!loading && !result && (
            <div style={styles.emptyState} data-testid="character-empty-state">
              <span style={{ fontSize: 64 }}>🧍</span>
              <p style={{ color: "#6b7280" }}>Configure your character and hit Generate</p>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={{ marginTop: 64 }} data-testid="character-history">
          <h2 style={styles.panelTitle}>Generation History</h2>
          <div style={styles.historyGrid}>
            {history.map((item, i) => (
              <div key={i} style={styles.historyCard}>
                <img
                  src={`${B}${item.image_url}`}
                  alt={`Character ${i}`}
                  style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8 }}
                />
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6, textAlign: "center" }}>
                  {item.character_type} • {(item.generation_time_ms / 1000).toFixed(1)}s
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: 40, fontFamily: "'Inter', sans-serif", background: "#080810", minHeight: "100vh", color: "#fff" },
  backLink: { color: "#6b7280", fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 700, margin: 0 },
  subtitle: { color: "#6b7280", marginBottom: 32 },
  layout: { display: "grid", gridTemplateColumns: "minmax(280px, 380px) 1fr", gap: 40, alignItems: "start" },
  formPanel: { background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: 28, display: "flex", flexDirection: "column", gap: 20 },
  panelTitle: { fontSize: 18, fontWeight: 600, margin: "0 0 4px" },
  label: { display: "block", fontSize: 12, color: "#9ca3af", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" },
  select: { width: "100%", padding: "10px 12px", background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#fff", fontSize: 14 },
  btn: { background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", cursor: "pointer", fontWeight: 600, fontSize: 15, width: "100%" },
  statsBox: { background: "#1f2937", borderRadius: 8, padding: 16 },
  statLine: { margin: "0 0 4px", fontSize: 13, color: "#d1d5db" },
  resultPanel: { background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: 28, minHeight: 500 },
  loadingBox: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400 },
  spinner: { width: 48, height: 48, border: "4px solid #374151", borderTop: "4px solid #7c3aed", borderRadius: "50%", animation: "cc-spin 0.8s linear infinite" },
  resultCard: { display: "flex", flexDirection: "column" },
  characterImage: { width: "100%", maxHeight: 600, objectFit: "cover", borderRadius: 12 },
  resultMeta: { display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" },
  metaBadge: { background: "#1f2937", border: "1px solid #374151", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#9ca3af" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400 },
  historyGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 },
  historyCard: { background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: 10 },
};
