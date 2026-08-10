import { useEffect, useState, useRef } from "react";
import { AudioWaveform, Play, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const VoicePicker = ({ value, onChange, inline = false }) => {
  const [voices, setVoices] = useState([]);
  const [hasCustom, setHasCustom] = useState(false);
  const [open, setOpen] = useState(false);
  const [previewing, setPreviewing] = useState(null);
  const boxRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/voice/voices`).then((r) => r.json()).then((d) => setVoices(d.voices || [])).catch(() => {});
    fetch(`${API}/voice/clone/status`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setHasCustom(!!d?.has_sample))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function preview(v) {
    if (previewing) return;
    setPreviewing(v.id);
    try {
      const res = await fetch(`${API}/voice/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: v.id === "custom" ? "This is your cloned sovereign voice, speaking just like you." : `Hi, I'm ${v.name}. This is how Luchii sounds with my voice.`, voice: v.id }),
      });
      const data = await res.json();
      if (data.audio_base64) {
        await new Promise((resolve) => {
          const audio = new Audio(`data:${data.mime || "audio/mp3"};base64,${data.audio_base64}`);
          audio.onended = resolve;
          audio.onerror = resolve;
          audio.play().catch(resolve);
        });
      } else toast.error("Preview unavailable");
    } catch {
      toast.error("Preview unavailable");
    } finally {
      setPreviewing(null);
    }
  }

  const allVoices = hasCustom
    ? [{ id: "custom", name: "My Voice", description: "Your cloned sovereign voice" }, ...voices]
    : voices;

  const list = (
    <div className="max-h-64 space-y-1 overflow-y-auto" data-testid="voice-picker-list">
      {allVoices.length === 0 && <p className="px-2 py-3 text-[13px] text-lux-text2">Loading voices…</p>}
      {allVoices.map((v) => (
        <div
          key={v.id}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${
            value === v.id ? "border-lux-accent bg-lux-surface2" : "border-transparent hover:bg-lux-surface2"
          }`}
          data-testid={`voice-option-${v.id}`}
        >
          <button
            type="button"
            onClick={() => { onChange(v.id); toast.success(`Luchii now speaks as ${v.name}`); setOpen(false); }}
            className="flex-1 text-left"
            data-testid={`voice-select-${v.id}`}
          >
            <span className="flex items-center gap-1.5 text-sm font-600 text-lux-text">
              {v.name} {value === v.id && <Check size={12} className="text-lux-accent" />}
            </span>
            <span className="block text-[13px] text-lux-text2">{v.description}</span>
          </button>
          <button
            type="button"
            onClick={() => preview(v)}
            aria-label={`Preview ${v.name}`}
            data-testid={`voice-preview-${v.id}`}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-lux-border text-lux-text2 transition-colors hover:border-lux-accent hover:text-lux-accent"
          >
            {previewing === v.id ? <Loader2 size={13} className="animate-spin" /> : <Play size={12} />}
          </button>
        </div>
      ))}
    </div>
  );

  if (inline) return list;

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Choose Luchii's voice"
        title="Voice gallery — pick Luchii's sovereign voice"
        data-testid="voice-picker-btn"
        className={`grid h-7 w-7 place-items-center rounded-full border transition-colors ${
          open ? "border-lux-accent text-lux-accent" : "border-lux-border text-lux-text2 hover:border-lux-accent"
        }`}
      >
        <AudioWaveform size={13} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-50 w-72 rounded-2xl border border-lux-border bg-lux-surface p-2 shadow-2xl" data-testid="voice-picker-panel">
          <p className="px-2 pb-2 pt-1 font-mono text-[13.5px] uppercase tracking-[0.2em] text-lux-text2">Sovereign voices</p>
          {list}
        </div>
      )}
    </div>
  );
};
