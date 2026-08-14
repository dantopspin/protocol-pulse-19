import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { LockedCard } from "@/components/kit";
import { useEntitlement } from "@/lib/entitlements";
import { PRO_FEATURES, type ProFeature } from "@/lib/subscription";

/**
 * Single place where premium access is decided. Screens describe *what* is
 * gated; they never re-implement the entitlement check.
 */
export function ProGate({
  feature,
  body,
  preview,
  children,
}: {
  feature: ProFeature;
  /** Optional override for the explanatory line. */
  body?: string;
  /** Blurred sample shown behind the lock. */
  preview?: ReactNode;
  children: ReactNode;
}) {
  const { can } = useEntitlement();
  if (can(feature)) return <>{children}</>;
  return (
    <LockedCard
      title={`${PRO_FEATURES[feature]} is included with Pro`}
      body={body ?? "Upgrade to unlock this view. Your recorded data stays on this device."}
    >
      {preview}
    </LockedCard>
  );
}

/** Inline lock marker for list rows and buttons. */
export function ProBadge({ className }: { className?: string }) {
  return (
    <Link
      to="/paywall"
      className={`inline-flex items-center gap-1 border border-hairline px-2 py-[2px] text-[11px] uppercase tracking-[0.1em] text-muted-foreground ${className ?? ""}`}
    >
      <Lock className="size-[11px]" strokeWidth={1.5} /> Pro
    </Link>
  );
}
