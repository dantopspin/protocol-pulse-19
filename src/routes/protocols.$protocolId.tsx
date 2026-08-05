import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/AppShell";
import { Button, Card, LinkButton, Note, Row, Section, Sheet, StatusTag } from "@/components/kit";
import { fmt } from "@/lib/calc";
import { compoundName, reconFor, scheduleLabel, vialFor } from "@/lib/domain";
import { recordEvent, setState, useStore } from "@/lib/store";

export const Route = createFileRoute("/protocols/$protocolId")({
  head: () => ({
    meta: [
      { title: "Protocol detail — Peptide Lens" },
      { name: "description", content: "Schedule, calculation, vial connection, and change history for one protocol." },
      { property: "og:title", content: "Protocol detail — Peptide Lens" },
      { property: "og:description", content: "Review the derivation behind every scheduled amount." },
    ],
  }),
  component: ProtocolDetail,
});

function ProtocolDetail() {
  const { protocolId } = Route.useParams();
  const navigate = useNavigate();
  const state = useStore((s) => s);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const protocol = state.protocols.find((p) => p.id === protocolId);
  const pcs = state.protocolCompounds.filter((c) => c.protocol_id === protocolId);
  const events = state.events.filter((e) => e.protocol_id === protocolId);

  if (!protocol) {
    return (
      <Screen title="Protocol" back={{ to: "/protocols", label: "Protocols" }} hideTabs>
        <Section><Note>This protocol is no longer recorded on this device.</Note></Section>
      </Screen>
    );
  }

  return (
    <Screen
      title={protocol.name}
      eyebrow={protocol.status}
      back={{ to: "/protocols", label: "Protocols" }}
    >
      <Section title="Compounds">
        {pcs.map((pc) => {
          const vial = vialFor(state, pc);
          const recon = reconFor(state, pc, vial);
          return (
            <Card key={pc.id} className="mb-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[17px] font-medium">{compoundName(pc.compound_id)}</p>
                <StatusTag tone="accent">{pc.administration_format}</StatusTag>
              </div>
              <div className="mt-3">
                <Row label="Scheduled amount" value={`${fmt(pc.scheduled_amount, 3)} ${pc.amount_unit}`} />
                <Row label="Schedule" value={scheduleLabel(pc.schedule_rule)} mono={false} />
                <Row label="Preferred time" value={pc.preferred_times.join(", ")} />
                <Row label="Active vial" value={vial ? vial.name : "None"} mono={false} />
                <Row label="Concentration" value={recon ? `${fmt(recon.concentrationMgMl)} mg/mL` : "—"} />
                <Row label="Draw volume" value={recon ? `${fmt(recon.volumeMl, 3)} mL` : "—"} />
                <Row label="Syringe units" value={recon ? `${fmt(recon.syringeUnits, 1)} units` : "—"} className="border-b-0" />
              </div>
            </Card>
          );
        })}
      </Section>

      <Section title="Instruction source">
        <Card>
          <Row label="Source" value={protocol.instruction_source} mono={false} />
          <Row label="Start date" value={new Date(protocol.start_date).toLocaleDateString()} />
          <Row label="Notes" value={protocol.notes || "None"} mono={false} className="border-b-0" />
        </Card>
      </Section>

      <Section title="Change history" action={<LinkButton to="/timeline" variant="quiet">Timeline</LinkButton>}>
        <ul className="border-t border-hairline">
          {events.length === 0 && <li className="py-4"><Note>No changes recorded.</Note></li>}
          {events.slice(0, 12).map((e) => (
            <li key={e.id} className="py-3 hairline-b">
              <p className="text-[14px]">{e.event_type.replace(/_/g, " ")}</p>
              <p className="num text-[12px] text-muted-foreground">
                {new Date(e.timestamp).toLocaleString()}
                {e.previous_value ? ` · ${e.previous_value} → ${e.new_value}` : e.new_value ? ` · ${e.new_value}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            full
            onClick={() => {
              const nextStatus = protocol.status === "active" ? "paused" : "active";
              setState((s) => ({
                ...s,
                protocols: s.protocols.map((p) => (p.id === protocol.id ? { ...p, status: nextStatus } : p)),
              }));
              recordEvent(nextStatus === "active" ? "protocol_resumed" : "protocol_paused", {
                protocol_id: protocol.id,
                previous_value: protocol.status,
                new_value: nextStatus,
              });
            }}
          >
            {protocol.status === "active" ? "Pause" : "Resume"}
          </Button>
          <Button variant="destructive" full onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        </div>
      </Section>

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title={`Delete ${protocol.name}`}>
        <div className="page-x pt-4">
          <p className="text-[14px] leading-relaxed">
            This removes its schedule, dose history, vial connections, symptoms, and timeline events
            from this device.
          </p>
          <div className="mt-6 space-y-3">
            <Button variant="secondary" full onClick={() => setConfirmDelete(false)}>Keep protocol</Button>
            <Button
              variant="destructive"
              full
              onClick={() => {
                setState((s) => ({
                  ...s,
                  protocols: s.protocols.filter((p) => p.id !== protocol.id),
                  protocolCompounds: s.protocolCompounds.filter((c) => c.protocol_id !== protocol.id),
                  doses: s.doses.filter((d) => d.protocol_id !== protocol.id),
                  events: s.events.filter((e) => e.protocol_id !== protocol.id),
                }));
                navigate({ to: "/protocols" });
              }}
            >
              Delete protocol
            </Button>
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}
