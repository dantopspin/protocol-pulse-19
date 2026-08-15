import { useEffect, useSyncExternalStore } from "react";
import { askAi, REFUSAL_TEXT } from "./ai.functions";
import { adherence, compoundName } from "./domain";
import { formatDate, formatDateTime } from "./format";
import { getState, setState, uid, type AiQueueItem, type AppState } from "./store";
import type { ChangeObservation, ProtocolEvent } from "./types";

export const REFUSAL = REFUSAL_TEXT;

export const AI_CATEGORIES = [
  "Dose history",
  "Vials",
  "Symptoms",
  "Change timeline",
  "Adherence",
] as const;

/* ------------------------------------------------------------------ */
/* Permitted record context                                             */
/* ------------------------------------------------------------------ */

export function recordSummary(s: AppState) {
  const a = adherence(s, 30);
  const last = s.doses[0];
  return [
    `Records available: ${s.doses.length} dose entries, ${s.vials.length} vials, ${s.symptoms.length} symptom entries, ${s.events.length} recorded changes.`,
    `Adherence over 30 days: ${a.pct == null ? "not enough records" : a.pct + "%"} (${a.logged} of ${a.scheduled}).`,
    `Last entry: ${last ? `${compoundName(last.compound_id)} on ${formatDateTime(last.logged_at)}` : "none recorded"}.`,
  ].join(" ");
}

/**
 * Builds the record context sent to the server. Nothing is sent unless the
 * user has enabled assistant sharing; identifiers and notes are left out.
 */
export function buildAiContext(s: AppState): { context: string; categories: string[] } {
  if (!s.preferences.ai_sharing) return { context: "", categories: [] };
  const a = adherence(s, 30);
  const lines: string[] = [];
  const categories: string[] = [];

  lines.push(`Adherence over 30 days: ${a.pct == null ? "not enough records" : a.pct + "%"} (${a.logged} logged of ${a.scheduled} scheduled).`);
  categories.push("Adherence");

  if (s.protocolCompounds.length) {
    categories.push("Protocols");
    lines.push("Protocol entries:");
    for (const pc of s.protocolCompounds.slice(0, 20)) {
      lines.push(`- ${compoundName(pc.compound_id)}: ${pc.scheduled_amount} ${pc.amount_unit} scheduled`);
    }
  }
  if (s.doses.length) {
    categories.push("Dose history");
    lines.push(`Dose entries (${s.doses.length} total, most recent 40):`);
    for (const d of s.doses.slice(0, 40)) {
      lines.push(`- ${formatDateTime(d.logged_at)} ${compoundName(d.compound_id)} ${d.actual_amount} ${d.amount_unit} (${d.status})`);
    }
  }
  if (s.vials.length) {
    categories.push("Vials");
    lines.push("Vials:");
    for (const v of s.vials.slice(0, 20)) {
      lines.push(`- ${v.name}: ${v.manual_remaining_amount ?? v.estimated_remaining_amount} ${v.amount_unit} remaining, ${v.status}`);
    }
  }
  if (s.symptoms.length) {
    categories.push("Symptoms");
    lines.push("Symptom entries:");
    for (const x of s.symptoms.slice(0, 30)) {
      lines.push(`- ${formatDate(x.started_at)} ${x.name}, severity ${x.severity}/10${x.resolved_at ? `, resolved ${formatDate(x.resolved_at)}` : ", ongoing"}`);
    }
  }
  if (s.sites.length) {
    categories.push("Injection sites");
    lines.push("Recent injection sites:");
    for (const site of s.sites.slice(0, 20)) {
      lines.push(`- ${formatDateTime(site.used_at)} ${site.site_key.replace(/_/g, " ")}`);
    }
  }
  if (s.events.length) {
    categories.push("Change timeline");
    lines.push("Recorded changes:");
    for (const e of s.events.slice(0, 25)) {
      lines.push(`- ${formatDateTime(e.timestamp)} ${e.event_type.replace(/_/g, " ")}${e.new_value ? `: ${e.previous_value ?? ""} -> ${e.new_value}` : ""}`);
    }
  }
  return { context: lines.join("\n"), categories };
}

