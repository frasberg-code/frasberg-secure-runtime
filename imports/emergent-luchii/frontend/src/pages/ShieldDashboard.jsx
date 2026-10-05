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
    padding: "2px 8px", borderRadius: 20, fontSize: 12, fontWeight: "bold", letterSpacing: 1,
    color, border: `1px solid ${color}`, background: `${color}18`,
  }}>{children}</span>
);

const StatCard = ({ label, value, color, testid }) => (
  <div data-testid={testid} style={{
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: "20px 24px", textAlign: "center",
  }}>
    <div style={{ fontSize: 13, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
    <div style={{ fontSize: 40, fontWeight: "bold", color }}>{value}</div>
  </div>
);

export default function ShieldDashboard() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState("—");
  const [breaches, setBreaches] = useState([]);
  const [cds, setCds] = useState([]);
  const [banned, setBanned] = useState([]);
  const [geoCountries, setGeoCountries] = useState([]);
  const [geoLog, setGeoLog] = useState([]);
  const [banInput, setBanInput] = useState("");
  const [geoCC, setGeoCC] = useState("");
  const [geoName, setGeoName] = useState("");
  const [geoRegions, setGeoRegions] = useState([]);
  const [regCC, setRegCC] = useState("");
  const [regCode, setRegCode] = useState("");
  const [regName, setRegName] = useState("");
  const [cleared, setCleared] = useState(false);
  const timer = useRef(null);

  const pollAll = async () => {
    try {
      const opts = { credentials: "include" };
      const [lr, br, cr, bn, gc, gl, gr] = await Promise.all([
        fetch(`${API}/security/logs`, opts),
        fetch(`${API}/security/breaches`, opts),
        fetch(`${API}/security/cease-desist`, opts),
        fetch(`${API}/admin/banned`, opts),
        fetch(`${API}/geo/countries`, opts),
        fetch(`${API}/geo/log`, opts),
        fetch(`${API}/geo/regions`, opts),
      ]);
      if (lr.ok) { const d = await lr.json(); setTotal(d.total); setLogs(d.logs); }
      if (br.ok) setBreaches((await br.json()).breaches);
      if (cr.ok) setCds((await cr.json()).records);
      if (bn.ok) setBanned((await bn.json()).banned);
      if (gc.ok) setGeoCountries((await gc.json()).countries);
      if (gl.ok) setGeoLog((await gl.json()).log);
      if (gr.ok) setGeoRegions((await gr.json()).regions);
    } catch {}
  };

  const banIP = async () => {
    const ip = banInput.trim();
    if (!ip) return;
    await fetch(`${API}/admin/ban`, {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ ip, reason: "Manual ban via dashboard", expires_hours: 24 }),
    });
    setBanInput(""); pollAll();
  };
  const unbanIP = async (ip) => {
    await fetch(`${API}/admin/unban`, {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ ip, reason: "Manual unban via dashboard" }),
    });
    pollAll();
  };
  const blockCountry = async () => {
    if (!geoCC.trim() || !geoName.trim()) return;
    await fetch(`${API}/geo/countries`, {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ country_code: geoCC.trim(), country_name: geoName.trim(), reason: "Blocked via dashboard" }),
    });
    setGeoCC(""); setGeoName(""); pollAll();
  };
  const unblockCountry = async (code) => {
    await fetch(`${API}/geo/countries/${code}`, { method: "DELETE", credentials: "include" });
    pollAll();
  };
  const blockRegion = async () => {
    if (!regCC.trim() || !regCode.trim() || !regName.trim()) return;
    await fetch(`${API}/geo/regions`, {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ country_code: regCC.trim(), region_code: regCode.trim(), region_name: regName.trim(), reason: "Blocked via dashboard" }),
    });
    setRegCC(""); setRegCode(""); setRegName(""); pollAll();
  };
  const unblockRegion = async (cc, rc) => {
    await fetch(`${API}/geo/regions/${cc}/${rc}`, { method: "DELETE", credentials: "include" });
    pollAll();
  };
  const downloadCdPdf = async (r) => {
    try {
      const res = await fetch(`${API}/security/cease-desist/${r.id}/pdf`, { credentials: "include" });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `cease_desist_${r.ip.replace(/\./g, "_")}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {}
  };
  const sendDigest = async () => {
    const res = await fetch(`${API}/admin/digest/send`, { method: "POST", credentials: "include" });
    if (res.ok) window.alert("Weekly digest emailed to admins.");
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
          <button onClick={sendDigest} data-testid="shield-send-digest"
            style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, padding: "4px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            📧 Send Digest Now
          </button>
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
              style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, padding: "4px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
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
                  <span style={{ color: C.muted, fontSize: 13 }}>{new Date(l.created_at).toLocaleTimeString()}</span>
                  <span style={{ color: l.flagged ? C.red : C.green, fontWeight: "bold" }}>{l.event}</span>
                </div>
                <div>{l.detail || "—"}</div>
                <div style={{ color: C.orange, fontSize: 12, marginTop: 2 }}>IP: {l.ip} · Session: {(l.session_id || "").slice(0, 8)}…</div>
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
                  <th key={h} style={{ background: C.panelHead, color: C.muted, textTransform: "uppercase", fontSize: 12, padding: "10px 14px", textAlign: "left", borderBottom: `1px solid ${C.border}` }}>{h}</th>
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
                  <th key={h} style={{ background: C.panelHead, color: C.muted, textTransform: "uppercase", fontSize: 12, padding: "10px 14px", textAlign: "left", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cds.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: C.muted, padding: 30 }}>No C&amp;D records yet.</td></tr>}
              {cds.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: 12 }}>{r.id.slice(0, 12)}…</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, color: C.orange }}>{r.ip}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>{new Date(r.drafted_at).toLocaleString()}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                    {r.sent ? <Badge color={C.blue}>SENT</Badge> : <Badge color={C.orange}>QUEUED</Badge>}
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => window.alert(r.cd_text)} data-testid={`shield-cd-view-${r.id}`}
                        style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, padding: "4px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                        View
                      </button>
                      <button onClick={() => downloadCdPdf(r)} data-testid={`shield-cd-pdf-${r.id}`}
                        style={{ background: "transparent", border: `1px solid ${C.blue}`, color: C.blue, borderRadius: 6, padding: "4px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                        ⬇ PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section style={{ gridColumn: "1 / -1", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "14px 18px", borderBottom: `1px solid ${C.border}`, background: C.panelHead }}>
            <h2 style={{ fontSize: 13, color: C.green, letterSpacing: 2 }}>🚫 BANNED IPs</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={banInput} onChange={(e) => setBanInput(e.target.value)} placeholder="Enter IP to ban…"
                data-testid="shield-ban-input"
                style={{ background: C.panelHead, border: `1px solid ${C.border}`, color: C.text, padding: "4px 10px", borderRadius: 6, fontFamily: "inherit", fontSize: 13, width: 180 }} />
              <button onClick={banIP} data-testid="shield-ban-btn"
                style={{ background: "transparent", border: `1px solid ${C.red}`, color: C.red, borderRadius: 6, padding: "4px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                🚫 Ban IP (24h)
              </button>
            </div>
          </div>
          <table data-testid="shield-ban-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["IP Address", "Reason", "Banned By", "Banned At", "Expires", "Status", "Action"].map((h) => (
                  <th key={h} style={{ background: C.panelHead, color: C.muted, textTransform: "uppercase", fontSize: 12, padding: "10px 14px", textAlign: "left", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {banned.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", color: C.muted, padding: 30 }}>No banned IPs.</td></tr>}
              {banned.map((b) => (
                <tr key={b.ip}>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, color: C.orange, fontWeight: "bold" }}>{b.ip}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.muted }}>{b.reason || "—"}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                    <Badge color={b.banned_by === "ADMIN" ? C.orange : C.red}>{b.banned_by}</Badge>
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>{new Date(b.banned_at).toLocaleString()}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>{b.expires_at ? new Date(b.expires_at).toLocaleString() : "PERMANENT"}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                    {b.active ? <Badge color={C.red}>ACTIVE</Badge> : <Badge color={C.green}>LIFTED</Badge>}
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                    {b.active ? (
                      <button onClick={() => unbanIP(b.ip)} data-testid={`shield-unban-${b.ip}`}
                        style={{ background: "transparent", border: `1px solid ${C.green}`, color: C.green, borderRadius: 6, padding: "4px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                        ✅ Unban
                      </button>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={{ gridColumn: "1 / -1", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "14px 18px", borderBottom: `1px solid ${C.border}`, background: C.panelHead }}>
            <h2 style={{ fontSize: 13, color: C.green, letterSpacing: 2 }}>🌍 GEOIP BLOCKING</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input value={geoCC} onChange={(e) => setGeoCC(e.target.value)} placeholder="Country Code (e.g. RU)"
                data-testid="shield-geo-cc-input"
                style={{ background: C.panelHead, border: `1px solid ${C.border}`, color: C.text, padding: "4px 10px", borderRadius: 6, fontFamily: "inherit", fontSize: 13, width: 160 }} />
              <input value={geoName} onChange={(e) => setGeoName(e.target.value)} placeholder="Country Name"
                data-testid="shield-geo-name-input"
                style={{ background: C.panelHead, border: `1px solid ${C.border}`, color: C.text, padding: "4px 10px", borderRadius: 6, fontFamily: "inherit", fontSize: 13, width: 160 }} />
              <button onClick={blockCountry} data-testid="shield-geo-block-btn"
                style={{ background: "transparent", border: `1px solid ${C.red}`, color: C.red, borderRadius: 6, padding: "4px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                🌍 Block Country
              </button>
            </div>
          </div>
          <table data-testid="shield-geo-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["Code", "Country", "Reason", "Blocked At", "Status", "Action"].map((h) => (
                  <th key={h} style={{ background: C.panelHead, color: C.muted, textTransform: "uppercase", fontSize: 12, padding: "10px 14px", textAlign: "left", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {geoCountries.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: C.muted, padding: 30 }}>No countries blocked.</td></tr>}
              {geoCountries.map((c) => (
                <tr key={c.country_code}>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, color: C.blue, fontWeight: "bold", fontSize: 16 }}>{c.country_code}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>{c.country_name}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.muted }}>{c.reason || "—"}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>{new Date(c.blocked_at).toLocaleString()}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                    {c.active ? <Badge color={C.red}>BLOCKED</Badge> : <Badge color={C.green}>LIFTED</Badge>}
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                    {c.active ? (
                      <button onClick={() => unblockCountry(c.country_code)} data-testid={`shield-geo-unblock-${c.country_code}`}
                        style={{ background: "transparent", border: `1px solid ${C.green}`, color: C.green, borderRadius: 6, padding: "4px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                        ✅ Unblock
                      </button>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "14px 18px", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: C.panelHead }}>
            <h2 style={{ fontSize: 13, color: C.green, letterSpacing: 2 }}>🗺️ REGION / STATE BLOCKING</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input value={regCC} onChange={(e) => setRegCC(e.target.value)} placeholder="Country (e.g. US)"
                data-testid="shield-region-cc-input"
                style={{ background: C.panelHead, border: `1px solid ${C.border}`, color: C.text, padding: "4px 10px", borderRadius: 6, fontFamily: "inherit", fontSize: 13, width: 120 }} />
              <input value={regCode} onChange={(e) => setRegCode(e.target.value)} placeholder="Region Code (e.g. TX)"
                data-testid="shield-region-code-input"
                style={{ background: C.panelHead, border: `1px solid ${C.border}`, color: C.text, padding: "4px 10px", borderRadius: 6, fontFamily: "inherit", fontSize: 13, width: 140 }} />
              <input value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Region Name (e.g. Texas)"
                data-testid="shield-region-name-input"
                style={{ background: C.panelHead, border: `1px solid ${C.border}`, color: C.text, padding: "4px 10px", borderRadius: 6, fontFamily: "inherit", fontSize: 13, width: 160 }} />
              <button onClick={blockRegion} data-testid="shield-region-block-btn"
                style={{ background: "transparent", border: `1px solid ${C.red}`, color: C.red, borderRadius: 6, padding: "4px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                🗺️ Block Region
              </button>
            </div>
          </div>
          <table data-testid="shield-region-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["Region", "Name", "Reason", "Blocked At", "Status", "Action"].map((h) => (
                  <th key={h} style={{ background: C.panelHead, color: C.muted, textTransform: "uppercase", fontSize: 12, padding: "10px 14px", textAlign: "left", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {geoRegions.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: C.muted, padding: 30 }}>No regions blocked.</td></tr>}
              {geoRegions.map((r) => (
                <tr key={`${r.country_code}-${r.region_code}`}>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, color: C.blue, fontWeight: "bold" }}>{r.country_code}-{r.region_code}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>{r.region_name}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.muted }}>{r.reason || "—"}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>{new Date(r.blocked_at).toLocaleString()}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                    {r.active ? <Badge color={C.red}>BLOCKED</Badge> : <Badge color={C.green}>LIFTED</Badge>}
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                    {r.active ? (
                      <button onClick={() => unblockRegion(r.country_code, r.region_code)} data-testid={`shield-region-unblock-${r.country_code}-${r.region_code}`}
                        style={{ background: "transparent", border: `1px solid ${C.green}`, color: C.green, borderRadius: 6, padding: "4px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                        ✅ Unblock
                      </button>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {geoLog.length > 0 && (
            <div data-testid="shield-geo-log" style={{ borderTop: `1px solid ${C.border}` }}>
              <div style={{ padding: "10px 18px", fontSize: 13, color: C.muted, letterSpacing: 2, background: C.panelHead }}>GEO BLOCK LOG ({geoLog.length})</div>
              {geoLog.slice(0, 20).map((g) => (
                <div key={g.id} style={{ padding: "6px 18px", fontSize: 13, borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ color: C.orange }}>{g.ip}</span> · <Badge color={C.red}>{g.country_code || "??"}</Badge>{" "}
                  {g.country_name} · {g.city || "—"} · <span style={{ color: C.muted }}>{g.endpoint} · {new Date(g.blocked_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
