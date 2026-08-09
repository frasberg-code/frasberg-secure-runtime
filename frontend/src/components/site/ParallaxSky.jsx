import { useRef, useEffect } from "react";

// Layered pointer-parallax sky — mouse/pointer parallax, drifting stars (motion-based),
// glowing 3D depth orbs. Fixed, non-interactive, sits behind dashboard content.
export const ParallaxSky = () => {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d");
    let raf, w, h, stars;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };

    const resize = () => {
      w = canvas.width = window.innerWidth * window.devicePixelRatio;
      h = canvas.height = window.innerHeight * window.devicePixelRatio;
      const count = Math.min(110, Math.floor((window.innerWidth * window.innerHeight) / 16000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.3 + 0.3, depth: 0.4 + Math.random() * 0.6,
      }));
    };

    const onMove = (e) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const layers = root.querySelectorAll("[data-depth]");
    const tick = () => {
      cur.x += (target.x - cur.x) * 0.045;
      cur.y += (target.y - cur.y) * 0.045;
      layers.forEach((el) => {
        const d = parseFloat(el.dataset.depth);
        el.style.transform = `translate3d(${cur.x * d * 34}px, ${cur.y * d * 22}px, 0)`;
      });
      const dpr = window.devicePixelRatio;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) s.x = w; if (s.x > w) s.x = 0;
        if (s.y < 0) s.y = h; if (s.y > h) s.y = 0;
        ctx.beginPath();
        ctx.arc(s.x + cur.x * s.depth * 20 * dpr, s.y + cur.y * s.depth * 12 * dpr, s.r * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.3 + s.depth * 0.35})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    tick();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  const orb = "pointer-events-none absolute rounded-full";
  return (
    <div ref={rootRef} className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true" data-testid="parallax-sky">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div data-depth="0.35" className={orb} style={{ top: "-12%", left: "-8%", width: 520, height: 520, background: "radial-gradient(circle, rgba(0,240,255,0.11) 0%, transparent 65%)" }} />
      <div data-depth="0.7" className={orb} style={{ top: "30%", right: "-10%", width: 620, height: 620, background: "radial-gradient(circle, rgba(37,99,235,0.13) 0%, transparent 65%)" }} />
      <div data-depth="1.1" className={orb} style={{ bottom: "-18%", left: "22%", width: 480, height: 480, background: "radial-gradient(circle, rgba(0,240,255,0.09) 0%, transparent 65%)" }} />
      <div data-depth="0.5" className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 60%, rgba(0,240,255,0.02) 100%)" }} />
    </div>
  );
};
