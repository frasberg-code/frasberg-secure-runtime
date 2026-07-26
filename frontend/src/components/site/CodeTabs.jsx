import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

const BASE = "https://frasberg.com";

function build(apiKey) {
  const key = apiKey || "YOUR_API_KEY";
  const url = `${BASE}/api/v1/chat`;
  return {
    cURL: `curl -N -X POST "${url}" \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"luchii-70b","message":"Hello Luchii"}'`,
    Python: `import requests

resp = requests.post(
    "${url}",
    headers={"Authorization": "Bearer ${key}"},
    json={"model": "luchii-70b", "message": "Hello Luchii"},
    stream=True,
)
for line in resp.iter_lines():
    if line:
        print(line.decode())`,
    JavaScript: `const res = await fetch("${url}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${key}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ model: "luchii-70b", message: "Hello Luchii" }),
});

const reader = res.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(decoder.decode(value));
}`,
  };
}

const TABS = ["cURL", "Python", "JavaScript"];

export default function CodeTabs({ apiKey }) {
  const [active, setActive] = useState("cURL");
  const [copied, setCopied] = useState(false);
  const snippets = build(apiKey);

  const copy = async () => {
    const text = snippets[active];
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch {} ta.remove();
    }
    setCopied(true);
    toast.success(`${active} snippet copied`);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-lux-border bg-[#0d1013] shadow-xl" data-testid="quickstart-tabs">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              data-testid={`quickstart-tab-${t.toLowerCase()}`}
              className={`rounded-full px-4 py-1.5 font-mono text-xs transition-colors ${
                active === t ? "bg-lux-accent text-lux-bg" : "text-white/55 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={copy}
          data-testid="quickstart-copy"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-white/60 transition-colors hover:text-white"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-[#c8f7ff]">
        <code>{snippets[active]}</code>
      </pre>
      {!apiKey && (
        <p className="border-t border-white/10 px-5 py-3 font-mono text-[11px] text-white/45">
          Generate a key above to auto-fill it here — or replace YOUR_API_KEY.
        </p>
      )}
    </div>
  );
}
