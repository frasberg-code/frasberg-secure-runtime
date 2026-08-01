import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Check, Copy, ExternalLink, Loader2, Lock, BadgeCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import Seo from "../components/site/Seo";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ARCH = ["Client", "TLS 1.3 + Mutual Auth", "API Gateway", "Identity Verification", "Authorization", "Encrypted AI Runtime", "Luchii AI Models", "Response"];

export default function Pay() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [cfg, setCfg] = useState(null);
  const [step, setStep] = useState("review");
  const [intent, setIntent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sender, setSender] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    fetch(`${API}/cashapp/config`).then((r) => r.json()).then(setCfg).catch(() => setCfg(null));
  }, []);

  const plan = cfg?.plans?.[0];

  async function startPayment() {
    if (!user) { navigate("/auth?mode=login&next=%2Fpay"); return; }
    setBusy(true);
    try {
      const res = await fetch(`${API}/cashapp/intent`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ plan_id: plan?.id || "luchii-pro" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "Could not start payment");
      setIntent(d);
      setStep("pay");
    } catch (e) { toast.error(e.message || "Something went wrong"); }
    finally { setBusy(false); }
  }

  async function confirmPayment() {
    setBusy(true);
    try {
      const res = await fetch(`${API}/cashapp/confirm`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ reference: intent.reference, sender_cashtag: sender, note }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "Could not confirm");
      setStep("done");
      refreshUser?.();
    } catch (e) { toast.error(e.message || "Something went wrong"); }
    finally { setBusy(false); }
  }

  const copy = (t) => { navigator.clipboard.writeText(t).catch(() => {}); toast.success("Copied"); };

  return (
    <main className="relative min-h-screen bg-[#0a0a0f] text-white" data-testid="pay-page">
      <Seo title="Checkout — Luchii Pro · FRASBERG, INC." description="Secure Cash App checkout for Luchii Pro by Frasberg, Inc." />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(59,130,246,0.12),transparent)]" />

      <header className="relative z-10 mx-auto flex max-w-4xl items-center justify-between px-5 py-5">
        <Link to="/profile" className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white" data-testid="pay-back">
          <ArrowLeft size={15} /> Back
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
          <Lock size={11} /> Secure Checkout
        </span>
      </header>

      <div className="relative z-10 mx-auto grid max-w-4xl gap-8 px-5 pb-16 lg:grid-cols-[1fr_360px]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl sm:p-9">
          {!cfg ? (
            <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-white/40" /></div>
          ) : step === "review" ? (
            <>
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400">Frasberg · Checkout</p>
              <h1 className="mt-3 font-display text-3xl font-700 tracking-tight sm:text-4xl">Luchii Pro</h1>
              <p className="mt-3 text-white/60">One-time upgrade. Pay securely with Cash App to <span className="text-white">{cfg.payee}</span>.</p>
              <ul className="mt-7 space-y-3">
                {["200 images/day (free plan: 20/day)", "Priority Luchii Video Creator access", "Unlimited chat, voice & attachments", "Pro badge on your profile"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/80"><Check size={16} className="text-blue-400" /> {f}</li>
                ))}
              </ul>
              <button onClick={startPayment} disabled={busy} data-testid="pay-start-btn"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#00d64f] px-6 py-4 font-700 text-black transition-transform hover:-translate-y-0.5 disabled:opacity-50">
                {busy ? <Loader2 size={17} className="animate-spin" /> : <>Pay with Cash App</>}
              </button>
            </>
          ) : step === "pay" ? (
            <>
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400">Step 1 · Send payment</p>
              <h1 className="mt-3 font-display text-2xl font-700 tracking-tight">Send ${intent.amount} on Cash App</h1>
              <p className="mt-2 text-sm text-white/60">Pay <span className="text-white">{cfg.payee}</span> and include your reference so we can match it instantly.</p>

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <div className="flex flex-col items-center gap-5 sm:flex-row">
                    <div className="shrink-0 rounded-2xl bg-white p-3" data-testid="pay-qr">
                      <QRCodeSVG value={intent.pay_url} size={160} bgColor="#ffffff" fgColor="#000000" level="M" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">Scan with Cash App</p>
                      <p className="mt-2 text-sm leading-relaxed text-white/70">
                        Open Cash App, tap the scan icon and point your camera at this code —
                        the ${intent.amount} payment to <span className="text-white">{cfg.payee}</span> loads instantly.
                      </p>
                      <button onClick={() => copy(cfg.cashtag)} data-testid="pay-cashtag"
                        className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 font-mono text-sm font-700 text-[#00d64f] transition-colors hover:border-[#00d64f]">
                        {cfg.cashtag} <Copy size={13} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">Amount</p>
                    <p className="mt-1 font-display text-xl font-700">${intent.amount}</p>
                  </div>
                  <button onClick={() => copy(intent.reference)} className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-left" data-testid="pay-reference">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">Reference · tap to copy</p>
                    <p className="mt-1 font-mono text-lg font-700 text-blue-400">{intent.reference}</p>
                  </button>
                </div>
              </div>

              <a href={intent.pay_url} target="_blank" rel="noreferrer" data-testid="pay-open-cashapp"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#00d64f] px-6 py-4 font-700 text-black transition-transform hover:-translate-y-0.5">
                Open Cash App to pay <ExternalLink size={15} />
              </a>

              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400">Step 2 · Confirm</p>
                <p className="mt-2 text-sm text-white/60">After paying, enter your Cash App $cashtag so we can verify and activate Pro.</p>
                <input value={sender} onChange={(e) => setSender(e.target.value)} placeholder="Your $cashtag" data-testid="pay-sender-input"
                  className="mt-4 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-blue-400" />
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" data-testid="pay-note-input"
                  className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-blue-400" />
                <button onClick={confirmPayment} disabled={busy} data-testid="pay-confirm-btn"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-700 text-black transition-transform hover:-translate-y-0.5 disabled:opacity-50">
                  {busy ? <Loader2 size={16} className="animate-spin" /> : "I've sent the payment"}
                </button>
              </div>
            </>
          ) : (
            <div className="py-6 text-center" data-testid="pay-done">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#00d64f]/15 text-[#00d64f]"><BadgeCheck size={30} /></div>
              <h1 className="mt-5 font-display text-2xl font-700">Payment received — verifying</h1>
              <p className="mx-auto mt-3 max-w-sm text-sm text-white/60">
                Thanks! We're matching your Cash App payment to <span className="text-white">{cfg.payee}</span>. Luchii Pro activates as soon as it clears — usually within minutes. You'll keep full access meanwhile.
              </p>
              <Link to="/chat" className="mt-7 inline-block rounded-full bg-white px-7 py-3 text-sm font-700 text-black" data-testid="pay-done-chat">Start using Luchii</Link>
            </div>
          )}
        </motion.div>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50"><ShieldCheck size={13} className="text-blue-400" /> Sovereign secure runtime</p>
            <div className="mt-4 space-y-1.5" data-testid="pay-architecture">
              {ARCH.map((n, i) => (
                <div key={n}>
                  <div className="flex items-center gap-2 text-[13px] text-white/70">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-500/15 font-mono text-[9px] text-blue-300">{i + 1}</span>
                    {n}
                  </div>
                  {i < ARCH.length - 1 && <div className="ml-[9px] h-2 w-px bg-white/10" />}
                </div>
              ))}
            </div>
          </div>
          <p className="px-1 text-[10px] leading-relaxed text-white/35" data-testid="pay-copyright">
            Copyright © 2026 FRASBERG, INC. Luchii AI Models, Frasberg AI, associated software, architecture, designs,
            documentation, source code, training methods, model weights, prompts, branding, and related intellectual
            property are proprietary. Unauthorized copying, reverse engineering, redistribution, or creation of derivative
            works is prohibited except where permitted by law or by written permission from Frasberg AI. All rights reserved.
          </p>
        </aside>
      </div>
    </main>
  );
}
