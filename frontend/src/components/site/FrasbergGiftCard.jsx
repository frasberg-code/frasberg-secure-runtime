import { useState, useEffect, useCallback } from "react";
import { Gift, Sparkles, History, Send, Loader2, CreditCard } from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const KIND_LABEL = {
  signup_grant: "Signup gift", daily_grant: "Daily gift", spend_chat: "Chat",
  spend_builder: "Builder", spend_benchmark: "Benchmark", gift_sent: "Gift sent", gift_received: "Gift received",
};

export const FrasbergGiftCard = ({ className = "" }) => {
  const { user } = useAuth();
  const [gift, setGift] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [showLedger, setShowLedger] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showBuy, setShowBuy] = useState(false);
  const [paypal, setPaypal] = useState(null);
  const [pack, setPack] = useState(null);
  const [sendEmail, setSendEmail] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sending, setSending] = useState(false);

  const refresh = useCallback(() => {
    fetch(`${API}/auth/gift`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((g) => {
        setGift(g);
        if (g?.granted_today > 0) toast.success(`Frasberg Gift — +${g.granted_today} free tokens claimed today`);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (window.location.hash === "#gift") {
      setShowSend(true);
      setTimeout(() => document.querySelector('[data-testid="frasberg-gift-card"]')?.scrollIntoView({ behavior: "smooth" }), 400);
    }
  }, []);

  const loadLedger = () => {
    if (!showLedger && ledger === null) {
      fetch(`${API}/auth/gift/ledger`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : []))
        .then(setLedger)
        .catch(() => setLedger([]));
    }
    setShowLedger((v) => !v);
  };

  const sendGift = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch(`${API}/auth/gift/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: sendEmail.trim(), amount: Number(sendAmount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Transfer failed");
      toast.success(`Sent ${data.sent.toLocaleString()} tokens to ${data.to}`);
      setSendEmail(""); setSendAmount(""); setShowSend(false); setLedger(null);
      refresh();
    } catch (err) {
      toast.error(err.message);
    } finally { setSending(false); }
  };

  const toggleBuy = () => {
    if (!showBuy && paypal === null) {
      fetch(`${API}/paypal/config`).then((r) => r.json()).then(setPaypal).catch(() => setPaypal({ configured: false }));
    }
    setShowBuy((v) => !v);
    setPack(null);
  };

  if (!gift) return null;
  const year = (gift.member_since || "2026").slice(0, 4);
  const packs = (paypal?.plans || []).filter((p) => p.credits);

  return (
    <div data-testid="frasberg-gift-card" className={`relative overflow-hidden rounded-2xl border border-cyan-400/25 p-6 sm:p-7 ${className}`}
      style={{ background: "linear-gradient(135deg,#0B1220 0%,#101B33 45%,#16264A 100%)", boxShadow: "0 0 50px rgba(34,211,238,0.08)" }}>
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full" style={{ background: "radial-gradient(circle,rgba(34,211,238,0.14),transparent 70%)" }} />
      <div className="pointer-events-none absolute -left-10 -bottom-24 h-52 w-52 rounded-full" style={{ background: "radial-gradient(circle,rgba(251,191,36,0.10),transparent 70%)" }} />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11.5px] uppercase tracking-[0.3em] text-amber-300">
            <Gift size={14} /> Frasberg Gift
          </div>
          <p className="mt-4 font-mono text-4xl font-600 tracking-tighter text-white" data-testid="gift-token-balance">
            {Number(gift.tokens).toLocaleString()}
            <span className="ml-2 text-sm text-cyan-300/80">free tokens</span>
          </p>
          <p className="mt-1.5 font-mono text-[13px] text-gray-400" data-testid="gift-paid-balance">
            + {Number(gift.paid_tokens).toLocaleString()} purchased tokens <span className="text-gray-600">· giftable</span>
          </p>
          {gift.granted_today > 0 && (
            <span data-testid="gift-daily-claimed" className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 font-mono text-[12px] text-emerald-300">
              <Sparkles size={12} /> +{gift.granted_today} daily tokens claimed
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-2.5">
          <img src="/frasberg-mark-circle.png" alt="Frasberg" className="h-10 w-10 rounded-full opacity-90" />
          <div className="flex flex-wrap justify-end gap-2">
            <button onClick={toggleBuy} data-testid="gift-buy-toggle"
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 px-3 py-1.5 font-mono text-[12px] text-emerald-300 transition-colors hover:bg-emerald-400/[0.08]">
              <CreditCard size={12} /> Buy tokens
            </button>
            <button onClick={loadLedger} data-testid="gift-ledger-toggle"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 font-mono text-[12px] text-gray-300 transition-colors hover:border-cyan-400/50 hover:text-cyan-200">
              <History size={12} /> History
            </button>
            <button onClick={() => setShowSend((v) => !v)} data-testid="gift-send-toggle"
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 px-3 py-1.5 font-mono text-[12px] text-amber-300 transition-colors hover:bg-amber-400/[0.08]">
              <Send size={12} /> Send a gift
            </button>
          </div>
        </div>
      </div>

      {showBuy && (
        <div className="relative mt-5 rounded-xl border border-emerald-400/25 bg-black/25 p-4" data-testid="gift-buy-panel">
          <p className="font-mono text-[11.5px] uppercase tracking-[0.2em] text-emerald-300">Buy token packs — purchased tokens are giftable</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {packs.map((p) => (
              <button key={p.id} onClick={() => setPack(pack === p.id ? null : p.id)} data-testid={`gift-pack-${p.id}`}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${pack === p.id ? "border-emerald-300 bg-emerald-400/[0.08]" : "border-white/15 hover:border-emerald-400/50"}`}>
                <p className="font-mono text-[13px] font-600 text-white">${p.price} — {p.name}</p>
                <p className="mt-0.5 font-mono text-[11.5px] text-gray-400">{p.credits.toLocaleString()} tokens</p>
              </button>
            ))}
            {packs.length === 0 && <p className="col-span-3 font-mono text-[12px] text-gray-500">{paypal === null ? "Loading packs…" : "Token packs unavailable right now."}</p>}
          </div>
          {pack && paypal?.configured && user && (
            <div className="mt-4" data-testid="gift-buy-paypal">
              <PayPalScriptProvider options={{ "client-id": paypal.client_id, currency: "USD", intent: "capture" }}>
                <PayPalButtons
                  style={{ layout: "horizontal", color: "black", shape: "pill", label: "pay", height: 40 }}
                  createOrder={async () => {
                    const res = await fetch(`${API}/paypal/orders`, {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ plan_id: pack, key_id: `wallet-${user.id}` }),
                    });
                    const d = await res.json();
                    if (!d.id) throw new Error("order failed");
                    return d.id;
                  }}
                  onApprove={async (data) => {
                    const res = await fetch(`${API}/paypal/orders/${data.orderID}/capture`, {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ key_id: `wallet-${user.id}`, plan_id: pack }),
                    });
                    const d = await res.json();
                    if (d.status === "COMPLETED") {
                      toast.success(`Payment complete — ${d.credits_added.toLocaleString()} tokens added to your purchased balance`);
                      setShowBuy(false); setPack(null); setLedger(null);
                      refresh();
                    } else toast.error("Payment not completed");
                  }}
                  onError={() => toast.error("PayPal error — please try again")}
                />
              </PayPalScriptProvider>
            </div>
          )}
        </div>
      )}

      {showSend && (
        <form onSubmit={sendGift} className="relative mt-5 rounded-xl border border-amber-400/25 bg-black/25 p-4" data-testid="gift-send-form">
          <p className="font-mono text-[11.5px] uppercase tracking-[0.2em] text-amber-300">Send purchased tokens to a friend</p>
          <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
            <input type="email" required value={sendEmail} onChange={(e) => setSendEmail(e.target.value)}
              placeholder="friend@email.com" data-testid="gift-send-email"
              className="flex-1 rounded-full border border-white/15 bg-transparent px-4 py-2 text-[13px] text-white outline-none focus:border-amber-400/60" />
            <input type="number" required min="1" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)}
              placeholder="Amount" data-testid="gift-send-amount"
              className="w-full rounded-full border border-white/15 bg-transparent px-4 py-2 text-[13px] text-white outline-none focus:border-amber-400/60 sm:w-32" />
            <button type="submit" disabled={sending} data-testid="gift-send-btn"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-amber-300 px-5 py-2 font-mono text-[12.5px] font-600 text-[#0B1220] transition-opacity hover:opacity-85 disabled:opacity-50">
              {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Send
            </button>
          </div>
          <p className="mt-2.5 font-mono text-[11.5px] text-gray-500" data-testid="gift-send-rule">
            Only purchased tokens can be gifted — free daily tokens stay on your account.
          </p>
        </form>
      )}

      {showLedger && (
        <div className="relative mt-5 rounded-xl border border-white/10 bg-black/25 p-4" data-testid="gift-ledger">
          <p className="font-mono text-[11.5px] uppercase tracking-[0.2em] text-cyan-300">Token history</p>
          {ledger === null ? (
            <p className="mt-3 font-mono text-[12.5px] text-gray-500">Loading…</p>
          ) : ledger.length === 0 ? (
            <p className="mt-3 font-mono text-[12.5px] text-gray-500" data-testid="gift-ledger-empty">No activity yet — grants and spends will appear here.</p>
          ) : (
            <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
              {ledger.map((row, i) => (
                <div key={row.id || i} className="flex items-center justify-between gap-3 border-b border-white/[0.06] py-2 last:border-0" data-testid={`gift-ledger-row-${i}`}>
                  <div className="min-w-0">
                    <p className="font-mono text-[12.5px] text-gray-200">{KIND_LABEL[row.kind] || row.kind}</p>
                    <p className="truncate font-mono text-[11px] text-gray-500">{row.note}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className={`font-mono text-[13px] font-600 ${row.amount >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                      {row.amount >= 0 ? "+" : ""}{row.amount.toLocaleString()}
                    </span>
                    <span className="font-mono text-[11px] text-gray-600">{(row.ts || "").slice(0, 10)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-gray-400" data-testid="gift-card-terms">
          {gift.signup_grant} tokens on signup · {gift.daily_grant} free every day · chat {gift.chat_cost} tok · build {gift.build_cost} tok
        </p>
        <p className="font-mono text-[12px] tracking-[0.25em] text-cyan-300/70">FRSB •••• {year}</p>
      </div>
    </div>
  );
};
