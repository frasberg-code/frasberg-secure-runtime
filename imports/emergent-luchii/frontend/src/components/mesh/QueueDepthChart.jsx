import { useState } from "react";
import { toast } from "sonner";
import { flushQueue } from "../../api/adminApi";

export default function QueueDepthChart({ queueStats, onFlush }) {
  const [flushing, setFlushing] = useState(false);

  const handleFlush = async () => {
    if (!window.confirm("Flush all queued offline messages globally?")) return;
    setFlushing(true);
    try {
      const res = await flushQueue();
      toast.success(`Queue flushed — ${res.cleared} message(s) cleared`);
      onFlush?.();
    } catch (e) {
      toast.error("Flush failed");
    } finally {
      setFlushing(false);
    }
  };

  const queues = queueStats?.queues || [];

  return (
    <div data-testid="mesh-queue-panel">
      <div style={styles.header}>
        <h3 style={styles.title}>📦 Offline Queue Depth</h3>
        <button onClick={handleFlush} disabled={flushing} style={styles.flushBtn} data-testid="queue-flush-all-btn">
          {flushing ? "Flushing..." : "⚡ Flush All"}
        </button>
      </div>

      <div style={styles.summaryRow}>
        <div style={styles.summaryCard} data-testid="queue-total-card">
          <span style={styles.summaryValue}>{queueStats?.total_queued ?? "—"}</span>
          <span style={styles.summaryLabel}>Total Queued</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryValue}>
            {queueStats?.oldest_ms ? `${Math.round(queueStats.oldest_ms / 1000)}s` : "—"}
          </span>
          <span style={styles.summaryLabel}>Oldest Message Age</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={{ ...styles.summaryValue, fontSize: 18, textTransform: "uppercase" }}>
            {queueStats?.backend ?? "—"}
          </span>
          <span style={styles.summaryLabel}>Buffer Backend</span>
        </div>
      </div>

      <h4 style={styles.sub}>Per-Client Queues</h4>
      {queues.length === 0 ? (
        <p style={{ color: "#555" }}>No offline queues — every client is receiving in real time.</p>
      ) : (
        queues.map((q, i) => (
          <div key={i} style={styles.queueRow}>
            <code style={{ color: "#6c63ff" }}>{String(q.client_id).slice(0, 14)}…</code>
            <span style={{ color: "#aaa", marginLeft: 12 }}>{q.message_count} buffered</span>
            <span style={{ color: "#555", marginLeft: "auto" }}>TTL: {q.ttl}s</span>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { color: "#6c63ff", margin: 0 },
  flushBtn: { background: "#ff5252", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: "bold", fontSize: 13 },
  summaryRow: { display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" },
  summaryCard: { background: "#0d0d1a", borderRadius: 12, padding: "14px 20px", flex: 1, minWidth: 140, textAlign: "center", display: "flex", flexDirection: "column", gap: 4 },
  summaryValue: { color: "#ffab40", fontSize: 28, fontWeight: "bold" },
  summaryLabel: { color: "#aaa", fontSize: 12 },
  sub: { color: "#aaa", fontSize: 13, margin: "0 0 12px 0" },
  queueRow: { display: "flex", alignItems: "center", background: "#0d0d1a", padding: "8px 12px", borderRadius: 8, marginBottom: 6, fontSize: 13 },
};
