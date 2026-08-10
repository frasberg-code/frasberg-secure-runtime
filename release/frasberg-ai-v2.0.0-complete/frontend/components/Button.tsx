"use client";

export default function Button({
  children,
  onClick,
  variant = "primary",
  style = {},
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  style?: React.CSSProperties;
}) {
  const base = {
    padding: "10px 20px",
    borderRadius: 6,
    cursor: "pointer",
    border: "none",
    fontSize: 14,
  } as React.CSSProperties;

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: "#0a84ff", color: "#fff" },
    secondary: { background: "#222", color: "#fff", border: "1px solid #444" },
  };

  return (
    <button onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}
