import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Moon, Sun, ArrowLeft, Loader2, User, Check, Crown, Mic, Square, Pencil, Plus, Trash2, AudioWaveform } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "../context/ThemeContext";
import { useAuth, formatApiErrorDetail } from "../context/AuthContext";
import Starfield from "../components/site/Starfield";
import Seo from "../components/site/Seo";
import { TrialBanner } from "../components/site/TrialBanner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Profile() {
  const { theme, toggle } = useTheme();
  const { user, logout, refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busyName, setBusyName] = useState(false);
  const [busyPw, setBusyPw] = useState(false);
  const [paypal, setPaypal] = useState(null);
  const [showPay, setShowPay] = useState(false);
  const [memories, setMemories] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [newFact, setNewFact] = useState("");
  const [voiceClone, setVoiceClone] = useState(null);
  const [recState, setRecState] = useState("idle");
  const recRef = useState({ rec: null, timer: null })[0];

  useEffect(() => {
    if (!user) return;
    axios.get(`${API}/memory`, { withCredentials: true }).then((r) => setMemories(r.data)).catch(() => {});
    axios.get(`${API}/voice/clone/status`, { withCredentials: true }).then((r) => setVoiceClone(r.data)).catch(() => {});
  }, [user]);

  async function forget(id) {
    try {
      await axios.delete(`${API}/memory/${id}`, { withCredentials: true });
      setMemories((m) => m.filter((x) => x.id !== id));
      toast.success("Luchii forgot it");
    } catch { toast.error("Could not delete"); }
  }

  async function saveMemory(id) {
    try {
      const r = await axios.put(`${API}/memory/${id}`, { fact: editText }, { withCredentials: true });
      setMemories((m) => m.map((x) => (x.id === id ? { ...x, fact: r.data.fact } : x)));
      setEditId(null);
      toast.success("Memory updated");
    } catch (err) { toast.error(formatApiErrorDetail(err.response?.data?.detail)); }
  }

  async function addMemory(e) {
    e.preventDefault();
    if (newFact.trim().length < 4) { toast.error("Write a short fact first"); return; }
    try {
      const r = await axios.post(`${API}/memory`, { fact: newFact.trim() }, { withCredentials: true });
      setMemories((m) => [r.data, ...m]);
      setNewFact("");
      toast.success("Luchii will remember that");
    } catch (err) { toast.error(formatApiErrorDetail(err.response?.data?.detail)); }
  }

  async function uploadVoiceSample(blob) {
    setRecState("uploading");
    try {
      const fd = new FormData();
      fd.append("file", blob, "sample.webm");
      const r = await axios.post(`${API}/voice/clone`, fd, { withCredentials: true });
      setVoiceClone((v) => ({ ...(v || {}), has_sample: true, cloning_status: r.data.cloning_status }));
      toast.success(`Voice sample saved (${r.data.duration_sec}s) — Luchii can now speak in your voice`);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Upload failed");
    } finally { setRecState("idle"); }
  }

  async function toggleVoiceRecord() {
    if (recState === "recording") {
      recRef.rec?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        clearTimeout(recRef.timer);
        stream.getTracks().forEach((t) => t.stop());
        uploadVoiceSample(new Blob(chunks, { type: "audio/webm" }));
      };
      rec.start();
      recRef.rec = rec;
      recRef.timer = setTimeout(() => { if (rec.state !== "inactive") rec.stop(); }, 15000);
      setRecState("recording");
      toast.info("Recording — read a few sentences naturally (up to 15s)");
    } catch { toast.error("Microphone access denied"); }
  }

  async function deleteVoiceSample() {
    try {
      await axios.delete(`${API}/voice/clone`, { withCredentials: true });
      setVoiceClone((v) => ({ ...(v || {}), has_sample: false }));
      toast.success("Cloned voice removed");
    } catch { toast.error("Could not remove"); }
  }

  useEffect(() => { if (user) setName(user.name || ""); }, [user]);
  useEffect(() => {
    fetch(`${API}/paypal/config`).then((r) => r.json()).then(setPaypal).catch(() => setPaypal({ configured: false }));
  }, []);

  const upgradePlan = paypal?.upgrade_plans?.[0];

  if (user === false) return <Navigate to="/auth?mode=login&next=%2Fprofile" replace />;

  async function saveName(e) {
    e.preventDefault();
    setBusyName(true);
    try {
      await axios.patch(`${API}/auth/profile`, { name }, { withCredentials: true });
      toast.success("Name updated");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally { setBusyName(false); }
  }

  async function changePw(e) {
    e.preventDefault();
    setBusyPw(true);
    try {
      await axios.post(`${API}/auth/change-password`, { current_password: current, new_password: next }, { withCredentials: true });
      toast.success("Password changed");
      setCurrent(""); setNext("");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally { setBusyPw(false); }
  }

  return (
    <main className="relative z-10 min-h-screen bg-lux-bg text-lux-text" data-testid="profile-page">
      <Seo title="Your Profile — Luchii by Frasberg" description="Manage your Frasberg account: name, password and plan." />
      <div className="pointer-events-none absolute inset-0 opacity-40"><Starfield /></div>

      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/chat" className="flex items-center gap-2.5" data-testid="profile-back-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <img src="/luchii-logo.webp" alt="Frasberg Luchii" className="h-8 w-8 rounded-full ring-1 ring-lux-accent/40" />
            <span className="font-display text-lg font-700 tracking-tight">Profile</span>
          </Link>
          <button onClick={toggle} aria-label="Toggle theme" data-testid="profile-theme-toggle"
            className="grid h-10 w-10 place-items-center rounded-full border border-lux-border transition-colors hover:border-lux-accent hover:text-lux-accent">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>
      <TrialBanner />

      <div className="relative mx-auto max-w-3xl px-5 py-12 sm:px-8">
        {!user ? (
          <div className="grid h-64 place-items-center"><Loader2 size={26} className="animate-spin text-lux-accent" /></div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-full border border-lux-accent/50 text-lux-accent" style={{ boxShadow: "0 0 34px var(--lux-glow)" }}>
                <User size={22} />
              </span>
              <div>
                <h1 className="flex items-center gap-3 font-display text-3xl font-700 tracking-tighter" data-testid="profile-name-display">
                  {user.name}
                  {user.plan === "premium" && (
                    <span className="rounded-full border border-amber-400/50 bg-amber-400/10 px-3 py-1 font-mono text-[10px] font-700 uppercase tracking-[0.15em] text-amber-300" data-testid="profile-premium-badge">Premium</span>
                  )}
                </h1>
                <p className="font-mono text-xs text-lux-text2">{user.email} · <span className="uppercase text-lux-accent">{user.plan} plan</span></p>
              </div>
            </div>

            <form onSubmit={saveName} className="mt-10 rounded-2xl border border-lux-border bg-lux-surface p-7">
              <h2 className="font-display text-xl font-600 tracking-tight">Display name</h2>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input value={name} onChange={(e) => setName(e.target.value)} data-testid="profile-name-input"
                  className="flex-1 rounded-full border border-lux-border bg-lux-bg px-5 py-3 text-sm outline-none focus:border-lux-accent" />
                <button type="submit" disabled={busyName} data-testid="profile-save-name-btn"
                  className="rounded-full bg-lux-text px-6 py-3 text-sm font-600 text-lux-bg transition-transform hover:-translate-y-0.5 disabled:opacity-50">
                  {busyName ? "Saving…" : "Save"}
                </button>
              </div>
            </form>

            <form onSubmit={changePw} className="mt-6 rounded-2xl border border-lux-border bg-lux-surface p-7">
              <h2 className="font-display text-xl font-600 tracking-tight">Change password</h2>
              <div className="mt-4 space-y-3">
                <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)}
                  placeholder="Current password" data-testid="profile-current-password"
                  className="w-full rounded-full border border-lux-border bg-lux-bg px-5 py-3 text-sm outline-none focus:border-lux-accent" />
                <input type="password" required value={next} onChange={(e) => setNext(e.target.value)}
                  placeholder="New password (min 6 characters)" data-testid="profile-new-password"
                  className="w-full rounded-full border border-lux-border bg-lux-bg px-5 py-3 text-sm outline-none focus:border-lux-accent" />
                <button type="submit" disabled={busyPw} data-testid="profile-change-password-btn"
                  className="rounded-full bg-lux-text px-6 py-3 text-sm font-600 text-lux-bg transition-transform hover:-translate-y-0.5 disabled:opacity-50">
                  {busyPw ? "Updating…" : "Update password"}
                </button>
              </div>
            </form>

            <div className="mt-6 rounded-2xl border border-lux-accent/50 bg-lux-surface p-7" data-testid="profile-upgrade-card">
              <h2 className="flex items-center gap-2 font-display text-xl font-600 tracking-tight">
                <Crown size={19} className="text-lux-accent" /> Luchii Pro
              </h2>
              {user.plan === "pro" || user.plan === "premium" || user.role === "admin" ? (
                <p className="mt-3 text-sm text-lux-text2" data-testid="profile-pro-active">
                  <Check size={14} className="mr-1 inline text-lux-accent" />
                  You are on the {user.plan === "premium" ? "Premium" : "Pro"} plan — 200 images/day and priority Video Creator access.
                </p>
              ) : (
                <>
                  <p className="mt-2 font-display text-3xl font-700">${upgradePlan?.price || "15.00"}<span className="text-sm font-400 text-lux-text2"> one-time</span></p>
                  <ul className="mt-4 space-y-2 text-sm text-lux-text2">
                    <li className="flex items-center gap-2"><Check size={15} className="text-lux-accent" /> 200 images/day (free plan: 20/day)</li>
                    <li className="flex items-center gap-2"><Check size={15} className="text-lux-accent" /> Priority Luchii Video Creator access at launch</li>
                    <li className="flex items-center gap-2"><Check size={15} className="text-lux-accent" /> Unlimited chat, voice & attachments</li>
                  </ul>
                  {paypal?.configured && upgradePlan ? (
                    showPay ? (
                      <div className="mt-5">
                        <PayPalScriptProvider options={{ "client-id": paypal.client_id, currency: "USD", intent: "capture" }}>
                          <PayPalButtons
                            style={{ layout: "vertical", color: "black", shape: "pill", label: "pay" }}
                            createOrder={async () => {
                              const res = await fetch(`${API}/paypal/orders`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                credentials: "include",
                                body: JSON.stringify({ plan_id: upgradePlan.id }),
                              });
                              const d = await res.json();
                              if (!d.id) throw new Error("order failed");
                              return d.id;
                            }}
                            onApprove={async (data) => {
                              const res = await fetch(`${API}/paypal/orders/${data.orderID}/capture`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                credentials: "include",
                                body: JSON.stringify({ plan_id: upgradePlan.id }),
                              });
                              const d = await res.json();
                              if (d.status === "COMPLETED" && d.upgraded) {
                                toast.success("Welcome to Luchii Pro!");
                                setShowPay(false);
                                refreshUser();
                              } else {
                                toast.error("Payment not completed");
                              }
                            }}
                            onError={() => toast.error("PayPal error — please try again")}
                          />
                        </PayPalScriptProvider>
                        <button onClick={() => setShowPay(false)} className="mt-2 w-full text-center font-mono text-xs text-lux-text2 hover:text-lux-text">cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowPay(true)}
                        data-testid="profile-upgrade-btn"
                        className="mt-5 w-full rounded-full bg-lux-accent px-6 py-3 text-sm font-600 text-lux-bg transition-transform hover:-translate-y-0.5"
                      >
                        Upgrade to Luchii Pro
                      </button>
                    )
                  ) : (
                    <p className="mt-5 font-mono text-xs text-lux-text2">Checkout unavailable — PayPal not configured.</p>
                  )}
                  <Link to="/pay" data-testid="profile-cashapp-link"
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[#00d64f]/50 px-6 py-3 text-sm font-600 text-[#00d64f] transition-colors hover:bg-[#00d64f]/10">
                    Pay with Cash App
                  </Link>
                </>
              )}
            </div>

            {user?.role === "admin" && (
              <Link to="/downloads" data-testid="profile-downloads-link"
                className="mt-6 flex items-center justify-between rounded-2xl border border-lux-border bg-lux-surface p-6 transition-colors hover:border-lux-accent">
                <div>
                  <h2 className="font-display text-xl font-600 tracking-tight">My certified downloads</h2>
                  <p className="mt-1 text-xs text-lux-text2">Every court PDF you own — re-download any time, free.</p>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-lux-accent">Open →</span>
              </Link>
            )}
            <div className="mt-6 rounded-2xl border border-lux-border bg-lux-surface p-7" data-testid="profile-memory-card">
              <h2 className="font-display text-xl font-600 tracking-tight">Memory Manager</h2>
              <p className="mt-2 text-xs text-lux-text2">Everything Luchii remembers about you. Add, edit or delete any fact — she uses them to personalize every reply.</p>
              <form onSubmit={addMemory} className="mt-4 flex gap-2">
                <input value={newFact} onChange={(e) => setNewFact(e.target.value)} placeholder="Teach Luchii a fact about you…"
                  data-testid="memory-add-input"
                  className="flex-1 rounded-xl border border-lux-border bg-lux-bg px-4 py-2.5 text-sm text-lux-text outline-none focus:border-lux-accent" />
                <button type="submit" data-testid="memory-add-btn" aria-label="Add memory"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lux-text text-lux-bg transition-transform hover:-translate-y-0.5">
                  <Plus size={16} />
                </button>
              </form>
              <div className="mt-4 space-y-2">
                {memories.length === 0 && <p className="text-sm text-lux-text2" data-testid="profile-memory-empty">Nothing remembered yet — just keep chatting.</p>}
                {memories.map((m) => (
                  <div key={m.id} className="flex items-start justify-between gap-3 rounded-xl border border-lux-border bg-lux-bg px-4 py-3" data-testid={`memory-${m.id}`}>
                    {editId === m.id ? (
                      <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); saveMemory(m.id); }}>
                        <input value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus
                          data-testid={`memory-edit-input-${m.id}`}
                          className="flex-1 rounded-lg border border-lux-accent bg-lux-surface px-3 py-1.5 text-sm text-lux-text outline-none" />
                        <button type="submit" data-testid={`memory-save-${m.id}`} className="font-mono text-[10px] uppercase text-lux-accent">save</button>
                        <button type="button" onClick={() => setEditId(null)} className="font-mono text-[10px] uppercase text-lux-text2">cancel</button>
                      </form>
                    ) : (
                      <>
                        <p className="text-sm text-lux-text2">{m.fact}</p>
                        <span className="flex shrink-0 items-center gap-3">
                          <button onClick={() => { setEditId(m.id); setEditText(m.fact); }} aria-label="Edit" data-testid={`memory-edit-${m.id}`}
                            className="text-lux-text2 hover:text-lux-accent"><Pencil size={13} /></button>
                          <button onClick={() => forget(m.id)} aria-label="Forget" data-testid={`memory-forget-${m.id}`}
                            className="font-mono text-[10px] uppercase text-lux-text2 hover:text-red-400">forget</button>
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-lux-border bg-lux-surface p-7" data-testid="profile-voice-clone-card">
              <h2 className="flex items-center gap-2 font-display text-xl font-600 tracking-tight"><AudioWaveform size={18} className="text-lux-accent" /> My Voice</h2>
              <p className="mt-2 text-xs text-lux-text2">
                Record a short sample (5-15 seconds of natural speech) and Luchii will answer in your own cloned voice —
                built entirely on Frasberg infrastructure. Pick "My Voice" in the chat voice gallery once saved.
              </p>
              {voiceClone?.has_sample && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-lux-accent/50 px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-lux-accent" data-testid="voice-clone-active">
                  <Check size={11} /> Cloned voice active
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button onClick={toggleVoiceRecord} disabled={recState === "uploading"} data-testid="voice-clone-record-btn"
                  className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-600 transition-transform hover:-translate-y-0.5 disabled:opacity-50 ${
                    recState === "recording" ? "border border-red-500 text-red-500" : "bg-lux-text text-lux-bg"
                  }`}>
                  {recState === "uploading" ? <Loader2 size={15} className="animate-spin" /> : recState === "recording" ? <Square size={14} /> : <Mic size={15} />}
                  {recState === "uploading" ? "Saving…" : recState === "recording" ? "Stop & save" : voiceClone?.has_sample ? "Re-record sample" : "Record my voice"}
                </button>
                {voiceClone?.has_sample && (
                  <button onClick={deleteVoiceSample} data-testid="voice-clone-delete-btn"
                    className="inline-flex items-center gap-1.5 rounded-full border border-lux-border px-5 py-3 text-xs text-lux-text2 transition-colors hover:border-red-400 hover:text-red-400">
                    <Trash2 size={13} /> Remove
                  </button>
                )}
              </div>
              {voiceClone && voiceClone.cloning_status !== "ready" && (
                <p className="mt-3 font-mono text-[10px] uppercase tracking-wide text-lux-text2" data-testid="voice-clone-engine-status">
                  Cloning engine: {voiceClone.cloning_status === "loading" ? "warming up…" : voiceClone.cloning_status}
                </p>
              )}
            </div>

            {user.role === "admin" && (
              <Link to="/admin" data-testid="profile-admin-link"
                className="mt-6 inline-block rounded-full border border-lux-accent px-6 py-3 text-sm font-600 text-lux-accent transition-transform hover:-translate-y-0.5">
                Open Admin Console →
              </Link>
            )}

            <button onClick={logout} data-testid="profile-signout-btn"
              className="mt-8 rounded-full border border-lux-border px-6 py-3 text-sm text-lux-text2 transition-colors hover:border-red-400 hover:text-red-400">
              Sign out
            </button>
          </>
        )}
      </div>
    </main>
  );
}
