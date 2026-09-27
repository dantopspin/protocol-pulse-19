import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/AppShell";
import { EmptyState, LinkButton, Note, Section } from "@/components/kit";
import { useEntitlement } from "@/lib/entitlements";
import { useStore } from "@/lib/store";
import { anchorId } from "@/lib/ai-sources";
import { formatDateTime } from "@/lib/format";
import { focusClass, useFocusedRecord } from "@/lib/use-focus-record";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Change Timeline — Peptide Lens" },
      { name: "description", content: "Every meaningful protocol change with what you recorded before and after it." },
      { property: "og:title", content: "Change Timeline — Peptide Lens" },
      { property: "og:description", content: "Chronological, non-causal record of protocol changes." },
    ],
  }),
  component: TimelinePage,
});

function TimelinePage() {
  const events = useStore((s) => s.events);
  const { isPro } = useEntitlement();
  const focused = useFocusedRecord();
  return (
    <Screen title="Change Timeline" eyebrow="Protocol Intelligence" back={{ to: "/", label: "Today" }}>
      <Section>
        <LinkButton to="/recap" variant="secondary" className="mb-3 min-h-[44px]">Recap a date range</LinkButton>
        <LinkButton to="/compare" variant="secondary" className="mb-5 min-h-[44px]">Compare before and after a change</LinkButton>
        {events.length === 0 ? (
          <EmptyState title="No changes recorded" body="Record a protocol change and enough surrounding data to build a timeline." />
        ) : (
          <ol className="border-l border-hairline pl-4">
            {events.map((e) => (
              <li key={e.id} id={anchorId(e.id)} className={cn("mb-6", focused === e.id && focusClass)}>
                <p className="num text-[12px] text-muted-foreground">{formatDateTime(e.timestamp)}</p>
                <p className="mt-1 text-[15px]">{e.event_type.replace(/_/g, " ")}</p>
                {(e.previous_value || e.new_value) && (
                  <p className="num mt-1 text-[13px]">{e.previous_value ? `${e.previous_value} → ` : ""}{e.new_value}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </Section>
      <Section title="Change Impact">
        {isPro ? (
          <EmptyState title="No comparison available" body="Record a protocol change and enough surrounding data to create a before-and-after comparison." />
        ) : (
          <div className="border border-hairline p-4">
            <p className="text-[14px] font-medium">Change Impact is included with Pro</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Compare what you recorded 7, 14, or 30 days before and after a change.</p>
            <LinkButton to="/paywall" variant="secondary" className="mt-4 min-h-[44px]">See Pro</LinkButton>
          </div>
        )}
      </Section>
      <Section><Note>Observations describe temporal associations only. They do not establish causation.</Note></Section>
    </Screen>
  );
}
