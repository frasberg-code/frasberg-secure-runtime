import React from "react";

type PlanId = "BASIC" | "PRO" | "STUDIO" | "DEV_PLUS" | "SOVEREIGN";

interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: string;
  priceYearly?: string;
  highlight?: boolean;
  description: string;
  features: string[];
  cta: string;
}

const PLANS: Plan[] = [
  {
    id: "BASIC",
    name: "FRASBERG BASIC",
    priceMonthly: "Free",
    description: "For community and exploration.",
    features: [
      "30 requests/day",
      "Core governance engine",
      "Standard tone modulation",
      "Community support",
    ],
    cta: "Start for free",
  },
  {
    id: "PRO",
    name: "FRASBERG PRO",
    priceMonthly: "$19/mo",
    priceYearly: "$190/yr",
    highlight: true,
    description: "For power users and solo builders.",
    features: [
      "Unlimited requests",
      "Priority processing",
      "Advanced tonal modulation",
      "Basic API access",
    ],
    cta: "Upgrade to PRO",
  },
  {
    id: "STUDIO",
    name: "FRASBERG STUDIO",
    priceMonthly: "$49/mo",
    priceYearly: "$490/yr",
    description: "For creators and media teams.",
    features: [
      "Long‑form content",
      "Brand‑safe filters",
      "Cultural narrative shaping",
      "Batch generation tools",
    ],
    cta: "Start STUDIO",
  },
  {
    id: "DEV_PLUS",
    name: "FRASBERG DEV+",
    priceMonthly: "$99/mo",
    priceYearly: "$990/yr",
    description: "For developers and SaaS products.",
    features: [
      "Full API suite",
      "High‑volume rate limits",
      "Custom governance pipelines",
      "Audit logs & observability",
    ],
    cta: "Build with DEV+",
  },
  {
    id: "SOVEREIGN",
    name: "FRASBERG SOVEREIGN",
    priceMonthly: "Custom",
    description: "For governments and large institutions.",
    features: [
      "Dedicated governance engine",
      "On‑prem / VPC deployment",
      "Custom cultural models",
      "Compliance‑grade audit trails",
      "24/7 support & SLAs",
    ],
    cta: "Talk to sales",
  },
];

export const SubscriptionPage: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = React.useState<"monthly" | "yearly">(
    "monthly",
  );

  const handleSelectPlan = (planId: PlanId) => {
    // call backend to create Stripe Checkout session
    // e.g. POST /billing/checkout { planId, billingPeriod }
  };

  return (
    <div className="subscription-page">
      <header className="subscription-hero">
        <h1>Choose your FRASBERG AI plan</h1>
        <p>From community to sovereign governance—pick the rhythm that fits your world.</p>
        <div className="billing-toggle">
          <button
            className={billingPeriod === "monthly" ? "active" : ""}
            onClick={() => setBillingPeriod("monthly")}
          >
            Monthly
          </button>
          <button
            className={billingPeriod === "yearly" ? "active" : ""}
            onClick={() => setBillingPeriod("yearly")}
          >
            Yearly <span className="badge">Save 20%</span>
          </button>
        </div>
      </header>

      <section className="plans-grid">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billingPeriod={billingPeriod}
            onSelect={handleSelectPlan}
          />
        ))}
      </section>

      <section className="comparison-table">
        {/* implement feature comparison table */}
      </section>

      <section className="faq-section">
        {/* FAQ entries */}
      </section>
    </div>
  );
};

interface PlanCardProps {
  plan: Plan;
  billingPeriod: "monthly" | "yearly";
  onSelect: (id: PlanId) => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, billingPeriod, onSelect }) => {
  const price =
    billingPeriod === "monthly" || !plan.priceYearly
      ? plan.priceMonthly
      : plan.priceYearly;

  return (
    <div className={`plan-card ${plan.highlight ? "highlight" : ""}`}>
      {plan.highlight && <div className="ribbon">Most popular</div>}
      <h3>{plan.name}</h3>
      <p className="price">{price}</p>
      <p className="description">{plan.description}</p>
      <ul className="features">
        {plan.features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <button onClick={() => onSelect(plan.id)}>{plan.cta}</button>
    </div>
  );
};
