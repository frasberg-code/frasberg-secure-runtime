import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Loader2, Paperclip, Mic, Square, Volume2, VolumeX, X, ImageIcon, ArrowUp, ArrowDown, Plus, Upload, Clapperboard, AudioLines, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { useLiveVoice } from "../../hooks/useLiveVoice";
import { VoicePicker } from "./VoicePicker";
import { MODELS } from "../../data/content";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const KEYWORDS = /\b(function|return|const|let|var|if|else|for|while|import|from|export|default|class|def|async|await|try|except|catch|finally|raise|throw|new|in|of|not|and|or|None|True|False|null|undefined|true|false|print|lambda|pass|with|as|yield|self|this|public|private|static|void|int|str|float|bool)\b/g;

function highlight(code) {
  const tokens = [];
  const re = /(\/\/[^\n]*|#[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)/g;
  let last = 0, m, i = 0;
  const pushPlain = (text) => {
    let pl = 0, km;
    KEYWORDS.lastIndex = 0;
    while ((km = KEYWORDS.exec(text))) {
      if (km.index > pl) tokens.push(<span key={`p${i++}`}>{text.slice(pl, km.index)}</span>);
      tokens.push(<span key={`k${i++}`} className="text-[#ff7b72]">{km[0]}</span>);
      pl = km.index + km[0].length;
    }
    if (pl < text.length) tokens.push(<span key={`p${i++}`}>{text.slice(pl)}</span>);
  };
  while ((m = re.exec(code))) {
    if (m.index > last) pushPlain(code.slice(last, m.index));
    if (m[1]) tokens.push(<span key={`c${i++}`} className="text-[#8b949e] italic">{m[1]}</span>);
    else if (m[2]) tokens.push(<span key={`s${i++}`} className="text-[#a5d6ff]">{m[2]}</span>);
    else tokens.push(<span key={`n${i++}`} className="text-[#d2a8ff]">{m[3]}</span>);
    last = m.index + m[0].length;
  }
  if (last < code.length) pushPlain(code.slice(last));
  return tokens;
}

function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-2 max-w-full overflow-hidden rounded-xl border border-lux-border bg-[#0d1117]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wide text-[#7ee787]">{lang || "code"}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(code).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          data-testid="code-copy-btn"
          className="font-mono text-[10px] uppercase text-white/50 transition-colors hover:text-white"
        >
          {copied ? "copied!" : "copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[13px] leading-relaxed text-[#e6edf3]">{highlight(code)}</pre>
    </div>
  );
}

function renderInline(text, keyBase) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((p, j) => (j % 2 === 1 ? <strong key={`${keyBase}-${j}`} className="font-700">{p}</strong> : p));
}

function renderRich(text) {
  const out = [];
  const re = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<span key={i++} className="whitespace-pre-wrap break-words">{renderInline(text.slice(last, m.index), i)}</span>);
    out.push(<CodeBlock key={i++} lang={m[1]} code={m[2].replace(/\n$/, "")} />);
    last = m.index + m[0].length;
  }
  out.push(<span key={i++} className="whitespace-pre-wrap break-words">{renderInline(text.slice(last), i)}</span>);
  return out;
}

function fileKind(file) {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "pdf";
  return "text";
}

function EngineBadge() {
  const [st, setSt] = useState(null);
  useEffect(() => {
    fetch(`${API}/system/status`).then((r) => r.json()).then(setSt).catch(() => {});
  }, []);
  if (!st) return null;
  const online = st.overall !== "outage" && st.overall !== "degraded";
  return (
    <span
      data-testid="engine-status-badge"
      title={online ? "Frasberg Mesh — secure & connected (frasberg-secure-v1)" : "Frasberg Mesh degraded — some systems recovering"}
      className="inline-flex items-center gap-1.5 rounded-full border border-lux-border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-lux-text2"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-400" : "bg-amber-400"} animate-pulse`} />
      <span className="hidden md:inline">{online ? "Mesh Online" : "Mesh Recovering"}</span>
    </span>
  );
}

