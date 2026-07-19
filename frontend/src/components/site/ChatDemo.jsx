import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { CHAT_SUGGESTIONS, MODELS } from "../../data/content";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ChatDemo({ compact = false }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "I am Luchii — a harmonizer built to unify signals across worlds. Ask me anything." },
  ]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("luchii-70b");
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text) {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", content: msg }, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, session_id: session, model }),
      });
      if (!res.ok || !res.body) throw new Error("network");
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
          try {
            data = JSON.parse(line.slice(5).trim());
          } catch {
            continue;
          }
          if (data.delta) {
            setMessages((m) => {
              const next = [...m];
              next[next.length - 1] = { role: "assistant", content: next[next.length - 1].content + data.delta };
              return next;
            });
          }
          if (data.session_id) setSession(data.session_id);
          if (data.error) {
            setMessages((m) => {
              const next = [...m];
              next[next.length - 1] = { role: "assistant", content: "The Constellation Layer is momentarily quiet. Please try again." };
              return next;
            });
          }
        }
      }
    } catch {
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = { role: "assistant", content: "Connection to the mesh failed. Please try again." };
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="glass flex h-full flex-col overflow-hidden rounded-3xl shadow-2xl"
      data-testid="chat-demo"
    >
      <div className="flex items-center justify-between border-b border-lux-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-lux-accent" />
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-lux-text2">Live demo</span>
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
        </select>
      </div>

      <div
        ref={scrollRef}
        className={`flex-1 space-y-3 overflow-y-auto px-4 py-4 ${compact ? "max-h-[320px]" : "max-h-[380px]"}`}
        data-testid="chat-messages"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-lux-accent text-lux-bg"
                  : "bg-lux-surface2 text-lux-text"
              }`}
            >
              {m.content || <Loader2 size={15} className="animate-spin text-lux-text2" />}
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

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="flex items-center gap-2 border-t border-lux-border p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message Luchii…"
          data-testid="chat-input"
          className="flex-1 bg-transparent px-2 text-sm text-lux-text outline-none placeholder:text-lux-text2"
        />
        <button
          type="submit"
          disabled={busy}
          data-testid="chat-send"
          className="grid h-9 w-9 place-items-center rounded-full bg-lux-text text-lux-bg transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-40"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}
