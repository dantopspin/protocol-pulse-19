import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/AppShell";
import { EmptyState, Note, Section, StatusTag } from "@/components/kit";
import { anchorId } from "@/lib/ai-sources";
import { fmt } from "@/lib/calc";
import { compoundName } from "@/lib/domain";
import { formatDateTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import { focusClass, useFocusedRecord } from "@/lib/use-focus-record";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Dose history — Peptide Lens" },
      {
        name: "description",
        content: "Every dose you recorded, with amount, vial, site, and status in one chronological list.",
      },
      { property: "og:title", content: "Dose history — Peptide Lens" },
      { property: "og:description", content: "Your complete recorded dose history." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const state = useStore((s) => s);
  const focused = useFocusedRecord();

  return (
    <Screen
      title="Dose history"
      eyebrow={`${state.doses.length} recorded`}
      back={{ to: "/", label: "Today" }}
    >
      <Section>
        {state.doses.length === 0 ? (
          <EmptyState title="No doses recorded" body="Log an entry from Today and it appears here." />
        ) : (
          <ul className="border-t border-hairline">
            {state.doses.map((d) => (
              <li
                key={d.id}
                id={anchorId(d.id)}
                className={cn("py-3 hairline-b", focused === d.id && focusClass)}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[15px]">{compoundName(d.compound_id)}</p>
                  <StatusTag tone={d.status === "skipped" ? "neutral" : "accent"}>{d.status}</StatusTag>
                </div>
                <p className="num mt-1 text-[12px] text-muted-foreground">
                  {formatDateTime(d.logged_at)} · {fmt(d.actual_amount, 3)} {d.amount_unit}
                  {d.volume_ml != null ? ` · ${fmt(d.volume_ml, 3)} mL` : ""}
                </p>
                {d.notes && <p className="mt-1 text-[13px]">{d.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section>
        <Note>This list records what you entered. It does not verify medical appropriateness.</Note>
      </Section>
    </Screen>
  );
}
