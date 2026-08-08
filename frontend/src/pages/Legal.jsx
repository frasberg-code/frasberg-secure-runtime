import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Scale, ShieldCheck, FileText } from "lucide-react";

const DOCS = {
  partner: {
    title: "Partner API Agreement",
    icon: FileText,
    sections: [
      ["1. Definitions", "\"FrasbergAI\" refers to the FrasbergAI Platform and its Luchii model family, operated by FRASBERG INC. \"Partner\" refers to any entity integrating FrasbergAI into its products or services. \"API\" refers to https://api.frasberg.com/v1 and all associated endpoints."],
      ["2. Authentication", "Partners must authenticate using Bearer tokens: Authorization: Bearer {FRASBERG_LLM_KEY}"],
      ["3. Permitted Use", "Partners may integrate FrasbergAI models into applications, use SSE streaming for real-time inference, generate embeddings for search and retrieval, and deploy FrasbergAI in commercial products."],
      ["4. Prohibited Use", "Partners may not attempt to bypass authentication, redistribute API keys, or misrepresent FrasbergAI output as another provider's output."],
      ["5. Rate Limits & Quotas", "Rate limits are enforced per API key (60 requests/minute standard). Enterprise limits may be negotiated."],
      ["6. Data Privacy", "FrasbergAI does not store prompts or outputs for training. Metadata-only logging."],
      ["7. Termination", "FrasbergAI may revoke access for violation of this Agreement."],
      ["8. Governing Law", "This Agreement is governed by the laws of the State of Delaware, United States, without regard to conflict-of-law principles. Any disputes arising under or relating to this Agreement shall be resolved exclusively in the state or federal courts located in Delaware."],
    ],
  },
  sla: {
    title: "Provider SLA Contract",
    icon: Scale,
    sections: [
      ["1. Uptime Guarantee", "99.9% uptime (Standard) · 99.95% (Premium) · 99.99% (Enterprise) · 99.995% (Dedicated). Live measured uptime is published at /status."],
      ["2. Latency Targets", "Luchii-6-Plus: 250–450ms · Luchii-6-Mini: 150–300ms · Luchii-6-Embed: <100ms"],
      ["3. Error Rate Targets", "<0.5% (Premium) · <0.2% (Enterprise) · <0.1% (Dedicated)"],
      ["4. Failover", "Multi-region failover is automatic for enterprise tenants."],
      ["5. Support Response Times", "Standard: 24 hours · Premium: 4 hours · Enterprise: 1 hour · Dedicated: 15 minutes"],
      ["6. Incident Reporting", "All incidents are posted on https://status.frasberg.com"],
      ["7. Remedies", "If SLA is not met, FrasbergAI provides service credits."],
      ["8. Governing Law", "Delaware, United States."],
    ],
  },
  compliance: {
    title: "Enterprise Compliance Packet",
    icon: ShieldCheck,
    sections: [
      ["1. Certifications & Frameworks", "GDPR compliant · CCPA compliant · SOC2 (in progress) · HIPAA (optional enterprise add-on) · ISO 27001 (roadmap)"],
      ["2. Data Handling", "No prompt retention · No output retention · Metadata-only logging · AES-256 at rest · TLS 1.3 in transit · Memory scrubbing after inference"],
      ["3. Residency Controls", "US-only routing for US tenants · EU-only routing for EU tenants · APAC-only routing for APAC tenants"],
      ["4. Security Controls", "RBAC · SSO (Google, GitHub, Okta, Azure AD) · SCIM provisioning · MFA enforcement · Zero-trust network"],
      ["5. Audit Controls", "Immutable logs · SIEM integration (Splunk, Datadog, Sentinel) · Admin action logging · Model usage logging"],
      ["6. Governance Controls", "Policy enforcement · Safety filters · Model access controls · Tenant isolation · LINQ Governance Command Center (45-layer engine)"],
    ],
  },
};

export default function Legal() {
  const [params] = useSearchParams();
  const initial = DOCS[params.get("doc")] ? params.get("doc") : "partner";
  const [doc, setDoc] = useState(initial);
  const active = DOCS[doc];

  return (
    <main className="min-h-screen bg-lux-bg text-lux-text">
      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/docs" className="flex items-center gap-2.5" data-testid="legal-back-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <img src="/frasberg-mark-circle.png" alt="FrasbergAI" className="h-8 w-8 rounded-full" />
            <span className="font-display text-lg font-700 tracking-tight">Legal & Compliance</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8" data-testid="legal-page">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-lux-accent">FrasbergAI — Official Documents · Version 1.0 — August 2026</p>
        <h1 className="mt-3 font-display text-4xl font-700 tracking-tighter">{active.title}</h1>

        <div className="mt-6 flex flex-wrap gap-2">
          {Object.entries(DOCS).map(([id, d]) => (
            <button key={id} onClick={() => setDoc(id)} data-testid={`legal-tab-${id}`}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${doc === id ? "bg-lux-text text-lux-bg" : "border border-lux-border text-lux-text2 hover:text-lux-text"}`}>
              <d.icon size={14} /> {d.title}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-6" data-testid="legal-content">
          {active.sections.map(([h, body]) => (
            <section key={h} className="rounded-2xl border border-lux-border bg-lux-surface p-6">
              <h2 className="font-display text-lg font-600">{h}</h2>
              <p className="mt-2 text-sm leading-relaxed text-lux-text2">{body}</p>
            </section>
          ))}
        </div>

        <p className="mt-10 text-xs text-lux-text2">
          By integrating FrasbergAI, Partner agrees to these terms. Questions: support@frasberg.com · Operated by FRASBERG INC.
        </p>
      </div>
    </main>
  );
}
