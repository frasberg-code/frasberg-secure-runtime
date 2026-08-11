import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Check, Loader2, Lock, BadgeCheck } from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "sonner";
import { ParallaxSky } from "../components/site/ParallaxSky";
import { useAuth } from "../context/AuthContext";
import Seo from "../components/site/Seo";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ARCH = ["Client", "TLS 1.3 + Mutual Auth", "API Gateway", "Identity Verification", "Authorization", "Encrypted AI Runtime", "Luchii AI Models", "Response"];

export default function Pay() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [cfg, setCfg] = useState(null);
  const [step, setStep] = useState("review");
  const [paidPlan, setPaidPlan] = useState(null);

  useEffect(() => {
    fetch(`${API}/paypal/config`).then((r) => r.json()).then(setCfg).catch(() => setCfg(null));
  }, []);

  const subs = (cfg?.upgrade_plans || []).filter((p) => p.kind === "upgrade");
  const [planId, setPlanId] = useState("builder");
  const plan = subs.find((p) => p.id === planId) || subs[0];

  return (
    <main className="relative min-h-screen bg-[#0a0a0f] text-white" data-testid="pay-page">
      <ParallaxSky />
      <Seo title="Checkout — Luchii · FRASBERG, INC." description="Secure card checkout for Luchii subscriptions by Frasberg, Inc." />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(59,130,246,0.12),transparent)]" />

      <header className="relative z-10 mx-auto flex max-w-4xl items-center justify-between px-5 py-5">
        <Link to="/profile" className="inline-flex items-center gap-2 text-sm text-white/75 transition-colors hover:text-white" data-testid="pay-back">
          <ArrowLeft size={15} /> Back
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 font-mono text-[13.5px] uppercase tracking-[0.2em] text-white/75">
          <Lock size={11} /> Secure Checkout
        </span>
      </header>

      <div className="relative z-10 mx-auto grid max-w-4xl gap-8 px-5 pb-16 lg:grid-cols-[1fr_360px]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl sm:p-9">
          {!cfg ? (
            <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-white/70" /></div>
          ) : step === "done" ? (
            <div className="py-6 text-center" data-testid="pay-done">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-500/15 text-blue-400"><BadgeCheck size={30} /></div>
              <h1 className="mt-5 font-display text-2xl font-700">You're all set</h1>
              <p className="mx-auto mt-3 max-w-sm text-sm text-white/75">
                Payment complete — your <span className="text-white">{paidPlan?.name}</span> plan is active right now. No waiting, no approval queue.
              </p>
              <Link to="/chat" className="mt-7 inline-block rounded-full bg-white px-7 py-3 text-sm font-700 text-black" data-testid="pay-done-chat">Start using Luchii</Link>
            </div>
          ) : (
            <>
              <p className="font-mono text-[13px] uppercase tracking-[0.3em] text-blue-400">Frasberg · Subscriptions</p>
              <h1 className="mt-3 font-display text-3xl font-700 tracking-tight sm:text-4xl">Choose your plan</h1>
              <p className="mt-3 text-white/75">
                Luchii AI Models and our AI agents are <span className="text-white">free on every plan</span>. Subscribe to unlock
                API &amp; LLM keys, builders and advanced tools. Pay by card or PayPal — <span className="text-white">your plan activates instantly</span>.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2" data-testid="pay-plan-grid">
                {subs.map((p) => (
                  <button key={p.id} type="button" onClick={() => setPlanId(p.id)} data-testid={`pay-plan-${p.id}`}
                    className={`rounded-2xl border p-5 text-left transition-all ${planId === p.id ? "border-blue-400 bg-blue-500/10" : "border-white/10 bg-black/20 hover:border-white/30"}`}>
                    <div className="flex items-center justify-between">
                      <p className="font-display text-lg font-700">{p.name}</p>
                      {p.id === "annual" && <span className="rounded-full bg-blue-500/15 px-2 py-0.5 font-mono text-[13.5px] uppercase tracking-wide text-blue-300">Best value</span>}
                      {p.id === "trial" && <span className="rounded-full bg-blue-500/15 px-2 py-0.5 font-mono text-[13.5px] uppercase tracking-wide text-blue-300">Try it</span>}
                    </div>
                    <p className="mt-1 font-display text-2xl font-700">${p.price}<span className="ml-1.5 font-body text-[13px] font-400 text-white/75">{p.period}</span></p>
                    <p className="mt-2 text-[13px] leading-relaxed text-white/75">{p.blurb}</p>
                  </button>
                ))}
              </div>
              <ul className="mt-6 space-y-2.5">
                {["Luchii AI Models & AI agents included free", "API & LLM keys for your own apps", "Website, game & app builders with publishing", "Advanced tools: voice cloning, memory vault, priority access"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/80"><Check size={16} className="text-blue-400" /> {f}</li>
                ))}
              </ul>

              {!user ? (
                <button onClick={() => navigate("/auth?mode=login&next=%2Fpay")} data-testid="pay-signin-btn"
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-4 font-700 text-black transition-transform hover:-translate-y-0.5">
                  Sign in to subscribe
                </button>
              ) : cfg.configured && plan ? (
                <div className="mt-8" data-testid="pay-paypal-buttons">
                  <p className="mb-3 text-center font-mono text-[13.5px] uppercase tracking-[0.2em] text-white/70">
                    Paying ${plan.price} — {plan.name} · activates instantly
                  </p>
                  <PayPalScriptProvider options={{ "client-id": cfg.client_id, currency: "USD", intent: "capture" }}>
                    <PayPalButtons
                      key={plan.id}
                      forceReRender={[plan.id]}
                      style={{ layout: "vertical", color: "black", shape: "pill", label: "pay" }}
                      createOrder={async () => {
                        const res = await fetch(`${API}/paypal/orders`, {
                          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
                          body: JSON.stringify({ plan_id: plan.id }),
                        });
                        const d = await res.json();
                        if (!d.id) throw new Error(d.detail || "order failed");
                        return d.id;
                      }}
                      onApprove={async (data) => {
                        const res = await fetch(`${API}/paypal/orders/${data.orderID}/capture`, {
                          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
                          body: JSON.stringify({ plan_id: plan.id }),
                        });
                        const d = await res.json();
                        if (d.status === "COMPLETED" && d.upgraded) {
                          toast.success(`${plan.name} is live on your account!`);
                          setPaidPlan(plan);
                          setStep("done");
                          refreshUser?.();
                        } else {
                          toast.error("Payment not completed — you have not been charged twice, try again");
                        }
                      }}
                      onError={() => toast.error("Payment error — please try again")}
                    />
                  </PayPalScriptProvider>
                </div>
              ) : (
                <p className="mt-8 text-center font-mono text-[13px] text-white/70" data-testid="pay-checkout-offline">Checkout is temporarily offline — please check back shortly.</p>
              )}
            </>
          )}
        </motion.div>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <p className="inline-flex items-center gap-2 font-mono text-[13px] uppercase tracking-[0.2em] text-white/75"><ShieldCheck size={13} className="text-blue-400" /> Sovereign secure runtime</p>
            <div className="mt-4 space-y-1.5" data-testid="pay-architecture">
              {ARCH.map((n, i) => (
                <div key={n}>
                  <div className="flex items-center gap-2 text-[13px] text-white/70">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-500/15 font-mono text-[13.5px] text-blue-300">{i + 1}</span>
                    {n}
                  </div>
                  {i < ARCH.length - 1 && <div className="ml-[9px] h-2 w-px bg-white/10" />}
                </div>
              ))}
            </div>
          </div>
          <p className="px-1 text-[13.5px] leading-relaxed text-white/70" data-testid="pay-copyright">
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