/* ------------------------------------------------------------------ */
/* Weekly allowance                                                     */
/* ------------------------------------------------------------------ */

const WEEK_MS = 7 * 86400000;

/** Rolls the 7-day Free allowance window forward when it has expired. */
export function rollAiWeek(now = Date.now()) {
  const s = getState();
  const start = new Date(s.aiWeekStart).getTime();
  if (!Number.isFinite(start) || now - start >= WEEK_MS) {
    setState((prev) => ({ ...prev, aiUsedThisWeek: 0, aiWeekStart: new Date(now).toISOString() }));
    return true;
  }
  return false;
}

function consumeAllowance() {
  rollAiWeek();
  setState((s) => ({
    ...s,
    aiUsedThisWeek: s.aiUsedThisWeek + 1,
    aiWeekStart:
      new Date(s.aiWeekStart).getTime() > 0 ? s.aiWeekStart : new Date().toISOString(),
  }));
}

/* ------------------------------------------------------------------ */
/* Connectivity                                                         */
/* ------------------------------------------------------------------ */

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function useOnline() {
  return useSyncExternalStore(
    subscribeOnline,
    () => (typeof navigator === "undefined" ? true : navigator.onLine),
    () => true,
  );
}

export const isOnline = () =>
  typeof navigator === "undefined" ? true : navigator.onLine !== false;

/* ------------------------------------------------------------------ */
/* Queue                                                                */
/* ------------------------------------------------------------------ */

export function enqueue(
  question: string,
  kind: AiQueueItem["kind"] = "question",
  event_id: string | null = null,
) {
  const existing = getState().aiQueue.find(
    (q) => q.question === question && q.kind === kind && q.event_id === event_id,
  );
  if (existing) return existing; // no duplicates
  const item: AiQueueItem = {
    id: uid(),
    question,
    kind,
    event_id,
    status: "queued",
    attempts: 0,
    error: null,
    created_at: new Date().toISOString(),
  };
  setState((s) => ({ ...s, aiQueue: [...s.aiQueue, item] }));
  return item;
}

export function removeQueued(id: string) {
  setState((s) => ({ ...s, aiQueue: s.aiQueue.filter((q) => q.id !== id) }));
}

export function retryQueued(id: string) {
  setState((s) => ({
    ...s,
    aiQueue: s.aiQueue.map((q) => (q.id === id ? { ...q, status: "queued", error: null } : q)),
  }));
  void flushAiQueue();
}

/** Sends one question to the server assistant. Returns the answer text. */
export async function askAssistant(question: string): Promise<
  { ok: true; text: string; categories: string[] } | { ok: false; error: string }
> {
  const s = getState();
  const { context, categories } = buildAiContext(s);
  try {
    const result = await askAi({ data: { question, context, categories } });
    if (result.ok) consumeAllowance();
    return result;
  } catch {
    return { ok: false, error: "The assistant could not be reached." };
  }
}

export function appendMessage(
  role: "user" | "assistant",
  text: string,
  sources: string[] = [],
  queued = false,
) {
  setState((s) => ({
    ...s,
    aiMessages: [
      { id: uid(), role, text, sources, queued, created_at: new Date().toISOString() },
      ...s.aiMessages,
    ],
  }));
}

/* ------------------------------------------------------------------ */
/* Change observations (local, deterministic)                           */
/* ------------------------------------------------------------------ */

