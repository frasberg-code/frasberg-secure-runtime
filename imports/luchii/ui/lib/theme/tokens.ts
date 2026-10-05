export const tokens = {
  color: {
    primary: "#1F4FFF",
    primarySoft: "#E3EBFF",
    secondary: "#0F1A33",
    bg: "#F5F7FA",
    surface: "#FFFFFF",
    border: "#E0E6ED",
    text: "#1F2937",
    textLight: "#6B7280",
    error: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B"
  },
  font: {
    family: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    size: {
      xs: "0.75rem",
      sm: "0.875rem",
      md: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem"
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  spacing: (multiplier: number) => `${multiplier * 0.5}rem`,
  radius: {
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem"
  },
  shadow: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
  }
};
