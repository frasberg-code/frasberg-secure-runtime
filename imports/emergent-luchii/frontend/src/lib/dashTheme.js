export const T = {
  bg: "var(--dash-bg)",
  surface: "var(--dash-surface)",
  inset: "var(--dash-inset)",
  border: "var(--dash-border)",
  borderSubtle: "var(--dash-border-sub)",
  text: "var(--dash-text)",
  text2: "var(--dash-text2)",
  muted: "var(--dash-muted)",
  accent: "var(--dash-accent)",
  headerBg: "var(--dash-header-bg)",
};

export const applyDashTheme = (light) => {
  const root = document.documentElement;
  root.classList.toggle("light", light);
  root.classList.toggle("dark", !light);
  try { localStorage.setItem("luchii-theme", light ? "light" : "dark"); } catch {}
};

export const isLightSaved = () => {
  try { return localStorage.getItem("luchii-theme") === "light"; } catch { return false; }
};