function buildObservation(s: AppState, event: ProtocolEvent): ChangeObservation {
  const at = new Date(event.timestamp).getTime();
  const window = 14 * 86400000;
  const inRange = (iso: string, from: number, to: number) => {
    const t = new Date(iso).getTime();
    return t >= from && t < to;
  };
  const beforeDoses = s.doses.filter((d) => inRange(d.logged_at, at - window, at));
  const afterDoses = s.doses.filter((d) => inRange(d.logged_at, at, at + window));
  const beforeSymptoms = s.symptoms.filter((x) => inRange(x.started_at, at - window, at));
  const afterSymptoms = s.symptoms.filter((x) => inRange(x.started_at, at, at + window));
  const avg = (xs: number[]) =>
    xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : null;

  const missing: string[] = [];
  if (beforeDoses.length === 0) missing.push("dose entries before the change");
  if (afterDoses.length === 0) missing.push("dose entries after the change");
  if (beforeSymptoms.length + afterSymptoms.length === 0) missing.push("symptom entries");

  return {
    id: uid(),
    protocol_event_id: event.id,
    tracked_metrics: ["doses_logged", "symptom_severity"],
    before_period: {
      start: new Date(at - window).toISOString(),
      end: new Date(at).toISOString(),
    },
    after_period: {
      start: new Date(at).toISOString(),
      end: new Date(at + window).toISOString(),
    },
    before_summary: {
      doses_logged: beforeDoses.length,
      symptom_severity: avg(beforeSymptoms.map((x) => x.severity)),
    },
    after_summary: {
      doses_logged: afterDoses.length,
      symptom_severity: avg(afterSymptoms.map((x) => x.severity)),
    },
    record_counts: {
      before_records: beforeDoses.length + beforeSymptoms.length,
      after_records: afterDoses.length + afterSymptoms.length,
    },
    missing_data: missing,
    ai_observation: missing.length
      ? `Not enough records to describe this period. Missing: ${missing.join(", ")}.`
      : `In the 14 days after "${event.event_type.replace(/_/g, " ")}" you recorded ${afterDoses.length} doses compared with ${beforeDoses.length} before. Average recorded symptom severity moved from ${avg(beforeSymptoms.map((x) => x.severity)) ?? "no record"} to ${avg(afterSymptoms.map((x) => x.severity)) ?? "no record"}. This is a temporal description only and does not establish causation.`,
    generated_at: new Date().toISOString(),
  };
}

const CHANGE_EVENTS = ["amount_changed", "schedule_changed", "vial_changed", "protocol_paused"];

/** Generate observations for recorded changes that do not have one yet. */
export function generateMissingObservations() {
  const s = getState();
  const pending = s.events.filter(
    (e) =>
      CHANGE_EVENTS.includes(e.event_type) &&
      !s.observations.some((o) => o.protocol_event_id === e.id),
  );
  if (pending.length === 0) return 0;
  const created = pending.map((e) => buildObservation(s, e));
  setState((prev) => ({ ...prev, observations: [...created, ...prev.observations] }));
  return created.length;
}

/* ------------------------------------------------------------------ */
/* Processing                                                           */
/* ------------------------------------------------------------------ */

const MAX_ATTEMPTS = 3;
let flushing = false;

/** Process everything queued while offline. Safe to call repeatedly. */
export async function flushAiQueue() {
  if (flushing || !isOnline()) return;
  rollAiWeek();
  generateMissingObservations();
  const queued = getState().aiQueue.filter((q) => q.status === "queued");
  if (queued.length === 0) return;
  flushing = true;
  try {
    for (const item of queued) {
      setState((prev) => ({
        ...prev,
        aiQueue: prev.aiQueue.map((q) =>
          q.id === item.id ? { ...q, status: "processing", attempts: q.attempts + 1 } : q,
        ),
      }));
      const question =
        item.kind === "weekly_summary"
          ? "Summarise my recorded entries for the last seven days."
          : item.question;
      const result = await askAssistant(question);
      if (result.ok) {
        removeQueued(item.id);
        appendMessage("assistant", result.text, result.categories);
      } else {
        setState((prev) => ({
          ...prev,
          aiQueue: prev.aiQueue.map((q) =>
            q.id === item.id ? { ...q, status: "failed", error: result.error } : q,
          ),
        }));
        const attempts = getState().aiQueue.find((q) => q.id === item.id)?.attempts ?? 0;
        if (attempts >= MAX_ATTEMPTS) continue;
      }
    }
  } finally {
    flushing = false;
  }
}

/** Mount once, at the root: drains the queue as soon as connectivity returns. */
export function useAiQueueProcessor() {
  const online = useOnline();
  useEffect(() => {
    if (!online) return;
    const t = setTimeout(() => {
      void flushAiQueue();
    }, 800);
    return () => clearTimeout(t);
  }, [online]);
}
