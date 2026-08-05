import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/AppShell";
import { Card, Note, Row, Section } from "@/components/kit";
import { adherence } from "@/lib/domain";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/weekly-review")({
  head: () => ({
    meta: [
      { title: "Weekly review — Peptide Lens" },
      { name: "description", content: "Scheduled versus logged entries, vial usage, symptoms, and data needing review." },
      { property: "og:title", content: "Weekly review — Peptide Lens" },
      { property: "og:description", content: "A restrained summary of the last seven days." },
    ],
  }),
  component: WeeklyReview,
});

function WeeklyReview() {
  const state = useStore((s) => s);
  const a = adherence(state, 7);
  return (
    <Screen title="This week" back={{ to: "/", label: "Today" }}>
      <Section>
        <Card>
          <Row label="Scheduled entries" value={a.scheduled} />
          <Row label="Logged entries" value={a.logged} />
          <Row label="Adherence" value={a.pct == null ? "—" : `${a.pct}%`} />
          <Row label="Vials opened" value={state.events.filter((e) => e.event_type === "vial_opened").length} />
          <Row label="Symptom entries" value={state.symptoms.length} className="border-b-0" />
        </Card>
      </Section>
      <Section title="Questions to consider">
        <ul className="border-t border-hairline">
          {["Confirm the scheduled amount matches your instructions.", "Review any entry marked as needing review.", "Confirm the recorded vial balance."].map((q) => (
            <li key={q} className="py-3 text-[14px] hairline-b">{q}</li>
          ))}
        </ul>
      </Section>
      <Section><Note>This summary describes recorded entries. It does not state that a change caused an outcome.</Note></Section>
    </Screen>
  );
}
