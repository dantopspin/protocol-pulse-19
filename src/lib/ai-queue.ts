import { useEffect, useSyncExternalStore } from "react";
import { adherence, compoundName } from "./domain";
import { formatDate, formatDateTime } from "./format";
import { getState, setState, uid, type AiQueueItem, type AppState } from "./store";
import type { ChangeObservation, ProtocolEvent } from "./types";

export const REFUSAL =
  "I cannot recommend a dose or protocol change. Review the instructions you were given or contact a qualified healthcare professional. I can summarize your recorded history for that conversation.";

const ADVICE_PATTERN =
  /(should i|what dose|how much|increase|decrease|titrate|stack|safe|buy|supplier|stop taking|is it normal|diagnose)/;

/* ------------------------------------------------------------------ */
/* Grounded answers                                                     */
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

export function composeAnswer(question: string, s: AppState) {
  const q = question.toLowerCase();
  if (ADVICE_PATTERN.test(q)) return REFUSAL;

  if (/site|thigh|abdomen|rotation/.test(q)) {
    const site = s.sites[0];
    return site
      ? `Your most recent recorded site is ${site.site_key.replace(/_/g, " ")} on ${formatDateTime(site.used_at)}. ${s.sites.length} site records exist.`
      : "No injection sites are recorded yet.";
  }
  if (/symptom|side effect/.test(q)) {
    return s.symptoms.length
      ? `You recorded ${s.symptoms.length} symptom entries. Most recent: ${s.symptoms[0]!.name} (severity ${s.symptoms[0]!.severity}) starting ${formatDate(s.symptoms[0]!.started_at)}.`
      : "No symptom entries are recorded yet.";
  }
  if (/vial|inventory|remaining/.test(q)) {
    return s.vials.length
      ? s.vials
          .map(
            (v) =>
              `${v.name}: ${v.manual_remaining_amount ?? v.estimated_remaining_amount} ${v.amount_unit} remaining (${v.status}).`,
          )
          .join(" ")
      : "No vials are recorded yet.";
  }
  if (/change|timeline|history/.test(q)) {
    return s.events.length
      ? `Most recent recorded changes: ${s.events
          .slice(0, 3)
          .map((e) => `${e.event_type.replace(/_/g, " ")} on ${formatDate(e.timestamp)}`)
          .join("; ")}.`
      : "No protocol changes are recorded yet.";
  }
  return recordSummary(s);
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
  const item: AiQueueItem = {
    id: uid(),
    question,
    kind,
    event_id,
    created_at: new Date().toISOString(),
  };
  setState((s) => ({ ...s, aiQueue: [...s.aiQueue, item] }));
  return item;
}

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

let flushing = false;

/** Process everything queued while offline. Safe to call repeatedly. */
export async function flushAiQueue() {
  if (flushing || !isOnline()) return;
  const queued = getState().aiQueue;
  if (queued.length === 0) {
    generateMissingObservations();
    return;
  }
  flushing = true;
  try {
    for (const item of queued) {
      const s = getState();
      const text =
        item.kind === "weekly_summary" ? recordSummary(s) : composeAnswer(item.question, s);
      setState((prev) => ({
        ...prev,
        aiQueue: prev.aiQueue.filter((q) => q.id !== item.id),
        aiMessages: [
          {
            id: uid(),
            role: "assistant",
            text,
            sources: ["Dose history", "Vials", "Symptoms", "Change timeline"],
            queued: false,
            created_at: new Date().toISOString(),
          },
          ...prev.aiMessages,
        ],
      }));
    }
    generateMissingObservations();
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
    }, 400);
    return () => clearTimeout(t);
  }, [online]);
}
