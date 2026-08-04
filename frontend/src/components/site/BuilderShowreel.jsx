import { useEffect, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";

const DEMO_CODE = `<!DOCTYPE html>
<html>
<head>
<style>
  body{margin:0;font-family:system-ui;background:#07090f;color:#eef2ff;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    min-height:100vh;text-align:center}
  h1{font-size:2.2rem;letter-spacing:-.03em;margin:0}
  .glow{color:#7dd3fc;text-shadow:0 0 24px rgba(125,211,252,.55)}
  p{color:#94a3b8;max-width:34ch;line-height:1.6}
  button{margin-top:14px;padding:12px 28px;border:0;border-radius:999px;
    background:#7dd3fc;color:#07090f;font-weight:700;font-size:15px;cursor:pointer}
  .score{margin-top:18px;font-family:monospace;font-size:13px;color:#64748b}
</style>
</head>
<body>
  <h1>NEON <span class="glow">RUNNER</span></h1>
  <p>Dodge the grid. Collect the light. Built by Luchii from one sentence.</p>
  <button onclick="s.textContent='SCORE '+(++n*100)">PLAY</button>
  <div class="score" id="s">SCORE 0</div>
  <script>let n=0;const s=document.getElementById('s')</script>
</body>
</html>`;

const TICK_MS = 24;
const CHARS_PER_TICK = 3;
const PAUSE_MS = 4500;

export const BuilderShowreel = () => {
  const [pos, setPos] = useState(0);
  const [cycle, setCycle] = useState(0);
  const preRef = useRef(null);
  const finished = pos >= DEMO_CODE.length;

  useEffect(() => {
    if (finished) {
      const t = setTimeout(() => { setPos(0); setCycle((c) => c + 1); }, PAUSE_MS);
      return () => clearTimeout(t);
    }
    const t = setInterval(() => setPos((p) => Math.min(p + CHARS_PER_TICK, DEMO_CODE.length)), TICK_MS);
    return () => clearInterval(t);
  }, [finished, cycle]);

  useEffect(() => {
    if (preRef.current) preRef.current.scrollTop = preRef.current.scrollHeight;
  }, [pos]);

  const typed = DEMO_CODE.slice(0, pos);

  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-lux-border bg-lux-surface/60" data-testid="builder-showreel">
      <div className="flex items-center justify-between border-b border-lux-border px-4 py-2.5">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-lux-text2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Watch Luchii build — live
        </p>
        {finished ? (
          <button onClick={() => { setPos(0); setCycle((c) => c + 1); }} data-testid="showreel-replay-btn"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-lux-accent">
            <RotateCcw size={11} /> Replay
          </button>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-wide text-lux-text2">{typed.length.toLocaleString()} chars</span>
        )}
      </div>
      <div className="grid md:grid-cols-2">
        <pre ref={preRef} data-testid="showreel-code"
          className="m-0 h-56 overflow-hidden whitespace-pre-wrap break-all border-b border-lux-border p-4 font-mono text-[10.5px] leading-relaxed text-lux-text2 md:border-b-0 md:border-r">
          {typed}<span className="inline-block h-3 w-1.5 animate-pulse bg-lux-accent align-middle" />
        </pre>
        <div className="relative h-56 bg-[#07090f]">
          <iframe title="Luchii showreel preview" srcDoc={typed} sandbox="allow-scripts"
            data-testid="showreel-preview" className="h-full w-full border-0" />
          {finished && (
            <div className="absolute bottom-2 right-3 flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-black/60 px-3 py-1 font-mono text-[9px] uppercase tracking-wide text-emerald-300">
              <Play size={9} /> Built in 9.8s — yours next
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
