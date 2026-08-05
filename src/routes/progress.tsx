import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HeaderActions, Screen } from "@/components/AppShell";
import { Button, Card, EmptyState, Field, LockedCard, Note, Row, Section, inputClass } from "@/components/kit";
import { adherence } from "@/lib/domain";
import { useEntitlement } from "@/lib/entitlements";
import { setState, uid, useStore } from "@/lib/store";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Peptide Lens" },
      { name: "description", content: "Adherence, weight, metrics, symptoms, and change overlays across your recorded history." },
      { property: "og:title", content: "Progress — Peptide Lens" },
      { property: "og:description", content: "Longitudinal records with restrained, non-causal summaries." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const state = useStore((s) => s);
  const { isPro } = useEntitlement();
  const [weight, setWeight] = useState("");
  const [symptom, setSymptom] = useState("");
  const a = adherence(state, 30);
  const weights = state.metrics.filter((m) => m.metric_type === "weight").slice(0, 12);

  return (
    <Screen title="Progress" eyebrow="Last 30 days" right={<HeaderActions />}>
      <Section title="Adherence">
        <Card>
          <Row label="Scheduled entries" value={a.scheduled} />
          <Row label="Logged entries" value={a.logged} />
          <Row label="Adherence" value={a.pct == null ? "—" : `${a.pct}%`} className="border-b-0" />
        </Card>
      </Section>

      <Section title="Weight">
        <Field label="Record weight">
          <div className="flex gap-3">
            <input className={inputClass} inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="kg" />
            <Button
              variant="secondary"
              className="min-h-[44px] text-[14px]"
              onClick={() => {
                if (!Number(weight)) return;
                setState((s) => ({
                  ...s,
                  metrics: [
                    { id: uid(), metric_type: "weight", value: Number(weight), unit: s.preferences.measurement_system === "metric" ? "kg" : "lb", recorded_at: new Date().toISOString(), source: "manual", source_record_id: null, notes: "" },
                    ...s.metrics,
                  ],
                }));
                setWeight("");
              }}
            >
              Save
            </Button>
          </div>
        </Field>
        {weights.length === 0 ? (
          <div className="mt-4"><Note>No weight entries recorded.</Note></div>
        ) : (
          <ul className="mt-4 border-t border-hairline">
            {weights.map((m) => (
              <li key={m.id} className="flex justify-between py-2 hairline-b">
                <span className="num text-[14px]">{m.value} {m.unit}</span>
                <span className="num text-[12px] text-muted-foreground">{new Date(m.recorded_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Symptoms and side effects">
        <Field label="Record symptom">
          <div className="flex gap-3">
            <input className={inputClass + " font-sans text-[15px]"} value={symptom} onChange={(e) => setSymptom(e.target.value)} placeholder="Name" />
            <Button
              variant="secondary"
              className="min-h-[44px] text-[14px]"
              onClick={() => {
                if (!symptom.trim()) return;
                setState((s) => ({
                  ...s,
                  symptoms: [
                    { id: uid(), name: symptom.trim(), severity: 3, started_at: new Date().toISOString(), duration: "", resolved_at: null, related_protocol_id: s.activeProtocolId, related_compound_id: null, related_dose_id: null, related_vial_id: null, related_site_id: null, notes: "", attachment_uris: [], created_at: new Date().toISOString() },
                    ...s.symptoms,
                  ],
                }));
                setSymptom("");
              }}
            >
              Save
            </Button>
          </div>
        </Field>
        {state.symptoms.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No symptoms recorded" body="Add an entry only when there is something useful to remember." />
          </div>
        ) : (
          <ul className="mt-4 border-t border-hairline">
            {state.symptoms.slice(0, 10).map((s) => (
              <li key={s.id} className="flex justify-between py-2 hairline-b">
                <span className="text-[14px]">{s.name}</span>
                <span className="num text-[12px] text-muted-foreground">{new Date(s.started_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3"><Note>Severe or urgent symptoms require appropriate medical care, not an app response.</Note></p>
      </Section>

      <Section title="Advanced analytics">
        {isPro ? (
          <Card>
            <Row label="Change overlays" value="Enabled" mono={false} />
            <Row label="Estimated exposure" value="Educational estimate only" mono={false} />
            <Row label="Lifestyle modules" value="Enabled" mono={false} className="border-b-0" />
          </Card>
        ) : (
          <LockedCard title="Advanced analytics" body="Trends, event overlays, estimated exposure, lifestyle modules, and exportable reports are included with Pro.">
            <Card>
              <Row label="Symptom frequency" value="—" />
              <Row label="Vial consumption" value="—" />
              <Row label="Site usage" value="—" />
            </Card>
          </LockedCard>
        )}
      </Section>

      <Section><Note>Charts describe recorded associations. They do not establish causation.</Note></Section>
    </Screen>
  );
}
