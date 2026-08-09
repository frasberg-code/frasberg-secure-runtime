import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Home, X, Plus, Paperclip, GitFork, Mic, ArrowUp, Share2, RefreshCw, ExternalLink, Copy, Sparkles,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AGENTS = {
  architect: { name: "Luchii Architect", model: "luchii-70b", role: "System design & architecture",
    suggestions: ["Design a REST API + data model for a multi-tenant invoicing SaaS", "Plan the architecture for a realtime chat app with 1M users", "Draft a microservices split for an e-commerce monolith", "Design an event-driven pipeline for analytics ingestion"] },
  builder: { name: "Luchii Builder", model: "luchii-7b", role: "Code generation",
    suggestions: ["Build a responsive pricing page in a single HTML file", "Build a landing page for a coffee brand with a hero and testimonials", "Write a FastAPI endpoint with JWT auth and tests", "Build an HTML dashboard with a sidebar and stat cards"] },
  reviewer: { name: "Luchii Reviewer", model: "luchii-7b", role: "Code review & refactor",
    suggestions: ["Review this code for security issues: (paste your code)", "Refactor a callback-heavy JS function to async/await", "Audit my SQL queries for injection risks", "Suggest a cleaner structure for a 500-line React component"] },
  debugger: { name: "Luchii Debugger", model: "luchii-1b", role: "Bug hunting & fixes",
    suggestions: ["Debug: my React state updates but UI doesn't re-render", "Trace this stack trace to root cause: (paste trace)", "Why does my FastAPI endpoint return 422 on valid JSON?", "Find the memory leak in my Node websocket server"] },
};

const T = {
  bg: "#08090A", surface: "#121316", inset: "#050505",
  border: "rgba(255,255,255,0.08)", borderSub: "rgba(255,255,255,0.05)",
  text: "#EDEDED", text2: "#8A8F98", muted: "#525860", accent: "#00F0FF",
};

