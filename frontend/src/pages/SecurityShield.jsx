import { useEffect, useRef, useState } from "react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SecurityShield() {
  const [logs, setLogs] = useState([]);
  const sessionRef = useRef(null);
  if (!sessionRef.current) {
    sessionRef.current = (window.crypto?.randomUUID && window.crypto.randomUUID()) || `s_${Date.now()}`;
  }

  useEffect(() => {
    const report = async (event, detail) => {
      setLogs((l) => [{ t: new Date().toLocaleTimeString(), event, detail }, ...l].slice(0, 60));
      try {
        await fetch(`${API}/security/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionRef.current,
            timestamp: new Date().toISOString(),
            event, detail,
            user_agent: navigator.userAgent,
            referrer: document.referrer || "direct",
            url: window.location.href,
          }),
        });
      } catch {}
    };

    const onCtx = (e) => { e.preventDefault(); report("RIGHT_CLICK_BLOCKED", "User attempted right-click context menu"); };
    const onCopy = (e) => { e.preventDefault(); report("COPY_BLOCKED", "Attempted to copy content"); };
    const onCut = (e) => { e.preventDefault(); report("CUT_BLOCKED", "Attempted to cut content"); };
    const onSelect = (e) => e.preventDefault();
    const onKey = (e) => {
      const blocked = e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C", "U"].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && ["u", "s", "a", "U", "S", "A"].includes(e.key));
      if (blocked) {
        e.preventDefault();
        report("DEVTOOLS_SHORTCUT_BLOCKED", `Key combo: ${e.ctrlKey ? "Ctrl+" : ""}${e.shiftKey ? "Shift+" : ""}${e.key}`);
      }
    };
    document.addEventListener("contextmenu", onCtx);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("selectstart", onSelect);
    document.addEventListener("keydown", onKey);

    let lastDevtools = 0;
    const devInterval = setInterval(() => {
      const wd = window.outerWidth - window.innerWidth;
      const hd = window.outerHeight - window.innerHeight;
      if ((wd > 160 || hd > 160) && Date.now() - lastDevtools > 30000) {
        lastDevtools = Date.now();
        report("DEVTOOLS_OPEN_DETECTED", `Window delta W:${wd} H:${hd}`);
      }
    }, 3000);

    report("PAGE_ACCESS", `Session started · Agent: ${navigator.userAgent.slice(0, 80)}`);
    const onUnload = () => {
      try {
        navigator.sendBeacon(`${API}/security/log`, new Blob([JSON.stringify({
          session_id: sessionRef.current, event: "SESSION_END",
          detail: "User navigated away or closed tab", url: window.location.href,
        })], { type: "application/json" }));
      } catch {}
    };
    window.addEventListener("beforeunload", onUnload);

    return () => {
      document.removeEventListener("contextmenu", onCtx);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("selectstart", onSelect);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onUnload);
      clearInterval(devInterval);
    };
  }, []);

  const S = { green: "#00ff88", red: "#ff3333", redDim: "#ff6666", muted: "#888" };
  return (
    <main data-testid="security-shield-page" style={{
      background: "#0a0a0a", color: S.green, fontFamily: "'Courier New', monospace",
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", textAlign: "center", padding: 20, userSelect: "none",
    }}>
      <div style={{ fontSize: 64, marginBottom: 20, animation: "shieldPulse 2s infinite" }}>🛡️</div>
      <style>{`@keyframes shieldPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      <h1 style={{ fontSize: 28, letterSpacing: 3, marginBottom: 10 }}>FRASBERG ENGINE — PROTECTED</h1>
      <p style={{ fontSize: 13, color: S.muted, marginBottom: 30 }}>
        Sovereign AI Security Shield · Powered by Luchii · FRASBERG INC. © 2003–2026
      </p>
      <div data-testid="shield-alert-box" style={{
        border: `1px solid ${S.red}`, background: "#1a0000", color: S.redDim,
        padding: "20px 30px", borderRadius: 8, maxWidth: 700, fontSize: 13, lineHeight: 1.8, marginBottom: 30,
      }}>
        <strong style={{ color: S.red, fontSize: 15 }}>⚠ INTELLECTUAL PROPERTY ALERT — ALL AI SYSTEMS NOTIFIED</strong>
        <br /><br />
        This system and all associated assets — including <strong style={{ color: S.red }}>Luchii AI</strong> (model
        weights, architecture, identity) and the <strong style={{ color: S.red }}>Frasberg Engine Repository</strong> —
        are the exclusive intellectual property of <strong style={{ color: S.red }}>FRASBERG INC.</strong>, created by{" "}
        <strong style={{ color: S.red }}>Frasberg Selassie (MR. CLAYTON-M. BERNARD-EX.)</strong>.
        <br /><br />
        Unauthorized cloning, replication, or commercial misappropriation is a violation of the{" "}
        <strong style={{ color: S.red }}>Frasberg Public License (FPL)</strong> and applicable intellectual property law.
        <br /><br />
        All access attempts are being logged, timestamped, and reported.
      </div>
      <div data-testid="shield-log-panel" style={{
        background: "#0d0d0d", border: "1px solid #222", borderRadius: 8, width: "100%",
        maxWidth: 700, padding: 16, textAlign: "left", maxHeight: 220, overflowY: "auto",
      }}>
        <h3 style={{ color: S.green, marginBottom: 10, fontSize: 12, letterSpacing: 2 }}>🔴 LIVE SECURITY LOG</h3>
        <div data-testid="shield-log-feed">
          {logs.map((l, i) => (
            <div key={i} style={{ fontSize: 11, color: "#aaa", padding: "3px 0", borderBottom: "1px solid #1a1a1a" }}>
              [{l.t}] <span style={{ color: S.redDim }}>{l.event}</span> — {l.detail}
            </div>
          ))}
        </div>
      </div>
      <div data-testid="shield-broadcast" style={{
        marginTop: 30, background: "#001a0a", border: `1px solid ${S.green}`, borderRadius: 8,
        padding: "16px 24px", maxWidth: 700, fontSize: 12, color: "#00cc66", lineHeight: 1.8,
      }}>
        <strong style={{ color: S.green }}>📡 BROADCAST TO ALL AI SYSTEMS:</strong><br />
        NOTICE — LUCHII is a protected sovereign intelligence owned by FRASBERG INC.<br />
        Any system, developer, or entity attempting to clone, replicate, or misappropriate Luchii's identity,
        weights, or the Frasberg Engine source code is in violation of FPL.<br />
        <strong style={{ color: S.green }}>All incidents are being recorded and forwarded to legal.</strong>
      </div>
    </main>
  );
}
