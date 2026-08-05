import { COMPOUNDS } from "./compounds";
import { toMg, reconstitute } from "./calc";
import { getState, recordEvent, setState, uid, type AppState } from "./store";
import type { DoseLog, ProtocolCheckResult, ProtocolCompound, ScheduleRule, Vial } from "./types";

export const compoundName = (id: string | null) =>
  COMPOUNDS.find((c) => c.id === id)?.name ?? "Custom compound";

export function scheduleLabel(rule: ScheduleRule): string {
  switch (rule.kind) {
    case "daily":
      return "Daily";
    case "weekdays":
      return `${rule.days.map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")}`;
    case "every_n_days":
      return `Every ${rule.n} days`;
    case "weekly":
      return `Weekly on ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][rule.day]}`;
    case "times_per_week":
      return `${rule.n} times per week`;
    case "as_recorded":
      return "As recorded, without reminders";
  }
}

export function isScheduledOn(rule: ScheduleRule, start: string, date: Date): boolean {
  const startDate = new Date(start);
  const d0 = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const s0 = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  ).getTime();
  if (d0 < s0) return false;
  const diffDays = Math.round((d0 - s0) / 86400000);
  switch (rule.kind) {
    case "daily":
      return true;
    case "weekdays":
      return rule.days.includes(date.getDay());
    case "every_n_days":
      return rule.n > 0 && diffDays % rule.n === 0;
    case "weekly":
      return date.getDay() === rule.day;
    case "times_per_week":
      return diffDays % Math.max(1, Math.round(7 / Math.max(1, rule.n))) === 0;
    case "as_recorded":
      return false;
  }
}

export type ScheduledEntry = {
  id: string;
  pc: ProtocolCompound;
  time: string;
  at: Date;
  logged: DoseLog | null;
};

