import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

const VOICE_COLORS = {
  Lyra: "#6c63ff", Nova: "#40c4ff", Selene: "#ce93d8", Orion: "#00e676",
  Atlas: "#ffab40", Vega: "#ff5252", Rhea: "#f48fb1", Titan: "#80cbc4",
};

export default function VoiceHeatmap({ voiceStats }) {
  const usage = voiceStats?.usage || [];
  const data = usage.map((u) => ({
    name: u.voice, count: u.count, color: VOICE_COLORS[u.voice] || "#6c63ff",
  }));

  return (
    <div data-testid="mesh-voice-panel">
      <div style={styles.header}>
        <h3 style={styles.title}>🎙️ Voice Analytics</h3>
        <span style={styles.totalBadge}>{voiceStats?.total ?? 0} synth requests</span>
      </div>

      {data.length === 0 ? (
        <p style={{ color: "#555" }}>No voice synthesis recorded yet — usage appears here as clients speak with Luchii.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#aaa", fontSize: 13 }} />
            <YAxis tick={{ fill: "#aaa", fontSize: 13 }} />
            <Tooltip contentStyle={{ background: "#111122", border: "1px solid #6c63ff", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      <h4 style={styles.sub}>Sovereign Voice Roster</h4>
      <div style={styles.voiceGrid}>
        {(voiceStats?.voices || []).map((v) => (
          <div key={v} style={{ ...styles.voiceChip, borderColor: (VOICE_COLORS[v] || "#6c63ff") + "66" }}>
            <span style={{ color: VOICE_COLORS[v] || "#6c63ff", fontWeight: "bold" }}>{v}</span>
            <span style={{ color: "#555", fontSize: 13 }}>
              {usage.find((u) => u.voice === v)?.count ?? 0} plays
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { color: "#6c63ff", margin: 0 },
  totalBadge: { background: "#1a1a2e", color: "#ce93d8", padding: "4px 12px", borderRadius: 20, fontSize: 13 },
  sub: { color: "#aaa", fontSize: 13, margin: "20px 0 12px 0" },
  voiceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 },
  voiceChip: { background: "#0d0d1a", border: "1px solid", borderRadius: 10, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 4 },
};
