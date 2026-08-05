import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/AppShell";
import { Button, Choice, Note, Section } from "@/components/kit";
import { subscriptionService } from "@/lib/entitlements";
import { PLANS, PRO_FEATURES } from "@/lib/subscription";

export const Route = createFileRoute("/paywall")({
  head: () => ({
    meta: [
      { title: "Peptide Lens Pro" },
      { name: "description", content: "Unlimited protocols and vials, complete history, Change Impact, exports, and a grounded assistant." },
      { property: "og:title", content: "Peptide Lens Pro" },
      { property: "og:description", content: "See the complete protocol history." },
    ],
  }),
  component: Paywall,
});

function Paywall() {
  const [plan, setPlan] = useState<"annual" | "monthly">("annual");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <Screen title="See the complete protocol history" hideTabs back={{ to: "/", label: "Close" }}>
      <Section>
        <ul className="border-t border-hairline">
          {Object.values(PRO_FEATURES).map((f) => (
            <li key={f} className="py-3 text-[15px] hairline-b">{f}</li>
          ))}
        </ul>
      </Section>
      <Section title="Plan">
        <div className="space-y-2">
          {PLANS.map((p) => (
            <Choice key={p.id} title={`${p.title} — ${p.price} ${p.cadence}`} detail={p.detail} selected={plan === p.id} onClick={() => setPlan(p.id)} />
          ))}
        </div>
      </Section>
      <Section>
        <Button full onClick={async () => setMessage((await subscriptionService.purchase(plan)).reason)}>Continue</Button>
        <div className="mt-4 flex flex-wrap gap-4">
          <button className="text-[13px] text-muted-foreground underline underline-offset-4" onClick={async () => setMessage((await subscriptionService.restore()).reason)}>Restore purchases</button>
          <button className="text-[13px] text-muted-foreground underline underline-offset-4" onClick={async () => setMessage((await subscriptionService.manage()).reason)}>Manage subscription</button>
        </div>
        {message && <p className="mt-4 text-[13px]">{message}</p>}
        <p className="mt-6"><Note>Terms and Privacy Policy are available in Settings. Use the developer entitlement switch to preview Pro locally.</Note></p>
      </Section>
    </Screen>
  );
}
