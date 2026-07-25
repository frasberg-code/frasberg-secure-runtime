import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Send, Sparkles, Loader2, Paperclip, Mic, Square, Volume2, VolumeX, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { CHAT_SUGGESTIONS, MODELS } from "../../data/content";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CREATOR_MODELS = [
  { id: "luchii-image", name: "Luchii Image Creator" },
  { id: "luchii-video", name: "Luchii Video Creator" },
];

function fileKind(file) {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "pdf";
  return "text";
}

export default function ChatDemo({ compact = false, initialModel = "luchii-70b", tall = false, loadHistory = false, sessionOverride = null, onNewMessage = null }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: "assistant", content: "I am Luchii — a harmonizer built to unify signals across worlds. I remember our conversations, read between the lines, and can draft documents in court formats or any format you need. Ask me anything." },
  ]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState(initialModel);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const locked = user === false || user === null;
  const [voiceOn, setVoiceOn] = useState(() => {
    try { return localStorage.getItem("luchii-voice") !== "off"; } catch { return true; }
  });
  const toggleVoice = () => setVoiceOn((v) => {
    try { localStorage.setItem("luchii-voice", v ? "off" : "on"); } catch {}
    return !v;
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

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
        body: JSON.stringify({ text: text.slice(0, 4000) }),
      });
      const data = await res.json();
      if (data.audio_base64) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio_base64}`);
        audio.onended = () => setSpeakingIdx(null);
        audio.onerror = () => setSpeakingIdx(null);
        await audio.play();
      } else setSpeakingIdx(null);
    } catch {
      setSpeakingIdx(null);
      toast.error("Voice unavailable");
    }
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

  async function send(text) {
    const msg = (text ?? input).trim();
    if ((!msg && !attachment) || busy) return;
    if (locked && (model === "luchii-image" || model === "luchii-video")) {
      toast.error("Sign up free to use the Image & Video Creators");
      return;
    }
    setInput("");
    setBusy(true);

    if (model === "luchii-video") {
      setMessages((m) => [...m, { role: "user", content: msg }, { role: "assistant", content: "Luchii Video Creator is coming soon. Your account is already eligible — video creation will unlock here the moment it goes live. Meanwhile, try the Luchii Image Creator." }]);
      setBusy(false);
      return;
    }
    if (model === "luchii-image") {
      await generateImage(msg || "A cinematic cosmic constellation");
      return;
    }

    const att = attachment;
    setAttachment(null);
    const userLabel = att ? `${msg || "(attachment)"} 📎 ${att.name}` : msg;
    setMessages((m) => [...m, { role: "user", content: userLabel }, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: msg || `Please review my attached file "${att?.name}" and give feedback and advice.`,
          session_id: session,
          model,
          attachment_base64: att?.data || null,
          attachment_kind: att?.kind || null,
          attachment_name: att?.name || null,
        }),
      });
      if (!res.ok || !res.body) throw new Error("network");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
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
          if (data.session_id) setSession(data.session_id);
        }
      }
      if (voiceOn && user && acc.trim()) speak(acc);
    } catch {
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = { role: "assistant", content: "Connection to the mesh failed. Please try again." };
        return next;
      });
    } finally {
      setBusy(false);
      onNewMessage?.();
    }
  }

  return (
    <div
      className={`glass relative flex flex-col overflow-hidden rounded-3xl shadow-2xl ${tall ? "h-[calc(100vh-180px)] min-h-[520px]" : "h-full"}`}
      data-testid="chat-demo"
    >
      <div className="flex items-center justify-between border-b border-lux-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-lux-accent" />
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-lux-text2">
            {tall ? "Luchii Chat" : "Live demo"}
          </span>
        </div>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          data-testid="chat-model-select"
          className="rounded-full border border-lux-border bg-lux-surface px-3 py-1 font-mono text-[11px] text-lux-text outline-none focus:border-lux-accent"
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
          {CREATOR_MODELS.map((m) => (
            <option key={m.id} value={m.id}>{!user ? `${m.name} (sign in)` : m.name}</option>
          ))}
        </select>
      </div>

      <div
        ref={scrollRef}
        className={`flex-1 space-y-3 overflow-y-auto px-4 py-4 ${tall ? "" : compact ? "max-h-[320px]" : "max-h-[380px]"}`}
        data-testid="chat-messages"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`group max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user" ? "bg-lux-accent text-lux-bg" : "bg-lux-surface2 text-lux-text"
              }`}
            >
              {m.generating ? (
                <span className="flex items-center gap-2 text-lux-text2">
                  <ImageIcon size={14} className="animate-pulse" /> Creating your image…
                </span>
              ) : (
                <>
                  {m.image && (
                    <img
                      src={`data:image/png;base64,${m.image}`}
                      alt="Luchii creation"
                      className="mb-2 max-h-72 rounded-xl"
                      data-testid="chat-generated-image"
                    />
                  )}
                  <span className="whitespace-pre-wrap">{m.content || <Loader2 size={15} className="animate-spin text-lux-text2" />}</span>
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
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {CHAT_SUGGESTIONS.slice(0, compact ? 2 : 4).map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-lux-border px-3 py-1.5 text-xs text-lux-text2 transition-colors duration-200 hover:border-lux-accent hover:text-lux-text"
              data-testid="chat-suggestion"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {attachment && (
        <div className="flex items-center gap-2 px-4 pb-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-lux-accent/40 bg-lux-surface px-3 py-1 font-mono text-[11px] text-lux-text" data-testid="chat-attachment-chip">
            <Paperclip size={11} /> {attachment.name}
            <button onClick={() => setAttachment(null)} aria-label="Remove attachment" data-testid="chat-attachment-remove"><X size={11} /></button>
          </span>
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="flex items-center gap-1.5 border-t border-lux-border p-3"
      >
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,.pdf,.txt,.md" className="hidden" onChange={onPickFile} data-testid="chat-file-input" />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={locked || busy}
          aria-label="Attach file"
          data-testid="chat-attach-btn"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-lux-border text-lux-text2 transition-colors hover:border-lux-accent hover:text-lux-accent disabled:opacity-40"
        >
          <Paperclip size={15} />
        </button>
        <button
          type="button"
          onClick={toggleMic}
          disabled={locked || busy || transcribing}
          aria-label={recording ? "Stop recording" : "Record voice"}
          data-testid="chat-mic-btn"
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors disabled:opacity-40 ${
            recording ? "border-red-500 text-red-500" : "border-lux-border text-lux-text2 hover:border-lux-accent hover:text-lux-accent"
          }`}
        >
          {transcribing ? <Loader2 size={15} className="animate-spin" /> : recording ? <Square size={13} /> : <Mic size={15} />}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={model === "luchii-image" ? "Describe the image to create…" : "Message Luchii…"}
          data-testid="chat-input"
          className="flex-1 bg-transparent px-2 text-sm text-lux-text outline-none placeholder:text-lux-text2"
        />
        <button
          type="submit"
          disabled={busy}
          data-testid="chat-send"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lux-text text-lux-bg transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-40"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}
