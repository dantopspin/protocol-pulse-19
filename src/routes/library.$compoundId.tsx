import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/AppShell";
import { Card, Note, Row, Section, StatusTag } from "@/components/kit";
import { COMPOUNDS } from "@/lib/compounds";

export const Route = createFileRoute("/library/$compoundId")({
  head: () => ({
    meta: [
      { title: "Compound profile — Peptide Lens" },
      { name: "description", content: "Mechanism summary, half-life reference, regulatory status, and evidence quality." },
      { property: "og:title", content: "Compound profile — Peptide Lens" },
      { property: "og:description", content: "Educational reference separated from your active protocol." },
    ],
  }),
  component: CompoundProfile,
});

function CompoundProfile() {
  const { compoundId } = Route.useParams();
  const c = COMPOUNDS.find((x) => x.id === compoundId);
  if (!c) {
    return (
      <Screen title="Profile" back={{ to: "/library", label: "Library" }} hideTabs>
        <Section><Note>No profile recorded for this identifier.</Note></Section>
      </Screen>
    );
  }
  return (
    <Screen title={c.name} eyebrow={c.category} back={{ to: "/library", label: "Library" }}>
      <Section>
        <div className="flex flex-wrap gap-2">
          <StatusTag tone="accent">{c.regulatory_status}</StatusTag>
          <StatusTag>{`Evidence: ${c.evidence_quality}`}</StatusTag>
        </div>
        <p className="mt-5 text-[15px] leading-relaxed">{c.mechanism_summary}</p>
      </Section>
      <Section title="Reference">
        <Card>
          <Row label="Alternate names" value={c.alternate_names.join(", ") || "None recorded"} mono={false} />
          <Row label="Research status" value={c.research_status} mono={false} />
          <Row label="Half-life" value={c.half_life_value ? `${c.half_life_value} ${c.half_life_unit}` : "Not established"} />
          <Row label="Half-life source" value={c.half_life_source} mono={false} />
          <Row label="Educational ranges" value={c.educational_ranges} mono={false} />
          <Row label="Last reviewed" value={c.last_reviewed_at} className="border-b-0" />
        </Card>
      </Section>
      <Section title="References">
        <ul className="border-t border-hairline">
          {c.references.map((r) => (<li key={r} className="py-3 text-[13px] text-muted-foreground hairline-b">{r}</li>))}
        </ul>
      </Section>
      <Section>
        <Note>Educational only. Not an instruction, recommendation, or protocol for you.</Note>
      </Section>
    </Screen>
  );
}
