import { useState, useEffect } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "sonner";
import { Check, X, Zap } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TIERS = [
  { id: "free", name: "Free", price: "0", period: "forever", features: ["30 req/min", "100K tokens/month", "3 API keys", "All four model tiers"] },
  { id: "api-pro", name: "Pro", price: "12.50", period: "per month", features: ["120 req/min", "2M tokens/month", "Unlimited API keys", "200 images/day"] },
  { id: "api-scale", name: "Scale", price: "50.00", period: "per month", features: ["600 req/min", "20M tokens/month", "Unlimited API keys", "Priority routing"] },
];

export default function UpgradePlanModal({ open, onClose, quota, onUpgraded }) {
  const [config, setConfig] = useState(null);
  const [activePlan, setActivePlan] = useState(null);

  useEffect(() => {
    if (!open) return;
    fetch(`${API}/paypal/config`).then((r) => r.json()).then(setConfig).catch(() => setConfig({ configured: false }));
  }, [open]);

  if (!open) return null;
  const currentPlan = quota?.plan || "free";

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" data-testid="upgrade-plan-modal" onClick={onClose}>
      <div className="w-full max-w-3xl rounded-3xl border border-lux-border bg-lux-bg p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-display text-2xl font-700 tracking-tight">
              <Zap size={20} className="text-lux-accent" /> Upgrade your API plan
            </h2>
            <p className="mt-2 text-sm text-lux-text2">
              Higher rate limits and monthly token quotas — instant activation via PayPal.
            </p>
          </div>
          <button onClick={onClose} data-testid="upgrade-modal-close" aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full border border-lux-border text-lux-text2 transition-colors hover:border-lux-accent hover:text-lux-text">
            <X size={16} />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {TIERS.map((t) => {
            const isCurrent = currentPlan === (t.id === "api-pro" ? "pro" : t.id === "api-scale" ? "scale" : "free");
            return (
              <div key={t.id} data-testid={`upgrade-tier-${t.id}`}
                className={`rounded-2xl border p-5 ${isCurrent ? "border-lux-accent bg-lux-surface" : "border-lux-border bg-lux-surface"}`}>
                {isCurrent && (
                  <span className="mb-2 inline-block rounded-full bg-lux-accent px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-lux-bg">
                    Current plan
                  </span>
                )}
                <h3 className="font-display text-lg font-600">{t.name}</h3>
                <p className="mt-1 font-display text-3xl font-700">${t.price}</p>
                <p className="font-mono text-[10px] uppercase tracking-wide text-lux-text2">{t.period}</p>
                <ul className="mt-4 space-y-1.5 text-xs text-lux-text2">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5"><Check size={12} className="shrink-0 text-lux-accent" /> {f}</li>
                  ))}
                </ul>
                {t.id !== "free" && !isCurrent && config?.configured && (
                  activePlan === t.id ? (
                    <div className="mt-4">
                      <PayPalScriptProvider options={{ "client-id": config.client_id, currency: "USD", intent: "capture" }}>
                        <PayPalButtons
                          style={{ layout: "vertical", color: "black", shape: "pill", label: "pay" }}
                          createOrder={async () => {
                            const res = await fetch(`${API}/paypal/orders`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              credentials: "include",
                              body: JSON.stringify({ plan_id: t.id }),
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
                              body: JSON.stringify({ plan_id: t.id }),
                            });
                            const d = await res.json();
                            if (d.status === "COMPLETED") {
                              toast.success(`Upgraded to ${t.name} — new limits active now`);
                              setActivePlan(null);
                              onUpgraded?.();
                              onClose();
                            } else {
                              toast.error("Payment not completed");
                            }
                          }}
                          onError={() => toast.error("PayPal error — please try again")}
                        />
                      </PayPalScriptProvider>
                      <button onClick={() => setActivePlan(null)} className="mt-2 w-full text-center font-mono text-xs text-lux-text2 hover:text-lux-text">
                        cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setActivePlan(t.id)} data-testid={`upgrade-btn-${t.id}`}
                      className="mt-4 w-full rounded-full bg-lux-accent px-5 py-2.5 text-sm font-600 text-lux-bg transition-transform hover:-translate-y-0.5">
                      Upgrade to {t.name}
                    </button>
                  )
                )}
                {t.id !== "free" && !isCurrent && config && !config.configured && (
                  <p className="mt-4 font-mono text-[10px] text-lux-text2">Checkout unavailable — PayPal not configured.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
