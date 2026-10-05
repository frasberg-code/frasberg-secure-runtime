import { useEffect, useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "sonner";
import { Check, Crown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TIER_FEATURES = {
  "linq-operator": ["Ascension Ladder — all 45 layers", "Threat / Billing / Compliance engines", "API & LLM key generation", "Builder plan unlocked"],
  "linq-architect": ["Everything in Operator", "Priority engine runs", "Pro plan unlocked", "Higher rate limits"],
  "linq-sovereign": ["Everything in Architect", "LINQ Live hosting rights", "Premium plan unlocked", "Top limits · Premium badge"],
};

export const LinqBilling = () => {
  const { user, refreshUser } = useAuth();
  const [cfg, setCfg] = useState(null);

  useEffect(() => {
    fetch(`${API}/paypal/config`).then((r) => r.json()).then(setCfg).catch(() => setCfg(null));
  }, []);

  const plans = (cfg?.upgrade_plans || []).filter((p) => p.linq);

  return (
    <div className="space-y-6" data-testid="linq-billing">
      <div>
        <h2 className="text-2xl text-[#f8fafc]">LINQ Subscription Tiers</h2>
        <p className="text-sm text-[#94a3b8] mt-1">
          Purchase a tier with PayPal or card — your account plan upgrades <span className="text-[#f8fafc]">instantly on payment</span>.
          {user?.plan && <span className="ml-2 text-[#4ade80]" data-testid="linq-current-plan">Current plan: {user.plan}</span>}
        </p>
      </div>

      {!cfg && <div className="text-sm text-[#64748b]">Loading plans…</div>}
      {cfg && !cfg.configured && <div className="text-sm text-[#f87171]">Payments are not configured.</div>}

      {cfg?.configured && (
        <PayPalScriptProvider options={{ "client-id": cfg.client_id, currency: "USD", intent: "capture" }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((p, i) => (
              <div key={p.id} data-testid={`linq-plan-${p.id}`}
                className={`rounded-2xl border p-6 space-y-4 ${i === 1 ? "border-[#ef4444] bg-[#ef4444]/5" : "border-[#1e293b] bg-[#0f172a]"}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-[#f8fafc] text-lg flex items-center gap-2">
                    {i === 2 && <Crown size={16} className="text-[#facc15]" />} {p.name}
                  </h3>
                  {i === 1 && <span className="text-[13px] uppercase tracking-widest text-[#ef4444]">Popular</span>}
                </div>
                <div className="text-3xl text-[#f8fafc] font-mono">${p.price}<span className="text-sm text-[#64748b]"> {p.period}</span></div>
                <ul className="space-y-1.5">
                  {(TIER_FEATURES[p.id] || [p.blurb]).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#cbd5e1]">
                      <Check size={13} className="text-[#4ade80] mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <div data-testid={`linq-paypal-${p.id}`}>
                  <PayPalButtons
                    style={{ layout: "horizontal", color: "black", height: 40, tagline: false }}
                    forceReRender={[p.id]}
                    createOrder={async () => {
                      const res = await fetch(`${API}/paypal/orders`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ plan_id: p.id }),
                      });
                      if (!res.ok) throw new Error("order failed");
                      const data = await res.json();
                      return data.id;
                    }}
                    onApprove={async (data) => {
                      const res = await fetch(`${API}/paypal/orders/${data.orderID}/capture`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ plan_id: p.id }),
                      });
                      const out = await res.json();
                      if (out.status === "COMPLETED") {
                        toast.success(`${p.name} activated — your plan is now ${p.plan}`);
                        refreshUser?.();
                      } else {
                        toast.error("Payment did not complete");
                      }
                    }}
                    onError={() => toast.error("PayPal checkout failed")}
                  />
                </div>
              </div>
            ))}
          </div>
        </PayPalScriptProvider>
      )}
    </div>
  );
};
