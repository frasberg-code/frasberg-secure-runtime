import { useState } from "react";
import { toast } from "sonner";
import { failoverRegion } from "../../api/adminApi";

export default function FailoverControls({ regions, onRefresh }) {
  const [busy, setBusy] = useState(null);

  const handleFailover = async (regionId) => {
    if (!window.confirm(`Promote ${regionId} to PRIMARY? All new mesh traffic will route there.`)) return;
    setBusy(regionId);
    try {
      await failoverRegion(regionId);
      toast.success(`Failover complete — ${regionId} is now primary`);
      onRefresh?.();
    } catch {
      toast.error("Failover failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div data-testid="mesh-failover-panel">
      <h3 style={styles.title}>🔀 Multi-Region Failover</h3>
      <p style={styles.hint}>
        Promote a standby region to primary. Active clients reconnect automatically via the mesh backoff protocol.
      </p>
      <div style={styles.grid}>
        {(regions || []).map((r) => {
          const isPrimary = r.realm === "primary";
          return (
            <div key={r.id} style={{ ...styles.card, borderColor: isPrimary ? "#00e676" : "#1a1a2e" }}>
              <div style={styles.cardHeader}>
                <span style={{ ...styles.dot, background: r.status === "online" ? "#00e676" : "#ff5252" }} />
                <strong style={{ color: "#fff", fontSize: 14 }}>{r.name}</strong>
                <span style={{
                  marginLeft: "auto", fontSize: 12, fontWeight: "bold", padding: "3px 8px", borderRadius: 10,
                  background: isPrimary ? "#00e67622" : "#1a1a2e",
                  color: isPrimary ? "#00e676" : "#555",
                }}>
                  {r.realm?.toUpperCase()}
                </span>
              </div>
              <div style={styles.meta}>
                <span style={styles.metaItem}>⚡ {r.latency_ms}ms</span>
                <span style={styles.metaItem}>📊 {r.load_pct}% load</span>
                <span style={styles.metaItem}>🔗 {r.clients} clients</span>
              </div>
              <div style={styles.loadTrack}>
                <div style={{
                  width: `${r.load_pct}%`, height: "100%", borderRadius: 3,
                  background: r.load_pct > 80 ? "#ff5252" : r.load_pct > 60 ? "#ffab40" : "#00e676",
                  transition: "width 0.6s ease",
                }} />
              </div>
              {!isPrimary && (
                <button
                  onClick={() => handleFailover(r.id)}
                  disabled={busy === r.id}
                  style={styles.failoverBtn}
                  data-testid={`failover-btn-${r.id}`}
                >
                  {busy === r.id ? "Promoting..." : "⚡ Promote to Primary"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  title: { color: "#6c63ff", margin: "0 0 8px 0" },
  hint: { color: "#555", fontSize: 13, margin: "0 0 20px 0" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14 },
  card: { background: "#0d0d1a", borderRadius: 12, padding: 16, border: "1px solid" },
  cardHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  meta: { display: "flex", gap: 10, marginBottom: 8, flexWrap: "wrap" },
  metaItem: { color: "#aaa", fontSize: 12 },
  loadTrack: { height: 5, background: "#1a1a2e", borderRadius: 3, overflow: "hidden", marginBottom: 12 },
  failoverBtn: { width: "100%", padding: "8px 0", background: "#ff5252", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: "bold" },
};
