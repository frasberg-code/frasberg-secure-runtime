export const DARK = {
  bg: "#08090A",
  surface: "#121316",
  inset: "#050505",
  border: "rgba(255,255,255,0.08)",
  borderSubtle: "rgba(255,255,255,0.04)",
  text: "#F2F2F2",
  text2: "#A6ACB8",
  muted: "#8A919C",
  accent: "#00F0FF",
  headerBg: "rgba(8,9,10,0.85)",
};

export const LIGHT = {
  bg: "#F6F7F9",
  surface: "#FFFFFF",
  inset: "#EEF0F3",
  border: "rgba(17,24,39,0.12)",
  borderSubtle: "rgba(17,24,39,0.06)",
  text: "#111827",
  text2: "#374151",
  muted: "#6B7280",
  accent: "#0891B2",
  headerBg: "rgba(246,247,249,0.9)",
};

export const T = { ...DARK };

export const applyDashTheme = (light) => {
  Object.assign(T, light ? LIGHT : DARK);
};

export const isLightSaved = () => {
  try { return localStorage.getItem("dash-theme") === "light"; } catch { return false; }
};

applyDashTheme(isLightSaved());
