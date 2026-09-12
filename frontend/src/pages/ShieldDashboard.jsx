import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const C = {
  bg: "#080b0f", surface: "#0e1218", panelHead: "#0b0f15", border: "#1a2030",
  green: "#00ff88", greenDim: "#00cc66", red: "#ff3333", orange: "#ff8c00",
  blue: "#4da6ff", muted: "#556070", text: "#c8d0dc",
};

const Badge = ({ color, children }) => (
  <span style={{
    padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: "bold", letterSpacing: 1,
    color, border: `1px solid ${color}`, background: `${color}18`,
  }}>{children}</span>
);

const StatCard = ({ label, value, color, testid }) => (
  <div data-testid={testid} style={{
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: "20px 24px", textAlign: "center",
  }}>
    <div style={{ fontSize: 11, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
    <div style={{ fontSize: 40, fontWeight: "bold", color }}>{value}</div>
  </div>
);

export default function ShieldDashboard() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState("—");
  const [breaches, setBreaches] = useState([]);
  const [cds, setCds] = useState([]);
  const [cleared, setCleared] = useState(false);
  const timer = useRef(null);

  const pollAll = async () => {
    try {
      const [lr, br, cr] = await Promise.all([
        fetch(`${API}/security/logs`, { credentials: "include" }),
        fetch(`${API}/security/breaches`, { credentials: "include" }),
        fetch(`${API}/security/cease-desist`, { credentials: "include" }),
      ]);
      if (lr.ok) { const d = await lr.json(); setTotal(d.total); setLogs(d.logs); }
      if (br.ok) setBreaches((await br.json()).breaches);
      if (cr.ok) setCds((await cr.json()).records);
    } catch {}
  };

  useEffect(() => {
    if (user?.role !== "admin") return;
    pollAll();
    timer.current = setInterval(pollAll, 4000);
    return () => clearInterval(timer.current);
  }, [user]);

  if (user === undefined) return null;
  if (!user || user.role !== "admin") {
    return (
      <main data-testid="shield-dashboard-denied" style={{
        background: C.bg, color: C.red, fontFamily: "'Courier New', monospace", minHeight: "100vh",
        display: "grid", placeItems: "center", textAlign: "center", padding: 20,
      }}>
        <div>
          <div style={{ fontSize: 48 }}>🛡️</div>
          <h1 style={{ fontSize: 20, letterSpacing: 2, marginTop: 12 }}>ADMIN ACCESS REQUIRED</h1>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>The Shield Dashboard is restricted to FRASBERG INC. administrators.</p>
          <Link to="/" style={{ color: C.green, fontSize: 13 }} data-testid="shield-denied-home">← Return home</Link>
        </div>
      </main>
    );
  }

  const flaggedCount = logs.filter((l) => l.flagged).length;
  const shownLogs = cleared ? [] : logs.slice(0, 100);

  return (
    <main data-testid="shield-dashboard-page" style={{
      background: C.bg, color: C.text, fontFamily: "'Courier New', monospace", minHeight: "100vh",
    }}>
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 28px", background: C.surface, borderBottom: `1px solid ${C.border}`,
      }}>
        <Link to="/" style={{ fontSize: 18, fontWeight: "bold", color: C.green, letterSpacing: 3, textDecoration: "none" }}
          data-testid="shield-dash-logo">🛡️ FRASBERG SHIELD</Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: C.muted }}>
          <span style={{ width: 8, height: 8, background: C.green, borderRadius: "50%", animation: "shieldDot 1.4s infinite" }} />
          <style>{`@keyframes shieldDot { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
          <span style={{ color: C.green, fontWeight: "bold", letterSpacing: 2 }} data-testid="shield-live-status">LIVE</span>
          <span>FRASBERG INC. · Luchii Sovereign Intelligence</span>
        </div>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, padding: "24px 28px 0" }}>
        <StatCard label="Total Events" value={total} color={C.green} testid="shield-stat-total" />
        <StatCard label="Flagged Events" value={flaggedCount} color={C.orange} testid="shield-stat-flagged" />
        <StatCard label="Breach IPs" value={breaches.length} color={C.red} testid="shield-stat-breach-ips" />
        <StatCard label="C&D Drafted" value={cds.length} color={C.blue} testid="shield-stat-cd" />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: "24px 28px" }}>
        <section style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${C.border}`, background: C.panelHead }}>
            <h2 style={{ fontSize: 13, color: C.green, letterSpacing: 2 }}>📡 LIVE EVENT FEED</h2>
            <button onClick={() => setCleared(true)} data-testid="shield-clear-feed"
              style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
              Clear
            </button>
          </div>
          <div data-testid="shield-event-feed" style={{ padding: 12, maxHeight: 380, overflowY: "auto" }}>
            {shownLogs.length === 0 && <div style={{ textAlign: "center", color: C.muted, fontSize: 12, padding: "40px 0" }}>{cleared ? "Feed cleared." : "Waiting for events…"}</div>}
            {shownLogs.map((l) => (
              <div key={l.id} style={{
                padding: "8px 10px", borderRadius: 6, marginBottom: 6, fontSize: 12,
                borderLeft: `3px solid ${l.flagged ? C.red : C.greenDim}`, background: C.panelHead,
              }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ color: C.muted, fontSize: 11 }}>{new Date(l.created_at).toLocaleTimeString()}</span>
                  <span style={{ color: l.flagged ? C.red : C.green, fontWeight: "bold" }}>{l.event}</span>
                </div>
                <div>{l.detail || "—"}</div>
                <div style={{ color: C.orange, fontSize: 10, marginTop: 2 }}>IP: {l.ip} · Session: {(l.session_id || "").slice(0, 8)}…</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, background: C.panelHead }}>
            <h2 style={{ fontSize: 13, color: C.green, letterSpacing: 2 }}>🔴 IP BREACH LEADERBOARD</h2>
          </div>
          <table data-testid="shield-breach-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["IP Address", "Breaches", "Last Seen", "C&D", "Status"].map((h) => (
                  <th key={h} style={{ background: C.panelHead, color: C.muted, textTransform: "uppercase", fontSize: 10, padding: "10px 14px", textAlign: "left", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {breaches.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: C.muted, padding: 30 }}>No breach IPs detected.</td></tr>}
              {breaches.map((b) => (
                <tr key={b.ip}>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, color: C.orange, fontWeight: "bold" }}>{b.ip}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, color: C.red, fontSize: 18, fontWeight: "bold" }}>{b.breach_count}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>{new Date(b.last_seen).toLocaleString()}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                    {b.cd_triggered ? <Badge color={C.blue}>C&D SENT</Badge> : <Badge color={C.green}>NONE</Badge>}
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                    {b.breach_count >= 10 ? <Badge color={C.red}>CRITICAL</Badge> : b.breach_count >= 5 ? <Badge color={C.orange}>WARNING</Badge> : <Badge color={C.green}>LOW</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={{ gridColumn: "1 / -1", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, background: C.panelHead }}>
            <h2 style={{ fontSize: 13, color: C.green, letterSpacing: 2 }}>⚖️ CEASE &amp; DESIST RECORDS</h2>
          </div>
          <table data-testid="shield-cd-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["ID", "IP Address", "Drafted At", "Sent", "Letter"].map((h) => (
                  <th key={h} style={{ background: C.panelHead, color: C.muted, textTransform: "uppercase", fontSize: 10, padding: "10px 14px", textAlign: "left", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cds.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: C.muted, padding: 30 }}>No C&amp;D records yet.</td></tr>}
              {cds.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: 10 }}>{r.id.slice(0, 12)}…</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, color: C.orange }}>{r.ip}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>{new Date(r.drafted_at).toLocaleString()}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                    {r.sent ? <Badge color={C.blue}>SENT</Badge> : <Badge color={C.orange}>QUEUED</Badge>}
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                    <button onClick={() => window.alert(r.cd_text)} data-testid={`shield-cd-view-${r.id}`}
                      style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
