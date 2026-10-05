import { useEffect, useState } from "react";
import axios from "axios";
import { Receipt, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_ICON = {
  COMPLETED: <CheckCircle2 size={13} className="text-[#4ade80]" />,
  approved: <CheckCircle2 size={13} className="text-[#4ade80]" />,
  pending_review: <Clock size={13} className="text-[#facc15]" />,
  awaiting_payment: <Clock size={13} className="text-[#94a3b8]" />,
  rejected: <XCircle size={13} className="text-[#f87171]" />,
};

export const LinqHistory = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/purchases/my`, { withCredentials: true })
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const rows = [
    ...(data?.purchases || []).map((p) => ({
      id: p.order_id || p.id, date: p.ts, item: p.wallet ? `💰 Wallet top-up — ${p.plan_name || p.plan}` : (p.plan_name || p.plan),
      amount: p.price ? `$${p.price}` : (p.credits ? `${p.credits} credits` : "—"),
      status: p.status || "COMPLETED", method: p.provider === "stripe" ? "Card (Stripe)" : "PayPal", ref: p.order_id,
    })),
    ...(data?.cashapp || []).map((c) => ({
      id: c.id, date: c.created_at, item: c.plan_name,
      amount: `$${c.amount}`, status: c.status, method: "Cash App", ref: c.reference,
    })),
    ...(data?.transfers || []).map((t) => ({
      id: t.id, date: t.ts, item: "⚡ Auto refill — wallet → key",
      amount: `${t.amount.toLocaleString()} credits`, status: "COMPLETED", method: "Wallet", ref: t.key_id,
    })),
  ].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return (
    <div className="space-y-6" data-testid="linq-history">
      <div>
        <h2 className="text-2xl text-[#f8fafc] flex items-center gap-2"><Receipt size={20} /> Billing History</h2>
        <p className="text-sm text-[#94a3b8] mt-1">Your LINQ payments, tips and plan renewals.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="linq-plan-summary">
        <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-4">
          <div className="text-[13px] uppercase tracking-widest text-[#94a3b8]">Current plan</div>
          <div className="text-xl text-[#f8fafc] mt-1 capitalize" data-testid="history-current-plan">{data?.plan || user?.plan || "free"}</div>
          {typeof data?.wallet_balance === "number" && (
            <div className="mt-1 font-mono text-[13.5px] text-[#facc15]" data-testid="history-wallet-balance">💰 Wallet: {data.wallet_balance.toLocaleString()} tokens</div>
          )}
        </div>
        <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-4">
          <div className="text-[13px] uppercase tracking-widest text-[#94a3b8]">Started</div>
          <div className="text-sm text-[#f8fafc] mt-1 font-mono">{data?.plan_started ? data.plan_started.slice(0, 10) : "—"}</div>
        </div>
        <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-4">
          <div className="text-[13px] uppercase tracking-widest text-[#94a3b8]">Renews / expires</div>
          <div className="text-sm text-[#f8fafc] mt-1 font-mono">{data?.plan_expires ? data.plan_expires.slice(0, 10) : "—"}</div>
        </div>
      </div>

      <div className="rounded-xl border border-[#1e293b] overflow-hidden" data-testid="linq-history-table">
        {loading && <div className="p-6 text-sm text-[#64748b]">Loading…</div>}
        {!loading && rows.length === 0 && (
          <div className="p-6 text-sm text-[#64748b]" data-testid="history-empty">No purchases yet — grab a LINQ tier from the Plans tab.</div>
        )}
        {rows.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-[#1e293b] last:border-0 bg-[#0f172a]/60" data-testid={`history-row-${r.id}`}>
            <span className="font-mono text-[13.5px] text-[#64748b] w-24">{(r.date || "").slice(0, 10)}</span>
            <span className="text-sm text-[#f8fafc] flex-1 min-w-[140px]">{r.item}</span>
            <span className="font-mono text-sm text-[#f8fafc]">{r.amount}</span>
            <span className="text-[13.5px] text-[#94a3b8] w-16">{r.method}</span>
            <span className="flex items-center gap-1 text-[13.5px] text-[#cbd5e1] capitalize">{STATUS_ICON[r.status] || null} {String(r.status).replace("_", " ").toLowerCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
