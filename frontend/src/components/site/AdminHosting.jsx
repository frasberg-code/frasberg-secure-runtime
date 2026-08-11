import { useState, useEffect } from "react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AdminHosting = () => {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null);
  const load = () => {
    fetch(`${API}/admin/hosting`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null)).then(setData).catch(() => {});
  };
  useEffect(load, []);

  const toggleRegion = async (t, region) => {
    const cur = t.region_permissions || [];
    const next = cur.includes(region) ? cur.filter((r) => r !== region) : [...cur, region];
    if (next.length === 0) { toast.error("Tenant needs at least one region"); return; }
    setBusy(t.id + region);
    try {
      const r = await fetch(`${API}/admin/tenants/${t.id}/regions`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regions: next }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Update failed");
      toast.success(`${t.email}: regions → ${d.regions.join(", ")}`);
      load();
    } catch (e) { toast.error(String(e.message || e)); }
    setBusy(null);
  };

  return (
    <section className="mt-12" data-testid="admin-hosting-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-700 tracking-tight">Enterprise Hosting</h2>
        <span className="rounded-full border border-lux-accent/40 px-3 py-1 font-mono text-[13px] text-lux-accent">Kernel v4 · multi-tenant isolation</span>
      </div>
      <p className="mt-1 text-[13.5px] text-lux-text2">Per-tenant safety profiles, evolution policies, region permissions and billing meters. Click region chips to grant or revoke deployment access.</p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-lux-border" data-testid="admin-hosting-table">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-lux-border font-mono text-[12.5px] uppercase tracking-wide text-lux-text2">
              <th className="p-3.5">Tenant</th>
              <th className="p-3.5">Isolation</th>
              <th className="p-3.5">Safety profile</th>
              <th className="p-3.5">Evolution</th>
              <th className="p-3.5">Region permissions</th>
              <th className="p-3.5">Billing meters</th>
            </tr>
          </thead>
          <tbody>
            {!data && <tr><td colSpan={6} className="p-5 font-mono text-[13px] text-lux-text2">Loading hosting view…</td></tr>}
            {data && data.tenants.map((t) => (
              <tr key={t.id} className="border-b border-lux-border/50 align-top transition-colors hover:bg-white/[0.02]" data-testid={`hosting-row-${t.id}`}>
                <td className="p-3.5">
                  <p className="font-600">{t.name || t.email?.split("@")[0]}</p>
                  <p className="font-mono text-[12.5px] text-lux-text2">{t.email}</p>
                  <p className="mt-1 font-mono text-[11.5px] uppercase text-lux-accent">{t.plan}{t.suspended ? " · suspended" : ""}</p>
                </td>
                <td className="p-3.5 font-mono text-[12.5px]">{t.isolation}</td>
                <td className="p-3.5">
                  <div className="flex flex-wrap gap-1 font-mono text-[11.5px]">
                    {Object.entries(t.safety_profile).map(([k, v]) => (
                      <span key={k} className="rounded-full border border-lux-border px-2 py-0.5 text-lux-text2">{k}: {v}</span>
                    ))}
                  </div>
                </td>
                <td className="p-3.5 font-mono text-[12.5px]">{t.evolution_policy}</td>
                <td className="p-3.5">
                  <div className="flex flex-wrap gap-1">
                    {data.regions.map((r) => {
                      const on = (t.region_permissions || []).includes(r);
                      return (
                        <button key={r} onClick={() => toggleRegion(t, r)} disabled={busy === t.id + r}
                          data-testid={`hosting-region-${t.id}-${r}`}
                          className={`rounded-full border px-2.5 py-0.5 font-mono text-[11.5px] transition-colors disabled:opacity-40 ${on ? "border-emerald-400/60 text-emerald-300" : "border-lux-border text-lux-text2 opacity-60 hover:opacity-100"}`}>
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </td>
                <td className="p-3.5 font-mono text-[12px] text-lux-text2">
                  <p>{t.billing.cognition_cycles.toLocaleString()} cycles · {t.billing.tokens.toLocaleString()} tok</p>
                  <p>{t.billing.keys} keys · {t.billing.evolution_events} evo events · {t.billing.marketplace_items} items</p>
                  <p>wallet {t.billing.wallet.toLocaleString()}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
