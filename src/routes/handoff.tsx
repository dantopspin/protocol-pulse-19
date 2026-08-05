import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/AppShell";
import { Button, Card, LockedCard, Note, Row, Section } from "@/components/kit";
import { adherence, compoundName, scheduleLabel } from "@/lib/domain";
import { useEntitlement } from "@/lib/entitlements";
import { useStore } from "@/lib/store";
import { fmt } from "@/lib/calc";

export const Route = createFileRoute("/handoff")({
  head: () => ({
    meta: [
      { title: "Protocol Handoff — Peptide Lens" },
      { name: "description", content: "A provider-readable summary of protocols, changes, adherence, symptoms, and inventory." },
      { property: "og:title", content: "Protocol Handoff — Peptide Lens" },
      { property: "og:description", content: "Prepare a complete record for your next appointment." },
    ],
  }),
  component: Handoff,
});

function Handoff() {
  const state = useStore((s) => s);
  const { isPro } = useEntitlement();
  const a = adherence(state, 30);
  const report = (
    <Card>
      <Row label="Date range" value="Last 30 days" mono={false} />
      <Row label="Protocols" value={state.protocols.map((p) => p.name).join(", ") || "None"} mono={false} />
      {state.protocolCompounds.map((pc) => (
        <Row key={pc.id} label={compoundName(pc.compound_id)} value={`${fmt(pc.scheduled_amount, 3)} ${pc.amount_unit} · ${scheduleLabel(pc.schedule_rule)}`} />
      ))}
      <Row label="Adherence" value={a.pct == null ? "—" : `${a.pct}%`} />
      <Row label="Symptom entries" value={state.symptoms.length} />
      <Row label="Generated" value={new Date().toLocaleDateString()} className="border-b-0" />
    </Card>
  );
  return (
    <Screen title="Protocol Handoff" eyebrow="Export" back={{ to: "/protocols", label: "Protocols" }}>
      <Section title="One-page summary">
        {isPro ? report : <LockedCard title="Handoff and exports are included with Pro" body="Generate PDF summaries, CSV dose history, metrics, symptoms, and a full JSON backup.">{report}</LockedCard>}
      </Section>
      {isPro && (
        <Section title="Export">
          <div className="space-y-3">
            <Button variant="secondary" full>Preview PDF</Button>
            <Button variant="secondary" full>Export CSV dose history</Button>
            <Button variant="secondary" full>Export JSON backup</Button>
          </div>
          <p className="mt-3"><Note>Export adapters are prepared for native share and Files. Connect them to complete the handoff.</Note></p>
        </Section>
      )}
      <Section><Note>This report records what you entered. It contains no diagnosis and no recommendation.</Note></Section>
    </Screen>
  );
}
