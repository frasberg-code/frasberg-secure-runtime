import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Home, X, Plus, Paperclip, GitFork, Mic, ArrowUp, Share2, RefreshCw, ExternalLink, Copy, Sparkles, Download, Square, Play,
  MousePointerClick, Monitor, Smartphone, Tablet, Maximize2, Minimize2, ChevronDown, ChevronUp, Undo2, Github, Bot,
  Search, CircleDot, GitPullRequest, BookMarked, Inbox,
} from "lucide-react";
import { AccountMenu } from "../components/site/AccountMenu";
import { NotificationBell } from "../components/site/NotificationBell";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const QUICK_PAGES = [
  { label: "Developer Console", to: "/dashboard" },
  { label: "Frasberg Gift & Tokens", to: "/dashboard" },
  { label: "Singularity Codex", to: "/codex" },
  { label: "FrasbergOS Simulator", to: "/os" },
  { label: "Agent Marketplace", to: "/marketplace" },
  { label: "Verified LLM Provider", to: "/verified-provider" },
  { label: "Kernel Stack", to: "/kernels" },
  { label: "Tier Benchmark Arena", to: "/benchmark" },
  { label: "Ops Center", to: "/ops" },
  { label: "Ascension History", to: "/ascensions" },
  { label: "API Docs", to: "/docs" },
  { label: "Profile", to: "/profile" },
];

function QuickSearch({ T, navigate }) {
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  const results = q.trim() ? QUICK_PAGES.filter((p) => p.label.toLowerCase().includes(q.toLowerCase())) : QUICK_PAGES;
  return (
    <div className="relative hidden md:block">
      <div className="flex items-center gap-2 rounded-md border px-2.5 py-1.5" style={{ borderColor: T.border, background: T.inset }}>
        <Search size={13} style={{ color: T.muted }} />
        <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 150)}
          onKeyDown={(e) => { if (e.key === "Enter" && results[0]) navigate(results[0].to); }}
          placeholder="Type / to search" data-testid="ws-quick-search"
          className="w-36 bg-transparent text-[12.5px] outline-none" style={{ color: T.text }} />
        <kbd className="rounded border px-1 font-mono text-[10px]" style={{ borderColor: T.border, color: T.muted }}>/</kbd>
      </div>
      {focus && (
        <div className="absolute left-0 top-10 z-[80] w-64 rounded-xl border p-1.5 shadow-2xl" style={{ borderColor: T.border, background: "rgba(10,14,22,0.98)" }} data-testid="ws-quick-search-results">
          {results.slice(0, 7).map((p) => (
            <button key={p.label} onMouseDown={() => navigate(p.to)} data-testid={`ws-quick-nav-${p.to.slice(1)}`}
              className="block w-full rounded-lg px-3 py-2 text-left text-[12.5px] transition-colors hover:bg-white/[0.07]" style={{ color: T.text }}>
              {p.label}
            </button>
          ))}
          {results.length === 0 && <p className="px-3 py-2 text-[12.5px]" style={{ color: T.muted }}>No matches</p>}
        </div>
      )}
    </div>
  );
}

