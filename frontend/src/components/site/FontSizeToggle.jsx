import { useState, useEffect } from "react";
import { toast } from "sonner";

const STEPS = [100, 115, 130];
const getSaved = () => {
  try { const v = Number(localStorage.getItem("font-scale")); return STEPS.includes(v) ? v : 100; } catch { return 100; }
};

export const FontSizeToggle = () => {
  const [scale, setScale] = useState(getSaved);

  useEffect(() => { document.body.style.zoom = scale / 100; }, [scale]);

  const cycle = () => {
    const next = STEPS[(STEPS.indexOf(scale) + 1) % STEPS.length];
    setScale(next);
    try { localStorage.setItem("font-scale", String(next)); } catch {}
    toast.success(next === 100 ? "Text size: default" : `Text size: ${next}%`);
  };

  return (
    <button onClick={cycle} data-testid="font-size-toggle" aria-label="Adjust text size" title="Adjust text size"
      className="fixed bottom-6 left-5 z-50 flex h-11 items-end gap-0.5 rounded-full border border-white/20 bg-black/75 px-4 pb-2.5 font-display shadow-xl backdrop-blur-md transition-transform hover:scale-105">
      <span className="text-[12px] leading-none text-white/80">A</span>
      <span className="text-[17px] font-700 leading-none text-white">A</span>
      {scale !== 100 && <span className="ml-1.5 font-mono text-[12px] leading-none text-cyan-300">{scale}%</span>}
    </button>
  );
};
