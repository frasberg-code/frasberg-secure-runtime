import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import LiveFeed from "../components/mesh/LiveFeed";
import LatencyChart from "../components/mesh/LatencyChart";
import QueueDepthChart from "../components/mesh/QueueDepthChart";
import EncryptionHealth from "../components/mesh/EncryptionHealth";
import VoiceHeatmap from "../components/mesh/VoiceHeatmap";
import FailoverControls from "../components/mesh/FailoverControls";
import ClientsPanel from "../components/mesh/ClientsPanel";
import Seo from "../components/site/Seo";
import { useAdminSocket } from "../hooks/useAdminSocket";
import { useAdminMetrics } from "../hooks/useAdminMetrics";

const TABS = [
  { id: "overview", label: "⚡ Overview" },
  { id: "clients", label: "👥 Clients" },
  { id: "latency", label: "📡 Latency" },
  { id: "queue", label: "📦 Queue Depth" },
  { id: "encryption", label: "🔒 Encryption" },
  { id: "voice", label: "🎙️ Voice" },
  { id: "failover", label: "🔀 Failover" },
];

export default function MeshControlCenter() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const { events, connected, clearEvents } = useAdminSocket();
  const { overview, metrics, regions, clients, voiceStats, queueStats, refresh } = useAdminMetrics(8000);

  if (user === false) return <Navigate to="/auth?mode=login&next=%2Fadmin%2Fmesh" replace />;
  if (user && user.role !== "admin") return <Navigate to="/" replace />;

  return (
    <div style={styles.page} data-testid="mesh-control-center">
      <Seo title="Mesh Control Center — Frasberg" description="Real-time Luchii mesh monitoring, encryption health and failover controls." />

      {/* Page Header */}
      <div style={styles.pageHeader}>
        <div>
          <Link to="/admin" style={styles.backLink} data-testid="mesh-back-to-admin">
            <ArrowLeft size={14} /> Admin Dashboard
          </Link>
          <h1 style={styles.pageTitle}>🔮 Mesh Control Center</h1>
          <p style={styles.pageSubtitle}>Real-time mesh intelligence · Frasberg Sovereign Network</p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.connectionBadge} data-testid="live-feed-status">
            <span style={{
              ...styles.dot,
              background: connected ? "#00e676" : "#ff5252",
              boxShadow: connected ? "0 0 8px #00e676" : "0 0 8px #ff5252",
            }} />
            <span style={{ color: connected ? "#00e676" : "#ff5252", fontSize: 13 }}>
              {connected ? "Live Feed Active" : "Reconnecting..."}
            </span>
          </div>
          <button onClick={refresh} style={styles.refreshBtn} data-testid="mesh-refresh-btn">🔄 Refresh</button>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={styles.quickStats} data-testid="mesh-quick-stats">
        {[
          { icon: "🔗", label: "Active Connections", value: overview?.active_connections ?? "—", color: "#6c63ff" },
          { icon: "🌐", label: "Regions Online", value: regions.length ? `${regions.filter((r) => r.status === "online").length} / ${regions.length}` : "—", color: "#00e676" },
          { icon: "📦", label: "Queued Messages", value: queueStats?.total_queued ?? "—", color: "#ffab40" },
          { icon: "🔒", label: "Encrypted Sessions", value: overview?.encrypted_sessions ?? "—", color: "#40c4ff" },
          { icon: "⚡", label: "Avg Latency", value: overview?.avg_latency_ms ? `${overview.avg_latency_ms}ms` : "—", color: "#ce93d8" },
          { icon: "📈", label: "Uptime", value: overview?.uptime ?? "—", color: "#00e676" },
        ].map((s) => (
          <div key={s.label} style={{ ...styles.quickCard, borderColor: s.color + "33" }}>
            <span style={styles.quickIcon}>{s.icon}</span>
            <span style={{ color: s.color, fontSize: 22, fontWeight: "bold" }}>{s.value}</span>
            <span style={styles.quickLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div style={styles.tabBar} data-testid="mesh-tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              ...styles.tab,
              background: activeTab === t.id ? "#6c63ff" : "transparent",
              color: activeTab === t.id ? "#fff" : "#aaa",
              borderColor: activeTab === t.id ? "#6c63ff" : "#1a1a2e",
            }}
            data-testid={`mesh-tab-${t.id}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {activeTab === "overview" && <LiveFeed events={events} onClear={clearEvents} connected={connected} />}
        {activeTab === "clients" && <ClientsPanel clients={clients} onRefresh={refresh} />}
        {activeTab === "latency" && <LatencyChart regions={regions} metrics={metrics} />}
        {activeTab === "queue" && <QueueDepthChart queueStats={queueStats} onFlush={refresh} />}
        {activeTab === "encryption" && <EncryptionHealth overview={overview} regions={regions} />}
        {activeTab === "voice" && <VoiceHeatmap voiceStats={voiceStats} />}
        {activeTab === "failover" && <FailoverControls regions={regions} onRefresh={refresh} />}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "32px clamp(16px, 4vw, 48px)", background: "#0d0d1a", minHeight: "100vh", fontFamily: "'JetBrains Mono', monospace", color: "#fff" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 },
  backLink: { display: "inline-flex", alignItems: "center", gap: 6, color: "#555", fontSize: 12, textDecoration: "none", marginBottom: 10 },
  pageTitle: { color: "#6c63ff", margin: "0 0 6px 0", fontSize: 26 },
  pageSubtitle: { color: "#555", margin: 0, fontSize: 13 },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  connectionBadge: { display: "flex", alignItems: "center", gap: 6, background: "#111122", padding: "8px 14px", borderRadius: 20, border: "1px solid #1a1a2e" },
  dot: { width: 8, height: 8, borderRadius: 4, display: "inline-block" },
  refreshBtn: { background: "#1a1a2e", color: "#6c63ff", border: "1px solid #6c63ff", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13 },
  quickStats: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16, marginBottom: 28 },
  quickCard: { background: "#111122", borderRadius: 14, padding: "16px 20px", border: "1px solid", display: "flex", flexDirection: "column", gap: 6 },
  quickIcon: { fontSize: 22 },
  quickLabel: { color: "#555", fontSize: 11 },
  tabBar: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 },
  tab: { padding: "8px 18px", borderRadius: 20, border: "1px solid", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "background-color 0.2s, color 0.2s" },
  tabContent: { background: "#111122", borderRadius: 16, padding: 24, border: "1px solid #1a1a2e" },
};
