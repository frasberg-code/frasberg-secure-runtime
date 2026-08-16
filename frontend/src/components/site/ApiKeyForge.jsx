import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AudioWaveform, SlidersHorizontal, Network, Folder, ShieldCheck, Users, Copy, Check, Plus, ShieldAlert, FlaskConical, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const C = { base: "#05060a", panel: "#0b0c10", border: "#1f2933", primary: "#38bdf8", accent: "#a855f7", text: "#e5e7eb", muted: "#9ca3af", danger: "#f97373" };

const GROUPS = [
  ["Core Audio", AudioWaveform, ["text_to_speech", "speech_to_text", "speech_to_speech", "sound_effects"]],
  ["Advanced Audio", SlidersHorizontal, ["music_generation", "voice_changer", "voice_isolator", "dubbing", "audio_native", "audiobooks"]],
  ["Frasberg Agents", Network, ["frasberg_agents", "agent_memory", "agent_tools", "webhooks"]],
  ["Projects", Folder, ["projects", "productions", "history", "models"]],
  ["Administration", ShieldCheck, ["usage_analytics", "audit_log", "billing", "key_rotation"]],
  ["Workspace Members", Users, ["workspace", "workspace_members_read", "workspace_members_invite", "workspace_members_remove"]],
];
const ALL_KEYS = GROUPS.flatMap(([, , ks]) => ks);
const LEVELS = [["no_access", "No Access"], ["read", "Read"], ["write", "Write"], ["access", "Access"]];
const label = (k) => k === "frasberg_agents" ? "Frasberg Agents" : k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const defaultPerms = () => Object.fromEntries(ALL_KEYS.map((k) => [k, k === "models" ? "read" : "no_access"]));

