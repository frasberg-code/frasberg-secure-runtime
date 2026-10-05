export function DayNightOverlay({ hour }) {
  const getOverlay = () => {
    if (hour >= 5 && hour < 10) return "rgba(245, 158, 11, 0.12)";
    if (hour >= 10 && hour < 17) return "rgba(255, 255, 255, 0)";
    if (hour >= 17 && hour < 21) return "rgba(239, 68, 68, 0.15)";
    return "rgba(30, 27, 75, 0.55)";
  };

  return (
    <div
      data-testid="daynight-overlay"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: getOverlay(),
        pointerEvents: "none",
        zIndex: 9,
        transition: "background 2s ease",
      }}
    />
  );
}
