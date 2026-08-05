import type { EntitlementState } from "./types";

export type Plan = {
  id: "annual" | "monthly";
  title: string;
  price: string;
  cadence: string;
  detail: string;
};

export const PLANS: Plan[] = [
  {
    id: "annual",
    title: "Annual",
    price: "$79.99",
    cadence: "per year",
    detail: "Billed once. Equivalent to $6.67 per month.",
  },
  {
    id: "monthly",
    title: "Monthly",
    price: "$11.99",
    cadence: "per month",
    detail: "Billed monthly. Cancel at any time.",
  },
];

/**
 * Abstract subscription boundary. A RevenueCat adapter can implement this
 * interface later without changing any calling code.
 */
export interface SubscriptionService {
  getEntitlement(): Promise<EntitlementState>;
  purchase(planId: Plan["id"]): Promise<{ ok: false; reason: string }>;
  restore(): Promise<{ ok: false; reason: string }>;
  manage(): Promise<{ ok: false; reason: string }>;
}

const NOT_CONNECTED = "Purchases are not connected in this build.";

export class LocalMockSubscriptionService implements SubscriptionService {
  constructor(private read: () => EntitlementState) {}
  async getEntitlement() {
    return this.read();
  }
  async purchase(_planId: Plan["id"]) {
    return { ok: false as const, reason: NOT_CONNECTED };
  }
  async restore() {
    return { ok: false as const, reason: NOT_CONNECTED };
  }
  async manage() {
    return { ok: false as const, reason: NOT_CONNECTED };
  }
}

export const PRO_FEATURES = {
  unlimited_protocols: "Unlimited protocols and compounds",
  advanced_schedules: "Cycles, titration records, and custom intervals",
  full_history: "Complete dose history beyond 30 days",
  multiple_vials: "Multiple active and reserve vials",
  analytics: "Advanced analytics and event overlays",
  change_impact: "Change Impact comparisons",
  handoff: "Protocol Handoff and exports",
  weekly_review: "Weekly protocol review",
  full_ai: "Unlimited assistant questions grounded in your records",
  exposure: "Estimated exposure visualization",
  lifestyle: "Lifestyle tracking modules",
} as const;

export type ProFeature = keyof typeof PRO_FEATURES;