export const ApiKeyForge = ({ onCreated }) => {
  const [name, setName] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [expiresDays, setExpiresDays] = useState("");
  const [autoDisable, setAutoDisable] = useState(true);
  const [perms, setPerms] = useState(defaultPerms);
  const [busy, setBusy] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const preview = useMemo(() => JSON.stringify({
    name: name || "Default key",
    workspace: workspace || null,
    auto_disable_if_leaked: autoDisable,
    permissions: Object.fromEntries(Object.entries(perms).filter(([, v]) => v !== "no_access")),
  }, null, 2), [name, workspace, autoDisable, perms]);

  const setAll = (lvl) => setPerms(Object.fromEntries(ALL_KEYS.map((k) => [k, lvl])));

  const create = async () => {
    setBusy(true);
    setTestResults(null);
    try {
      const res = await fetch(`${API}/keys`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          name: name || "Default key", expires_days: expiresDays ? Number(expiresDays) : null,
          permissions: perms, auto_disable_if_leaked: autoDisable, workspace_name: workspace || null,
        }),
      });
      if (res.status === 401) { toast.error("Please sign in to generate keys"); return; }
      if (res.status === 402) {
        toast.error("Free accounts include 3 API keys — upgrade from $5/mo for unlimited keys");
        setTimeout(() => window.location.assign("/pay"), 1500);
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const d = err.detail || {};
        toast.error(d.code ? `${d.code} — ${d.message}` : "Could not create key");
        return;
      }
      const data = await res.json();
      setNewKey(data);
      toast.success("Key created successfully");
      onCreated && onCreated(data);
    } catch { toast.error("Could not create key"); }
    finally { setBusy(false); }
  };

  const runTest = async () => {
    if (!newKey) return;
    setTesting(true);
    try {
      const res = await fetch(`${API}/keys/${newKey.id}/test`, { method: "POST", credentials: "include" });
      const data = await res.json();
      setTestResults(data.results || []);
    } catch { toast.error("Test run failed"); }
    finally { setTesting(false); }
  };

  const copyKey = async (val) => {
    try { await navigator.clipboard.writeText(val); } catch {
      const ta = document.createElement("textarea");
      ta.value = val; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch {} ta.remove();
    }
    setCopied(true); toast.success("Copied"); setTimeout(() => setCopied(false), 1500);
  };

  const seg = (pk) => (
    <div className="grid grid-cols-4 gap-1" data-testid={`perm-options-${pk}`}>
      {LEVELS.map(([lv, lb]) => (
        <button key={lv} onClick={() => setPerms((p) => ({ ...p, [pk]: lv }))}
          data-testid={`perm-${pk}-${lv}`}
          className="rounded-md border px-1.5 py-1 font-mono text-[11px] transition-colors"
          style={perms[pk] === lv
            ? { borderColor: lv === "no_access" ? C.border : C.primary, background: lv === "no_access" ? "rgba(255,255,255,0.05)" : "rgba(56,189,248,0.14)", color: lv === "no_access" ? C.muted : C.primary }
            : { borderColor: C.border, color: C.muted }}>
          {lb}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-6" data-testid="api-key-forge">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(280px,360px)_minmax(480px,1fr)]">
        {/* Left panel — metadata + security */}
        <div className="rounded-xl border px-5 py-4" style={{ background: C.panel, borderColor: C.border }} data-testid="forge-metadata-panel">
          <p className="font-mono text-[11.5px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>Key Metadata</p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Key name (e.g. Production)"
            data-testid="key-name-input"
            className="mt-3 w-full rounded-md border bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors"
            style={{ borderColor: C.border, color: C.text }} />
          <input value={workspace} onChange={(e) => setWorkspace(e.target.value)} placeholder="Workspace (e.g. Frasberg HQ)"
            data-testid="key-workspace-input"
            className="mt-2 w-full rounded-md border bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors"
            style={{ borderColor: C.border, color: C.text }} />
          <select value={expiresDays} onChange={(e) => setExpiresDays(e.target.value)} data-testid="key-expiry-select"
            className="mt-2 w-full rounded-md border px-3.5 py-2.5 font-mono text-[12.5px] outline-none"
            style={{ borderColor: C.border, background: C.panel, color: C.text }}>
            <option value="">Never expires</option>
            <option value="30">Expires in 30 days</option>
            <option value="60">Expires in 60 days</option>
            <option value="90">Expires in 90 days</option>
          </select>

          <div className="mt-5 border-t pt-4" style={{ borderColor: C.border }}>
            <p className="font-mono text-[11.5px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>Security</p>
            <button onClick={() => setAutoDisable((v) => !v)} data-testid="auto-disable-toggle"
              className="mt-3 flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors"
              style={{ borderColor: autoDisable ? "rgba(56,189,248,0.5)" : C.border }}>
              <ShieldAlert size={16} className="mt-0.5 shrink-0" style={{ color: autoDisable ? C.primary : C.muted }} />
              <span>
                <span className="block text-[13px] font-600" style={{ color: C.text }}>
                  Auto-disable if leaked {autoDisable ? "— ON" : "— OFF"}
                </span>
                <span className="mt-1 block text-[12px] leading-relaxed" style={{ color: C.muted }}>
                  Frasberg continuously scans public repositories and runs internal anomaly detection. If this key is ever exposed, it is instantly moved to the auto_disabled state, the workspace owner is notified, and a reissue is suggested.
                </span>
              </span>
            </button>
          </div>

          <div className="mt-5 border-t pt-4" style={{ borderColor: C.border }}>
            <p className="font-mono text-[11.5px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>JSON Preview</p>
            <pre className="mt-2 max-h-52 overflow-auto rounded-md border p-3 font-mono text-[11.5px] leading-relaxed"
              style={{ borderColor: C.border, background: C.base, color: C.primary }} data-testid="key-json-preview">{preview}</pre>
          </div>
        </div>

        {/* Right panel — permissions matrix */}
        <div className="rounded-xl border px-5 py-4" style={{ background: C.panel, borderColor: C.border }} data-testid="forge-permissions-panel">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-[11.5px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>Permissions</p>
            <div className="flex gap-1.5">
              <button onClick={() => setAll("access")} data-testid="perm-preset-full" className="rounded-md border px-2.5 py-1 font-mono text-[11px]" style={{ borderColor: C.border, color: C.accent }}>Full Access</button>
              <button onClick={() => setAll("read")} data-testid="perm-preset-read" className="rounded-md border px-2.5 py-1 font-mono text-[11px]" style={{ borderColor: C.border, color: C.primary }}>Read Only</button>
              <button onClick={() => setPerms(defaultPerms())} data-testid="perm-preset-clear" className="rounded-md border px-2.5 py-1 font-mono text-[11px]" style={{ borderColor: C.border, color: C.muted }}>Reset</button>
            </div>
          </div>
          {GROUPS.map(([g, Icon, keys]) => (
            <div key={g} className="mt-4" data-testid={`perm-group-${g.toLowerCase().replace(/ /g, "-")}`}>
              <p className="flex items-center gap-2 text-[13px] font-700" style={{ color: C.text }}>
                <Icon size={14} style={{ color: C.primary }} /> {g}
              </p>
              <div className="mt-2 space-y-2">
                {keys.map((pk) => (
                  <div key={pk} className="grid items-center gap-2 sm:grid-cols-[1.5fr_2fr]">
                    <span className="text-[12.5px]" style={{ color: C.muted }}>{label(pk)}</span>
                    {seg(pk)}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-5 flex justify-end gap-3 border-t pt-4" style={{ borderColor: C.border }}>
            <button onClick={create} disabled={busy} data-testid="generate-key-btn"
              className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-700 text-black transition-opacity hover:opacity-85 disabled:opacity-50"
              style={{ background: C.primary }}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Create API Key
            </button>
          </div>
        </div>
      </div>

      {newKey && (
        <div className="rounded-xl border p-4" style={{ borderColor: "rgba(56,189,248,0.4)", background: "rgba(56,189,248,0.05)" }} data-testid="new-key-banner">
          <p className="font-mono text-[12.5px] uppercase tracking-[0.18em]" style={{ color: C.primary }}>
            Copy this now — it won't be shown in full again
          </p>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
            <code className="truncate font-mono text-sm" style={{ color: C.text }}>{newKey.key}</code>
            <div className="flex gap-2">
              <button onClick={() => copyKey(newKey.key)} data-testid="copy-new-key"
                className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-mono text-[12px]"
                style={{ borderColor: C.border, color: C.text }}>
                {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
              </button>
              <button onClick={runTest} disabled={testing} data-testid="test-key-btn"
                className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-mono text-[12px]"
                style={{ borderColor: "rgba(168,85,247,0.5)", color: C.accent }}>
                {testing ? <Loader2 size={12} className="animate-spin" /> : <FlaskConical size={12} />} Test Key
              </button>
            </div>
          </div>
          {testResults && (
            <div className="mt-3 space-y-1.5" data-testid="key-test-results">
              {testResults.map((r) => (
                <div key={r.route} className="flex flex-wrap items-center gap-2 font-mono text-[12px]">
                  <span style={{ color: r.status === "pass" ? "#34d399" : C.danger }}>{r.status === "pass" ? "PASS" : "FL-403"}</span>
                  <span style={{ color: C.text }}>{r.route}</span>
                  <span style={{ color: C.muted }}>requires {r.required_permission}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
