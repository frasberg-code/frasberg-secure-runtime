"use client";

export default function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  style = {},
}: {
  value: string | number;
  onChange: (e: any) => void;
  placeholder?: string;
  type?: string;
  style?: React.CSSProperties;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      style={{
        width: "100%",
        padding: 10,
        background: "#111",
        border: "1px solid #333",
        borderRadius: 6,
        color: "#fff",
        ...style,
      }}
    />
  );
}
