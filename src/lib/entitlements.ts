import { useCallback } from "react";
import { getState, setState, useStore } from "./store";
import { LocalMockSubscriptionService, type ProFeature } from "./subscription";

export const subscriptionService = new LocalMockSubscriptionService(() => getState().entitlement);

const FREE_LIMITS = {
  protocols: 1,
  compoundsPerProtocol: 3,
  vialsPerCompound: 1,
  historyDays: 30,
  savedCalculations: 3,
  aiPerWeek: 5,
};

export function useEntitlement() {
  const entitlement = useStore((s) => s.entitlement);
  const isPro = entitlement.tier === "pro";

  const can = useCallback((_feature: ProFeature) => isPro, [isPro]);

  const setDeveloperTier = useCallback((tier: "free" | "pro") => {
    setState((s) => ({
      ...s,
      entitlement: {
        tier,
        source: "developer",
        expires_at: null,
        last_verified_at: new Date().toISOString(),
      },
    }));
  }, []);

  return { entitlement, isPro, can, limits: FREE_LIMITS, setDeveloperTier };
}

export { FREE_LIMITS };
