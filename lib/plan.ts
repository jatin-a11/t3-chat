// lib/plans.ts
export const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    dailyMessages: 20,       // 20 AI messages per day
    features: [
      "20 AI messages per day",
      "Llama 3.3 70B model",
      "Friends messaging",
      "Group chats (5 members)",
      "Chat history",
    ],
  },
  PRO: {
    name: "Pro",
    price: 29900,            // ₹299 in paise
    displayPrice: "₹299",
    dailyMessages: 1000,
    features: [
      "1000 AI messages per day",
      "All models — Llama + Mixtral",
      "Friends messaging",
      "Group chats (50 members)",
      "Chat export (PDF/MD)",
      "Priority support",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 99900,            // ₹999 in paise
    displayPrice: "₹999",
    dailyMessages: 999999,   // Unlimited
    features: [
      "Unlimited AI messages",
      "All models",
      "Group chats (500 members)",
      "API access",
      "Custom system prompts",
      "Dedicated support",
    ],
  },
} as const;

export type PlanType = keyof typeof PLANS;

export function getPlanLimits(plan: PlanType) {
  return PLANS[plan];
}