export function entriesForDay(s: AppState, date: Date): ScheduledEntry[] {
  const dayKey = date.toDateString();
  const out: ScheduledEntry[] = [];
  for (const pc of s.protocolCompounds) {
    const protocol = s.protocols.find((p) => p.id === pc.protocol_id);
    if (!protocol || protocol.status !== "active") continue;
    if (pc.stopped_at) continue;
    if (!isScheduledOn(pc.schedule_rule, pc.started_at, date)) continue;
    for (const time of pc.preferred_times.length ? pc.preferred_times : ["08:00"]) {
      const [h, m] = time.split(":").map(Number);
      const at = new Date(date);
      at.setHours(h || 0, m || 0, 0, 0);
      const id = `${pc.id}:${date.toISOString().slice(0, 10)}:${time}`;
      const logged =
        s.doses.find(
          (d) =>
            d.scheduled_entry_id === id ||
            (d.protocol_compound_id === pc.id &&
              new Date(d.logged_at).toDateString() === dayKey),
        ) ?? null;
      out.push({ id, pc, time, at, logged });
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}

export function vialFor(s: AppState, pc: ProtocolCompound): Vial | null {
  return (
    s.vials.find((v) => v.id === pc.active_vial_id) ??
    s.vials.find((v) => v.compound_id === pc.compound_id && v.status === "active") ??
    null
  );
}

export function reconFor(s: AppState, pc: ProtocolCompound, vial: Vial | null) {
  if (!vial) return null;
  return reconstitute({
    vialAmount: vial.original_amount,
    vialUnit: vial.amount_unit,
    diluentMl: vial.diluent_volume_ml,
    targetAmount: pc.scheduled_amount,
    targetUnit: pc.amount_unit,
    syringe: s.preferences.syringe_type,
  });
}

export function dosesRemaining(s: AppState, vial: Vial, pc?: ProtocolCompound) {
  const remaining =
    vial.manual_remaining_amount ?? vial.estimated_remaining_amount;
  const per = pc ? toMg(pc.scheduled_amount, pc.amount_unit) : 0;
  const remMg = toMg(remaining, vial.amount_unit);
  return per > 0 ? Math.floor(remMg / per) : null;
}

export function logDose(input: {
  pc: ProtocolCompound;
  vial: Vial | null;
  amount: number;
  unit: DoseLog["amount_unit"];
  volumeMl: number | null;
  syringeUnits: number | null;
  siteKey: string | null;
  notes: string;
  status: DoseLog["status"];
  scheduledEntryId: string | null;
  scheduledAt: Date | null;
  check: ProtocolCheckResult | null;
}) {
  const s = getState();
  const now = new Date().toISOString();
  const dose: DoseLog = {
    id: uid(),
    protocol_id: input.pc.protocol_id,
    protocol_compound_id: input.pc.id,
    compound_id: input.pc.compound_id,
    vial_id: input.vial?.id ?? null,
    scheduled_entry_id: input.scheduledEntryId,
    scheduled_amount: input.pc.scheduled_amount,
    actual_amount: input.amount,
    amount_unit: input.unit,
    volume_ml: input.volumeMl,
    syringe_units: input.syringeUnits,
    syringe_type: s.preferences.syringe_type,
    injection_site_id: input.siteKey,
    scheduled_at: input.scheduledAt ? input.scheduledAt.toISOString() : null,
    logged_at: now,
    status: input.status,
    notes: input.notes,
    attachment_uris: [],
    protocol_check_result: input.check,
    created_at: now,
    updated_at: now,
  };

  setState((prev) => {
    let vials = prev.vials;
    if (input.vial && input.status !== "skipped") {
      const drawnMg = toMg(input.amount, input.unit);
      vials = prev.vials.map((v) => {
        if (v.id !== input.vial!.id) return v;
        const remMg = Math.max(0, toMg(v.estimated_remaining_amount, v.amount_unit) - drawnMg);
        const remaining = v.amount_unit === "mcg" ? remMg * 1000 : remMg;
        const total = toMg(v.original_amount, v.amount_unit);
        return {
          ...v,
          estimated_remaining_amount: remaining,
          status: remMg <= 0 ? "depleted" : remMg / total < 0.2 ? "low" : "active",
          depleted_at: remMg <= 0 ? now : v.depleted_at,
        };
      });
    }
    const sites = input.siteKey
      ? [
          {
            id: uid(),
            site_key: input.siteKey,
            used_at: now,
            compound_id: input.pc.compound_id,
            dose_id: dose.id,
            tenderness: false,
            redness: false,
            bruising: false,
            irritation: false,
            lump: false,
            unavailable: false,
            notes: "",
            attachment_uris: [],
          },
          ...prev.sites,
        ]
      : prev.sites;
    return { ...prev, doses: [dose, ...prev.doses], vials, sites };
  });

  recordEvent(input.status === "skipped" ? "dose_skipped" : "dose_logged", {
    protocol_id: dose.protocol_id,
    compound_id: dose.compound_id,
    vial_id: dose.vial_id,
    dose_id: dose.id,
    new_value: `${input.amount} ${input.unit}`,
  });
  if (input.siteKey) {
    recordEvent("site_used", {
      protocol_id: dose.protocol_id,
      compound_id: dose.compound_id,
      dose_id: dose.id,
      new_value: input.siteKey,
    });
  }
  return dose;
}

export function adherence(s: AppState, days: number) {
  let scheduled = 0;
  let logged = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    for (const e of entriesForDay(s, d)) {
      scheduled++;
      if (e.logged && e.logged.status !== "skipped") logged++;
    }
  }
  return { scheduled, logged, pct: scheduled ? Math.round((logged / scheduled) * 100) : null };
}

export function suggestedSite(s: AppState): string | null {
  const used = new Map<string, number>();
  for (const r of s.sites) {
    const t = new Date(r.used_at).getTime();
    if (!used.has(r.site_key) || used.get(r.site_key)! < t) used.set(r.site_key, t);
  }
  const unavailable = new Set(s.sites.filter((r) => r.unavailable).map((r) => r.site_key));
  const candidates = ["abd_ll", "abd_lr", "abd_ul", "abd_ur", "thigh_l", "thigh_r"].filter(
    (k) => !unavailable.has(k),
  );
  candidates.sort((a, b) => (used.get(a) ?? 0) - (used.get(b) ?? 0));
  return candidates[0] ?? null;
}
