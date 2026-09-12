import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft, AudioLines, Image as ImageIcon, Video as VideoIcon, Volume2, Music, Mic,
  AudioWaveform, Maximize2, MoreHorizontal, FileAudio, Languages, Radio, Clapperboard,
  BookOpen, Loader2, Sparkles, Upload, Sun, Moon, RotateCw, Film, Download, Trash2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ParallaxSky } from "../components/site/ParallaxSky";
import { T, applyDashTheme, isLightSaved } from "../lib/dashTheme";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PRESETS = [
  { id: "cinematic", label: "Cinematic", suffix: "cinematic film look, anamorphic lens, dramatic lighting, 35mm, shallow depth of field" },
  { id: "anime", label: "Anime", suffix: "anime style, vibrant cel-shaded animation, expressive characters, studio-quality 2D" },
  { id: "noir", label: "Noir", suffix: "film noir style, black and white, high-contrast shadows, moody 1940s atmosphere" },
];

const TOOLS = [
  { id: "image", label: "Image", icon: ImageIcon, kind: "image", ph: "Describe the image to generate..." },
  { id: "video", label: "Video", icon: VideoIcon, kind: "video", ph: "Describe the video scene..." },
  { id: "sound_effects", label: "Sound Effects", icon: Volume2, kind: "studio", ph: "Describe the sound effect (e.g. thunder rolling over a canyon)..." },
  { id: "music", label: "Music", icon: Music, kind: "studio", ph: "Describe the track (e.g. epic orchestral score, up to 5 minutes)..." },
  { id: "voice_changer", label: "Voice Changer", icon: Mic, kind: "studio", ph: "Describe the target voice transformation..." },
  { id: "voice_isolator", label: "Voice Isolator", icon: AudioWaveform, kind: "studio", ph: "Describe the audio to isolate vocals from..." },
  { id: "upscale", label: "Upscale", icon: Maximize2, kind: "studio", ph: "Describe the media to upscale..." },
  { id: "speech", label: "Speech", icon: AudioLines, kind: "tts", ph: "Start typing or paste text..." },
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
  const [gallery, setGallery] = useState([]);
  const [preset, setPreset] = useState(null);
  const [videoDuration, setVideoDuration] = useState(30);
  const [musicDuration, setMusicDuration] = useState(180);
  const [tabOrder, setTabOrder] = useState(TOOLS);
  const [lightMode, setLightMode] = useState(isLightSaved());
  const moreRef = useRef(null);
  const fileRef = useRef(null);
  const pollRef = useRef(null);

  const toggleTheme = () => {
    const nl = !lightMode;
    try { localStorage.setItem("dash-theme", nl ? "light" : "dark"); } catch {}
    applyDashTheme(nl);
    setLightMode(nl);
  };
  const C = { base: T.bg, panel: T.surface, border: T.border, primary: T.accent, accent: "#a855f7", text: T.text, muted: T.muted };

  const rotateTabs = () => setTabOrder((o) => [...o.slice(1), o[0]]);

  const prefsKey = user ? `studio_prefs_${user.id}` : null;
  const prefsLoaded = useRef(false);
  useEffect(() => {
    if (!prefsKey || prefsLoaded.current) return;
    prefsLoaded.current = true;
    try {
      const p = JSON.parse(localStorage.getItem(prefsKey) || "{}");
      if (p.active && ALL.some((t) => t.id === p.active)) setActive(p.active);
      if (p.preset) setPreset(PRESETS.find((x) => x.id === p.preset) || null);
      if (p.videoDuration) setVideoDuration(p.videoDuration);
      if (p.musicDuration) setMusicDuration(p.musicDuration);
    } catch {}
  }, [prefsKey]);
  useEffect(() => {
    if (!prefsKey || !prefsLoaded.current) return;
    try {
      localStorage.setItem(prefsKey, JSON.stringify({ active, preset: preset?.id || null, videoDuration, musicDuration }));
    } catch {}
  }, [prefsKey, active, preset, videoDuration, musicDuration]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

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
  const loadGallery = async () => {
    try {
      const r = await fetch(`${API}/generate/video/gallery`, { credentials: "include" });
      if (r.ok) setGallery(await r.json());
    } catch {}
  };
  useEffect(() => { if (user) { loadJobs(); loadGallery(); } }, [user]);

  const deleteRender = async (taskId) => {
    try {
      const r = await fetch(`${API}/generate/video/task/${taskId}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) { toast.error("Could not delete render"); return; }
      toast.success("Render deleted");
      setGallery((g) => g.filter((x) => x.task_id !== taskId));
    } catch { toast.error("Could not delete render"); }
  };

  const downloadRender = async (g) => {
    try {
      const r = await fetch(g.video_url);
      if (!r.ok) throw new Error();
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `frasberg_${g.task_id}.mp4`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast.success("Download started");
    } catch { window.open(g.video_url, "_blank"); }
  };

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
        const styled = preset ? `${prompt.trim()} — ${preset.suffix}` : prompt;
        const r = await fetch(`${API}/generate/video`, {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
          body: JSON.stringify({ prompt: styled, duration: videoDuration, model: "frasberg-engine", ratio: "16:9", motion: "medium", guidance_scale: 7, seed: null, output_format: "mp4" }),
        });
        if (r.status === 401) { toast.error("Please sign in to use the studio"); return; }
        if (!r.ok) { toast.error("Video request failed"); return; }
        const d = await r.json();
        if (d.task_id) {
          setResult({ type: "videotask", task: d });
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = setInterval(async () => {
            try {
              const pr = await fetch(`${API}/generate/video/task/${d.task_id}`, { credentials: "include" });
              if (!pr.ok) { clearInterval(pollRef.current); return; }
              const pd = await pr.json();
              setResult({ type: "videotask", task: { ...d, ...pd } });
              if (pd.status === "completed" || pd.status === "failed") {
                clearInterval(pollRef.current);
                if (pd.status === "completed") loadGallery();
              }
            } catch { clearInterval(pollRef.current); }
          }, 3000);
        } else {
          setResult({ type: "message", text: d.message || "Video job queued on the Video Cluster." });
        }
      } else if (active === "music") {
        const r = await fetch(`${API}/generate/music`, {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
          body: JSON.stringify({ prompt, duration: musicDuration, model: "frasberg-music" }),
        });
        if (r.status === 401) { toast.error("Please sign in to use the studio"); return; }
        if (!r.ok) { toast.error("Music request failed"); return; }
        const d = await r.json();
        setResult({ type: "musictask", task: d });
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
          try {
            const pr = await fetch(`${API}/generate/music/task/${d.task_id}`, { credentials: "include" });
            if (!pr.ok) { clearInterval(pollRef.current); return; }
            const pd = await pr.json();
            setResult({ type: "musictask", task: { ...d, ...pd } });
            if (pd.status === "completed" || pd.status === "failed") clearInterval(pollRef.current);
          } catch { clearInterval(pollRef.current); }
        }, 3000);
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
      <header className="relative z-10 border-b backdrop-blur" style={{ borderColor: C.border, background: T.headerBg }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5" data-testid="studio-home-link">
            <ArrowLeft size={16} style={{ color: C.muted }} />
            <img src="/frasberg-mark-circle.png" alt="Frasberg" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">Creative Studio</span>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} data-testid="studio-theme-toggle" aria-label="Toggle theme"
              className="grid h-8 w-8 place-items-center rounded-full border transition-colors"
              style={{ borderColor: C.border, color: C.muted }}>
              {lightMode ? <Moon size={14} /> : <Sun size={14} />}
            </button>
            <Link to="/dashboard" className="rounded-full border px-3.5 py-1.5 font-mono text-[12px]"
              style={{ borderColor: C.border, color: C.muted }} data-testid="studio-dashboard-link">API Keys</Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-8">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2" data-testid="studio-toolbar">
          <button onClick={rotateTabs} data-testid="studio-rotate-tabs" aria-label="Rotate tabs" title="Rotate tool tabs"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors"
            style={{ borderColor: C.border, color: C.muted }}>
            <RotateCw size={14} />
          </button>
          {tabOrder.map((t) => <TabBtn key={t.id} t={t} />)}
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
              {tool.kind === "video" && (
                <div className="mb-3 flex flex-wrap items-center gap-2 border-b pb-3" style={{ borderColor: C.border }} data-testid="studio-presets">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>Style preset</span>
                  {PRESETS.map((p) => (
                    <button key={p.id} onClick={() => setPreset((cur) => cur?.id === p.id ? null : p)}
                      data-testid={`studio-preset-${p.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] transition-colors"
                      style={preset?.id === p.id
                        ? { borderColor: C.accent, background: "rgba(168,85,247,0.14)", color: C.accent }
                        : { borderColor: C.border, color: C.muted }}>
                      <Film size={12} /> {p.label}
                    </button>
                  ))}
                  {preset && <span className="font-mono text-[11px]" style={{ color: C.muted }} data-testid="studio-preset-hint">+ {preset.suffix.slice(0, 48)}…</span>}
                </div>
              )}
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={tool.ph}
                rows={5} data-testid="studio-prompt-input"
                className="w-full resize-none bg-transparent text-[15px] outline-none placeholder:text-[#4b5563]"
                style={{ color: C.text }} />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3" style={{ borderColor: C.border }}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-[11.5px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>
                    {tool.label} · Frasberg Gateway · api.frasberg.com
                  </span>
                  {tool.kind === "video" && (
                    <select value={videoDuration} onChange={(e) => setVideoDuration(Number(e.target.value))}
                      data-testid="video-duration-select"
                      className="rounded-md border px-2.5 py-1 font-mono text-[11.5px] outline-none"
                      style={{ borderColor: C.border, background: C.panel, color: C.text }}>
                      <option value="15">15 sec</option>
                      <option value="30">30 sec</option>
                      <option value="60">1 min</option>
                      <option value="300">5 min</option>
                      <option value="900">15 min</option>
                      <option value="1800">30 min</option>
                      <option value="3600">1 hour</option>
                      <option value="7200">2 hours (max)</option>
                    </select>
                  )}
                  {active === "music" && (
                    <select value={musicDuration} onChange={(e) => setMusicDuration(Number(e.target.value))}
                      data-testid="music-duration-select"
                      className="rounded-md border px-2.5 py-1 font-mono text-[11.5px] outline-none"
                      style={{ borderColor: C.border, background: C.panel, color: C.text }}>
                      <option value="180">3 min</option>
                      <option value="240">4 min</option>
                      <option value="300">5 min (max)</option>
                    </select>
                  )}
                </div>
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
            {result.type === "videotask" && (
              <div className="grid gap-1 font-mono text-[12.5px]" data-testid="studio-video-task">
                <span style={{ color: result.task.status === "completed" ? "#34d399" : C.primary }}>
                  {result.task.status.toUpperCase()} · Frasberg Engine v2 · {result.task.gpu_class || "gpu-medium"} · {result.task.region || "us-west"}
                </span>
                <span style={{ color: C.text }}>{result.task.task_id}</span>
                {result.task.status !== "completed" && <span style={{ color: C.muted }}>ETA ~{result.task.eta_seconds}s — polling task status...</span>}
                {result.task.video_url && !result.task.video_error && (
                  <video controls autoPlay muted src={result.task.video_url} className="mt-2 max-h-[420px] w-full rounded-lg"
                    data-testid="studio-video-player"
                    onError={() => setResult((r) => r?.type === "videotask" ? { ...r, task: { ...r.task, video_error: true } } : r)} />
                )}
                {result.task.video_error && (
                  <span style={{ color: "#f97373" }} data-testid="studio-video-error">
                    The rendered video could not be loaded — the asset may still be propagating. Try regenerating.
                  </span>
                )}
              </div>
            )}
            {result.type === "musictask" && (
              <div className="grid gap-1 font-mono text-[12.5px]" data-testid="studio-music-task">
                <span style={{ color: result.task.status === "completed" ? "#34d399" : C.primary }}>
                  {result.task.status.toUpperCase()} · Frasberg Music Engine · {result.task.gpu_class || "gpu-medium"} · {result.task.region || "us-west"}{result.task.mood ? ` · ${result.task.mood} key` : ""}
                </span>
                <span style={{ color: C.text }}>{result.task.task_id}</span>
                {result.task.status !== "completed" && <span style={{ color: C.muted }}>ETA ~{result.task.eta_seconds}s — rendering your track...</span>}
                {result.task.audio_url && (
                  <audio controls autoPlay src={`${process.env.REACT_APP_BACKEND_URL}${result.task.audio_url}`}
                    className="mt-2 w-full" data-testid="studio-music-player" />
                )}
              </div>
            )}
            {result.type === "job" && (
              <div className="grid gap-2 font-mono text-[12.5px]" data-testid="studio-job-result">
                <span style={{ color: "#34d399" }}>COMPLETED · {result.job.cluster}</span>
                {result.job.output_url?.startsWith("/api/") ? (
                  <audio controls autoPlay src={`${process.env.REACT_APP_BACKEND_URL}${result.job.output_url}`}
                    className="w-full" data-testid="studio-job-audio-player" />
                ) : (
                  <span style={{ color: C.text }}>{result.job.output_url}</span>
                )}
                <span style={{ color: C.muted }}>{result.job.duration_sec >= 60 ? `${Math.floor(result.job.duration_sec / 60)}m ${Math.round(result.job.duration_sec % 60)}s` : `${result.job.duration_sec}s`} · {result.job.format.toUpperCase()} · {result.job.latency_ms}ms latency</span>
              </div>
            )}
          </div>
        )}

        {/* Video gallery */}
        {gallery.length > 0 && (
          <div className="mt-8" data-testid="studio-gallery">
            <p className="mb-3 font-mono text-[11.5px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>
              My renders · {gallery.length} completed
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((g) => (
                <div key={g.task_id} className="overflow-hidden rounded-xl border" style={{ borderColor: C.border, background: C.panel }}
                  data-testid={`studio-gallery-item-${g.task_id}`}>
                  <video controls preload="metadata" src={g.video_url} className="aspect-video w-full bg-black object-cover" />
                  <div className="px-3.5 py-3">
                    <p className="line-clamp-2 text-[12.5px] leading-relaxed" style={{ color: C.text }}>{g.prompt}</p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <p className="font-mono text-[10.5px] uppercase tracking-wide" style={{ color: C.muted }}>
                        {g.model} · {g.ratio} · {g.duration}s · {(g.created_at || "").slice(0, 10)}
                      </p>
                      <div className="flex shrink-0 gap-1.5">
                        <button onClick={() => downloadRender(g)} data-testid={`gallery-download-${g.task_id}`} aria-label="Download video" title="Download video"
                          className="grid h-7 w-7 place-items-center rounded-md border transition-colors"
                          style={{ borderColor: C.border, color: C.muted }}>
                          <Download size={12} />
                        </button>
                        <button onClick={() => deleteRender(g.task_id)} data-testid={`gallery-delete-${g.task_id}`} aria-label="Delete render" title="Delete render"
                          className="grid h-7 w-7 place-items-center rounded-md border transition-colors hover:border-[#f97373] hover:text-[#f97373]"
                          style={{ borderColor: C.border, color: C.muted }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Job history */}
        {jobs.length > 0 && (
          <div className="mt-8" data-testid="studio-job-history">
            <p className="mb-3 font-mono text-[11.5px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>Recent studio jobs</p>
            <div className="overflow-hidden rounded-xl border" style={{ borderColor: C.border }}>
              {jobs.slice(0, 8).map((j) => (
                <div key={j.id} className="border-b px-4 py-2.5 last:border-0"
                  style={{ borderColor: C.border }} data-testid={`studio-job-${j.id}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px]" style={{ color: C.text }}>{ALL.find((t) => t.id === j.tool)?.label || j.tool}</span>
                    <span className="max-w-[40%] truncate font-mono text-[11.5px]" style={{ color: C.muted }}>{j.prompt}</span>
                    <span className="font-mono text-[11.5px]" style={{ color: "#34d399" }}>{j.status} · {j.cluster}</span>
                  </div>
                  {j.output_url?.startsWith("/api/") && (
                    <audio controls preload="none" src={`${process.env.REACT_APP_BACKEND_URL}${j.output_url}`}
                      className="mt-2 h-8 w-full" data-testid={`studio-job-audio-${j.id}`} />
                  )}
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
