import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Screen } from "@/components/AppShell";
import { EmptyState, Note, Section, StatusTag, inputClass } from "@/components/kit";
import { anchorId } from "@/lib/ai-sources";
import { fmt } from "@/lib/calc";
import { compoundName } from "@/lib/domain";
import { formatDateTime, formatISODate } from "@/lib/format";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const state = useStore((s) => s);
  const focused = useFocusedRecord();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [compound, setCompound] = useState("");

  const compounds = useMemo(
    () => Array.from(new Set(state.doses.map((d) => d.compound_id))).map((id) => ({ id, name: compoundName(id) })),
    [state.doses],
  );
  const filtered = state.doses.filter((d) => {
    if (compound && d.compound_id !== compound) return false;
    const day = formatISODate(d.logged_at);
    if (from && day < from) return false;
    if (to && day > to) return false;
    return true;
  });
  const active = Boolean(from || to || compound);

  return (
    <Screen
      title="Dose history"
      eyebrow={active ? `${filtered.length} of ${state.doses.length} shown` : `${state.doses.length} recorded`}
      back={{ to: "/", label: "Today" }}
    >
      {state.doses.length > 0 && (
        <Section title="Filter">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[12px] text-muted-foreground">
              From
              <input type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="text-[12px] text-muted-foreground">
              To
              <input type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>
          <label className="mt-3 block text-[12px] text-muted-foreground">
            Compound
            <select className={inputClass} value={compound} onChange={(e) => setCompound(e.target.value)}>
              <option value="">All compounds</option>
              {compounds.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          {from && to && from > to && (
            <p className="mt-2 text-[12px] text-destructive">The start date is after the end date.</p>
          )}
          {active && (
            <button
              className="mt-3 text-[12px] underline underline-offset-4"
              onClick={() => { setFrom(""); setTo(""); setCompound(""); }}
            >
              Clear filters
            </button>
          )}
        </Section>
      )}
      <Section>
        {state.doses.length === 0 ? (
          <EmptyState title="No doses recorded" body="Log an entry from Today and it appears here." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching entries" body="No logged doses match these filters. Adjust or clear them." />
        ) : (
          <ul className="border-t border-hairline">
            {filtered.map((d) => (
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
