import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft, AudioLines, Image as ImageIcon, Video as VideoIcon, Volume2, Music, Mic,
  AudioWaveform, Maximize2, MoreHorizontal, FileAudio, Languages, Radio, Clapperboard,
  BookOpen, Loader2, Sparkles, Upload,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ParallaxSky } from "../components/site/ParallaxSky";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const C = { base: "#05060a", panel: "#0b0c10", border: "#1f2933", primary: "#38bdf8", accent: "#a855f7", text: "#e5e7eb", muted: "#9ca3af" };

const TOOLS = [
  { id: "speech", label: "Speech", icon: AudioLines, kind: "tts", ph: "Start typing or paste text..." },
  { id: "image", label: "Image", icon: ImageIcon, kind: "image", ph: "Describe the image to generate..." },
  { id: "video", label: "Video", icon: VideoIcon, kind: "video", ph: "Describe the video scene..." },
  { id: "sound_effects", label: "Sound Effects", icon: Volume2, kind: "studio", ph: "Describe the sound effect (e.g. thunder rolling over a canyon)..." },
  { id: "music", label: "Music", icon: Music, kind: "studio", ph: "Describe the track (e.g. epic orchestral score, 30s)..." },
  { id: "voice_changer", label: "Voice Changer", icon: Mic, kind: "studio", ph: "Describe the target voice transformation..." },
  { id: "voice_isolator", label: "Voice Isolator", icon: AudioWaveform, kind: "studio", ph: "Describe the audio to isolate vocals from..." },
  { id: "upscale", label: "Upscale", icon: Maximize2, kind: "studio", ph: "Describe the media to upscale..." },
];
const MORE_TOOLS = [
  { id: "stt", label: "Speech to Text", icon: FileAudio, kind: "stt", ph: "Upload an audio file to transcribe" },
  { id: "dubbing", label: "Dubbing", icon: Languages, kind: "studio", ph: "Describe the dubbing job (source + target language)..." },
  { id: "audio_native", label: "Audio Native", icon: Radio, kind: "studio", ph: "Describe the multi-track mix or effects chain..." },
  { id: "productions", label: "Productions", icon: Clapperboard, kind: "studio", ph: "Describe the production pipeline job..." },
  { id: "audiobooks", label: "Audiobooks", icon: BookOpen, kind: "studio", ph: "Paste chapter text to narrate..." },
];
const ALL = [...TOOLS, ...MORE_TOOLS];

