import React from "react";

type NavItemId =
  | "OVERVIEW"
  | "GOVERNANCE"
  | "TONE_IDENTITY"
  | "API_KEYS"
  | "USAGE_LOGS"
  | "BILLING"
  | "SETTINGS";

const NAV_ITEMS: { id: NavItemId; label: string }[] = [
  { id: "OVERVIEW", label: "Overview" },
  { id: "GOVERNANCE", label: "Governance Engine" },
  { id: "TONE_IDENTITY", label: "Tone & Identity" },
  { id: "API_KEYS", label: "API & Keys" },
  { id: "USAGE_LOGS", label: "Usage & Logs" },
  { id: "BILLING", label: "Billing & Plan" },
  { id: "SETTINGS", label: "Settings" },
];

export const DashboardLayout: React.FC = () => {
  const [active, setActive] = React.useState<NavItemId>("OVERVIEW");

  return (
    <div className="dashboard-root">
      <aside className="sidebar">
        <div className="brand">
          {/* logo */}
          <span>FRASBERG AI</span>
        </div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={active === item.id ? "nav-item active" : "nav-item"}
              onClick={() => setActive(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-panel">
        <DashboardTopBar />
        <div className="main-content">
          {active === "OVERVIEW" && <OverviewScreen />}
          {active === "GOVERNANCE" && <GovernanceScreen />}
          {active === "TONE_IDENTITY" && <ToneIdentityScreen />}
          {active === "API_KEYS" && <ApiKeysScreen />}
          {active === "USAGE_LOGS" && <UsageLogsScreen />}
          {active === "BILLING" && <BillingScreen />}
          {active === "SETTINGS" && <SettingsScreen />}
        </div>
      </main>
    </div>
  );
};

const DashboardTopBar: React.FC = () => {
  // fetch user + plan from context or API
  return (
    <header className="top-bar">
      <div className="left">
        <h2>Dashboard</h2>
      </div>
      <div className="right">
        <span className="plan-badge">PRO</span>
        <div className="user-avatar">FS</div>
      </div>
    </header>
  );
};

const OverviewScreen: React.FC = () => {
  return (
    <section className="overview-screen">
      {/* cards: current plan, usage, governance incidents, status */}
    </section>
  );
};

const GovernanceScreen: React.FC = () => {
  return (
    <section className="governance-screen">
      {/* toggles + preset selection */}
    </section>
  );
};

const ToneIdentityScreen: React.FC = () => {
  return (
    <section className="tone-identity-screen">
      {/* sliders + identity presets */}
    </section>
  );
};

const ApiKeysScreen: React.FC = () => {
  return (
    <section className="api-keys-screen">
      {/* list + create/revoke keys */}
    </section>
  );
};

const UsageLogsScreen: React.FC = () => {
  return (
    <section className="usage-logs-screen">
      {/* charts + table */}
    </section>
  );
};

const BillingScreen: React.FC = () => {
  return (
    <section className="billing-screen">
      {/* current plan, next billing, manage billing button */}
    </section>
  );
};

const SettingsScreen: React.FC = () => {
  return (
    <section className="settings-screen">
      {/* profile, security, preferences */}
    </section>
  );
};
