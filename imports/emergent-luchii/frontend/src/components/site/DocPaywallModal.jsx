import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, FileText, BadgeCheck } from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DocPaywallModal({ open, onClose, onPurchased, docTitle }) {
  const [paypal, setPaypal] = useState(null);
  const [planId, setPlanId] = useState("doc-single");

  useEffect(() => {
    if (open) {
      fetch(`${API}/paypal/config`).then((r) => r.json()).then(setPaypal).catch(() => setPaypal({ configured: false }));
    }
  }, [open]);

  if (!open) return null;
  const plans = (paypal?.upgrade_plans || []).filter((p) => p.kind === "doc_credits");
  const active = plans.find((p) => p.id === planId) || plans[0];

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" data-testid="doc-paywall-modal">
      <div className="glass w-full max-w-md rounded-3xl border border-lux-border bg-lux-surface p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-lux-accent/50 text-lux-accent"><FileText size={18} /></span>
            <div>
              <p className="font-display text-lg font-700 tracking-tight text-lux-text">Certified PDF download</p>
              {docTitle && <p className="mt-0.5 line-clamp-1 text-[15px] text-lux-text2">{docTitle}</p>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" data-testid="doc-paywall-close" className="text-lux-text2 hover:text-lux-text"><X size={17} /></button>
        </div>

        <div className="mt-5 rounded-2xl border border-lux-accent/40 bg-lux-accent/5 p-4">
          <p className="flex items-center gap-2 text-sm text-lux-text"><BadgeCheck size={15} className="text-lux-accent" /> Luchii Pro members download every document free.</p>
          <Link to="/pay" data-testid="doc-paywall-upgrade"
            className="mt-3 inline-block w-full rounded-full bg-lux-accent px-5 py-2.5 text-center text-sm font-600 text-lux-bg transition-transform hover:-translate-y-0.5">
            Upgrade to Luchii Pro
          </Link>
        </div>

        <p className="mt-5 font-mono text-[15.5px] uppercase tracking-[0.25em] text-lux-text2">Or pay per document</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {plans.map((p) => (
            <button key={p.id} onClick={() => setPlanId(p.id)} data-testid={`doc-paywall-plan-${p.id}`}
              className={`rounded-2xl border p-3 text-left transition-colors ${active?.id === p.id ? "border-lux-accent bg-lux-surface2" : "border-lux-border"}`}>
              <p className="font-display text-lg font-700 text-lux-text">${p.price}</p>
              <p className="mt-0.5 text-[15px] leading-snug text-lux-text2">{p.doc_credits} download{p.doc_credits > 1 ? "s" : ""}</p>
            </button>
          ))}
        </div>

        {paypal?.configured && active ? (
          <div className="mt-4" data-testid="doc-paywall-paypal">
            <PayPalScriptProvider options={{ "client-id": paypal.client_id, currency: "USD", intent: "capture" }}>
              <PayPalButtons
                forceReRender={[active.id]}
                style={{ layout: "vertical", color: "black", shape: "pill", label: "pay" }}
                createOrder={async () => {
                  const res = await fetch(`${API}/paypal/orders`, {
                    method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
                    body: JSON.stringify({ plan_id: active.id }),
                  });
                  const d = await res.json();
                  if (!d.id) throw new Error("order failed");
                  return d.id;
                }}
                onApprove={async (data) => {
                  const res = await fetch(`${API}/paypal/orders/${data.orderID}/capture`, {
                    method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
                    body: JSON.stringify({ plan_id: active.id }),
                  });
                  const d = await res.json();
                  if (d.status === "COMPLETED" && d.credits_added > 0) {
                    toast.success(`${d.credits_added} download credit${d.credits_added > 1 ? "s" : ""} added`);
                    onPurchased?.();
                  } else {
                    toast.error("Payment not completed");
                  }
                }}
                onError={() => toast.error("PayPal error — please try again")}
              />
            </PayPalScriptProvider>
          </div>
        ) : (
          <p className="mt-4 font-mono text-[15px] text-lux-text2">Checkout unavailable — PayPal not configured.</p>
        )}
      </div>
    </div>
  );
}