const AGENTS = {
  architect: { name: "Luchii", model: "luchii-70b", role: "Frasberg",
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
          <pre className="font-mono text-[13px] leading-relaxed" style={{ color: "#c9d1d9" }}>{code}</pre>
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
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem(`luchii-ws-${agentKey}`)) || {}; } catch { return {}; }
  })();
  const [model, setModel] = useState(saved.model || params.get("model") || agent.model);
  const [messages, setMessages] = useState(saved.messages || []);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [session, setSession] = useState(saved.session || null);
  const [tab, setTab] = useState("preview");
  const [manageTab, setManageTab] = useState("overview");
  const splitRef = useRef(null);
  const [split, setSplit] = useState(() => { try { const v = Number(localStorage.getItem("ws-split")); return v >= 25 && v <= 75 ? v : 50; } catch { return 50; } });
  const [dragging, setDragging] = useState(false);
  const [fullPreview, setFullPreview] = useState(false);
  const [device, setDevice] = useState("desktop");
  const [toolbarOpen, setToolbarOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [htmlOverride, setHtmlOverride] = useState(null);
  const [ghOwner, setGhOwner] = useState("");
  const [ghRepo, setGhRepo] = useState("");
  const [ghBusy, setGhBusy] = useState(false);
  const [ghResult, setGhResult] = useState(null);
  const [ghAgent, setGhAgent] = useState(null);
  const [ghRepos, setGhRepos] = useState(null);
  const [ghListBusy, setGhListBusy] = useState(false);
  const loadGhRepos = async () => {
    if (ghRepos) { setGhRepos(null); return; }
    setGhListBusy(true);
    try {
      const r = await fetch(`${API}/github/repos`, { credentials: "include" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Could not list repos");
      setGhRepos(d.repos);
      toast.success(`Loaded ${d.repos.length} repos for ${d.login}`);
    } catch (e) { toast.error(String(e.message || e)); }
    setGhListBusy(false);
  };
  const forkGithub = async (o = ghOwner, r = ghRepo) => {
    setGhBusy(true);
    setGhResult(null);
    try {
      const res = await fetch(`${API}/github/fork`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: o, repo: r }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "Fork failed");
      setGhResult(d.html_url);
      toast.success(`Forked ${d.full_name}`);
    } catch (e) { toast.error(String(e.message || e)); }
    setGhBusy(false);
  };
  const importGithub = async (o = ghOwner, r = ghRepo) => {
    setGhBusy(true);
    try {
      const res = await fetch(`${API}/github/import`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: o, repo: r }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "Import failed");
      setGhAgent(d.agent ? { ...d.agent, repo: d.repo } : null);
      if (d.content) {
        setHtmlOverride(d.content);
        setEditing(true);
        setTab("code");
        toast.success(`Imported ${d.file} from ${d.repo} — edit it with Luchii`);
      } else {
        setManageTab("overview");
        toast.success(`Synced agent file ${d.agent?.file} from ${d.repo}`);
      }
      if (d.agent && !d.agent.error) toast.success(`Agent detected: ${d.agent.name || d.agent.id} (${d.agent.file})`);
    } catch (e) { toast.error(String(e.message || e)); }
    setGhBusy(false);
  };
  const scaffoldGithub = async (o = ghOwner, r = ghRepo) => {
    setGhBusy(true);
    try {
      const res = await fetch(`${API}/github/scaffold`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: o, repo: r }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "Scaffold failed");
      toast.success(`Frasberg-ready — added ${d.added.length ? d.added.join(", ") : "nothing new"}${d.skipped_existing.length ? ` (already had ${d.skipped_existing.join(", ")})` : ""}`);
    } catch (e) { toast.error(String(e.message || e)); }
    setGhBusy(false);
  };
  const [ghSynced, setGhSynced] = useState(null);
  const [ghSyncBusy, setGhSyncBusy] = useState(false);
  useEffect(() => {
    fetch(`${API}/github/synced-agents`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.agents?.length) setGhSynced(d.agents); })
      .catch(() => {});
  }, []);
  const syncAgents = async () => {
    setGhSyncBusy(true);
    try {
      const res = await fetch(`${API}/github/agent-sync`, { method: "POST", credentials: "include" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "Sync failed");
      const list = await fetch(`${API}/github/synced-agents`, { credentials: "include" }).then((r) => r.json());
      setGhSynced(list.agents || []);
      toast.success(`Scanned ${d.scanned} repos — ${d.synced.length} agent file${d.synced.length === 1 ? "" : "s"} synced`);
    } catch (e) { toast.error(String(e.message || e)); }
    setGhSyncBusy(false);
  };
  const [ghDeploying, setGhDeploying] = useState(null);
  const deployAgent = async (repo) => {
    setGhDeploying(repo);
    try {
      const res = await fetch(`${API}/marketplace/deploy-from-github`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "Deploy failed");
      toast.success(`${d.name} ${d.updated ? "re-deployed" : "deployed"} to the Marketplace`, {
        action: { label: "View", onClick: () => window.open("/marketplace", "_blank") },
      });
    } catch (e) { toast.error(String(e.message || e)); }
    setGhDeploying(null);
  };
  const exportGithub = async (o = ghOwner, r = ghRepo) => {
    if (!previewHtml) { toast.error("Nothing to push yet — build something with Luchii first"); return; }
    setGhBusy(true);
    try {
      const res = await fetch(`${API}/github/export`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: o, repo: r, html: previewHtml }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "Push failed");
      setGhResult(d.repo_url);
      toast.success(`${d.created_repo ? "Created repo and pushed" : "Pushed"} index.html to ${o}/${r}`);
    } catch (e) { toast.error(String(e.message || e)); }
    setGhBusy(false);
  };
  const snapSplit = () => {
    if (!fullPreview && split === 50) setFullPreview(true);
    else { setFullPreview(false); setSplit(50); try { localStorage.setItem("ws-split", "50"); } catch {} }
  };
  const startDrag = (e) => {
    e.preventDefault();
    const el = splitRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDragging(true);
    document.body.style.userSelect = "none";
    const move = (ev) => {
      const pct = Math.min(75, Math.max(25, ((rect.right - ev.clientX) / rect.width) * 100));
      setSplit(pct);
      try { localStorage.setItem("ws-split", String(Math.round(pct))); } catch {}
    };
    const up = () => {
      setDragging(false);
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const [showSuggest, setShowSuggest] = useState((saved.messages || []).length === 0);
  const [publishes, setPublishes] = useState(
    (saved.publishes || []).map((p) => ({ ...p, at: new Date(p.at) }))
  );
  const [reviewKind, setReviewKind] = useState("Code Review");
  const [publishId, setPublishId] = useState(saved.publishId || null);
  const [slugName, setSlugName] = useState(saved.savedSlug || "");
  const [savedSlug, setSavedSlug] = useState(saved.savedSlug || null);
  const [slugStatus, setSlugStatus] = useState(null);
  const [slugSuggestions, setSlugSuggestions] = useState([]);
  const [attach, setAttach] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [paused, setPaused] = useState(false);
  const abortRef = useRef(null);
  const fileRef = useRef(null);
  const recRef = useRef(null);
  const bottomRef = useRef(null);

  // workspace memory — builds and chats survive refresh
  useEffect(() => {
    if (running) return;
    try {
      localStorage.setItem(`luchii-ws-${agentKey}`, JSON.stringify({
        model, session, publishId, savedSlug,
        messages: messages.slice(-40),
        publishes: publishes.slice(0, 10).map((p) => ({ ...p, at: p.at.toISOString() })),
      }));
    } catch {}
  }, [messages, session, publishes, model, agentKey, running, publishId, savedSlug]);

  useEffect(() => {
    const n = slugName.trim().toLowerCase();
    if (!n || n === savedSlug) { setSlugStatus(null); return; }
    setSlugStatus("checking");
    const t = setTimeout(() => {
      fetch(`${API}/workspace/slug-check?name=${encodeURIComponent(n)}`).then((r) => r.json())
        .then((d) => {
          setSlugStatus(!d.valid ? "invalid" : d.available ? "available" : "taken");
          setSlugSuggestions(d.suggestions || []);
        })
        .catch(() => setSlugStatus(null));
    }, 350);
    return () => clearTimeout(t);
  }, [slugName, savedSlug]);

  const claimSlug = async () => {
    const n = slugName.trim().toLowerCase();
    if (!publishId) { toast.error("Publish your app first, then claim a name"); return; }
    try {
      const r = await fetch(`${API}/workspace/publishes/${publishId}/slug`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Claim failed");
      setSavedSlug(d.slug);
      setSlugStatus(null);
      toast.success(`Claimed — your app now lives at ${d.slug}.preview.frasberg.com`);
    } catch (e) { toast.error(String(e.message || e)); }
  };

  const derivedHtml = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") {
        const h = extractHtml(messages[i].content);
        if (h) return h;
      }
    }
    return null;
  })();
  const previewHtml = htmlOverride ?? derivedHtml;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = useCallback(async (text, display) => {
    const msg = (text || input).trim();
    if (!msg || running) return;
    setInput("");
    setShowSuggest(false);
    setHtmlOverride(null);
    setRunning(true);
    setPaused(false);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const att = attach;
    setAttach(null);
    const shownMsg = display ?? (att ? `${msg}\n📎 ${att.name}` : msg);
    setMessages((m) => [...m, { role: "user", content: shownMsg }, { role: "assistant", content: "" }]);
    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: ctrl.signal,
        body: JSON.stringify({
          message: att?.kind === "text" ? `${msg}\n\nAttached file ${att.name}:\n\`\`\`\n${att.text.slice(0, 20000)}\n\`\`\`` : msg,
          session_id: session, model, agent: agentKey,
          ...(att?.kind === "image" ? { attachment_base64: att.data, attachment_kind: "image", attachment_name: att.name } : {}),
        }),
      });
      if (!res.ok || !res.body) {
        let detail = "network";
        try { detail = (await res.json()).detail || detail; } catch {}
        throw new Error(typeof detail === "string" ? detail : "network");
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
    } catch (err) {
      if (err?.name === "AbortError") {
        setMessages((m) => {
          const next = [...m];
          if (!next[next.length - 1].content) next[next.length - 1] = { role: "assistant", content: "⏸ Paused." };
          return next;
        });
      } else {
        const note = err?.message && err.message !== "network" ? err.message : "Connection hiccup — please try again.";
        setMessages((m) => {
          const next = [...m];
          if (!next[next.length - 1].content) next[next.length - 1] = { role: "assistant", content: note };
          return next;
        });
      }
    } finally {
      setRunning(false);
    }
  }, [input, running, session, model, agentKey, attach]);

  const stopAgent = () => {
    abortRef.current?.abort();
    setPaused(true);
    toast("Agent paused — hit Resume to continue", { duration: 4000 });
  };

  const resumeAgent = () => {
    const last = [...messages].reverse().find((m) => m.role === "assistant" && m.content && m.content !== "⏸ Paused.");
    const tail = last ? last.content.slice(-3000) : "";
    setPaused(false);
    send(
      tail
        ? `You were paused mid-response. Here is the end of what you had written so far:\n---\n${tail}\n---\nContinue from EXACTLY where this leaves off. Do not repeat anything already written. If you were inside a code block, continue the code seamlessly.`
        : "Continue where you left off.",
      "▶ Resume",
    );
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > 2_000_000) { toast.error("File too large — 2MB max"); return; }
    const reader = new FileReader();
    if (f.type.startsWith("image/")) {
      reader.onload = () => { setAttach({ kind: "image", name: f.name, data: String(reader.result).split(",")[1] }); toast.success(`${f.name} attached`); };
      reader.readAsDataURL(f);
    } else {
      reader.onload = () => { setAttach({ kind: "text", name: f.name, text: String(reader.result) }); toast.success(`${f.name} attached`); };
      reader.readAsText(f);
    }
  };

  const toggleMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error("Voice input isn't supported in this browser"); return; }
    if (listening) { recRef.current?.stop(); return; }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (ev) => setInput((v) => (v ? v + " " : "") + ev.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => { setListening(false); toast.error("Voice input error — check mic permissions"); };
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const isTruncated = (h) => /<html/i.test(h) && !/<\/html>/i.test(h);

  const republish = async () => {
    if (!previewHtml) { toast.error("Nothing to publish yet — ask the agent to build something first"); return; }
    if (isTruncated(previewHtml)) {
      toast.warning("Build looks incomplete — asking the agent to finish it", { duration: 5000 });
      send("The HTML you generated was cut off before the closing </html> tag. Regenerate the COMPLETE file from <!DOCTYPE html> to </html> in one code block, keeping it compact enough to fit.");
      return;
    }
    try {
      let d = null;
      if (publishId) {
        const r = await fetch(`${API}/workspace/publishes/${publishId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ html: previewHtml }),
        });
        if (r.ok) d = await r.json();
      }
      if (!d) {
        const r = await fetch(`${API}/workspace/publishes`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agent: agentKey, title: `${agent.name} build`, html: previewHtml }),
        });
        if (!r.ok) throw new Error();
        d = await r.json();
        setPublishId(d.id);
      }
      setPublishes((p) => [{ n: d.version, hash: d.hash, at: new Date(), url: d.url }, ...p]);
      toast.success(`Publish ${d.version} deployed — ${d.hash}`, {
        action: { label: "Open", onClick: () => window.open(`${process.env.REACT_APP_BACKEND_URL}${d.url}`, "_blank") },
      });
    } catch { toast.error("Publish failed — try again"); }
  };

  const downloadBuild = () => {
    if (!previewHtml) { toast.error("Nothing to download yet — ask the agent to build something first"); return; }
    if (isTruncated(previewHtml)) toast.warning("Heads up — this build looks incomplete (missing </html>)");
    const blob = new Blob([previewHtml], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `luchii-${agentKey}-build.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Build downloaded");
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
        <Link to="/apps" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors hover:bg-white/[0.05]" style={{ color: T.text2 }} data-testid="workspace-home-btn">
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
        <div className="ml-auto flex items-center gap-1">
          <QuickSearch T={T} navigate={navigate} />
          <div className="mx-1.5 hidden h-5 w-px sm:block" style={{ background: T.border }} />
          <button onClick={() => navigate("/ops")} title="Cycle alerts · Ops Center" aria-label="Ops Center" data-testid="ws-icon-alerts"
            className="rounded-md p-2 transition-colors hover:bg-white/[0.06]" style={{ color: T.text2 }}><CircleDot size={15} /></button>
          <button onClick={() => navigate("/ascensions")} title="Ascension history" aria-label="Ascensions" data-testid="ws-icon-ascensions"
            className="rounded-md p-2 transition-colors hover:bg-white/[0.06]" style={{ color: T.text2 }}><GitPullRequest size={15} /></button>
          <button onClick={() => navigate("/codex")} title="Singularity Codex" aria-label="Codex" data-testid="ws-icon-codex"
            className="rounded-md p-2 transition-colors hover:bg-white/[0.06]" style={{ color: T.text2 }}><BookMarked size={15} /></button>
          <button onClick={() => navigate("/dashboard")} title="Developer Console" aria-label="Console" data-testid="ws-icon-inbox"
            className="rounded-md p-2 transition-colors hover:bg-white/[0.06]" style={{ color: T.text2 }}><Inbox size={15} /></button>
          <button onClick={() => { setTab("manage"); toast.info("GitHub tools — fork, import, scaffold & export in Manage"); }}
            title="GitHub — fork, import & export" aria-label="GitHub tools" data-testid="ws-icon-github"
            className="rounded-md p-2 transition-colors hover:bg-white/[0.06]" style={{ color: T.text2 }}><Github size={15} /></button>
          <NotificationBell />
          <div className="mx-1.5 h-5 w-px" style={{ background: T.border }} />
          <AccountMenu />
          <span className="ml-2 hidden font-mono text-[13.5px] uppercase tracking-wide lg:block" style={{ color: T.muted }}>{agent.role}</span>
        </div>
      </div>

      <div ref={splitRef} className="flex min-h-0 flex-1">
        {/* Split divider — drag to resize */}
        <div onPointerDown={startDrag} onDoubleClick={snapSplit} data-testid="workspace-split-divider" aria-label="Resize panels" title="Drag to resize · double-click to snap"
          className="order-2 flex w-2.5 shrink-0 cursor-col-resize items-center justify-center transition-colors hover:bg-white/[0.06]"
          style={{ background: dragging ? "rgba(0,240,255,0.1)" : "transparent", touchAction: "none" }}>
          <span className="h-16 w-1 rounded-full" style={{ background: dragging ? T.accent : "rgba(255,255,255,0.2)" }} />
        </div>
        {/* Chat — right side per user request */}
        <div className="order-3 flex min-w-0 flex-col border-l" style={{ borderColor: T.borderSub, width: `${split}%`, display: fullPreview ? "none" : undefined }} data-testid="workspace-chat-pane">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {messages.length === 0 && (
              <div className="mt-14 text-center">
                <img src="/luchii-mark-circle.png" alt="" className="mx-auto h-14 w-14 rounded-full opacity-90" />
                <h1 className="mt-4 text-xl font-700 tracking-tight">{agent.name}</h1>
                <p className="mt-1 text-sm" style={{ color: T.text2 }}>{agent.role} · {model.replace(/^luchii/, "Luchii")}</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`mt-4 ${m.role === "user" ? "flex justify-end" : ""}`}>
                {m.role === "user" ? (
                  <div className="max-w-[85%] rounded-xl px-4 py-2.5 text-[13.5px]" style={{ background: "rgba(255,255,255,0.07)" }}>{m.content}</div>
                ) : (
                  <div className="max-w-full">
                    {m.content ? <MessageBody content={m.content} /> : (
                      <p className="flex items-center gap-2 font-mono text-[13px]" style={{ color: T.text2 }}>
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
                <span className="flex items-center gap-2 text-[13.5px]" style={{ color: T.accent }}>
                  <Sparkles size={13} /> Agent is suggesting some tasks:
                </span>
                <button onClick={() => setShowSuggest(false)} aria-label="Dismiss suggestions" style={{ color: T.text2 }} data-testid="workspace-suggestions-close"><X size={13} /></button>
              </div>
              <div className="max-h-44 overflow-y-auto">
                {agent.suggestions.map((s, i) => (
                  <button key={i} onClick={() => send(s)} data-testid={`workspace-suggestion-${i}`}
                    className="flex w-full items-start gap-3 px-4 py-2.5 text-left text-[13.5px] transition-colors hover:bg-white/[0.04]" style={{ color: T.text }}>
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
              <p className="mb-1.5 flex items-center gap-2 font-mono text-[13px]" style={{ color: "#10B981" }} data-testid="workspace-running">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "#10B981" }} /> Agent is running…
              </p>
            )}
            {paused && !running && (
              <div className="mb-1.5">
                <button onClick={resumeAgent} data-testid="workspace-resume"
                  className="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-[13px] transition-colors hover:bg-white/[0.05]"
                  style={{ borderColor: T.accent, color: T.accent }}>
                  <Play size={10} fill="currentColor" /> Resume agent
                </button>
              </div>
            )}
            <div className="rounded-xl border p-2.5" style={{ borderColor: T.border, background: T.surface }}>
              {attach && (
                <div className="mb-1.5 flex w-fit items-center gap-2 rounded-md border px-3 py-1.5 text-[13.5px]" style={{ borderColor: T.border, background: T.inset, color: T.text2 }} data-testid="workspace-attachment-chip">
                  <Paperclip size={11} style={{ color: T.accent }} /> {attach.name}
                  <button onClick={() => setAttach(null)} aria-label="Remove attachment" data-testid="workspace-attachment-remove" style={{ color: T.muted }}><X size={12} /></button>
                </div>
              )}
              <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); } }}
                placeholder="Type your build request — Enter for a new line, Ctrl+Enter to send" data-testid="workspace-input"
                className="w-full resize-none bg-transparent px-1.5 py-1 text-[13.5px] outline-none" style={{ color: T.text }} />
              <div className="mt-1.5 flex items-center gap-1.5">
                <input ref={fileRef} type="file" hidden accept=".txt,.md,.html,.css,.js,.jsx,.ts,.tsx,.json,.csv,.py,image/*" onChange={onFile} data-testid="workspace-file-input" />
                <button className={iconBtn} style={{ borderColor: attach ? T.accent : T.borderSub, color: attach ? T.accent : T.muted }} onClick={() => fileRef.current?.click()} aria-label="Attach" data-testid="workspace-attach"><Paperclip size={14} /></button>
                <button className={iconBtn} style={{ borderColor: T.borderSub, color: T.muted }} onClick={() => { setSession(null); setMessages([]); setPublishes([]); setShowSuggest(true); try { localStorage.removeItem(`luchii-ws-${agentKey}`); } catch {} toast.success("Forked into a fresh session"); }} aria-label="Fork" data-testid="workspace-fork"><GitFork size={14} /></button>
                <select value={model} onChange={(e) => setModel(e.target.value)} data-testid="workspace-model-select"
                  className="rounded-md border px-3 py-1.5 font-mono text-[13px] outline-none" style={{ borderColor: T.border, background: T.inset, color: T.text }}>
                  <option value="luchii-1b">✳ Luchii-1b</option>
                  <option value="luchii-7b">✳ Luchii-7b</option>
                  <option value="luchii-70b">✳ Luchii-70b</option>
                  <option disabled>──────────</option>
                  <option value="frasberg-ai" disabled>◈ Frasberg — coming soon</option>
                  <option value="luchii-vision" disabled>✳ Luchii Earth 7 — coming soon</option>
                </select>
                <button className={`${iconBtn} ml-auto`} style={{ borderColor: listening ? T.accent : T.borderSub, color: listening ? T.accent : T.muted }} onClick={toggleMic} aria-label="Mic" data-testid="workspace-mic"><Mic size={14} className={listening ? "animate-pulse" : ""} /></button>
                {running ? (
                  <button onClick={stopAgent} data-testid="workspace-stop"
                    className="grid h-9 w-9 place-items-center rounded-full transition-opacity hover:opacity-85"
                    style={{ background: T.text, color: T.bg }} aria-label="Pause agent">
                    <Square size={12} fill="currentColor" />
                  </button>
                ) : (
                  <button onClick={() => send()} disabled={!input.trim()} data-testid="workspace-send"
                    className="grid h-9 w-9 place-items-center rounded-full transition-opacity disabled:opacity-40"
                    style={{ background: T.accent, color: "#08090A" }} aria-label="Send">
                    <ArrowUp size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preview / manage — left side */}
        <div className="order-1 flex min-w-0 flex-1 flex-col" data-testid="workspace-right-pane">
          <div className="flex h-12 shrink-0 items-center gap-2 border-b px-4" style={{ borderColor: T.borderSub }}>
            <div className="flex rounded-md border p-0.5" style={{ borderColor: T.border }}>
              {["preview", "code", "manage"].map((t) => (
                <button key={t} onClick={() => setTab(t)} data-testid={`workspace-${t}-tab`}
                  className="rounded px-3.5 py-1 text-[13.5px] capitalize transition-colors"
                  style={tab === t ? { background: "rgba(255,255,255,0.09)", color: T.text } : { color: T.text2 }}>
                  {t}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setHelpOpen((o) => !o)} className="rounded-full border px-3.5 py-1.5 text-[13px]" style={{ borderColor: helpOpen ? T.accent : T.border, color: T.text2 }} data-testid="workspace-help-btn">Need Help?</button>
                {helpOpen && (
                  <div className="absolute right-0 top-10 z-50 w-56 overflow-hidden rounded-lg border py-1 shadow-2xl" style={{ background: T.surface, borderColor: T.border }} data-testid="workspace-help-menu">
                    <Link to="/docs" className="block px-4 py-2.5 text-[13.5px] transition-colors hover:bg-white/[0.05]" style={{ color: T.text }} data-testid="help-link-docs">📘 API Documentation</Link>
                    <Link to="/luchii-code" className="block px-4 py-2.5 text-[13.5px] transition-colors hover:bg-white/[0.05]" style={{ color: T.text }} data-testid="help-link-luchii-code">✳ Luchii Code Guide</Link>
                    <a href="mailto:support@frasberg.com" className="block px-4 py-2.5 text-[13.5px] transition-colors hover:bg-white/[0.05]" style={{ color: T.text }} data-testid="help-link-support">✉ Email Support</a>
                  </div>
                )}
              </div>
              <button className={iconBtn} style={{ borderColor: T.borderSub, color: T.muted }} onClick={() => { navigator.clipboard.writeText(window.location.href).catch(() => {}); toast.success("Workspace link copied"); }} aria-label="Share" data-testid="workspace-share"><Share2 size={13} /></button>
              <button className={iconBtn} style={{ borderColor: T.borderSub, color: T.muted }} onClick={downloadBuild} aria-label="Download build" data-testid="workspace-download"><Download size={13} /></button>
              <button className={iconBtn} style={{ borderColor: T.borderSub, color: T.muted }} onClick={() => setTab("preview")} aria-label="Reload preview" data-testid="workspace-reload"><RefreshCw size={13} /></button>
              <button onClick={republish} data-testid="workspace-republish"
                className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13.5px] font-600" style={{ background: T.text, color: T.bg }}>
                <ExternalLink size={12} /> Re-publish
              </button>
            </div>
          </div>

          {tab === "preview" ? (
            <div className="relative min-h-0 flex-1" data-testid="workspace-preview">
              {previewHtml ? (
                device !== "desktop" ? (
                  <div className="flex h-full items-center justify-center p-4" style={{ background: T.inset }}>
                    <div className={`h-full overflow-hidden border-4 shadow-2xl ${device === "mobile" ? "max-h-[700px] w-[390px] rounded-[28px]" : "max-h-[740px] w-[768px] rounded-[20px]"}`} style={{ borderColor: "#26282c" }} data-testid={`preview-${device}-frame`}>
                      <iframe title="preview" srcDoc={previewHtml} sandbox="allow-scripts" className="h-full w-full bg-white" style={{ pointerEvents: dragging ? "none" : "auto" }} />
                    </div>
                  </div>
                ) : (
                  <iframe title="preview" srcDoc={previewHtml} sandbox="allow-scripts" className="h-full w-full bg-white" style={{ pointerEvents: dragging ? "none" : "auto" }} />
                )
              ) : (
                <div className="grid h-full place-items-center">
                  <div className="text-center">
                    <img src="/luchii-mark-circle.png" alt="" className="mx-auto h-16 w-16 rounded-full opacity-80" style={{ boxShadow: "0 0 50px rgba(0,240,255,0.25)" }} />
                    <p className="mt-5 max-w-xs text-sm" style={{ color: T.text2 }}>
                      Your build preview appears here — ask Luchii to build a page and it renders live.
                    </p>
                  </div>
                </div>
              )}
              {/* Floating preview toolbar */}
              <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center">
                <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border px-1.5 py-1 shadow-2xl backdrop-blur-md" style={{ background: "rgba(12,13,15,0.92)", borderColor: T.border }} data-testid="preview-toolbar">
                  {toolbarOpen && (
                    <>
                      <button onClick={() => { setEditing(true); setTab("code"); }} data-testid="preview-edit-btn"
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] transition-colors hover:bg-white/[0.08]" style={{ color: T.text }}>
                        <MousePointerClick size={13} /> Edit
                      </button>
                      <button onClick={() => setDevice((d) => (d === "desktop" ? "tablet" : d === "tablet" ? "mobile" : "desktop"))} data-testid="preview-device-btn" aria-label="Toggle device preview" title="Desktop / tablet / mobile preview"
                        className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-white/[0.08]" style={{ color: device !== "desktop" ? T.accent : T.text2 }}>
                        {device === "mobile" ? <Smartphone size={14} /> : device === "tablet" ? <Tablet size={14} /> : <Monitor size={14} />}
                      </button>
                      {htmlOverride !== null && (
                        <button onClick={() => { setHtmlOverride(null); toast.success("Edits reverted — back to the agent's original build"); }} data-testid="preview-undo-btn" aria-label="Undo edits" title="Revert to agent's original build"
                          className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-white/[0.08]" style={{ color: "#FBBF24" }}>
                          <Undo2 size={14} />
                        </button>
                      )}
                      <button onClick={() => setFullPreview((f) => !f)} data-testid="preview-fullscreen-btn" aria-label="Toggle full preview" title="Full-screen preview"
                        className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-white/[0.08]" style={{ color: fullPreview ? T.accent : T.text2 }}>
                        {fullPreview ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                      </button>
                    </>
                  )}
                  <button onClick={() => setToolbarOpen((o) => !o)} data-testid="preview-toolbar-collapse" aria-label="Toggle toolbar" title="Collapse toolbar"
                    className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-white/[0.08]" style={{ color: T.text2 }}>
                    {toolbarOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  </button>
                </div>
              </div>
            </div>
          ) : tab === "code" ? (
            <div className="min-h-0 flex-1 overflow-auto p-4" data-testid="workspace-code">
              {previewHtml || editing ? (
                <div className="relative flex h-full flex-col rounded-md border" style={{ borderColor: T.borderSub, background: T.inset }}>
                  <div className="flex shrink-0 items-center justify-between border-b px-3 py-2" style={{ borderColor: T.borderSub }}>
                    <span className="font-mono text-[12.5px]" style={{ color: editing ? T.accent : T.text2 }} data-testid="workspace-code-status">
                      {editing ? "● Editing — changes update the preview live" : "Source"}
                    </span>
                    <span className="flex items-center gap-2">
                      <button onClick={() => { navigator.clipboard.writeText(previewHtml || "").catch(() => {}); toast.success("Code copied"); }}
                        className="flex items-center gap-1.5 rounded border px-2.5 py-1 text-[13px]" style={{ borderColor: T.border, color: T.text2, background: T.surface }} data-testid="workspace-code-copy">
                        <Copy size={11} /> Copy
                      </button>
                      {htmlOverride !== null && (
                        <button onClick={() => { setHtmlOverride(null); toast.success("Edits reverted — back to the agent's original build"); }}
                          className="flex items-center gap-1.5 rounded border px-2.5 py-1 text-[13px]" style={{ borderColor: "#FBBF24", color: "#FBBF24" }} data-testid="workspace-code-undo">
                          <Undo2 size={11} /> Undo edits
                        </button>
                      )}
                      {editing ? (
                        <button onClick={() => { setEditing(false); setTab("preview"); toast.success("Edits applied to preview"); }}
                          className="rounded border px-2.5 py-1 text-[13px] font-600" style={{ borderColor: T.accent, color: T.accent }} data-testid="workspace-code-done">
                          Done — view preview
                        </button>
                      ) : (
                        <button onClick={() => setEditing(true)}
                          className="flex items-center gap-1.5 rounded border px-2.5 py-1 text-[13px]" style={{ borderColor: T.border, color: T.text2, background: T.surface }} data-testid="workspace-code-edit">
                          <MousePointerClick size={11} /> Edit
                        </button>
                      )}
                    </span>
                  </div>
                  {editing ? (
                    <textarea value={previewHtml || ""} onChange={(e) => setHtmlOverride(e.target.value)} spellCheck={false} data-testid="workspace-code-editor"
                      className="min-h-0 flex-1 resize-none bg-transparent p-4 font-mono text-[13px] leading-relaxed outline-none" style={{ color: "#c9d1d9" }} />
                  ) : (
                    <pre className="min-h-0 flex-1 overflow-auto p-4 font-mono text-[13px] leading-relaxed" style={{ color: "#c9d1d9" }}>{previewHtml}</pre>
                  )}
                </div>
              ) : (
                <div className="grid h-full place-items-center">
                  <p className="max-w-xs text-center text-sm" style={{ color: T.text2 }}>No code yet — ask Luchii to build something and the source appears here.</p>
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
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 text-[13.5px]" style={{ borderColor: T.border, background: T.surface }}>
                    <span style={{ color: T.text2 }}>Noticing issues on your live app?</span>
                    <span className="flex gap-4">
                      <button className="underline" style={{ color: T.text }} onClick={() => { setTab("preview"); send("Something looks broken in the app you built — diagnose likely issues and fix them."); }} data-testid="manage-ask-fix">Ask agent to fix</button>
                      <button className="underline" style={{ color: T.text }} onClick={() => toast("Support: hello@frasberg.com")}>Contact Support</button>
                    </span>
                  </div>
                  <div className="mt-4 rounded-lg border p-4" style={{ borderColor: T.border, background: T.surface }}>
                    <p className="flex items-center gap-2 text-[13.5px] font-600">Run a review
                      <span className="rounded px-1.5 py-0.5 text-[13.5px] font-700 uppercase" style={{ background: "#2563EB", color: "#fff" }}>New</span>
                    </p>
                    <p className="mt-0.5 text-[13.5px]" style={{ color: T.text2 }}>Let a specialist subagent review your deployed app</p>
                    <div className="mt-3 flex gap-2">
                      <select value={reviewKind} onChange={(e) => setReviewKind(e.target.value)} data-testid="manage-review-select"
                        className="flex-1 rounded-md border px-3 py-2 text-[13.5px] outline-none" style={{ borderColor: T.border, background: T.inset, color: T.text }}>
                        <option>Code Review</option>
                        <option>Security Review</option>
                        <option>Performance Review</option>
                      </select>
                      <button onClick={runReview} data-testid="manage-run-review"
                        className="rounded-md border px-4 py-2 text-[13.5px]" style={{ borderColor: T.border, color: T.text }}>✦ Run review</button>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg border p-4" style={{ borderColor: T.border, background: T.surface }} data-testid="manage-custom-url">
                    <p className="text-[13.5px] font-600">Custom preview URL</p>
                    <p className="mt-0.5 text-[13.5px]" style={{ color: T.text2 }}>Pick a name — like a GitHub username — and your app gets its own address</p>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[13.5px]" style={{ color: T.muted }}>https://</span>
                      <input value={slugName} onChange={(e) => setSlugName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        placeholder="my-app-name" maxLength={30} data-testid="custom-url-input"
                        className="w-44 rounded-md border px-3 py-1.5 font-mono text-[13.5px] outline-none"
                        style={{ borderColor: slugStatus === "taken" || slugStatus === "invalid" ? "#EF4444" : slugStatus === "available" ? "#10B981" : T.border, background: T.inset, color: T.text }} />
                      <span className="font-mono text-[13.5px]" style={{ color: T.muted }}>.preview.frasberg.com</span>
                      <button onClick={claimSlug} disabled={slugStatus !== "available"} data-testid="custom-url-claim"
                        className="rounded-md px-4 py-1.5 text-[13.5px] font-600 transition-opacity disabled:opacity-40"
                        style={{ background: T.accent, color: "#08090A" }}>Claim</button>
                    </div>
                    <p className="mt-2 font-mono text-[13px]" data-testid="custom-url-status" style={{ color: slugStatus === "available" ? "#10B981" : slugStatus ? "#EF4444" : T.muted }}>
                      {slugStatus === "checking" && "Checking availability…"}
                      {slugStatus === "available" && `✓ ${slugName} is available`}
                      {slugStatus === "taken" && `✗ ${slugName} is taken — try another`}
                      {slugStatus === "invalid" && "✗ 3–30 chars: lowercase letters, numbers and hyphens"}
                      {!slugStatus && !savedSlug && "Your app keeps working at its standard link either way"}
                    </p>
                    {slugStatus === "taken" && slugSuggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-2" data-testid="custom-url-suggestions">
                        <span className="font-mono text-[13px]" style={{ color: T.text2 }}>Available instead:</span>
                        {slugSuggestions.map((s) => (
                          <button key={s} onClick={() => setSlugName(s)} data-testid={`slug-suggestion-${s}`}
                            className="rounded-full border px-3 py-1 font-mono text-[13px] transition-colors hover:bg-white/[0.05]"
                            style={{ borderColor: T.accent, color: T.accent }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                    {savedSlug && (
                      <div className="mt-2 flex flex-wrap items-center gap-3 rounded-md border px-3 py-2" style={{ borderColor: "rgba(16,185,129,0.35)" }} data-testid="custom-url-active">
                        <span className="font-mono text-[13.5px]" style={{ color: "#10B981" }}>● https://{savedSlug}.preview.frasberg.com</span>
                        <a className="text-[13.5px] underline" style={{ color: T.accent }} href={`${process.env.REACT_APP_BACKEND_URL}/api/workspace/app/${savedSlug}`} target="_blank" rel="noreferrer" data-testid="custom-url-open">Open app ↗</a>
                        <button className="text-[13.5px] underline" style={{ color: T.text2 }} onClick={() => { navigator.clipboard.writeText(`https://${savedSlug}.preview.frasberg.com`).catch(() => {}); toast.success("Custom URL copied"); }}>Copy</button>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 rounded-lg border p-4" style={{ borderColor: T.border, background: T.surface }} data-testid="manage-github">
                    <p className="flex items-center gap-2 text-[13.5px] font-600"><Github size={14} /> Fork from GitHub</p>
                    <p className="mt-0.5 text-[13.5px]" style={{ color: T.text2 }}>Fork a repo to your GitHub, import its code into this workspace to edit with Luchii, or scaffold it Frasberg-ready — sign in with GitHub first</p>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <input value={ghOwner} onChange={(e) => setGhOwner(e.target.value.trim())} placeholder="owner" maxLength={100} data-testid="github-fork-owner"
                        className="w-36 rounded-md border px-3 py-1.5 font-mono text-[13.5px] outline-none" style={{ borderColor: T.border, background: T.inset, color: T.text }} />
                      <span className="font-mono text-[14px]" style={{ color: T.muted }}>/</span>
                      <input value={ghRepo} onChange={(e) => setGhRepo(e.target.value.trim())} placeholder="repository" maxLength={100} data-testid="github-fork-repo"
                        className="w-44 rounded-md border px-3 py-1.5 font-mono text-[13.5px] outline-none" style={{ borderColor: T.border, background: T.inset, color: T.text }} />
                      <button onClick={forkGithub} disabled={!ghOwner || !ghRepo || ghBusy} data-testid="github-fork-btn"
                        className="flex items-center gap-1.5 rounded-md px-4 py-1.5 text-[13.5px] font-600 transition-opacity disabled:opacity-40"
                        style={{ background: T.text, color: T.bg }}>
                        <GitFork size={12} /> {ghBusy ? "Working…" : "Fork"}
                      </button>
                      <button onClick={importGithub} disabled={!ghOwner || !ghRepo || ghBusy} data-testid="github-import-btn"
                        title="Load the repo's code into this workspace so you can edit it with Luchii"
                        className="flex items-center gap-1.5 rounded-md border px-4 py-1.5 text-[13.5px] font-600 transition-opacity disabled:opacity-40"
                        style={{ borderColor: T.accent, color: T.accent }}>
                        <Download size={12} /> Import
                      </button>
                      <button onClick={scaffoldGithub} disabled={!ghOwner || !ghRepo || ghBusy} data-testid="github-scaffold-btn"
                        title="Inject Frasberg SDK starter files (frasberg.json, src/index.ts) into your fork"
                        className="flex items-center gap-1.5 rounded-md border px-4 py-1.5 text-[13.5px] font-600 transition-opacity disabled:opacity-40"
                        style={{ borderColor: T.border, color: T.text2 }}>
                        <Sparkles size={12} /> Scaffold
                      </button>
                      <button onClick={loadGhRepos} disabled={ghListBusy} data-testid="github-my-repos-btn"
                        title="List your own GitHub repositories"
                        className="flex items-center gap-1.5 rounded-md border px-4 py-1.5 text-[13.5px] font-600 transition-opacity disabled:opacity-40"
                        style={{ borderColor: T.border, color: T.text2 }}>
                        <Github size={12} /> {ghListBusy ? "Loading…" : ghRepos ? "Hide repos" : "My repos"}
                      </button>
                      <button onClick={() => exportGithub()} disabled={!ghOwner || !ghRepo || ghBusy} data-testid="github-push-btn"
                        title="Commit this app's HTML to the repo (creates the repo if it's yours and missing)"
                        className="flex items-center gap-1.5 rounded-md border px-4 py-1.5 text-[13.5px] font-600 transition-opacity disabled:opacity-40"
                        style={{ borderColor: "#10B981", color: "#10B981" }}>
                        <ArrowUp size={12} /> Push
                      </button>
                      <button onClick={syncAgents} disabled={ghSyncBusy} data-testid="github-agent-sync-btn"
                        title="Scan all your repos for agent.json / luchii.yaml and sync them into your agent registry"
                        className="flex items-center gap-1.5 rounded-md border px-4 py-1.5 text-[13.5px] font-600 transition-opacity disabled:opacity-40"
                        style={{ borderColor: T.border, color: T.text2 }}>
                        <RefreshCw size={12} className={ghSyncBusy ? "animate-spin" : ""} /> {ghSyncBusy ? "Scanning…" : "Sync agents"}
                      </button>
                    </div>
                    {ghResult && (
                      <p className="mt-2 font-mono text-[13px]" style={{ color: "#10B981" }} data-testid="github-fork-result">
                        ✓ Forked — <a className="underline" href={ghResult} target="_blank" rel="noreferrer">{ghResult}</a>
                      </p>
                    )}
                    {ghAgent && (
                      <div className="mt-3 rounded-md border p-3" style={{ borderColor: "rgba(0,240,255,0.3)", background: "rgba(0,240,255,0.04)" }} data-testid="github-agent-details">
                        {ghAgent.error ? (
                          <p className="text-[13px]" style={{ color: "#FBBF24" }}>{ghAgent.file}: {ghAgent.error}</p>
                        ) : (
                          <>
                            <p className="flex items-center gap-2 text-[13.5px] font-600" style={{ color: T.accent }}>
                              <Bot size={13} /> {ghAgent.name || ghAgent.id || "Agent"} <span className="font-mono text-[12px] font-400" style={{ color: T.text2 }}>· {ghAgent.file} · {ghAgent.repo}</span>
                            </p>
                            {ghAgent.description && <p className="mt-1 text-[13px]" style={{ color: T.text2 }}>{ghAgent.description}</p>}
                            <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[12px]">
                              {ghAgent.model && <span className="rounded-full border px-2.5 py-0.5" style={{ borderColor: T.border, color: T.text2 }}>model: {ghAgent.model}</span>}
                              {ghAgent.entrypoint && <span className="rounded-full border px-2.5 py-0.5" style={{ borderColor: T.border, color: T.text2 }}>entry: {ghAgent.entrypoint}</span>}
                              {Object.entries(ghAgent.capabilities || {}).filter(([, v]) => v).map(([k]) => (
                                <span key={k} className="rounded-full border px-2.5 py-0.5" style={{ borderColor: "rgba(0,240,255,0.4)", color: T.accent }}>{k}</span>
                              ))}
                              {(ghAgent.tools || []).map((t) => (
                                <span key={t} className="rounded-full border px-2.5 py-0.5" style={{ borderColor: T.border, color: T.text2 }}>tool: {t}</span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    {ghRepos && (
                      <div className="mt-3 max-h-64 overflow-y-auto rounded-md border" style={{ borderColor: T.borderSub }} data-testid="github-repo-browser">
                        {ghRepos.length === 0 && <p className="p-3 text-[13.5px]" style={{ color: T.text2 }}>No repositories found on your account.</p>}
                        {ghRepos.map((r) => (
                          <div key={r.full_name} className="flex items-center gap-2 border-b px-3 py-2 last:border-b-0" style={{ borderColor: T.borderSub }} data-testid={`github-repo-row-${r.name}`}>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-mono text-[13px]" style={{ color: T.text }}>{r.full_name}{r.private ? " · private" : ""}</p>
                              {r.description && <p className="truncate text-[12.5px]" style={{ color: T.muted }}>{r.description}</p>}
                            </div>
                            <button onClick={() => forkGithub(r.owner, r.name)} disabled={ghBusy} className="rounded border px-2.5 py-1 text-[12.5px] disabled:opacity-40" style={{ borderColor: T.border, color: T.text2 }} data-testid={`repo-fork-${r.name}`}>Fork</button>
                            <button onClick={() => importGithub(r.owner, r.name)} disabled={ghBusy} className="rounded border px-2.5 py-1 text-[12.5px] disabled:opacity-40" style={{ borderColor: T.accent, color: T.accent }} data-testid={`repo-import-${r.name}`}>Import</button>
                            <button onClick={() => scaffoldGithub(r.owner, r.name)} disabled={ghBusy} className="rounded border px-2.5 py-1 text-[12.5px] disabled:opacity-40" style={{ borderColor: T.border, color: T.text2 }} data-testid={`repo-scaffold-${r.name}`}>Scaffold</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {ghSynced && (
                      <div className="mt-3 rounded-md border p-3" style={{ borderColor: T.borderSub }} data-testid="github-synced-agents">
                        <p className="font-mono text-[12px] uppercase tracking-wide" style={{ color: T.muted }}>Synced agents ({ghSynced.length})</p>
                        {ghSynced.length === 0 && <p className="mt-1.5 text-[13px]" style={{ color: T.text2 }}>No agent.json or luchii.yaml found in your repos — add one and re-sync.</p>}
                        {ghSynced.map((s) => (
                          <div key={s.repo} className="mt-2 flex flex-wrap items-center gap-2" data-testid={`synced-agent-${s.repo.replace("/", "-")}`}>
                            <Bot size={13} style={{ color: T.accent }} />
                            <span className="text-[13px] font-600" style={{ color: T.text }}>{s.agent?.name || s.agent?.id || "Agent"}</span>
                            <span className="font-mono text-[12px]" style={{ color: T.text2 }}>{s.repo} · {s.agent?.file}{s.agent?.model ? ` · ${s.agent.model}` : ""}</span>
                            <span className="rounded-full border px-2 py-0.5 font-mono text-[11px]" style={{ borderColor: T.border, color: T.muted }}>{s.source === "webhook_push" ? "auto · push" : "manual"}</span>
                            <button onClick={() => deployAgent(s.repo)} disabled={ghDeploying === s.repo} data-testid={`deploy-agent-${s.repo.replace("/", "-")}`}
                              title="Publish this agent to the Frasberg Marketplace in one click"
                              className="rounded-full border px-3 py-0.5 text-[12px] font-600 transition-opacity disabled:opacity-40"
                              style={{ borderColor: T.accent, color: T.accent }}>
                              {ghDeploying === s.repo ? "Deploying…" : "Deploy to Marketplace"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 rounded-lg border p-4" style={{ borderColor: T.border, background: T.surface }} data-testid="manage-publishes">
                    <p className="text-[13.5px] font-600">Publishes</p>
                    <p className="mt-0.5 text-[13.5px]" style={{ color: T.text2 }}>All published versions of your app</p>
                    {publishes.length === 0 ? (
                      <p className="mt-3 font-mono text-[13px]" style={{ color: T.muted }}>No publishes yet — hit Re-publish once the agent builds something.</p>
                    ) : (
                      publishes.map((p) => (
                        <div key={p.n} className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: T.borderSub }} data-testid={`publish-row-${p.n}`}>
                          <span className="flex items-center gap-2 text-[13.5px]">
                            <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#10B981" }} />
                            Publish {p.n} · {p.at.toLocaleTimeString()} <code className="font-mono text-[13.5px]" style={{ color: T.muted }}>{p.hash}</code>
                          </span>
                          <span className="flex gap-3">
                            {p.url && <a className="text-[13.5px] underline" style={{ color: T.accent }} href={`${process.env.REACT_APP_BACKEND_URL}${p.url}`} target="_blank" rel="noreferrer" data-testid={`publish-open-${p.n}`}>Open ↗</a>}
                            <button className="text-[13.5px] underline" style={{ color: T.text2 }} onClick={() => toast(`Logs for publish ${p.n}: build OK · deploy OK · healthy`)}>View Logs</button>
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <button className="text-[13.5px] underline" style={{ color: T.text2 }} onClick={() => toast("Thanks — feedback noted!")}>Give us feedback</button>
                    <div className="flex gap-2">
                      <button onClick={healthCheck} data-testid="manage-health-check"
                        className="rounded-full border px-4 py-2 text-[13.5px]" style={{ borderColor: T.border, color: T.text }}>Run health check</button>
                      <button onClick={republish} className="rounded-full px-4 py-2 text-[13.5px] font-600" style={{ background: T.text, color: T.bg }}>Re-publish changes</button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-5 rounded-lg border p-5 text-[13.5px]" style={{ borderColor: T.border, background: T.surface, color: T.text2 }}>
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