export default function CreativeStudio() {
  const { user } = useAuth();
  const [active, setActive] = useState("speech");
  const [moreOpen, setMoreOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [jobs, setJobs] = useState([]);
  const moreRef = useRef(null);
  const fileRef = useRef(null);

  const tool = ALL.find((t) => t.id === active);
  const inMore = MORE_TOOLS.some((t) => t.id === active);

  useEffect(() => {
    if (!moreOpen) return;
    const onDoc = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [moreOpen]);

  const loadJobs = async () => {
    try {
      const r = await fetch(`${API}/studio/jobs`, { credentials: "include" });
      if (r.ok) setJobs(await r.json());
    } catch {}
  };
  useEffect(() => { if (user) loadJobs(); }, [user]);

  const generate = async () => {
    if (tool.kind !== "stt" && !prompt.trim()) { toast.error("Type something first"); return; }
    setBusy(true); setResult(null);
    try {
      if (tool.kind === "tts") {
        const r = await fetch(`${API}/voice/speak`, {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
          body: JSON.stringify({ text: prompt }),
        });
        if (r.status === 401) { toast.error("Please sign in to use the studio"); return; }
        if (!r.ok) { toast.error("Voice generation failed"); return; }
        const d = await r.json();
        setResult({ type: "audio", src: `data:${d.mime || "audio/mp3"};base64,${d.audio_base64}`, engine: d.engine });
      } else if (tool.kind === "image") {
        const r = await fetch(`${API}/generate/image`, {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
          body: JSON.stringify({ prompt }),
        });
        if (r.status === 401) { toast.error("Please sign in to use the studio"); return; }
        if (!r.ok) { const e = await r.json().catch(() => ({})); toast.error(e.detail || "Image generation failed"); return; }
        const d = await r.json();
        setResult({ type: "image", src: `data:image/png;base64,${d.image_base64}` });
      } else if (tool.kind === "video") {
        const r = await fetch(`${API}/generate/video`, {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
          body: JSON.stringify({ prompt }),
        });
        if (r.status === 401) { toast.error("Please sign in to use the studio"); return; }
        const d = await r.json();
        setResult({ type: "message", text: d.message || "Video job queued on the Video Cluster." });
      } else {
        const r = await fetch(`${API}/studio/generate`, {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
          body: JSON.stringify({ tool: active, prompt }),
        });
        if (r.status === 401) { toast.error("Please sign in to use the studio"); return; }
        if (!r.ok) { toast.error("Generation failed"); return; }
        const d = await r.json();
        setResult({ type: "job", job: d });
        loadJobs();
      }
    } catch { toast.error("Generation failed"); }
    finally { setBusy(false); }
  };

  const transcribe = async (file) => {
    if (!file) return;
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(`${API}/voice/transcribe`, { method: "POST", credentials: "include", body: fd });
      if (r.status === 401) { toast.error("Please sign in to use the studio"); return; }
      if (!r.ok) { toast.error("Transcription failed"); return; }
      const d = await r.json();
      setResult({ type: "text", text: d.text || d.transcript || JSON.stringify(d) });
    } catch { toast.error("Transcription failed"); }
    finally { setBusy(false); }
  };

  const TabBtn = ({ t }) => (
    <button onClick={() => { setActive(t.id); setMoreOpen(false); setResult(null); }}
      data-testid={`studio-tab-${t.id}`}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors"
      style={active === t.id
        ? { borderColor: C.primary, background: "rgba(56,189,248,0.12)", color: C.primary }
        : { borderColor: C.border, color: C.muted }}>
      <t.icon size={14} /> {t.label}
    </button>
  );

  return (
    <main className="relative min-h-screen" style={{ background: C.base, color: C.text }} data-testid="creative-studio-page">
      <ParallaxSky />
      <header className="relative z-10 border-b backdrop-blur" style={{ borderColor: C.border, background: "rgba(5,6,10,0.7)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5" data-testid="studio-home-link">
            <ArrowLeft size={16} style={{ color: C.muted }} />
            <img src="/frasberg-mark-circle.png" alt="Frasberg" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">Creative Studio</span>
          </Link>
          <Link to="/dashboard" className="rounded-full border px-3.5 py-1.5 font-mono text-[12px]"
            style={{ borderColor: C.border, color: C.muted }} data-testid="studio-dashboard-link">API Keys</Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-8">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2" data-testid="studio-toolbar">
          {TOOLS.map((t) => <TabBtn key={t.id} t={t} />)}
          <div className="relative" ref={moreRef}>
            <button onClick={() => setMoreOpen((o) => !o)} data-testid="studio-more-tools-btn"
              className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors"
              style={inMore ? { borderColor: C.accent, background: "rgba(168,85,247,0.12)", color: C.accent } : { borderColor: C.border, color: C.muted }}>
              <MoreHorizontal size={14} /> More tools
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-10 z-40 w-56 rounded-xl border p-2 shadow-2xl"
                style={{ background: C.panel, borderColor: C.border }} data-testid="studio-more-menu">
                {MORE_TOOLS.map((t) => (
                  <button key={t.id} onClick={() => { setActive(t.id); setMoreOpen(false); setResult(null); }}
                    data-testid={`studio-tab-${t.id}`}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors hover:bg-white/5"
                    style={{ color: active === t.id ? C.accent : C.text }}>
                    <t.icon size={15} style={{ color: C.muted }} /> {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Workbench */}
        <div className="mt-6 rounded-xl border px-5 py-4" style={{ background: C.panel, borderColor: C.border }} data-testid="studio-workbench">
          {tool.kind === "stt" ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <FileAudio size={28} style={{ color: C.muted }} />
              <p className="text-sm" style={{ color: C.muted }}>{tool.ph}</p>
              <input ref={fileRef} type="file" accept="audio/*" className="hidden" data-testid="stt-file-input"
                onChange={(e) => transcribe(e.target.files?.[0])} />
              <button onClick={() => fileRef.current?.click()} disabled={busy} data-testid="stt-upload-btn"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-700 text-black disabled:opacity-50"
                style={{ background: C.primary }}>
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Upload audio
              </button>
            </div>
          ) : (
            <>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={tool.ph}
                rows={5} data-testid="studio-prompt-input"
                className="w-full resize-none bg-transparent text-[15px] outline-none placeholder:text-[#4b5563]"
                style={{ color: C.text }} />
              <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: C.border }}>
                <span className="font-mono text-[11.5px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>
                  {tool.label} · Frasberg Gateway · api.frasberg.com
                </span>
                <button onClick={generate} disabled={busy} data-testid="studio-generate-btn"
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-700 text-black transition-opacity hover:opacity-85 disabled:opacity-50"
                  style={{ background: C.primary }}>
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Generate
                </button>
              </div>
            </>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="mt-4 rounded-xl border px-5 py-4" style={{ background: C.panel, borderColor: "rgba(56,189,248,0.35)" }} data-testid="studio-result">
            {result.type === "audio" && (
              <div>
                <p className="mb-2 font-mono text-[11.5px] uppercase tracking-[0.18em]" style={{ color: C.primary }}>Generated audio · {result.engine}</p>
                <audio controls autoPlay src={result.src} className="w-full" data-testid="studio-audio-player" />
              </div>
            )}
            {result.type === "image" && <img src={result.src} alt="Generated" className="max-h-[480px] rounded-lg" data-testid="studio-image-result" />}
            {result.type === "text" && <p className="text-[14.5px] leading-relaxed" data-testid="studio-text-result">{result.text}</p>}
            {result.type === "message" && <p className="text-[14px]" style={{ color: C.muted }} data-testid="studio-message-result">{result.text}</p>}
            {result.type === "job" && (
              <div className="grid gap-1 font-mono text-[12.5px]" data-testid="studio-job-result">
                <span style={{ color: "#34d399" }}>COMPLETED · {result.job.cluster}</span>
                <span style={{ color: C.text }}>{result.job.output_url}</span>
                <span style={{ color: C.muted }}>{result.job.duration_sec}s · {result.job.format.toUpperCase()} · {result.job.latency_ms}ms latency</span>
              </div>
            )}
          </div>
        )}

        {/* Job history */}
        {jobs.length > 0 && (
          <div className="mt-8" data-testid="studio-job-history">
            <p className="mb-3 font-mono text-[11.5px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>Recent studio jobs</p>
            <div className="overflow-hidden rounded-xl border" style={{ borderColor: C.border }}>
              {jobs.slice(0, 8).map((j) => (
                <div key={j.id} className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 last:border-0"
                  style={{ borderColor: C.border }} data-testid={`studio-job-${j.id}`}>
                  <span className="text-[13px]" style={{ color: C.text }}>{ALL.find((t) => t.id === j.tool)?.label || j.tool}</span>
                  <span className="max-w-[40%] truncate font-mono text-[11.5px]" style={{ color: C.muted }}>{j.prompt}</span>
                  <span className="font-mono text-[11.5px]" style={{ color: "#34d399" }}>{j.status} · {j.cluster}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!user && (
          <div className="mt-8 rounded-xl border p-5 text-center" style={{ borderColor: C.border, background: C.panel }} data-testid="studio-signin-prompt">
            <p className="text-sm" style={{ color: C.muted }}>
              <Link to="/auth?mode=login" className="underline" style={{ color: C.primary }}>Sign in</Link> to generate speech, images, music and more with your Frasberg account.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
