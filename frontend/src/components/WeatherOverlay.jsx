import { useEffect, useRef } from "react";

export function WeatherOverlay({ weather, intensity = 0.6 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animFrame;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const drops = [];
    if (weather === "rain" || weather === "stormy") {
      for (let i = 0; i < 200 * intensity; i++) {
        drops.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed: 8 + Math.random() * 8,
          length: 15 + Math.random() * 20,
        });
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (weather === "rain" || weather === "stormy") {
        ctx.strokeStyle = `rgba(174, 214, 241, ${0.4 * intensity})`;
        ctx.lineWidth = 1;
        drops.forEach((drop) => {
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 2, drop.y + drop.length);
          ctx.stroke();
          drop.y += drop.speed;
          if (drop.y > canvas.height) {
            drop.y = -drop.length;
            drop.x = Math.random() * canvas.width;
          }
        });
      }

      if (weather === "fog") {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, `rgba(200, 210, 220, ${0.5 * intensity})`);
        gradient.addColorStop(1, "rgba(200, 210, 220, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (weather === "heat_haze") {
        const time = Date.now() * 0.001;
        ctx.fillStyle = `rgba(255, 200, 100, ${0.08 + Math.sin(time) * 0.03})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (weather === "stormy") {
        if (Math.random() < 0.003) {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * intensity})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }

      animFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrame);
  }, [weather, intensity]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="weather-overlay"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 10,
      }}
    />
  );
}
