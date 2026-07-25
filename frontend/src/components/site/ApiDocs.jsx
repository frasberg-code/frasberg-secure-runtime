import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import Reveal, { Overline } from "./Reveal";
import { API_SNIPPET } from "../../data/content";

export default function ApiDocs() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(API_SNIPPET);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = API_SNIPPET;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      ta.remove();
    }
    setCopied(true);
    toast.success("Snippet copied");
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section id="api" className="border-t border-lux-border bg-lux-surface/40">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-5 py-28 sm:px-8 lg:grid-cols-2">
        <Reveal>
          <Overline>Developer API</Overline>
          <h2 className="mt-4 font-display text-4xl font-700 tracking-tighter text-lux-text sm:text-5xl">
            One API. Drop-in ready.
          </h2>
          <p className="mt-5 max-w-md text-lux-text2">
            One endpoint, four models. Bearer auth, familiar chat schema, and
            streaming responses. Public tier ships 60 req/min; enterprise scales
            to 600.
          </p>
          <ul className="mt-8 space-y-3 font-mono text-sm text-lux-text2">
            <li className="flex items-center gap-3"><span className="h-1 w-1 rounded-full bg-lux-accent" /> POST /v1/chat · /embeddings · /moderation</li>
            <li className="flex items-center gap-3"><span className="h-1 w-1 rounded-full bg-lux-accent" /> Models: 200m · 1b · 7b · 70b</li>
            <li className="flex items-center gap-3"><span className="h-1 w-1 rounded-full bg-lux-accent" /> Frasberg Public License (FPL)</li>
          </ul>
          <a
            href="mailto:support@frasberg.ai"
            data-testid="api-contact"
            className="mt-9 inline-flex rounded-full bg-lux-accent px-6 py-3 text-sm font-600 text-lux-bg transition-transform duration-200 hover:-translate-y-0.5"
          >
            Request access
          </a>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="overflow-hidden rounded-2xl border border-lux-border bg-[#0d1013] shadow-2xl" data-testid="api-code-block">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
              </div>
              <button
                onClick={copy}
                data-testid="api-copy"
                className="inline-flex items-center gap-1.5 font-mono text-xs text-white/60 transition-colors hover:text-white"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="overflow-x-auto p-6 font-mono text-[13px] leading-relaxed text-[#c8f7ff]">
              <code>{API_SNIPPET}</code>
            </pre>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
