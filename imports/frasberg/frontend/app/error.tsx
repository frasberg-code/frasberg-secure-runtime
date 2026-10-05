"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body
        style={{
          background: "#000",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
        }}
      >
        <h1>Something went wrong</h1>
        <p style={{ marginTop: 12, color: "#aaa" }}>{error.message}</p>
        <button
          onClick={reset}
          style={{
            marginTop: 24,
            padding: "10px 20px",
            background: "#0a84ff",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
