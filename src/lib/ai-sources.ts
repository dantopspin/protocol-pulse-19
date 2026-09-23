/**
 * Source-linked assistant grounding.
 *
 * Every record handed to the model carries a short reference such as [D3].
 * The model is instructed to cite those references, and the app turns each
 * citation back into a tappable link to the exact record it came from.
 */

import { adherence, compoundName } from "./domain";
import { formatDate, formatDateTime } from "./format";
import type { AppState } from "./store";

export type AiSourceKind = "dose" | "vial" | "symptom" | "event" | "site" | "protocol";

export type AiSource = {
  /** Citation reference exactly as the model writes it, e.g. "D3". */
  ref: string;
  kind: AiSourceKind;
  /** Record id in the local store. */
  recordId: string;
  /** Short human label shown on the chip. */
  label: string;
  /** Route the chip opens. */
  to: string;
};

const ROUTE: Record<AiSourceKind, string> = {
  dose: "/history",
  vial: "/vials",
  symptom: "/progress",
  event: "/timeline",
  site: "/sites",
  protocol: "/protocols",
};

/** DOM id used by the destination screen to highlight the referenced entry. */
export const anchorId = (recordId: string) => `rec-${recordId}`;

function push(
  sources: AiSource[],
  kind: AiSourceKind,
  prefix: string,
  recordId: string,
  label: string,
) {
  const ref = `${prefix}${sources.filter((s) => s.kind === kind).length + 1}`;
  sources.push({ ref, kind, recordId, label, to: ROUTE[kind] });
  return ref;
}

/**
 * Builds referenced record context. Nothing is sent unless the user has
 * enabled assistant sharing in Settings.
 */
export function buildSourcedContext(s: AppState): {
  context: string;
  categories: string[];
  sources: AiSource[];
} {
  if (!s.preferences.ai_sharing) return { context: "", categories: [], sources: [] };

  const sources: AiSource[] = [];
  const lines: string[] = [];
  const categories: string[] = [];
  const a = adherence(s, 30);

  lines.push(
    `Adherence over 30 days: ${a.pct == null ? "not enough records" : a.pct + "%"} (${a.logged} logged of ${a.scheduled} scheduled).`,
  );
  categories.push("Adherence");

  if (s.protocolCompounds.length) {
    categories.push("Protocols");
    lines.push("Protocol entries:");
    for (const pc of s.protocolCompounds.slice(0, 20)) {
      const label = `${compoundName(pc.compound_id)} ${pc.scheduled_amount} ${pc.amount_unit}`;
      const ref = push(sources, "protocol", "P", pc.protocol_id, label);
      lines.push(`- [${ref}] ${label} scheduled`);
    }
  }

  if (s.doses.length) {
    categories.push("Dose history");
    lines.push(`Dose entries (${s.doses.length} total, most recent 40):`);
    for (const d of s.doses.slice(0, 40)) {
      const label = `${compoundName(d.compound_id)} · ${formatDate(d.logged_at)}`;
      const ref = push(sources, "dose", "D", d.id, label);
      lines.push(
        `- [${ref}] ${formatDateTime(d.logged_at)} ${compoundName(d.compound_id)} ${d.actual_amount} ${d.amount_unit} (${d.status})`,
      );
    }
  }

  if (s.vials.length) {
    categories.push("Vials");
    lines.push("Vials:");
    for (const v of s.vials.slice(0, 20)) {
      const ref = push(sources, "vial", "V", v.id, v.name);
      lines.push(
        `- [${ref}] ${v.name}: ${v.manual_remaining_amount ?? v.estimated_remaining_amount} ${v.amount_unit} remaining, ${v.status}`,
      );
    }
  }

  if (s.symptoms.length) {
    categories.push("Symptoms");
    lines.push("Symptom entries:");
    for (const x of s.symptoms.slice(0, 30)) {
      const label = `${x.name} · ${formatDate(x.started_at)}`;
      const ref = push(sources, "symptom", "S", x.id, label);
      lines.push(
        `- [${ref}] ${formatDate(x.started_at)} ${x.name}, severity ${x.severity}/10${x.resolved_at ? `, resolved ${formatDate(x.resolved_at)}` : ", ongoing"}`,
      );
    }
  }

  if (s.sites.length) {
    categories.push("Injection sites");
    lines.push("Recent injection sites:");
    for (const site of s.sites.slice(0, 20)) {
      const label = `${site.site_key.replace(/_/g, " ")} · ${formatDate(site.used_at)}`;
      const ref = push(sources, "site", "I", site.id, label);
      lines.push(`- [${ref}] ${formatDateTime(site.used_at)} ${site.site_key.replace(/_/g, " ")}`);
    }
  }

  if (s.events.length) {
    categories.push("Change timeline");
    lines.push("Recorded changes:");
    for (const e of s.events.slice(0, 25)) {
      const label = `${e.event_type.replace(/_/g, " ")} · ${formatDate(e.timestamp)}`;
      const ref = push(sources, "event", "E", e.id, label);
      lines.push(
        `- [${ref}] ${formatDateTime(e.timestamp)} ${e.event_type.replace(/_/g, " ")}${e.new_value ? `: ${e.previous_value ?? ""} -> ${e.new_value}` : ""}`,
      );
    }
  }

  return { context: lines.join("\n"), categories, sources };
}

const CITATION = /\[([A-Z]\d{1,3}(?:\s*,\s*[A-Z]\d{1,3})*)\]/g;

export type AnswerSegment =
  | { type: "text"; text: string }
  | { type: "source"; source: AiSource };

/** Splits an answer into plain text and the sources it cites, in order. */
export function parseAnswer(text: string, sources: AiSource[]): AnswerSegment[] {
  const byRef = new Map(sources.map((s) => [s.ref, s]));
  const out: AnswerSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(CITATION)) {
    const start = match.index ?? 0;
    const refs = match[1]!.split(",").map((r) => r.trim());
    const found = refs.map((r) => byRef.get(r)).filter(Boolean) as AiSource[];
    if (found.length === 0) continue;
    if (start > last) out.push({ type: "text", text: text.slice(last, start) });
    for (const source of found) out.push({ type: "source", source });
    last = start + match[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  return out.length ? out : [{ type: "text", text }];
}

/** Unique sources cited by an answer. */
export function citedSources(text: string, sources: AiSource[]): AiSource[] {
  const seen = new Set<string>();
  const out: AiSource[] = [];
  for (const seg of parseAnswer(text, sources)) {
    if (seg.type === "source" && !seen.has(seg.source.ref)) {
      seen.add(seg.source.ref);
      out.push(seg.source);
    }
  }
  return out;
}
