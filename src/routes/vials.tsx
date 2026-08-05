import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/AppShell";
import { EmptyState, LinkButton, Note, Row, Section, StatusTag } from "@/components/kit";
import { fmt } from "@/lib/calc";
import { compoundName } from "@/lib/domain";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/vials")({
  head: () => ({
    meta: [
      { title: "Vial inventory — Peptide Lens" },
      { name: "description", content: "Vial status, remaining amount, batch, and projected depletion from recorded entries." },
      { property: "og:title", content: "Vial inventory — Peptide Lens" },
      { property: "og:description", content: "Every vial, its balance, and its recorded history." },
    ],
  }),
  component: VialsPage,
});

function VialsPage() {
  const vials = useStore((s) => s.vials);
  return (
    <Screen title="Vials" eyebrow={`${vials.length} recorded`} back={{ to: "/protocols", label: "Protocols" }}>
      <Section>
        {vials.length === 0 ? (
          <EmptyState title="No active vial" body="Add a vial to estimate remaining doses." action={<LinkButton to="/onboarding" variant="secondary">Set up a vial</LinkButton>} />
        ) : (
          vials.map((v) => (
            <div key={v.id} className="mb-4 border border-hairline p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[17px] font-medium">{v.name}</p>
                <StatusTag tone={v.status === "low" ? "warning" : v.status === "active" ? "accent" : "neutral"}>{v.status}</StatusTag>
              </div>
              <div className="mt-3">
                <Row label="Compound" value={compoundName(v.compound_id)} mono={false} />
                <Row label="Original amount" value={`${fmt(v.original_amount, 3)} ${v.amount_unit}`} />
                <Row label="Diluent" value={`${fmt(v.diluent_volume_ml, 2)} mL`} />
                <Row label="Remaining (estimated)" value={`${fmt(v.estimated_remaining_amount, 3)} ${v.amount_unit}`} />
                <Row label="Batch" value={v.batch_number || "Not recorded"} mono={false} />
                <Row label="Expiry or discard date" value={v.user_expiry_date || "Not recorded"} className="border-b-0" />
              </div>
            </div>
          ))
        )}
      </Section>
      <Section><Note>Balances are estimated from entries you recorded. Correct them manually when they differ.</Note></Section>
    </Screen>
  );
}
