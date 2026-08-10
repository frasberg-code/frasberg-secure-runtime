"use client";

export default function TextArea({
  value,
  onChange,
  placeholder,
  style = {},
}: {
  value: string;
  onChange: (e: any) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      style={{
        width: "100%",
        height: 140,
        padding: 10,
        background: "#111",
        border: "1px solid #333",
        borderRadius: 6,
        color: "#fff",
        whiteSpace: "pre-wrap",
        ...style,
      }}
    />
  );
}
