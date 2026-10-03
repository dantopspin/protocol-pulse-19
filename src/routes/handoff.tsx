import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/AppShell";
import { Button, Card, Choice, Note, Row, Section } from "@/components/kit";
import { ProGate } from "@/components/Pro";
import { adherence, compoundName, scheduleLabel } from "@/lib/domain";
import { useStore } from "@/lib/store";
import { fmt } from "@/lib/calc";
import { formatDate } from "@/lib/format";
import {
  buildDoseCsv,
  buildEventCsv,
  buildHandoffHtml,
  buildHandoffText,
  buildJsonExport,
  buildMetricCsv,
  buildSymptomCsv,
  buildVialCsv,
  exportName,
  handoffRangeLabel,
  printHtml,
  shareOrDownload,
  type HandoffRange,
} from "@/lib/export";

export const Route = createFileRoute("/handoff")({
  head: () => ({
    meta: [
      { title: "Protocol Handoff — Peptide Lens" },
      { name: "description", content: "A provider-readable summary of protocols, changes, adherence, symptoms, and inventory." },
      { property: "og:title", content: "Protocol Handoff — Peptide Lens" },
      { property: "og:description", content: "Prepare a complete record for your next appointment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Handoff,
});

const RANGES: HandoffRange[] = [30, 90, 0];

function Handoff() {
  const state = useStore((s) => s);
  const [range, setRange] = useState<HandoffRange>(30);
  const [status, setStatus] = useState<string | null>(null);
  const a = adherence(state, range === 0 ? 365 : range);

  const run = async (label: string, fn: () => Promise<"shared" | "downloaded"> | boolean) => {
    setStatus(null);
    try {
      const result = await fn();
      if (result === false) {
        setStatus("The print window was blocked. Allow pop-ups for this site and try again.");
        return;
      }
      setStatus(
        result === "shared"
          ? `${label} shared.`
          : result === true
            ? `${label} opened in a new window. Choose Print, then Save to Files for a PDF.`
            : `${label} saved to your downloads.`,
      );
    } catch {
      setStatus(`${label} could not be created.`);
    }
  };

  const report = (
    <Card>
      <Row label="Date range" value={handoffRangeLabel(range)} mono={false} />
      <Row label="Protocols" value={state.protocols.map((p) => p.name).join(", ") || "None"} mono={false} />
      {state.protocolCompounds.map((pc) => (
        <Row key={pc.id} label={compoundName(pc.compound_id)} value={`${fmt(pc.scheduled_amount, 3)} ${pc.amount_unit} · ${scheduleLabel(pc.schedule_rule)}`} />
      ))}
      <Row label="Adherence" value={a.pct == null ? "—" : `${a.pct}%`} />
      <Row label="Dose entries" value={state.doses.length} />
      <Row label="Symptom entries" value={state.symptoms.length} />
      <Row label="Recorded changes" value={state.events.length} />
      <Row label="Generated" value={formatDate(new Date())} className="border-b-0" />
    </Card>
  );

  return (
    <Screen title="Protocol Handoff" eyebrow="Export" back={{ to: "/protocols", label: "Protocols" }}>
      <Section title="One-page summary">
        <ProGate
          feature="handoff"
          body="Generate PDF summaries, CSV dose history, metrics, symptoms, and a full JSON backup."
          preview={report}
        >
          <div className="space-y-4">
            {report}
            <div className="space-y-2">
              {RANGES.map((r) => (
                <Choice
                  key={r}
                  title={handoffRangeLabel(r)}
                  selected={range === r}
                  onClick={() => setRange(r)}
                />
              ))}
            </div>
          </div>
        </ProGate>
      </Section>

      <ProGate feature="handoff" body="Exports are included with Pro.">
        <Section title="Export">
          <div className="space-y-3">
            <Button
              variant="secondary"
              full
              onClick={() => void run("The handoff report", () => printHtml(buildHandoffHtml(state, range)))}
            >
              Preview and print PDF
            </Button>
            <Button
              variant="secondary"
              full
              onClick={() =>
                void run("The handoff text", () =>
                  shareOrDownload(exportName("handoff", "txt"), buildHandoffText(state, range), "text/plain"),
                )
              }
            >
              Share handoff as text
            </Button>
            <Button
              variant="secondary"
              full
              onClick={() =>
                void run("Dose history", () =>
                  shareOrDownload(exportName("doses", "csv"), buildDoseCsv(state), "text/csv"),
                )
              }
            >
              Export CSV dose history
            </Button>
            <Button
              variant="secondary"
              full
              onClick={() =>
                void run("Symptom records", () =>
                  shareOrDownload(exportName("symptoms", "csv"), buildSymptomCsv(state), "text/csv"),
                )
              }
            >
              Export CSV symptoms
            </Button>
            <Button
              variant="secondary"
              full
              onClick={() =>
                void run("Metrics", () =>
                  shareOrDownload(exportName("metrics", "csv"), buildMetricCsv(state), "text/csv"),
                )
              }
            >
              Export CSV metrics
            </Button>
            <Button
              variant="secondary"
              full
              onClick={() =>
                void run("Vial inventory", () =>
                  shareOrDownload(exportName("vials", "csv"), buildVialCsv(state), "text/csv"),
                )
              }
            >
              Export CSV vials
            </Button>
            <Button
              variant="secondary"
              full
              onClick={() =>
                void run("The change timeline", () =>
                  shareOrDownload(exportName("timeline", "csv"), buildEventCsv(state), "text/csv"),
                )
              }
            >
              Export CSV change timeline
            </Button>
            <Button
              variant="secondary"
              full
              onClick={() =>
                void run("The full backup", () =>
                  shareOrDownload(exportName("backup", "json"), buildJsonExport(state), "application/json"),
                )
              }
            >
              Export JSON backup
            </Button>
          </div>
          {status && <p className="mt-3 text-[13px]">{status}</p>}
          <p className="mt-3">
            <Note>
              On iPhone the share sheet opens; otherwise the file downloads. For a PDF, choose Print
              then Save to Files.
            </Note>
          </p>
        </Section>
      </ProGate>

      <Section><Note>This report records what you entered. It contains no diagnosis and no recommendation.</Note></Section>
    </Screen>
  );
}
