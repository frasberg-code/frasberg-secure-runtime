"use client";

export default function Section({
  title,
  children,
  style = {},
}: {
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ marginBottom: 32, ...style }}>
      <h2 style={{ marginBottom: 12 }}>{title}</h2>
      {children}
    </div>
  );
}
