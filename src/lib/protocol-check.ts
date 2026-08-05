import { fmt, reconstitute, toMg } from "./calc";
import type {
  AmountUnit,
  CheckFinding,
  DoseLog,
  ProtocolCheckResult,
  ProtocolCompound,
  SyringeType,
  Vial,
} from "./types";

/**
 * Protocol Check evaluates internal consistency of a user-entered dose against
 * the configured protocol, vial, and recent history. It never evaluates medical
 * appropriateness.
 */
export function runProtocolCheck(input: {
  pc: ProtocolCompound;
  vial: Vial | null;
  amount: number;
  unit: AmountUnit;
  syringe: SyringeType;
  syringeCapacityMl: number;
  recent: DoseLog[];
  loggedAt: Date;
}): ProtocolCheckResult {
  const findings: CheckFinding[] = [];
  const { pc, vial, amount, unit, recent } = input;

  if (unit !== pc.amount_unit) {
    findings.push({
      field: "Amount unit",
      detail: `Protocol uses ${pc.amount_unit}. This entry uses ${unit}.`,
      severity: "explainable",
    });
  }

  const scheduledMg = toMg(pc.scheduled_amount, pc.amount_unit);
  const enteredMg = toMg(amount, unit);
  if (scheduledMg > 0 && Math.abs(enteredMg - scheduledMg) > 0.0001) {
    const ratio = enteredMg / scheduledMg;
    findings.push({
      field: "Scheduled amount",
      detail: `Protocol schedules ${fmt(pc.scheduled_amount, 3)} ${pc.amount_unit}. This entry records ${fmt(amount, 3)} ${unit}.`,
      severity: ratio >= 3 || ratio <= 0.34 ? "mismatch" : "explainable",
    });
  }

  let recon = null;
  if (vial) {
    recon = reconstitute({
      vialAmount: vial.original_amount,
      vialUnit: vial.amount_unit,
      diluentMl: vial.diluent_volume_ml,
      targetAmount: amount,
      targetUnit: unit,
      syringe: input.syringe,
    });
    if (recon && recon.volumeMl > input.syringeCapacityMl) {
      findings.push({
        field: "Syringe capacity",
        detail: `Draw volume ${fmt(recon.volumeMl, 3)} mL exceeds the configured ${fmt(input.syringeCapacityMl, 2)} mL syringe.`,
        severity: "mismatch",
      });
    }
    const remaining =
      vial.manual_remaining_amount != null
        ? toMg(vial.manual_remaining_amount, vial.amount_unit)
        : toMg(vial.estimated_remaining_amount, vial.amount_unit);
    if (remaining < enteredMg) {
      findings.push({
        field: "Inventory",
        detail: `${vial.name} records ${fmt(remaining, 3)} mg remaining. This entry draws ${fmt(enteredMg, 3)} mg.`,
        severity: "mismatch",
      });
    }
    if (vial.status === "depleted" || vial.status === "discarded") {
      findings.push({
        field: "Vial state",
        detail: `${vial.name} is marked ${vial.status}.`,
        severity: "mismatch",
      });
    }
  } else {
    findings.push({
      field: "Vial",
      detail: "No vial selected. Inventory will not be updated.",
      severity: "explainable",
    });
  }

  const last5 = recent.slice(0, 5).filter((d) => d.syringe_units != null);
  if (last5.length >= 3 && recon) {
    const avg = last5.reduce((a, d) => a + (d.syringe_units ?? 0), 0) / last5.length;
    if (avg > 0 && (recon.syringeUnits > avg * 3 || recon.syringeUnits < avg / 3)) {
      findings.push({
        field: "Syringe units",
        detail: `Your last ${last5.length} entries averaged ${fmt(avg, 1)} units. This entry uses ${fmt(recon.syringeUnits, 1)} units.`,
        severity: "mismatch",
      });
    }
  }

  const lastSame = recent.find((d) => d.protocol_compound_id === pc.id);
  if (lastSame) {
    const hours = (input.loggedAt.getTime() - new Date(lastSame.logged_at).getTime()) / 3600000;
    if (hours >= 0 && hours < 4) {
      findings.push({
        field: "Possible duplicate",
        detail: `An entry for this compound was logged ${fmt(hours, 1)} hours ago.`,
        severity: "mismatch",
      });
    }
  }

  const severity: ProtocolCheckResult["severity"] = findings.some((f) => f.severity === "mismatch")
    ? "mismatch"
    : findings.length
      ? "explainable"
      : "consistent";

  return { severity, findings };
}

export const CHECK_LABEL: Record<ProtocolCheckResult["severity"], string> = {
  consistent: "Matches your active protocol",
  explainable: "Differs from the active protocol",
  mismatch: "Review this entry",
};
