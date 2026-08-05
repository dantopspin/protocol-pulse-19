import type { AmountUnit, SyringeType } from "./types";

export const toMg = (amount: number, unit: AmountUnit): number => {
  if (unit === "mcg") return amount / 1000;
  return amount;
};

export const toMcg = (amount: number, unit: AmountUnit): number => toMg(amount, unit) * 1000;

export const unitsPerMl = (syringe: SyringeType): number => {
  if (syringe === "U-50 insulin") return 50;
  return 100;
};

export type Reconstitution = {
  concentrationMgMl: number;
  volumeMl: number;
  syringeUnits: number;
  dosesPerVial: number;
  steps: string[];
};

export function reconstitute(input: {
  vialAmount: number;
  vialUnit: AmountUnit;
  diluentMl: number;
  targetAmount: number;
  targetUnit: AmountUnit;
  syringe: SyringeType;
}): Reconstitution | null {
  const vialMg = toMg(input.vialAmount, input.vialUnit);
  const targetMg = toMg(input.targetAmount, input.targetUnit);
  if (!vialMg || !input.diluentMl || !targetMg) return null;
  const concentrationMgMl = vialMg / input.diluentMl;
  const volumeMl = targetMg / concentrationMgMl;
  const upml = unitsPerMl(input.syringe);
  const syringeUnits = volumeMl * upml;
  const dosesPerVial = Math.floor(vialMg / targetMg);
  return {
    concentrationMgMl,
    volumeMl,
    syringeUnits,
    dosesPerVial,
    steps: [
      `${fmt(vialMg)} mg ÷ ${fmt(input.diluentMl)} mL = ${fmt(concentrationMgMl)} mg/mL`,
      `${fmt(targetMg)} mg ÷ ${fmt(concentrationMgMl)} mg/mL = ${fmt(volumeMl, 3)} mL`,
      `${fmt(volumeMl, 3)} mL on a ${input.syringe} = ${fmt(syringeUnits, 1)} units`,
    ],
  };
}

export function fmt(n: number, digits = 2): string {
  if (!isFinite(n)) return "—";
  const s = n.toFixed(digits);
  return s.replace(/\.?0+$/, "") || "0";
}

export function representations(amount: number, unit: AmountUnit, r?: Reconstitution | null) {
  const parts = [`${fmt(toMg(amount, unit), 3)} mg`, `${fmt(toMcg(amount, unit), 0)} mcg`];
  if (r) {
    parts.push(`${fmt(r.volumeMl, 3)} mL`);
    parts.push(`${fmt(r.syringeUnits, 1)} units`);
  }
  return parts.join(" · ");
}
