import { useState, useEffect } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "sonner";
import { Check, Sparkles, CreditCard, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Pricing({ keys = [], onPurchased, walletId }) {
  const [config, setConfig] = useState(null);
  const [stripeReady, setStripeReady] = useState(false);
  const [selectedKey, setSelectedKey] = useState("");
  const [activePlan, setActivePlan] = useState(null);
  const [stripeBusy, setStripeBusy] = useState(null);

  useEffect(() => {
    fetch(`${API}/paypal/config`).then((r) => r.json()).then(setConfig).catch(() => setConfig({ configured: false, plans: [] }));
    fetch(`${API}/payments/config`).then((r) => r.json()).then((d) => setStripeReady(!!d.configured)).catch(() => {});
  }, []);

  const stripeCheckout = async (planId) => {
    setStripeBusy(planId);
    try {
      const res = await fetch(`${API}/payments/checkout`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ plan_id: planId, key_id: selectedKey || null, origin_url: window.location.origin }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.checkout_url) {
        toast.error(typeof d.detail === "string" ? d.detail : "Could not start Stripe checkout");
        setStripeBusy(null);
        return;
      }
      window.location.href = d.checkout_url;
    } catch {
      toast.error("Could not start Stripe checkout");
      setStripeBusy(null);
    }
  };

  useEffect(() => {
    if (keys.length && !selectedKey) setSelectedKey(keys[0].id);
  }, [keys, selectedKey]);

  if (!config) return null;

  return (
    <section className="mt-14" data-testid="pricing-section">
      <h2 className="flex items-center gap-2 font-display text-2xl font-600 tracking-tight">
        <Sparkles size={20} className="text-lux-accent" /> Buy API Credits
      </h2>
      <p className="mt-2 text-sm text-lux-text2">
        Top up a key with token credits. Secure checkout via card (Stripe) or PayPal
        {config.mode ? ` (${config.mode})` : ""}.
      </p>

      {keys.length > 0 && (
        <div className="mt-5 flex items-center gap-3">
          <span className="font-mono text-[15px] text-lux-text2">Credit key:</span>
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            data-testid="pricing-key-select"
            className="rounded-full border border-lux-border bg-lux-surface px-4 py-2 text-sm outline-none focus:border-lux-accent"
          >
            {keys.map((k) => (
              <option key={k.id} value={k.id}>{`${k.name} (${k.credits || 0} credits)`}</option>
            ))}
            {walletId && <option value={`wallet-${walletId}`}>💰 My wallet (auto top-up pool)</option>}
          </select>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
        {config.plans.map((p) => (
          <div
            key={p.id}
            data-testid={`plan-${p.id}`}
            className={`rounded-2xl border p-7 transition-colors ${
              p.id === "pro" ? "border-lux-accent bg-lux-surface" : "border-lux-border bg-lux-surface"
            }`}
          >
            {p.id === "pro" && (
              <span className="mb-3 inline-block rounded-full bg-lux-accent px-3 py-1 font-mono text-[15.5px] uppercase tracking-[0.2em] text-lux-bg">
                Most popular
              </span>
            )}
            <h3 className="font-display text-xl font-600 text-lux-text">{p.name}</h3>
            <p className="mt-2 font-display text-4xl font-700 text-lux-text">
              ${p.price}
            </p>
            <p className="mt-3 text-sm text-lux-text2">{p.blurb}</p>
            <ul className="mt-5 space-y-2 text-sm text-lux-text2">
              <li className="flex items-center gap-2"><Check size={15} className="text-lux-accent" /> {p.credits.toLocaleString()} token credits</li>
              <li className="flex items-center gap-2"><Check size={15} className="text-lux-accent" /> All four model tiers</li>
              <li className="flex items-center gap-2"><Check size={15} className="text-lux-accent" /> 60 req/min</li>
            </ul>

            {stripeReady && (
              <button
                onClick={() => stripeCheckout(p.id)}
                disabled={stripeBusy === p.id}
                data-testid={`stripe-buy-${p.id}`}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-lux-accent px-6 py-3 text-sm font-600 text-lux-bg transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {stripeBusy === p.id ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
                Pay with Card
              </button>
            )}

            {config.configured ? (
              activePlan === p.id ? (
                <div className="mt-6">
                  <PayPalScriptProvider options={{ "client-id": config.client_id, currency: "USD", intent: "capture" }}>
                    <PayPalButtons
                      style={{ layout: "vertical", color: "black", shape: "pill", label: "pay" }}
                      createOrder={async () => {
                        const res = await fetch(`${API}/paypal/orders`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ plan_id: p.id, key_id: selectedKey || null }),
                        });
                        const d = await res.json();
                        if (!d.id) throw new Error("order failed");
                        return d.id;
                      }}
                      onApprove={async (data) => {
                        const res = await fetch(`${API}/paypal/orders/${data.orderID}/capture`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ key_id: selectedKey || null, plan_id: p.id }),
                        });
                        const d = await res.json();
                        if (d.status === "COMPLETED") {
                          toast.success(`Payment complete — ${d.credits_added.toLocaleString()} credits added`);
                          setActivePlan(null);
                          onPurchased?.();
                        } else {
                          toast.error("Payment not completed");
                        }
                      }}
                      onError={() => toast.error("PayPal error — please try again")}
                    />
                  </PayPalScriptProvider>
                  <button onClick={() => setActivePlan(null)} className="mt-2 w-full text-center font-mono text-[15px] text-lux-text2 hover:text-lux-text">
                    cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActivePlan(p.id)}
                  data-testid={`buy-${p.id}`}
                  className={`mt-3 w-full rounded-full border border-lux-border px-6 py-3 text-sm font-600 text-lux-text transition-transform hover:-translate-y-0.5 ${stripeReady ? "" : "mt-6 bg-lux-accent text-lux-bg border-transparent"}`}
                >
                  Pay with PayPal
                </button>
              )
            ) : (
              !stripeReady && <p className="mt-6 font-mono text-[15px] text-lux-text2">Checkout unavailable — payments not configured.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
