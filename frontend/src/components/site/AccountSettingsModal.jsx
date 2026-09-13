import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, User, Coins, Key, CreditCard, Pencil, Check, Loader2, Camera } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TABS = [
  { id: "account", label: "Account", icon: User },
  { id: "tokens", label: "Tokens & Usage", icon: Coins },
  { id: "keys", label: "API Keys", icon: Key },
  { id: "plan", label: "Plan & Billing", icon: CreditCard },
];
const KIND_LABEL = {
  signup_grant: "Signup gift", daily_grant: "Daily gift", spend_chat: "Chat",
  spend_builder: "Builder", spend_benchmark: "Benchmark", gift_sent: "Gift sent", gift_received: "Gift received",
};

export const AccountSettingsModal = ({ open, onClose }) => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("account");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gift, setGift] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [supportCode, setSupportCode] = useState("");
  const [avatarSaving, setAvatarSaving] = useState(false);
  const fileRef = useRef(null);

  const onAvatarFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    const img = new Image();
    img.onload = async () => {
      const size = 160;
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d");
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      URL.revokeObjectURL(img.src);
      setAvatarSaving(true);
      try {
        await axios.patch(`${API}/auth/profile`, { avatar: dataUrl }, { withCredentials: true });
        await refreshUser?.();
        toast.success("Profile picture updated");
      } catch (err) {
        toast.error(err?.response?.data?.detail || "Could not update picture");
      } finally { setAvatarSaving(false); }
    };
    img.onerror = () => toast.error("Could not read that image");
    img.src = URL.createObjectURL(file);
  };

  useEffect(() => { if (open && user) setName(user.name || ""); }, [open, user]);
  useEffect(() => {
    if (open && user && tab === "tokens" && gift === null) {
      fetch(`${API}/auth/gift`, { credentials: "include" }).then((r) => (r.ok ? r.json() : null)).then(setGift).catch(() => {});
      fetch(`${API}/auth/gift/ledger`, { credentials: "include" }).then((r) => (r.ok ? r.json() : [])).then(setLedger).catch(() => setLedger([]));
    }
  }, [open, user, tab, gift]);

  if (!open || !user) return null;

  const saveName = async () => {
    setSaving(true);
    try {
      await axios.patch(`${API}/auth/profile`, { name: name.trim() }, { withCredentials: true });
      await refreshUser?.();
      setEditing(false);
      toast.success("Name updated");
    } catch { toast.error("Could not update name"); } finally { setSaving(false); }
  };

  const Row = ({ label, sub, children }) => (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] py-4">
      <div>
        <p className="text-[14px] font-600 text-white">{label}</p>
        {sub && <p className="mt-0.5 text-[14.5px] text-gray-500">{sub}</p>}
      </div>
      <div>{children}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" data-testid="account-settings-modal">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-[560px] w-full max-w-3xl overflow-hidden rounded-2xl border border-white/12" style={{ background: "#0A0E16" }}>
        <aside className="w-52 shrink-0 border-r border-white/10 p-4">
          <p className="px-2 font-mono text-[13px] uppercase tracking-[0.25em] text-gray-500">Account settings</p>
          <div className="mt-3 space-y-1">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} data-testid={`settings-tab-${t.id}`}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[15.5px] transition-colors ${tab === t.id ? "bg-white/[0.08] text-white" : "text-gray-400 hover:bg-white/[0.04]"}`}>
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0 flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[18px] font-700 text-white">{TABS.find((t) => t.id === tab)?.label}</h2>
            <button onClick={onClose} data-testid="settings-close-btn" aria-label="Close settings" className="rounded-lg p-1.5 text-gray-400 hover:bg-white/[0.06]"><X size={16} /></button>
          </div>

          {tab === "account" && (
            <div className="mt-2">
              <Row label="Email" sub="The email address linked to your account"><span className="font-mono text-[15px] text-gray-300" data-testid="settings-email">{user.email}</span></Row>
              <Row label="Profile picture" sub="Displayed publicly across Frasberg — click to upload">
                <div className="flex items-center gap-3">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarFile} data-testid="settings-avatar-file" />
                  <button onClick={() => fileRef.current?.click()} disabled={avatarSaving} data-testid="settings-avatar-upload"
                    className="group relative grid h-12 w-12 place-items-center overflow-hidden rounded-full border border-white/20 hover:border-cyan-400/60">
                    <img src={user.avatar || "/frasberg-mark-circle.png"} alt="" className="h-full w-full object-cover" data-testid="settings-avatar-img" />
                    <span className="absolute inset-0 grid place-items-center bg-black/55 opacity-0 transition-opacity group-hover:opacity-100">
                      {avatarSaving ? <Loader2 size={14} className="animate-spin text-white" /> : <Camera size={14} className="text-white" />}
                    </span>
                  </button>
                  {user.avatar && (
                    <button data-testid="settings-avatar-remove"
                      onClick={async () => {
                        try {
                          await axios.patch(`${API}/auth/profile`, { avatar: "" }, { withCredentials: true });
                          await refreshUser?.();
                          toast.success("Picture removed");
                        } catch { toast.error("Could not remove picture"); }
                      }}
                      className="font-mono text-[14px] text-gray-500 underline hover:text-rose-300">remove</button>
                  )}
                </div>
              </Row>
              <Row label="Name" sub="Your full name, as displayed everywhere">
                {editing ? (
                  <div className="flex items-center gap-2">
                    <input value={name} onChange={(e) => setName(e.target.value)} data-testid="settings-name-input"
                      className="w-44 rounded-lg border border-white/20 bg-transparent px-3 py-1.5 text-[15px] text-white outline-none focus:border-cyan-400/60" />
                    <button onClick={saveName} disabled={saving} data-testid="settings-name-save" className="rounded-lg bg-cyan-300 p-2 text-[#05070C] disabled:opacity-50">
                      {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditing(true)} data-testid="settings-name-edit"
                    className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-1.5 text-[15px] text-gray-200 hover:border-cyan-400/50">
                    {user.name || "Set name"} <Pencil size={12} className="text-gray-500" />
                  </button>
                )}
              </Row>
              <Row label="Support code" sub="Share this with our support team if they ask for it">
                {supportCode ? <span className="font-mono text-[15px] text-amber-300" data-testid="settings-support-code">{supportCode}</span> : (
                  <button onClick={() => setSupportCode(`FRSB-${user.id.slice(0, 4).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`)}
                    data-testid="settings-support-generate" className="rounded-full bg-white px-4 py-1.5 text-[15px] font-600 text-[#05070C] hover:opacity-85">Generate</button>
                )}
              </Row>
            </div>
          )}

          {tab === "tokens" && (
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/[0.04] p-4">
                  <p className="font-mono text-[13.5px] uppercase tracking-[0.2em] text-gray-500">Free tokens</p>
                  <p className="mt-1 font-mono text-2xl font-600 text-white" data-testid="settings-free-tokens">{gift ? Number(gift.tokens).toLocaleString() : "…"}</p>
                </div>
                <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.04] p-4">
                  <p className="font-mono text-[13.5px] uppercase tracking-[0.2em] text-gray-500">Purchased · giftable</p>
                  <p className="mt-1 font-mono text-2xl font-600 text-white" data-testid="settings-paid-tokens">{gift ? Number(gift.paid_tokens).toLocaleString() : "…"}</p>
                </div>
              </div>
              <p className="mt-3 font-mono text-[14px] text-gray-500">100 free daily · chat 1 tok · build 5 tok · benchmark 4 tok</p>
              <p className="mt-5 font-mono text-[13.5px] uppercase tracking-[0.2em] text-gray-500">Recent activity</p>
              <div className="mt-2 space-y-1" data-testid="settings-ledger">
                {(ledger || []).slice(0, 8).map((r, i) => (
                  <div key={r.id || i} className="flex items-center justify-between border-b border-white/[0.06] py-2 text-[14.5px]">
                    <span className="text-gray-300">{KIND_LABEL[r.kind] || r.kind}</span>
                    <span className={`font-mono ${r.amount >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{r.amount >= 0 ? "+" : ""}{r.amount}</span>
                  </div>
                ))}
                {ledger !== null && ledger.length === 0 && <p className="text-[14.5px] text-gray-500">No activity yet.</p>}
              </div>
            </div>
          )}

          {tab === "keys" && (
            <div className="mt-4">
              <p className="text-[15.5px] leading-relaxed text-gray-400">Your luchii-sk-* API keys, usage metering and per-plan quotas live in the LINQ Developer Console. Every account gets a free starter key.</p>
              <button onClick={() => { onClose(); navigate("/dashboard"); }} data-testid="settings-open-console"
                className="mt-4 rounded-full bg-cyan-300 px-6 py-2.5 font-mono text-[15px] font-600 text-[#05070C] hover:opacity-85">Open Developer Console →</button>
            </div>
          )}

          {tab === "plan" && (
            <div className="mt-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                <p className="font-mono text-[13.5px] uppercase tracking-[0.2em] text-gray-500">Personal plan</p>
                <p className="mt-1 font-display text-3xl font-700 capitalize text-white" data-testid="settings-plan-name">{user.plan || "free"}</p>
                {user.plan_expires && <p className="mt-1 font-mono text-[14px] text-gray-500">renews/expires {String(user.plan_expires).slice(0, 10)}</p>}
                <button onClick={() => { onClose(); navigate("/dashboard"); }} data-testid="settings-manage-plan"
                  className="mt-4 rounded-full bg-amber-300 px-6 py-2.5 font-mono text-[15px] font-600 text-[#0B1220] hover:opacity-85">Manage Plan ✦</button>
              </div>
              <p className="mt-3 text-[14.5px] text-gray-500">Credit packs and plan upgrades are handled via PayPal in the Developer Console and your Frasberg Gift card.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
