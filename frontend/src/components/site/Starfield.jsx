import { useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";

export default function Starfield() {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let w, h, stars;
    const mouse = { x: -999, y: -999 };

    const accent = theme === "dark" ? "0,240,255" : "0,122,255";
    const dot = theme === "dark" ? "255,255,255" : "30,35,39";

    function resize() {
      w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      const count = Math.min(140, Math.floor((canvas.offsetWidth * canvas.offsetHeight) / 12000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        r: Math.random() * 1.4 + 0.3,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const dpr = window.devicePixelRatio;
      const mx = mouse.x * dpr;
      const my = mouse.y * dpr;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = w; if (s.x > w) s.x = 0;
        if (s.y < 0) s.y = h; if (s.y > h) s.y = 0;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dot},0.5)`;
        ctx.fill();
        // link to mouse
        const dmx = s.x - mx, dmy = s.y - my;
        const dm = Math.sqrt(dmx * dmx + dmy * dmy);
        if (dm < 160 * dpr) {
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(mx, my);
          ctx.strokeStyle = `rgba(${accent},${0.35 * (1 - dm / (160 * dpr))})`;
          ctx.lineWidth = dpr;
          ctx.stroke();
        }
        // link to neighbours
        for (let j = i + 1; j < stars.length; j++) {
          const o = stars[j];
          const dx = s.x - o.x, dy = s.y - o.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 110 * dpr) {
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(o.x, o.y);
            ctx.strokeStyle = `rgba(${dot},${0.08 * (1 - d / (110 * dpr))})`;
            ctx.lineWidth = dpr * 0.6;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }

    function onMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }
    function onLeave() { mouse.x = -999; mouse.y = -999; }

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    />
  );
}
