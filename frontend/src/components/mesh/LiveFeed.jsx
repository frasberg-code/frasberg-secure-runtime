import { formatDistanceToNow } from "date-fns";

const EVENT_COLORS = {
  connect: "#00e676", disconnect: "#ff5252", message: "#6c63ff",
  failover: "#ffab40", encrypt: "#40c4ff", error: "#ff5252",
  voice: "#ce93d8", queue: "#ffab40",
};

const EVENT_ICONS = {
  connect: "🔗", disconnect: "🔌", message: "💬", failover: "🔀",
  encrypt: "🔒", error: "⚠️", voice: "🎙️", queue: "📦",
};

export default function LiveFeed({ events, onClear, connected }) {
  return (
    <div data-testid="mesh-live-feed">
      <div style={styles.header}>
        <h3 style={styles.title}>⚡ Live Mesh Event Feed</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ color: "#555", fontSize: 12 }}>{events.length} events</span>
          <button onClick={onClear} style={styles.clearBtn} data-testid="live-feed-clear-btn">Clear</button>
        </div>
      </div>

      {events.length === 0 ? (
        <div style={styles.empty} data-testid="live-feed-empty">
          {connected ? "Waiting for mesh events..." : "Feed disconnected — reconnecting..."}
          <span style={styles.pulse}> ●</span>
        </div>
      ) : (
        <div style={styles.feed}>
          {events.map((e, i) => (
            <div key={i} style={{ ...styles.event, borderLeftColor: EVENT_COLORS[e.type] || "#6c63ff" }}>
              <span style={styles.eventIcon}>{EVENT_ICONS[e.type] || "📡"}</span>
              <div style={styles.eventBody}>
                <div style={styles.eventMain}>
                  <span style={{ color: EVENT_COLORS[e.type] || "#6c63ff", fontWeight: 600, fontSize: 13 }}>
                    {e.type?.toUpperCase()}
                  </span>
                  <span style={styles.eventMsg}>{e.message || e.detail}</span>
                </div>
                <div style={styles.eventMeta}>
                  {e.region && <span style={styles.tag}>🌐 {e.region}</span>}
                  {e.client_id && <span style={styles.tag}>🔑 {String(e.client_id).slice(0, 10)}…</span>}
                  {e.voice && <span style={styles.tag}>🎙️ {e.voice}</span>}
                  <span style={styles.time}>
                    {e.timestamp ? formatDistanceToNow(new Date(e.timestamp * 1000), { addSuffix: true }) : "just now"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { color: "#6c63ff", margin: 0 },
  clearBtn: { background: "transparent", color: "#ff5252", border: "1px solid #ff5252", borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontSize: 12 },
  empty: { color: "#555", textAlign: "center", padding: 40, fontSize: 14 },
  pulse: { color: "#6c63ff", marginLeft: 8 },
  feed: { display: "flex", flexDirection: "column", gap: 8, maxHeight: 520, overflowY: "auto" },
  event: { display: "flex", gap: 12, background: "#0d0d1a", borderRadius: 10, padding: "10px 14px", borderLeft: "3px solid" },
  eventIcon: { fontSize: 18, marginTop: 2 },
  eventBody: { flex: 1 },
  eventMain: { display: "flex", gap: 10, alignItems: "baseline", marginBottom: 4 },
  eventMsg: { color: "#ccc", fontSize: 13 },
  eventMeta: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  tag: { background: "#1a1a2e", color: "#aaa", fontSize: 13, padding: "2px 8px", borderRadius: 10 },
  time: { color: "#444", fontSize: 13, marginLeft: "auto" },
};
