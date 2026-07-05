import React from "react";

export const MarketingHero: React.FC = () => {
  return (
    <section className="frasberg-hero" style={{ fontFamily: "Inter, system-ui, sans-serif", color: "#0b1221" }}>
      {/* Hero */}
      <div style={{ display: "flex", alignItems: "center", gap: 40, padding: "48px 32px", background: "linear-gradient(90deg,#f7fbff,#ffffff)" }}>
        <div style={{ flex: 1, maxWidth: 780 }}>
          <h1 style={{ fontSize: 40, lineHeight: 1.05, margin: 0 }}>
            Replace dozens of tools with one unified platform
          </h1>
          <p style={{ marginTop: 16, fontSize: 18, color: "#324040" }}>
            Automate end-to-end workflows across HR, IT, Finance and Product — onboard employees, run payroll,
            issue devices and corporate cards, and manage compliance without switching systems.
          </p>
          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <a href="/demo" style={{ padding: "12px 18px", background: "#0b66ff", color: "#fff", borderRadius: 8, textDecoration: "none" }}>
              Schedule demo
            </a>
            <a href="/app-studio" style={{ padding: "12px 18px", border: "1px solid #dbe7ff", borderRadius: 8, color: "#0b1221", textDecoration: "none" }}>
              Try App Studio
            </a>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{ width: 420, height: 280, background: "#fff", borderRadius: 12, boxShadow: "0 8px 30px rgba(11,18,33,0.08)", padding: 18 }}>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Live App Preview</div>
            <div style={{ height: 200, borderRadius: 8, background: "linear-gradient(180deg,#eef6ff,#ffffff)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0b1221" }}>
              <strong>App Studio • Drag & Drop Workflow</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Three feature blocks */}
      <div style={{ display: "flex", gap: 18, padding: "36px 32px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ flex: 1, background: "#ffffff", borderRadius: 10, padding: 20, boxShadow: "0 6px 20px rgba(11,18,33,0.04)" }}>
          <h3 style={{ marginTop: 0 }}>Automate end‑to‑end workflows</h3>
          <p style={{ color: "#334155" }}>
            Onboard new hires, run payroll, manage performance, provision devices and corporate cards — all without hopping between apps.
          </p>
          <ul style={{ color: "#475569", paddingLeft: 18 }}>
            <li>Custom triggers + actions across HR, IT, Finance</li>
            <li>Shared permissions & audit trails</li>
            <li>Prebuilt templates for fast time-to-value</li>
          </ul>
        </div>

        <div style={{ flex: 1, background: "#ffffff", borderRadius: 10, padding: 20, boxShadow: "0 6px 20px rgba(11,18,33,0.04)" }}>
          <h3 style={{ marginTop: 0 }}>Platform capabilities at scale</h3>
          <p style={{ color: "#334155" }}>
            One consistent platform across all Frasberg apps: automation, reporting, governance and access controls work everywhere.
          </p>
          <ul style={{ color: "#475569", paddingLeft: 18 }}>
            <li>Reusable building blocks: automations, reports, dashboards</li>
            <li>Governance: role-based access, audit-ready history</li>
            <li>Low/no-code App Studio for internal apps</li>
          </ul>
        </div>

        <div style={{ flex: 1, background: "#ffffff", borderRadius: 10, padding: 20, boxShadow: "0 6px 20px rgba(11,18,33,0.04)" }}>
          <h3 style={{ marginTop: 0 }}>Integrations that keep work in sync</h3>
          <p style={{ color: "#334155" }}>
            Connect the tools your teams already use — GitHub, Slack, Jira, Workday, accounting systems and MDM — and automate across them.
          </p>
          <div style={{ color: "#475569", paddingLeft: 18 }}>
            <strong>Examples:</strong>
            <div style={{ marginTop: 8 }}>
              GitHub • Slack • Jira • HubSpot • Google Workspace • Microsoft 365 • Carta • Checkr • Supabase • Apple Business Manager
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketingHero;
