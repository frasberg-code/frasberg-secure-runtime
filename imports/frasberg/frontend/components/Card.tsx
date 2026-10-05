"use client";

export default function Card({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "#111",
        borderRadius: 8,
        padding: 16,
        border: "1px solid #333",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