export default function ChatDemo({ compact = false, initialModel = "luchii-70b", tall = false, loadHistory = false, sessionOverride = null, onNewMessage = null, agent = null, mobileFull = false, headerHidden = false }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: "assistant", content: "I am Luchii — Ask me anything." },
  ]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState(initialModel);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [showScroll, setShowScroll] = useState(false);
  const [tone, setTone] = useState("balanced");
  const [attachMenu, setAttachMenu] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [composerMode, setComposerMode] = useState(null);
  const [voiceId, setVoiceId] = useState(() => {
    try { return localStorage.getItem("luchii-voice-id") || "p273"; } catch { return "p273"; }
  });
  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const attachMenuRef = useRef(null);
  const settingsRef = useRef(null);
  const utterRef = useRef(() => {});

  const locked = user === false || user === null;
  const [voiceOn, setVoiceOn] = useState(() => {
    try { return localStorage.getItem("luchii-voice") !== "off"; } catch { return true; }
  });
  const toggleVoice = () => setVoiceOn((v) => {
    try { localStorage.setItem("luchii-voice", v ? "off" : "on"); } catch {}
    return !v;
  });
  const pickVoice = (id) => {
    setVoiceId(id);
    try { localStorage.setItem("luchii-voice-id", id); } catch {}
  };

  const live = useLiveVoice(useCallback((blob) => utterRef.current(blob), []));

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const onDoc = (e) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) setAttachMenu(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const onScrollArea = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScroll(el.scrollHeight - el.scrollTop - el.clientHeight > 160);
  }, []);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!loadHistory || !user) return;
    if (sessionOverride === "new") return;
    (async () => {
      try {
        const qs = sessionOverride ? `?session_id=${encodeURIComponent(sessionOverride)}` : "";
        const res = await fetch(`${API}/chat/history${qs}`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages?.length) {
          setMessages((m) => [m[0], ...data.messages.map((d) => ({ role: d.role, content: d.content }))]);
          setSession(data.session_id);
        }
      } catch {}
    })();
  }, [loadHistory, user, sessionOverride]);

  const onPickFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error("File too large (max 8 MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = String(reader.result).split(",")[1];
      setAttachment({ name: file.name, kind: fileKind(file), data: b64 });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  function guardCreator(action) {
    if (locked) {
      toast.error("Sign up free to use this");
      return false;
    }
    setAttachMenu(false);
    action();
    return true;
  }

  async function toggleMic() {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        setTranscribing(true);
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const fd = new FormData();
          fd.append("file", blob, "voice.webm");
          const res = await fetch(`${API}/voice/transcribe`, { method: "POST", body: fd, credentials: "include" });
          const data = await res.json();
          if (data.text) setInput((v) => (v ? v + " " : "") + data.text);
          else toast.error("Could not hear that — try again");
        } catch {
          toast.error("Transcription failed");
        } finally {
          setTranscribing(false);
        }
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  }

  async function speak(text, idx = -1) {
    if (speakingIdx !== null) return;
    setSpeakingIdx(idx);
    try {
      const res = await fetch(`${API}/voice/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: text.slice(0, 4000), tone: tone === "balanced" ? null : tone, voice: voiceId }),
      });
      const data = await res.json();
      if (data.audio_base64) {
        await new Promise((resolve) => {
          const audio = new Audio(`data:${data.mime || "audio/mp3"};base64,${data.audio_base64}`);
          audio.onended = () => { setSpeakingIdx(null); resolve(); };
          audio.onerror = () => { setSpeakingIdx(null); resolve(); };
          audio.play().catch(() => { setSpeakingIdx(null); resolve(); });
        });
      } else setSpeakingIdx(null);
    } catch {
      setSpeakingIdx(null);
      toast.error("Voice unavailable");
    }
  }

  utterRef.current = async (blob) => {
    try {
      const fd = new FormData();
      fd.append("file", blob, "voice.webm");
      const res = await fetch(`${API}/voice/transcribe`, { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      const text = (data.text || "").trim();
      if (!text) { live.resume(); return; }
      await send(text, { fromLive: true });
    } catch {
      live.resume();
    }
  };

  function toggleLive() {
    if (locked) { toast.error("Sign up free to use Live Voice mode"); return; }
    if (live.active) live.stop();
    else live.start();
  }

  async function generateImage(prompt) {
    setMessages((m) => [...m, { role: "user", content: prompt }, { role: "assistant", content: "", generating: true }]);
    try {
      const res = await fetch(`${API}/generate/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt, session_id: session }),
      });
      const data = await res.json();
      setMessages((m) => {
        const next = [...m];
        if (res.ok && data.image_base64) {
          next[next.length - 1] = { role: "assistant", content: "Here is your creation.", image: data.image_base64 };
        } else {
          next[next.length - 1] = {
            role: "assistant",
            content: typeof data.detail === "string" ? data.detail : "Image creation is momentarily unavailable. Please try again.",
          };
        }
        return next;
      });
      if (data.session_id) setSession(data.session_id);
    } catch {
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = { role: "assistant", content: "Image creation failed. Please try again." };
        return next;
      });
    } finally {
      setBusy(false);
      onNewMessage?.();
    }
  }

  async function send(text, opts = {}) {
    const msg = (text ?? input).trim();
    if ((!msg && !attachment) || busy) return;
    setInput("");
    setBusy(true);

    if (composerMode === "video") {
      setComposerMode(null);
      setMessages((m) => [...m, { role: "user", content: msg }, { role: "assistant", content: "", generating: true }]);
      try {
        const res = await fetch(`${API}/generate/video`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ prompt: msg || "A cinematic cosmic constellation", session_id: session }),
        });
        const data = await res.json();
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = {
            role: "assistant",
            content: data.video_url ? "Here is your creation." : (data.message || (typeof data.detail === "string" ? data.detail : "The Luchii Video Engine is busy — please try again.")),
            video: data.video_url || null,
          };
          return next;
        });
      } catch {
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = { role: "assistant", content: "The Luchii Video Engine could not be reached. Please try again." };
          return next;
        });
      } finally {
        setBusy(false);
      }
      return;
    }
    if (composerMode === "image") {
      setComposerMode(null);
      await generateImage(msg || "A cinematic cosmic constellation");
      return;
    }

    const att = attachment;
    setAttachment(null);
    const userLabel = att ? `${msg || "(attachment)"} 📎 ${att.name}` : msg;
    setMessages((m) => [...m, { role: "user", content: userLabel }, { role: "assistant", content: "" }]);

    let acc = "";
    const doRequest = async () => {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: msg || `Please review my attached file "${att?.name}" and give feedback and advice.`,
          session_id: session,
          model,
          agent,
          tone: tone === "balanced" ? null : tone,
          attachment_base64: att?.data || null,
          attachment_kind: att?.kind || null,
          attachment_name: att?.name || null,
        }),
      });
      if (!res.ok || !res.body) {
        let detail = "";
        try { detail = (await res.json()).detail || ""; } catch {}
        throw new Error(typeof detail === "string" && detail ? detail : "network");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          let data;
          try { data = JSON.parse(line.slice(5).trim()); } catch { continue; }
          if (data.delta) {
            acc += data.delta;
            setMessages((m) => {
              const next = [...m];
              next[next.length - 1] = { role: "assistant", content: next[next.length - 1].content + data.delta };
              return next;
            });
          }
          if (data.error && !acc) throw new Error(data.error);
          if (data.session_id) setSession(data.session_id);
        }
      }
    };
    try {
      try {
        await doRequest();
      } catch (e1) {
        if (acc) throw e1;
        await new Promise((r) => setTimeout(r, 1200));
        await doRequest();
      }
    } catch (err) {
      setMessages((m) => {
        const next = [...m];
        if (!next[next.length - 1].content) {
          next[next.length - 1] = {
            role: "assistant",
            content: err?.message && err.message !== "network" ? err.message : "Connection to the mesh failed. Please try again.",
          };
        }
        return next;
      });
    } finally {
      setBusy(false);
      onNewMessage?.();
    }

    if (user && acc.trim()) {
      if (opts.fromLive) {
        await speak(acc);
        live.resume();
      } else if (voiceOn) {
        speak(acc);
      }
    }
  }

  const modelSelect = (extraTestId = "") => (
    <select
      value={model}
      onChange={(e) => setModel(e.target.value)}
      data-testid={`chat-model-select${extraTestId}`}
      className="w-full rounded-full border border-lux-border bg-lux-surface px-3 py-1 font-mono text-[11px] text-lux-text outline-none focus:border-lux-accent sm:w-auto"
    >
      {MODELS.map((m) => (
        <option key={m.id} value={m.id}>{m.name}</option>
      ))}
    </select>
  );

  const toneSelect = (extraTestId = "") => (
    <select
      value={tone}
      onChange={(e) => setTone(e.target.value)}
      data-testid={`chat-tone-select${extraTestId}`}
      aria-label="Luchii tone"
      className="w-full rounded-full border border-lux-border bg-lux-surface px-2 py-1 font-mono text-[10px] text-lux-text2 outline-none focus:border-lux-accent sm:w-auto"
      title="Emotion & tone — how Luchii speaks"
    >
      <option value="balanced">Balanced</option>
      <option value="warm">Warm</option>
      <option value="business">Business</option>
      <option value="firm">Firm</option>
    </select>
  );

  return (
    <div
      className={`glass relative flex flex-col overflow-hidden shadow-2xl ${mobileFull ? "max-sm:!rounded-none max-sm:!border-0 max-sm:!shadow-none sm:rounded-3xl" : "rounded-3xl"} ${tall ? `${mobileFull ? (headerHidden ? "h-[100dvh]" : "h-[calc(100dvh-74px)]") : "h-[calc(100dvh-150px)] min-h-[480px]"} sm:h-[calc(100vh-180px)] sm:min-h-[520px]` : "h-full"}`}
      data-testid="chat-demo"
    >
      <div className={`flex items-center justify-between gap-2 border-b border-lux-border px-3 py-3 sm:px-4 ${mobileFull ? "max-sm:border-0 max-sm:py-2" : ""}`}>
        <div className="flex min-w-0 items-center gap-2">
          {(!mobileFull || agent) && (
            <>
              <img src="/luchii-logo.webp" alt="Luchii" className="h-6 w-6 shrink-0 rounded-full ring-1 ring-lux-accent/40" />
              <span className="truncate font-display text-sm font-700 tracking-tight text-lux-text">
                {agent ? `Luchii ${agent.charAt(0).toUpperCase()}${agent.slice(1)}` : "Luchii"}
              </span>
            </>
          )}
          <EngineBadge />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="hidden items-center gap-1.5 sm:flex">
            {user && toneSelect()}
            {user && (
              <button
                type="button"
                onClick={toggleVoice}
                aria-label={voiceOn ? "Turn voice off" : "Turn voice on"}
                data-testid="chat-voice-toggle"
                className={`grid h-7 w-7 place-items-center rounded-full border transition-colors ${
                  voiceOn ? "border-lux-accent text-lux-accent" : "border-lux-border text-lux-text2 hover:border-lux-accent"
                }`}
                title={voiceOn ? "Luchii speaks replies aloud — click to mute" : "Voice off — click so Luchii speaks"}
              >
                {voiceOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
              </button>
            )}
            {user && <VoicePicker value={voiceId} onChange={pickVoice} />}
            {modelSelect()}
          </div>
          <div className="relative sm:hidden" ref={settingsRef}>
            <button
              type="button"
              onClick={() => setSettingsOpen((o) => !o)}
              aria-label="Chat settings"
              data-testid="chat-settings-btn"
              className={`grid h-7 w-7 place-items-center rounded-full border transition-colors ${
                settingsOpen ? "border-lux-accent text-lux-accent" : "border-lux-border text-lux-text2"
              }`}
            >
              <SlidersHorizontal size={13} />
            </button>
            {settingsOpen && (
              <div className="absolute right-0 top-9 z-50 w-72 space-y-3 rounded-2xl border border-lux-border bg-lux-surface p-3 shadow-2xl" data-testid="chat-settings-menu">
                <div>
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-lux-text2">Model</p>
                  {modelSelect("-mobile")}
                </div>
                {user && (
                  <div>
                    <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-lux-text2">Tone</p>
                    {toneSelect("-mobile")}
                  </div>
                )}
                {user && (
                  <button
                    type="button"
                    onClick={toggleVoice}
                    data-testid="chat-voice-toggle-mobile"
                    className="flex w-full items-center justify-between rounded-xl border border-lux-border px-3 py-2 text-sm text-lux-text"
                  >
                    <span>Speak replies aloud</span>
                    {voiceOn ? <Volume2 size={14} className="text-lux-accent" /> : <VolumeX size={14} className="text-lux-text2" />}
                  </button>
                )}
                {user && (
                  <div>
                    <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-lux-text2">Luchii's voice</p>
                    <VoicePicker value={voiceId} onChange={pickVoice} inline />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {live.active && (
        <div className="flex items-center gap-2 border-b border-lux-border bg-lux-surface/70 px-4 py-2" data-testid="live-voice-banner">
          <span className={`h-2 w-2 shrink-0 rounded-full animate-pulse ${live.phase === "listening" ? "bg-emerald-400" : "bg-lux-accent"}`} />
          <span className="text-xs text-lux-text2">
            {live.phase === "listening" ? "Listening — just speak, Luchii answers aloud" : speakingIdx !== null ? "Luchii is speaking…" : "Thinking…"}
          </span>
          <button type="button" onClick={live.stop} data-testid="live-voice-stop" className="ml-auto text-xs text-lux-text2 underline hover:text-lux-text">
            End
          </button>
        </div>
      )}

      {locked && (
        <div className="border-b border-lux-border bg-lux-surface/60 px-4 py-2 text-center" data-testid="chat-guest-banner">
          <p className="text-[11px] text-lux-text2">
            Guest mode — conversations are deleted after you leave.{" "}
            <Link to="/auth" className="text-lux-accent underline" data-testid="chat-guest-signup-link">Sign up free</Link>
            {" "}to save chats and unlock image creation, voice & attachments.
          </p>
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={onScrollArea}
        className={`flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5 ${tall ? "" : compact ? "max-h-[320px]" : "max-h-[380px]"}`}
        data-testid="chat-messages"
      >
        {messages.map((m, i) => (
          <div key={i} className="group w-full min-w-0">
            <p className={`font-mono text-[10px] uppercase tracking-[0.25em] ${m.role === "user" ? "text-lux-accent" : "text-lux-text2"}`}>
              {m.role === "user" ? (user?.name || "You") : "Luchii"}
            </p>
            <div className="mt-1.5 w-full min-w-0">
              {m.generating ? (
                <span className="flex items-center gap-2 text-sm text-lux-text2">
                  <ImageIcon size={14} className="animate-pulse" /> Creating…
                </span>
              ) : (
                <>
                  {m.video && (
                    <video src={m.video} controls className="mb-2 max-h-72 max-w-full rounded-xl" data-testid="chat-generated-video" />
                  )}
                  {m.image && (
                    <img
                      src={`data:image/png;base64,${m.image}`}
                      alt="Luchii creation"
                      className="mb-2 max-h-72 max-w-full rounded-xl"
                      data-testid="chat-generated-image"
                    />
                  )}
                  <div className="w-full text-base leading-relaxed text-lux-text sm:text-[15px]">
                    {m.content ? renderRich(m.content) : <Loader2 size={15} className="animate-spin text-lux-text2" />}
                    {m.role === "assistant" && m.content && (
                      <button
                        onClick={() => speak(m.content, i)}
                        aria-label="Read aloud"
                        data-testid={`chat-speak-${i}`}
                        className="ml-2 inline-flex align-middle text-lux-text2 opacity-0 transition-opacity hover:text-lux-accent group-hover:opacity-100"
                      >
                        {speakingIdx === i ? <Loader2 size={13} className="animate-spin" /> : <Volume2 size={13} />}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {(attachment || composerMode) && (
        <div className="flex flex-wrap items-center gap-2 px-4 pb-1">
          {composerMode && (
            <span className="inline-flex items-center gap-2 rounded-full border border-lux-accent bg-lux-surface px-3 py-1 font-mono text-[11px] text-lux-accent" data-testid="composer-mode-chip">
              {composerMode === "image" ? <ImageIcon size={11} /> : <Clapperboard size={11} />}
              {composerMode === "image" ? "Image Creator" : "Video Creator"}
              <button onClick={() => setComposerMode(null)} aria-label="Exit creator mode" data-testid="composer-mode-clear"><X size={11} /></button>
            </span>
          )}
          {attachment && (
            <span className="inline-flex items-center gap-2 rounded-full border border-lux-accent/40 bg-lux-surface px-3 py-1 font-mono text-[11px] text-lux-text" data-testid="chat-attachment-chip">
              <Paperclip size={11} /> {attachment.name}
              <button onClick={() => setAttachment(null)} aria-label="Remove attachment" data-testid="chat-attachment-remove"><X size={11} /></button>
            </span>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="relative border-t border-lux-border p-3 sm:p-4"
      >
        {showScroll && (
          <button
            type="button"
            onClick={scrollToBottom}
            aria-label="Scroll to latest"
            data-testid="chat-scroll-bottom-btn"
            className="glass absolute -top-14 right-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-lux-border text-lux-text shadow-lg transition-transform hover:-translate-y-0.5"
          >
            <ArrowDown size={17} />
          </button>
        )}
        <div className="rounded-2xl border border-lux-border bg-lux-surface px-3 pb-2 pt-1 transition-colors focus-within:border-lux-accent">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={composerMode === "image" ? "Describe the image to create…" : composerMode === "video" ? "Describe the video to create…" : "Message Luchii…"}
            data-testid="chat-input"
            className="w-full bg-transparent px-1.5 py-2.5 text-base text-lux-text outline-none placeholder:text-lux-text2 sm:text-sm"
          />
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,.pdf,.txt,.md" className="hidden" onChange={onPickFile} data-testid="chat-file-input" />
            <div className="relative" ref={attachMenuRef}>
              <button
                type="button"
                onClick={() => setAttachMenu((o) => !o)}
                disabled={busy}
                aria-label="Add — upload a file, create image or video"
                data-testid="chat-attach-btn"
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-all duration-200 disabled:opacity-40 ${
                  attachMenu ? "rotate-45 border-lux-accent text-lux-accent" : "border-lux-border text-lux-text2 hover:border-lux-accent hover:text-lux-accent"
                }`}
              >
                <Plus size={18} />
              </button>
              {attachMenu && (
                <div className="absolute bottom-12 left-0 z-50 w-60 rounded-2xl border border-lux-border bg-lux-surface p-2 shadow-2xl" data-testid="chat-attach-menu">
                  <button
                    type="button"
                    onClick={() => guardCreator(() => fileRef.current?.click())}
                    data-testid="attach-upload-btn"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-lux-text transition-colors hover:bg-lux-surface2"
                  >
                    <Upload size={15} className="text-lux-text2" /> Upload a file
                  </button>
                  <button
                    type="button"
                    onClick={() => guardCreator(() => { setComposerMode("image"); toast.info("Image Creator on — describe your image"); })}
                    data-testid="attach-image-creator-btn"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-lux-text transition-colors hover:bg-lux-surface2"
                  >
                    <ImageIcon size={15} className="text-lux-text2" /> Image Creator
                  </button>
                  <button
                    type="button"
                    onClick={() => guardCreator(() => { setComposerMode("video"); toast.info("Video Creator on — describe your video"); })}
                    data-testid="attach-video-creator-btn"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-lux-text transition-colors hover:bg-lux-surface2"
                  >
                    <Clapperboard size={15} className="text-lux-text2" /> Video Creator
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={toggleMic}
              disabled={locked || busy || transcribing}
              aria-label={recording ? "Stop recording" : "Record voice"}
              data-testid="chat-mic-btn"
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-colors disabled:opacity-40 ${
                recording ? "border-red-500 text-red-500" : "border-lux-border text-lux-text2 hover:border-lux-accent hover:text-lux-accent"
              }`}
            >
              {transcribing ? <Loader2 size={17} className="animate-spin" /> : recording ? <Square size={15} /> : <Mic size={17} />}
            </button>
            <button
              type="button"
              onClick={toggleLive}
              aria-label={live.active ? "End live voice conversation" : "Talk to Luchii hands-free"}
              title="Talk to Luchii — hands-free voice conversation"
              data-testid="chat-live-voice-btn"
              className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-600 transition-colors ${
                live.active
                  ? "border-red-500 text-red-500 animate-pulse"
                  : "border-lux-accent/60 text-lux-accent hover:bg-lux-accent/10"
              }`}
            >
              <AudioLines size={15} /> {live.active ? "End" : "Talk"}
            </button>
            <span className="flex-1" />
            <button
              type="submit"
              disabled={busy}
              aria-label="Send message"
              data-testid="chat-send"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-lux-text text-lux-bg transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-40"
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={19} />}
            </button>
          </div>
        </div>
        <p className="px-1 pt-2 text-center text-[10px] leading-relaxed text-lux-text2" data-testid="chat-disclaimer">
          Luchii is AI. By using it, you agree to our <Link to="/laws" className="underline hover:text-lux-text">Terms &amp; Privacy Policy</Link>. Chats may be reviewed and used to improve our AI models. <Link to="/about" className="underline hover:text-lux-text">Learn more</Link>
        </p>
      </form>
    </div>
  );
}
