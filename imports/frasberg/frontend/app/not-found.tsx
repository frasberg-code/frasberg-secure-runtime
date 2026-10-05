export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        flexDirection: "column",
      }}
    >
      <h1>404</h1>
      <p style={{ marginTop: 8, color: "#aaa" }}>The page you requested was not found.</p>
    </div>
  );
}
