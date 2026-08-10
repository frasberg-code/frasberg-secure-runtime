import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { MessageCircle, X, Send } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function LiveChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role: "assistant", content: "Hey there! I'm Zion from Frasberg. What can I help you with today?" }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const sidRef = useRef(crypto.randomUUID());
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    const history = msgs.slice(-10);
    setMsgs((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    try {
      const res = await fetch(`${API}/support/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sidRef.current, history }),
      });
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n\n");
        buf = lines.pop();
        for (const l of lines) {
          if (!l.startsWith("data: ")) continue;
          try {
            const d = JSON.parse(l.slice(6));
            if (d.delta) setMsgs((m) => { const n = [...m]; n[n.length - 1] = { role: "assistant", content: n[n.length - 1].content + d.delta }; return n; });
          } catch {}
        }
      }
    } catch {
      setMsgs((m) => { const n = [...m]; if (!n[n.length - 1].content) n[n.length - 1] = { role: "assistant", content: "Hmm, connection hiccup — mind trying that again?" }; return n; });
    }
    setBusy(false);
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[460px] w-[340px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl" data-testid="live-chat-panel">
          <div className="flex items-center gap-3 border-b border-gray-100 bg-black px-4 py-3.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-[15px] font-700 text-white">Z</span>
            <div>
              <p className="text-[13.5px] font-600 text-white">Zion · Frasberg Support</p>
              <p className="flex items-center gap-1.5 text-[11px] text-emerald-400"><span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online now</p>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-white/60 hover:text-white" aria-label="Close chat" data-testid="live-chat-close"><X size={16} /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4" data-testid="live-chat-messages">
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${m.role === "user" ? "ml-auto bg-black text-white" : "bg-white text-gray-800 shadow-sm"}`}>
                {m.content || <span className="inline-block animate-pulse">Zion is typing…</span>}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="flex items-center gap-2 border-t border-gray-100 bg-white p-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Write a message…" data-testid="live-chat-input"
              className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-[13px] text-gray-900 outline-none focus:border-gray-400" />
            <button onClick={send} disabled={busy || !input.trim()} data-testid="live-chat-send"
              className="grid h-9 w-9 place-items-center rounded-full bg-black text-white disabled:opacity-40" aria-label="Send">
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} data-testid="live-chat-bubble" aria-label="Live chat"
        className="fixed bottom-6 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-black text-white shadow-xl transition-transform hover:scale-105">
        {open ? <X size={20} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const r = await fetch(`${API}/support/contact`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error((await r.json()).detail || "Failed");
      setSent(true);
    } catch (err) { toast.error(String(err.message || err)); }
  };

  const field = "w-full border border-gray-300 bg-white px-4 py-3 text-[15px] text-gray-900 outline-none transition-colors focus:border-black";

  return (
    <main className="min-h-screen bg-white text-gray-900" data-testid="contact-page">
      <div className="mx-auto max-w-xl px-6 py-20 sm:py-28">
        <h1 className="text-center font-serif text-4xl sm:text-5xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "0.01em" }}>
          Contact Us
        </h1>
        <p className="mx-auto mt-6 max-w-md text-center text-[15px] leading-relaxed text-gray-500">
          Questions about Luchii, the API, or your account? Send us a note — we usually reply within one business day.
        </p>
        <div className="mt-8 space-y-1 text-center font-mono text-[13.5px] text-gray-600" data-testid="contact-info">
          <p>Frasberg.com</p>
          <p><a href="mailto:support@frasberg.com" className="underline decoration-gray-300 underline-offset-4 hover:decoration-black">support@frasberg.com</a></p>
        </div>

        {sent ? (
          <div className="mt-14 border border-gray-200 bg-gray-50 p-10 text-center" data-testid="contact-success">
            <p className="font-serif text-2xl" style={{ fontFamily: "Georgia, serif" }}>Thank you.</p>
            <p className="mt-3 text-[14px] text-gray-500">Your message is on its way — we'll get back to you at {form.email}.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-14 space-y-6" data-testid="contact-form">
            <label className="block">
              <span className="mb-2 block text-[12px] font-600 uppercase tracking-[0.14em] text-gray-700">Name <span className="text-gray-400">(required)</span></span>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} data-testid="contact-name" />
            </label>
            <label className="block">
              <span className="mb-2 block text-[12px] font-600 uppercase tracking-[0.14em] text-gray-700">Email <span className="text-gray-400">(required)</span></span>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} data-testid="contact-email" />
            </label>
            <label className="block">
              <span className="mb-2 block text-[12px] font-600 uppercase tracking-[0.14em] text-gray-700">Message <span className="text-gray-400">(required)</span></span>
              <textarea required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={field} data-testid="contact-message" />
            </label>
            <button type="submit" data-testid="contact-submit"
              className="bg-black px-10 py-3.5 text-[13px] font-600 uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-80">
              Send
            </button>
          </form>
        )}
        <div className="mt-20 border-t border-gray-200 pt-12" data-testid="contact-about">
          <h2 className="text-center font-serif text-2xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>About the company</h2>
          <p className="mt-2 text-center text-[13px] font-600 uppercase tracking-[0.14em] text-gray-700">Frasberg, Inc.</p>
          <p className="mt-5 text-[14px] leading-relaxed text-gray-500">
            Frasberg, Inc. is an American multinational technology company dedicated to advancing the future of artificial
            intelligence, intelligent computing, and digital transformation. Founded with the vision of making advanced
            technology accessible, practical, and beneficial for everyone, Frasberg develops innovative AI platforms,
            intelligent software, cloud technologies, and enterprise solutions that help organizations, governments,
            developers, creators, researchers, and individuals solve complex problems and unlock new opportunities.
          </p>
          <p className="mt-10 text-center font-mono text-[11.5px] text-gray-400" data-testid="contact-copyright">
            Copyright © 2003-2026 FRASBERG, INC., All Rights Reserved.
          </p>
        </div>
      </div>
      <LiveChat />
    </main>
  );
}