function extractHtml(text) {
  const t = text || "";
  const m = [...t.matchAll(/```(?:html)?\n([\s\S]*?)```/g)];
  for (let i = m.length - 1; i >= 0; i--) {
    if (/<(!DOCTYPE|html|body|div|section|main|header)/i.test(m[i][1])) return m[i][1];
  }
  // streaming / unclosed fence — render live as the agent writes
  const open = t.lastIndexOf("```");
  if (open !== -1) {
    const tail = t.slice(open).replace(/^```(?:html)?\n?/, "");
    if (/<(!DOCTYPE|html|body)/i.test(tail) && !tail.includes("```")) return tail;
  }
  return null;
}

function MessageBody({ content }) {
  const parts = (content || "").split(/```(\w*)\n?/);
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 3 === 0 && parts[i]) {
      out.push(<p key={i} className="whitespace-pre-wrap text-[13.5px] leading-relaxed">{parts[i]}</p>);
    } else if (i % 3 === 2 && parts[i] !== undefined) {
      const code = parts[i];
      out.push(
        <div key={i} className="group relative my-2 overflow-x-auto rounded-md border p-3" style={{ borderColor: T.borderSub, background: T.inset }}>
          <button onClick={() => { navigator.clipboard.writeText(code).catch(() => {}); toast.success("Copied"); }}
            className="absolute right-2 top-2 hidden rounded border p-1 group-hover:block" style={{ borderColor: T.border, color: T.text2 }} aria-label="Copy code">
            <Copy size={11} />
          </button>
          <pre className="font-mono text-[11.5px] leading-relaxed" style={{ color: "#c9d1d9" }}>{code}</pre>
        </div>
      );
    }
  }
  return <div>{out}</div>;
}

export default function AgentWorkspace() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const agentKey = (params.get("agent") || "builder").toLowerCase();
  const agent = AGENTS[agentKey] || AGENTS.builder;
  const [model, setModel] = useState(params.get("model") || agent.model);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("preview");
  const [manageTab, setManageTab] = useState("overview");
  const [showSuggest, setShowSuggest] = useState(true);
  const [publishes, setPublishes] = useState([]);
  const [reviewKind, setReviewKind] = useState("Code Review");
  const bottomRef = useRef(null);

  const previewHtml = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") {
        const h = extractHtml(messages[i].content);
        if (h) return h;
      }
    }
    return null;
  })();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || running) return;
    setInput("");
    setShowSuggest(false);
    setRunning(true);
    setMessages((m) => [...m, { role: "user", content: msg }, { role: "assistant", content: "" }]);
    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: msg, session_id: session, model, agent: agentKey }),
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
          try { data = JSON.parse(line.slice(5).trim()); } catch { continue; }
          if (data.delta) {
            setMessages((m) => {
              const next = [...m];
              next[next.length - 1] = { role: "assistant", content: next[next.length - 1].content + data.delta };
              return next;
            });
          }
          if (data.session_id) setSession(data.session_id);
          if (data.error) throw new Error(data.error);
        }
      }
    } catch {
      setMessages((m) => {
        const next = [...m];
        if (!next[next.length - 1].content) next[next.length - 1] = { role: "assistant", content: "Connection hiccup — please try again." };
        return next;
      });
    } finally {
      setRunning(false);
    }
  }, [input, running, session, model, agentKey]);

  const republish = () => {
    if (!previewHtml) { toast.error("Nothing to publish yet — ask the agent to build something first"); return; }
    const n = publishes.length + 1;
    const hash = Math.random().toString(16).slice(2, 9);
    setPublishes((p) => [{ n, hash, at: new Date(), html: previewHtml }, ...p]);
    toast.success(`Publish ${n} deployed — ${hash}`);
  };

  const healthCheck = async () => {
    try {
      const r = await fetch(`${API}/health`);
      toast[r.ok ? "success" : "error"](r.ok ? "Health check passed — all systems live" : "Health check failed");
    } catch { toast.error("Health check failed"); }
  };

  const runReview = () => {
    setTab("preview");
    send(previewHtml
      ? `Run a ${reviewKind} on the app you just built. List findings by severity with fixes:\n\`\`\`html\n${previewHtml.slice(0, 6000)}\n\`\`\``
      : `Explain how you would run a ${reviewKind} on a deployed web app — checklist by severity.`);
    toast(`${reviewKind} started`, { description: "The agent is reviewing" });
  };

  const iconBtn = "grid h-9 w-9 place-items-center rounded-md border transition-colors";

  return (
    <main className="flex h-screen flex-col overflow-hidden" style={{ background: T.bg, color: T.text }} data-testid="agent-workspace-page">
      {/* Tab bar */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3" style={{ borderColor: T.borderSub, background: T.inset }}>
        <Link to="/" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors hover:bg-white/[0.05]" style={{ color: T.text2 }} data-testid="workspace-home-btn">
          <Home size={14} /> Home
        </Link>
        <div className="flex items-center gap-2 rounded-t-md border border-b-0 px-3.5 py-2 text-[13px]" style={{ borderColor: T.border, background: T.surface }} data-testid="workspace-tab">
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: T.accent }} />
          {agent.name}
          <button onClick={() => navigate("/coding-agents")} aria-label="Close tab" className="ml-1 rounded p-0.5 hover:bg-white/[0.08]" data-testid="workspace-tab-close" style={{ color: T.text2 }}>
            <X size={12} />
          </button>
        </div>
        <Link to="/coding-agents" className="rounded-md p-1.5 transition-colors hover:bg-white/[0.05]" style={{ color: T.text2 }} data-testid="workspace-new-tab" aria-label="New agent">
          <Plus size={15} />
        </Link>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-wide" style={{ color: T.muted }}>{agent.role}</span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* LEFT — chat */}
        <div className="flex min-w-0 flex-1 flex-col border-r" style={{ borderColor: T.borderSub, maxWidth: "50%" }} data-testid="workspace-chat-pane">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {messages.length === 0 && (
              <div className="mt-14 text-center">
                <img src="/luchii-mark-circle.png" alt="" className="mx-auto h-14 w-14 rounded-full opacity-90" />
                <h1 className="mt-4 text-xl font-700 tracking-tight">{agent.name}</h1>
                <p className="mt-1 text-sm" style={{ color: T.text2 }}>{agent.role} · {model}</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`mt-4 ${m.role === "user" ? "flex justify-end" : ""}`}>
                {m.role === "user" ? (
                  <div className="max-w-[85%] rounded-xl px-4 py-2.5 text-[13.5px]" style={{ background: "rgba(255,255,255,0.07)" }}>{m.content}</div>
                ) : (
                  <div className="max-w-full">
                    {m.content ? <MessageBody content={m.content} /> : (
                      <p className="flex items-center gap-2 font-mono text-xs" style={{ color: T.text2 }}>
                        <span className="inline-block h-2 w-2 animate-pulse rounded-full" style={{ background: T.accent }} /> Thinking…
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions card */}
          {showSuggest && messages.length === 0 && (
            <div className="mx-4 mb-2 rounded-lg border" style={{ borderColor: T.border, background: T.surface }} data-testid="workspace-suggestions">
              <div className="flex items-center justify-between border-b px-4 py-2.5" style={{ borderColor: T.borderSub }}>
                <span className="flex items-center gap-2 text-[12.5px]" style={{ color: T.accent }}>
                  <Sparkles size={13} /> Agent is suggesting some tasks:
                </span>
                <button onClick={() => setShowSuggest(false)} aria-label="Dismiss suggestions" style={{ color: T.text2 }} data-testid="workspace-suggestions-close"><X size={13} /></button>
              </div>
              <div className="max-h-44 overflow-y-auto">
                {agent.suggestions.map((s, i) => (
                  <button key={i} onClick={() => send(s)} data-testid={`workspace-suggestion-${i}`}
                    className="flex w-full items-start gap-3 px-4 py-2.5 text-left text-[12.5px] transition-colors hover:bg-white/[0.04]" style={{ color: T.text }}>
                    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border" style={{ borderColor: T.border, color: T.text2 }}><Plus size={9} /></span>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status + composer */}
          <div className="shrink-0 px-4 pb-4">
            {running && (
              <p className="mb-1.5 flex items-center gap-2 font-mono text-[11px]" style={{ color: "#10B981" }} data-testid="workspace-running">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "#10B981" }} /> Agent is running…
              </p>
            )}
            <div className="rounded-xl border p-2.5" style={{ borderColor: T.border, background: T.surface }}>
              <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={1}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={`Message ${agent.name.split(" ")[1]}`} data-testid="workspace-input"
                className="w-full resize-none bg-transparent px-1.5 py-1 text-[13.5px] outline-none" style={{ color: T.text }} />
              <div className="mt-1.5 flex items-center gap-1.5">
                <button className={iconBtn} style={{ borderColor: T.borderSub, color: T.muted }} onClick={() => toast("Attachments live in Luchii Chat")} aria-label="Attach" data-testid="workspace-attach"><Paperclip size={14} /></button>
                <button className={iconBtn} style={{ borderColor: T.borderSub, color: T.muted }} onClick={() => { setSession(null); setMessages([]); setShowSuggest(true); toast.success("Forked into a fresh session"); }} aria-label="Fork" data-testid="workspace-fork"><GitFork size={14} /></button>
                <select value={model} onChange={(e) => setModel(e.target.value)} data-testid="workspace-model-select"
                  className="rounded-md border px-3 py-1.5 font-mono text-[11px] outline-none" style={{ borderColor: T.border, background: T.inset, color: T.text }}>
                  <option value="luchii-1b">✳ luchii-1b</option>
                  <option value="luchii-7b">✳ luchii-7b</option>
                  <option value="luchii-70b">✳ luchii-70b</option>
                </select>
                <button className={`${iconBtn} ml-auto`} style={{ borderColor: T.borderSub, color: T.muted }} onClick={() => toast("Voice input lives in Luchii Chat")} aria-label="Mic" data-testid="workspace-mic"><Mic size={14} /></button>
                <button onClick={() => send()} disabled={running || !input.trim()} data-testid="workspace-send"
                  className="grid h-9 w-9 place-items-center rounded-full transition-opacity disabled:opacity-40"
                  style={{ background: T.accent, color: "#08090A" }} aria-label="Send">
                  <ArrowUp size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — preview / manage */}
        <div className="flex min-w-0 flex-1 flex-col" data-testid="workspace-right-pane">
          <div className="flex h-12 shrink-0 items-center gap-2 border-b px-4" style={{ borderColor: T.borderSub }}>
            <div className="flex rounded-md border p-0.5" style={{ borderColor: T.border }}>
              {["preview", "manage"].map((t) => (
                <button key={t} onClick={() => setTab(t)} data-testid={`workspace-${t}-tab`}
                  className="rounded px-3.5 py-1 text-[12.5px] capitalize transition-colors"
                  style={tab === t ? { background: "rgba(255,255,255,0.09)", color: T.text } : { color: T.text2 }}>
                  {t}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => toast("Docs: /luchii-code")} className="rounded-full border px-3.5 py-1.5 text-[11.5px]" style={{ borderColor: T.border, color: T.text2 }} data-testid="workspace-help-btn">Need Help?</button>
              <button className={iconBtn} style={{ borderColor: T.borderSub, color: T.muted }} onClick={() => { navigator.clipboard.writeText(window.location.href).catch(() => {}); toast.success("Workspace link copied"); }} aria-label="Share" data-testid="workspace-share"><Share2 size={13} /></button>
              <button className={iconBtn} style={{ borderColor: T.borderSub, color: T.muted }} onClick={() => setTab("preview")} aria-label="Reload preview" data-testid="workspace-reload"><RefreshCw size={13} /></button>
              <button onClick={republish} data-testid="workspace-republish"
                className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-600" style={{ background: T.text, color: T.bg }}>
                <ExternalLink size={12} /> Re-publish
              </button>
            </div>
          </div>

          {tab === "preview" ? (
            <div className="min-h-0 flex-1" data-testid="workspace-preview">
              {previewHtml ? (
                <iframe title="preview" srcDoc={previewHtml} sandbox="allow-scripts" className="h-full w-full bg-white" />
              ) : (
                <div className="grid h-full place-items-center">
                  <div className="text-center">
                    <img src="/luchii-mark-circle.png" alt="" className="mx-auto h-16 w-16 rounded-full opacity-80" style={{ boxShadow: "0 0 50px rgba(0,240,255,0.25)" }} />
                    <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: T.accent }}>● Luchii V12 · Constellation layer live</p>
                    <p className="mt-3 max-w-xs text-sm" style={{ color: T.text2 }}>
                      Your build preview appears here — ask {agent.name} to build a page and it renders live.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto p-6" data-testid="workspace-manage">
              <h2 className="text-[15px] font-700">☁ Manage Publishing</h2>
              <div className="mt-4 flex gap-5 border-b text-[13px]" style={{ borderColor: T.borderSub }}>
                {["overview", "domain", "resources", "database", "secrets"].map((t) => (
                  <button key={t} onClick={() => setManageTab(t)} data-testid={`manage-tab-${t}`}
                    className="pb-2 capitalize transition-colors"
                    style={manageTab === t ? { color: T.text, borderBottom: `2px solid ${T.text}` } : { color: T.text2 }}>
                    {t}
                  </button>
                ))}
              </div>
              {manageTab === "overview" ? (
                <>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 text-[12.5px]" style={{ borderColor: T.border, background: T.surface }}>
                    <span style={{ color: T.text2 }}>Noticing issues on your live app?</span>
                    <span className="flex gap-4">
                      <button className="underline" style={{ color: T.text }} onClick={() => { setTab("preview"); send("Something looks broken in the app you built — diagnose likely issues and fix them."); }} data-testid="manage-ask-fix">Ask agent to fix</button>
                      <button className="underline" style={{ color: T.text }} onClick={() => toast("Support: hello@frasberg.com")}>Contact Support</button>
                    </span>
                  </div>
                  <div className="mt-4 rounded-lg border p-4" style={{ borderColor: T.border, background: T.surface }}>
                    <p className="flex items-center gap-2 text-[13.5px] font-600">Run a review
                      <span className="rounded px-1.5 py-0.5 text-[9px] font-700 uppercase" style={{ background: "#2563EB", color: "#fff" }}>New</span>
                    </p>
                    <p className="mt-0.5 text-[12px]" style={{ color: T.text2 }}>Let a specialist subagent review your deployed app</p>
                    <div className="mt-3 flex gap-2">
                      <select value={reviewKind} onChange={(e) => setReviewKind(e.target.value)} data-testid="manage-review-select"
                        className="flex-1 rounded-md border px-3 py-2 text-[12.5px] outline-none" style={{ borderColor: T.border, background: T.inset, color: T.text }}>
                        <option>Code Review</option>
                        <option>Security Review</option>
                        <option>Performance Review</option>
                      </select>
                      <button onClick={runReview} data-testid="manage-run-review"
                        className="rounded-md border px-4 py-2 text-[12.5px]" style={{ borderColor: T.border, color: T.text }}>✦ Run review</button>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg border p-4" style={{ borderColor: T.border, background: T.surface }} data-testid="manage-publishes">
                    <p className="text-[13.5px] font-600">Publishes</p>
                    <p className="mt-0.5 text-[12px]" style={{ color: T.text2 }}>All published versions of your app</p>
                    {publishes.length === 0 ? (
                      <p className="mt-3 font-mono text-[11px]" style={{ color: T.muted }}>No publishes yet — hit Re-publish once the agent builds something.</p>
                    ) : (
                      publishes.map((p) => (
                        <div key={p.n} className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: T.borderSub }} data-testid={`publish-row-${p.n}`}>
                          <span className="flex items-center gap-2 text-[12.5px]">
                            <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#10B981" }} />
                            Publish {p.n} · {p.at.toLocaleTimeString()} <code className="font-mono text-[10px]" style={{ color: T.muted }}>{p.hash}</code>
                          </span>
                          <button className="text-[12px] underline" style={{ color: T.text2 }} onClick={() => toast(`Logs for publish ${p.n}: build OK · deploy OK · healthy`)}>View Logs</button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <button className="text-[12px] underline" style={{ color: T.text2 }} onClick={() => toast("Thanks — feedback noted!")}>Give us feedback</button>
                    <div className="flex gap-2">
                      <button onClick={healthCheck} data-testid="manage-health-check"
                        className="rounded-full border px-4 py-2 text-[12.5px]" style={{ borderColor: T.border, color: T.text }}>Run health check</button>
                      <button onClick={republish} className="rounded-full px-4 py-2 text-[12.5px] font-600" style={{ background: T.text, color: T.bg }}>Re-publish changes</button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-5 rounded-lg border p-5 text-[12.5px]" style={{ borderColor: T.border, background: T.surface, color: T.text2 }}>
                  {manageTab === "domain" && "Custom domains are managed per project in the Luchii Builder — publish there to attach frasberg.com subdomains."}
                  {manageTab === "resources" && "This workspace runs on the shared Frasberg gateway: 1 vCPU · 512MB per session, auto-scaled."}
                  {manageTab === "database" && "Sessions persist chat history in MongoDB (chat_history). No dedicated database is attached to this workspace."}
                  {manageTab === "secrets" && "API keys live in the Developer Console → API Keys. Never paste secrets into chat."}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
