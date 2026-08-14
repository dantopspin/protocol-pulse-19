import { fmt } from "./calc";
import { siteLabel } from "./compounds";
import { adherence, compoundName, scheduleLabel } from "./domain";
import { formatDate, formatDateTime, formatISODate } from "./format";
import type { AppState } from "./store";

/* ------------------------------------------------------------------ */
/* Serialisers                                                          */
/* ------------------------------------------------------------------ */

export function buildJsonExport(s: AppState) {
  return JSON.stringify(
    {
      app: "Peptide Lens",
      schema_version: 1,
      exported_at: new Date().toISOString(),
      preferences: s.preferences,
      protocols: s.protocols,
      protocol_compounds: s.protocolCompounds,
      vials: s.vials,
      doses: s.doses,
      symptoms: s.symptoms,
      metrics: s.metrics,
      sites: s.sites,
      events: s.events,
      observations: s.observations,
      calculations: s.calculations,
    },
    null,
    2,
  );
}

const csvCell = (v: unknown) => {
  const str = v == null ? "" : String(v);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

export function toCsv(rows: (string | number | null)[][]) {
  return rows.map((r) => r.map(csvCell).join(",")).join("\n");
}

export function buildDoseCsv(s: AppState) {
  return toCsv([
    [
      "logged_at",
      "compound",
      "scheduled_amount",
      "actual_amount",
      "unit",
      "volume_ml",
      "syringe_units",
      "site",
      "status",
      "check",
      "notes",
    ],
    ...s.doses.map((d) => [
      d.logged_at,
      compoundName(d.compound_id),
      d.scheduled_amount,
      d.actual_amount,
      d.amount_unit,
      d.volume_ml,
      d.syringe_units,
      siteLabel(d.injection_site_id),
      d.status,
      d.protocol_check_result?.severity ?? "",
      d.notes,
    ]),
  ]);
}

export function buildSymptomCsv(s: AppState) {
  return toCsv([
    ["started_at", "name", "severity", "duration", "resolved_at", "notes"],
    ...s.symptoms.map((x) => [
      x.started_at,
      x.name,
      x.severity,
      x.duration,
      x.resolved_at,
      x.notes,
    ]),
  ]);
}

export function buildMetricCsv(s: AppState) {
  return toCsv([
    ["recorded_at", "metric_type", "value", "unit", "source", "notes"],
    ...s.metrics.map((m) => [m.recorded_at, m.metric_type, m.value, m.unit, m.source, m.notes]),
  ]);
}

export function buildVialCsv(s: AppState) {
  return toCsv([
    [
      "name",
      "compound",
      "status",
      "original_amount",
      "unit",
      "diluent_ml",
      "remaining",
      "reconstituted",
      "expiry",
      "batch",
    ],
    ...s.vials.map((v) => [
      v.name,
      compoundName(v.compound_id),
      v.status,
      v.original_amount,
      v.amount_unit,
      v.diluent_volume_ml,
      v.manual_remaining_amount ?? v.estimated_remaining_amount,
      v.reconstitution_date,
      v.user_expiry_date,
      v.batch_number,
    ]),
  ]);
}

export function buildEventCsv(s: AppState) {
  return toCsv([
    ["timestamp", "event_type", "previous_value", "new_value", "source", "notes"],
    ...s.events.map((e) => [
      e.timestamp,
      e.event_type,
      e.previous_value,
      e.new_value,
      e.source,
      e.notes,
    ]),
  ]);
}

/* ------------------------------------------------------------------ */
/* Clinician-readable handoff                                           */
/* ------------------------------------------------------------------ */

export type HandoffRange = 30 | 90 | 0; // 0 = complete history

export function handoffRangeLabel(range: HandoffRange) {
  return range === 0 ? "Complete recorded history" : `Last ${range} days`;
}

function within(iso: string, range: HandoffRange) {
  if (range === 0) return true;
  return Date.now() - new Date(iso).getTime() <= range * 86400000;
}

export function buildHandoffText(s: AppState, range: HandoffRange = 30) {
  const a = adherence(s, range === 0 ? 365 : range);
  const doses = s.doses.filter((d) => within(d.logged_at, range));
  const symptoms = s.symptoms.filter((x) => within(x.started_at, range));
  const events = s.events.filter((e) => within(e.timestamp, range));
  const L: string[] = [];

  L.push("PEPTIDE LENS — PROTOCOL HANDOFF");
  L.push(`Generated ${formatDateTime(new Date())}`);
  L.push(`Period: ${handoffRangeLabel(range)}`);
  L.push("");
  L.push("This document reproduces information entered by the individual. It contains no");
  L.push("diagnosis, no clinical assessment, and no recommendation.");
  L.push("");

  L.push("1. PROTOCOLS");
  if (s.protocols.length === 0) L.push("  None recorded.");
  for (const p of s.protocols) {
    L.push(`  ${p.name} — ${p.status}, started ${formatDate(p.start_date)}`);
    for (const pc of s.protocolCompounds.filter((c) => c.protocol_id === p.id)) {
      L.push(
        `    · ${compoundName(pc.compound_id)}: ${fmt(pc.scheduled_amount, 3)} ${pc.amount_unit}, ${scheduleLabel(pc.schedule_rule)}${pc.stopped_at ? ` (stopped ${formatDate(pc.stopped_at)})` : ""}`,
      );
    }
  }
  L.push("");

  L.push("2. ADHERENCE");
  L.push(`  Scheduled entries: ${a.scheduled}`);
  L.push(`  Logged entries:    ${a.logged}`);
  L.push(`  Adherence:         ${a.pct == null ? "not enough records" : a.pct + "%"}`);
  L.push("");

  L.push("3. CHANGE TIMELINE");
  if (events.length === 0) L.push("  No changes recorded in this period.");
  for (const e of events) {
    L.push(
      `  ${formatDateTime(e.timestamp)} — ${e.event_type.replace(/_/g, " ")}${
        e.previous_value || e.new_value
          ? `: ${e.previous_value ? `${e.previous_value} -> ` : ""}${e.new_value ?? ""}`
          : ""
      }`,
    );
  }
  L.push("");

  L.push("4. DOSE HISTORY");
  if (doses.length === 0) L.push("  No doses recorded in this period.");
  for (const d of doses) {
    L.push(
      `  ${formatDateTime(d.logged_at)} — ${compoundName(d.compound_id)} ${fmt(d.actual_amount, 3)} ${d.amount_unit}${
        d.volume_ml ? ` (${fmt(d.volume_ml, 3)} mL)` : ""
      }, site ${siteLabel(d.injection_site_id)}, ${d.status}${d.notes ? ` — ${d.notes}` : ""}`,
    );
  }
  L.push("");

  L.push("5. SYMPTOM RECORDS");
  if (symptoms.length === 0) L.push("  None recorded in this period.");
  for (const x of symptoms) {
    L.push(
      `  ${formatDate(x.started_at)} — ${x.name}, severity ${x.severity}/10${x.duration ? `, ${x.duration}` : ""}${
        x.resolved_at ? `, resolved ${formatDate(x.resolved_at)}` : ", ongoing"
      }`,
    );
  }
  L.push("");

  L.push("6. INVENTORY");
  if (s.vials.length === 0) L.push("  No vials recorded.");
  for (const v of s.vials) {
    L.push(
      `  ${v.name} — ${compoundName(v.compound_id)}, ${v.original_amount} ${v.amount_unit} in ${v.diluent_volume_ml} mL, remaining ${fmt(
        v.manual_remaining_amount ?? v.estimated_remaining_amount,
        2,
      )} ${v.amount_unit}, ${v.status}`,
    );
  }
  L.push("");

  L.push("7. OBSERVATIONS (temporal, non-causal)");
  if (s.observations.length === 0) L.push("  None generated.");
  for (const o of s.observations.slice(0, 10)) {
    L.push(`  ${formatDate(o.generated_at)} — ${o.ai_observation ?? "No description."}`);
  }
  L.push("");
  L.push("End of report.");
  return L.join("\n");
}

const escapeHtml = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function buildHandoffHtml(s: AppState, range: HandoffRange = 30) {
  return `<!doctype html><html><head><meta charset="utf-8">
<title>Peptide Lens — Protocol Handoff</title>
<style>
  @page { margin: 18mm 14mm; }
  body { font: 12px/1.55 ui-monospace, "SFMono-Regular", Menlo, monospace; color: #14161a; }
  pre { white-space: pre-wrap; word-break: break-word; }
</style></head><body><pre>${escapeHtml(buildHandoffText(s, range))}</pre>
<script>window.onload = function () { window.focus(); window.print(); };</script>
</body></html>`;
}

/* ------------------------------------------------------------------ */
/* Delivery                                                             */
/* ------------------------------------------------------------------ */

export function downloadFile(name: string, content: string, mime: string) {
  if (typeof document === "undefined") return;
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export const exportName = (base: string, ext: string) =>
  `peptide-lens-${base}-${formatISODate(new Date())}.${ext}`;

/** Native share sheet where available (iOS), download otherwise. */
export async function shareOrDownload(name: string, content: string, mime: string) {
  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      const file = new File([content], name, { type: mime });
      const nav = navigator as Navigator & {
        canShare?: (data: { files?: File[] }) => boolean;
      };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: name });
        return "shared" as const;
      }
      await navigator.share({ title: name, text: content.slice(0, 4000) });
      return "shared" as const;
    } catch {
      /* user dismissed or share unavailable; fall through to download */
    }
  }
  downloadFile(name, content, mime);
  return "downloaded" as const;
}

/** Opens the print dialog; on iOS this offers "Save to Files" as a PDF. */
export function printHtml(html: string) {
  if (typeof window === "undefined") return false;
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
