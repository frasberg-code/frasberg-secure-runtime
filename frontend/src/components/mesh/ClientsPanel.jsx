import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { disconnectClient, broadcastMessage } from "../../api/adminApi";

export default function ClientsPanel({ clients, onRefresh }) {
  const [broadcast, setBroadcast] = useState("");
  const [sending, setSending] = useState(false);

  const handleDisconnect = async (id) => {
    if (!window.confirm(`Force-disconnect client ${id.slice(0, 12)}…?`)) return;
    try {
      await disconnectClient(id);
      toast.success("Client disconnected");
      onRefresh?.();
    } catch {
      toast.error("Client already offline");
      onRefresh?.();
    }
  };

  const handleBroadcast = async () => {
    if (!broadcast.trim()) return;
    setSending(true);
    try {
      const res = await broadcastMessage(broadcast.trim());
      toast.success(`Broadcast delivered to ${res.recipients} client(s)`);
      setBroadcast("");
    } catch {
      toast.error("Broadcast failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div data-testid="mesh-clients-panel">
      <h3 style={styles.title}>👥 Connected Clients ({clients.length})</h3>

      {clients.length === 0 ? (
        <p style={{ color: "#555" }}>No active mesh clients right now.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table} data-testid="mesh-clients-table">
            <thead>
              <tr style={{ borderBottom: "1px solid #1a1a2e", color: "#aaa" }}>
                {["Client ID", "Voice", "Region", "E2E", "Messages", "Connected", "Action"].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #111" }}>
                  <td style={styles.td}><code style={{ color: "#6c63ff" }}>{c.id.slice(0, 14)}…</code></td>
                  <td style={styles.td}>{c.voice}</td>
                  <td style={styles.td}>{c.region}</td>
                  <td style={styles.td}>
                    <span style={{ color: c.e2e ? "#00e676" : "#555" }}>{c.e2e ? "🔒 Sealed" : "HMAC"}</span>
                  </td>
                  <td style={styles.td}>{c.message_count}</td>
                  <td style={styles.td}>
                    {c.connected_at ? formatDistanceToNow(new Date(c.connected_at), { addSuffix: true }) : "—"}
                  </td>
                  <td style={styles.td}>
                    <button onClick={() => handleDisconnect(c.id)} style={styles.kickBtn} data-testid={`disconnect-client-${c.id}`}>
                      Disconnect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h4 style={styles.sub}>📢 Broadcast Message</h4>
      <div style={styles.broadcastRow}>
        <input
          value={broadcast}
          onChange={(e) => setBroadcast(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleBroadcast()}
          placeholder="Send a signed message to all connected mesh clients..."
          style={styles.input}
          data-testid="broadcast-input"
        />
        <button onClick={handleBroadcast} disabled={sending || !broadcast.trim()} style={styles.sendBtn} data-testid="broadcast-send-btn">
          {sending ? "Sending..." : "Broadcast"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  title: { color: "#6c63ff", margin: "0 0 16px 0" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600 },
  td: { padding: "10px 14px", color: "#ccc" },
  kickBtn: { padding: "5px 12px", background: "transparent", color: "#ff5252", border: "1px solid #ff5252", borderRadius: 6, cursor: "pointer", fontSize: 12 },
  sub: { color: "#aaa", fontSize: 13, margin: "24px 0 12px 0" },
  broadcastRow: { display: "flex", gap: 10 },
  input: { flex: 1, background: "#0d0d1a", color: "#fff", border: "1px solid #1a1a2e", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none" },
  sendBtn: { background: "#6c63ff", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: "bold", fontSize: 13 },
};
