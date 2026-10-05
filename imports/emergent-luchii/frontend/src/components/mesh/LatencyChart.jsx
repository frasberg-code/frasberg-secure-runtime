import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const REGION_COLORS = ["#6c63ff", "#00e676", "#ffab40", "#40c4ff", "#ce93d8", "#ff5252"];

export default function LatencyChart({ regions, metrics }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!regions?.length) return;
    const point = { time: new Date().toLocaleTimeString() };
    regions.forEach((r) => { point[r.name] = r.latency_ms; });
    setHistory((prev) => [...prev.slice(-19), point]);
  }, [regions]);

  return (
    <div data-testid="mesh-latency-panel">
      <h3 style={styles.title}>📡 Region Latency (ms) — Live</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
          <XAxis dataKey="time" stroke="#444" tick={{ fill: "#555", fontSize: 13 }} />
          <YAxis stroke="#444" tick={{ fill: "#555", fontSize: 13 }} unit="ms" />
          <Tooltip contentStyle={{ background: "#111122", border: "1px solid #6c63ff", borderRadius: 8 }} labelStyle={{ color: "#aaa" }} />
          <Legend wrapperStyle={{ color: "#aaa", fontSize: 12 }} />
          {regions.map((r, i) => (
            <Line key={r.id} type="monotone" dataKey={r.name}
              stroke={REGION_COLORS[i % REGION_COLORS.length]}
              strokeWidth={2} dot={false} isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <h3 style={{ ...styles.title, marginTop: 28 }}>⚡ Inference Latency (ms)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={metrics?.latency_history || []}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
          <XAxis dataKey="time" stroke="#444" tick={{ fill: "#555", fontSize: 12 }} />
          <YAxis stroke="#444" tick={{ fill: "#555", fontSize: 13 }} />
          <Tooltip contentStyle={{ background: "#111122", border: "1px solid #00e676", borderRadius: 8 }} labelStyle={{ color: "#aaa" }} />
          <Bar dataKey="latency" fill="#00e676" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div style={styles.table} data-testid="region-latency-table">
        {regions.map((r, i) => (
          <div key={r.id} style={styles.row}>
            <span style={{ ...styles.colorDot, background: REGION_COLORS[i % REGION_COLORS.length] }} />
            <span style={styles.regionName}>{r.name}</span>
            <span style={styles.realm}>{r.realm?.toUpperCase()}</span>
            <span style={{
              ...styles.latency,
              color: r.latency_ms > 200 ? "#ff5252" : r.latency_ms > 100 ? "#ffab40" : "#00e676",
            }}>
              {r.latency_ms}ms
            </span>
            <span style={{
              ...styles.statusBadge,
              background: r.status === "online" ? "#00e67622" : "#ff525222",
              color: r.status === "online" ? "#00e676" : "#ff5252",
            }}>
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  title: { color: "#6c63ff", margin: "0 0 20px 0" },
  table: { marginTop: 24, display: "flex", flexDirection: "column", gap: 8 },
  row: { display: "flex", alignItems: "center", gap: 12, background: "#0d0d1a", borderRadius: 10, padding: "10px 16px" },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  regionName: { color: "#fff", flex: 1, fontSize: 14 },
  realm: { color: "#555", fontSize: 13 },
  latency: { fontWeight: "bold", fontSize: 15, minWidth: 60, textAlign: "right" },
  statusBadge: { padding: "3px 10px", borderRadius: 12, fontSize: 13, fontWeight: 600 },
};
