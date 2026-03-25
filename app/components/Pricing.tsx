import Link from "next/link";

const plans = [
  {
    name: "Free",
    desc: "Getting started ke liye",
    price: "₹0",
    period: "hamesha free",
    featured: false,
    tag: null,
    features: [
      "20 AI messages per day",
      "Llama 3.3 model",
      "Friends messaging",
      "Group chats (5 members)",
      "Chat history",
    ],
    cta: "Get started free",
    href: "/register",
  },
  {
    name: "Pro",
    desc: "Serious users ke liye",
    price: "₹299",
    period: "billed monthly",
    featured: true,
    tag: "Most Popular",
    features: [
      "1000 AI messages per day",
      "GPT-4o + Claude + Llama",
      "Friends messaging",
      "Group chats (50 members)",
      "Chat export (PDF/MD)",
      "Daily digest email",
      "Priority support",
    ],
    cta: "Start Pro trial",
    href: "/register",
  },
  {
    name: "Enterprise",
    desc: "Teams ke liye",
    price: "₹999",
    period: "billed monthly",
    featured: false,
    tag: null,
    features: [
      "Unlimited AI messages",
      "All models",
      "Group chats (500 members)",
      "API access",
      "Custom system prompts",
      "Usage analytics",
      "Dedicated support",
    ],
    cta: "Contact us",
    href: "/register",
  },
];

export default function Pricing() {
  return (
    <section className="pricing-section" id="pricing">
      <div className="pricing-inner">
        <div className="section-label">Pricing</div>
        <h2 className="section-title">Simple, transparent pricing</h2>
        <p className="section-sub">
          Free mein shuru karo। Baad mein upgrade karo jab ready ho।
        </p>

        <div className="pricing-grid">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`pricing-card${plan.featured ? " featured" : ""}`}
            >
              {plan.tag && <div className="pricing-tag">{plan.tag}</div>}
              <div className="plan-name">{plan.name}</div>
              <div className="plan-desc">{plan.desc}</div>
              <div className="plan-price">
                {plan.price}{" "}
                {plan.period !== "hamesha free" && <span>/mo</span>}
              </div>
              <div className="plan-period">{plan.period}</div>
              <ul className="plan-features">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`btn-plan${plan.featured ? " featured" : ""}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}