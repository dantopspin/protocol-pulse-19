import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { HeaderActions, Screen } from "@/components/AppShell";
import { Button, Card, EmptyState, Field, Note, Row, Section, inputClass, selectClass } from "@/components/kit";
import { fmt, reconstitute } from "@/lib/calc";
import { useEntitlement } from "@/lib/entitlements";
import { setState, uid, useStore } from "@/lib/store";
import type { AmountUnit, SyringeType } from "@/lib/types";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "Reconstitution calculator — Peptide Lens" },
      { name: "description", content: "Convert vial amount and diluent volume into concentration, draw volume, and syringe units." },
      { property: "og:title", content: "Reconstitution calculator — Peptide Lens" },
      { property: "og:description", content: "See the formula and every calculation step, not only the result." },
    ],
  }),
  component: CalculatorPage,
});

function CalculatorPage() {
  const { isPro, limits } = useEntitlement();
  const saved = useStore((s) => s.calculations);
  const [vialAmount, setVialAmount] = useState("10");
  const [vialUnit, setVialUnit] = useState<AmountUnit>("mg");
  const [diluent, setDiluent] = useState("2");
  const [target, setTarget] = useState("0.25");
  const [targetUnit, setTargetUnit] = useState<AmountUnit>("mg");
  const [syringe, setSyringe] = useState<SyringeType>("U-100 insulin");

  const r = useMemo(
    () =>
      reconstitute({
        vialAmount: Number(vialAmount) || 0,
        vialUnit,
        diluentMl: Number(diluent) || 0,
        targetAmount: Number(target) || 0,
        targetUnit,
        syringe,
      }),
    [vialAmount, vialUnit, diluent, target, targetUnit, syringe],
  );

  const plunger = r ? Math.min(100, (r.syringeUnits / 100) * 100) : 0;
  const atLimit = !isPro && saved.length >= limits.savedCalculations;

  return (
    <Screen title="Calculator" eyebrow="Reconstitution" right={<HeaderActions />}>
      <Section title="Inputs">
        <Field label="Vial amount">
          <div className="flex gap-3">
            <input className={inputClass} inputMode="decimal" value={vialAmount} onChange={(e) => setVialAmount(e.target.value)} />
            <select className={selectClass + " max-w-[110px]"} value={vialUnit} onChange={(e) => setVialUnit(e.target.value as AmountUnit)}>
              <option value="mg">mg</option>
              <option value="mcg">mcg</option>
            </select>
          </div>
        </Field>
        <Field label="Diluent volume (mL)">
          <input className={inputClass} inputMode="decimal" value={diluent} onChange={(e) => setDiluent(e.target.value)} />
        </Field>
        <Field label="Your target amount" hint="Enter the amount from your own instructions.">
          <div className="flex gap-3">
            <input className={inputClass} inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
            <select className={selectClass + " max-w-[110px]"} value={targetUnit} onChange={(e) => setTargetUnit(e.target.value as AmountUnit)}>
              <option value="mg">mg</option>
              <option value="mcg">mcg</option>
            </select>
          </div>
        </Field>
        <Field label="Syringe">
          <select className={selectClass} value={syringe} onChange={(e) => setSyringe(e.target.value as SyringeType)}>
            <option>U-100 insulin</option>
            <option>U-50 insulin</option>
            <option>1 mL syringe</option>
            <option>3 mL syringe</option>
          </select>
        </Field>
      </Section>

      <Section title="Result">
        {!r ? (
          <EmptyState title="Add the vial amount and diluent volume" body="Enter a vial amount, a diluent volume, and your target amount to convert." />
        ) : (
          <Card className="rise">
            <Row label="Concentration" value={`${fmt(r.concentrationMgMl)} mg/mL`} />
            <Row label="Volume to draw" value={`${fmt(r.volumeMl, 3)} mL`} />
            <Row label="Syringe units" value={`${fmt(r.syringeUnits, 1)} units`} />
            <Row label="Estimated doses per vial" value={r.dosesPerVial} className="border-b-0" />
            <div className="mt-5">
              <p className="eyebrow">Plunger position</p>
              <div className="mt-2 h-6 w-full border border-hairline">
                <div className="h-full bg-primary/80 transition-all duration-200" style={{ width: `${plunger}%` }} />
              </div>
              <p className="num mt-1 text-[12px] text-muted-foreground">{fmt(r.syringeUnits, 1)} of 100 units</p>
            </div>
            <div className="mt-5 border-t border-hairline pt-4">
              <p className="eyebrow">Calculation steps</p>
              <ul className="num mt-2 space-y-1 text-[13px]">{r.steps.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
            <div className="mt-5">
              <Button
                variant="secondary"
                full
                disabled={atLimit}
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    calculations: [
                      {
                        id: uid(),
                        label: `${vialAmount} ${vialUnit} in ${diluent} mL`,
                        vialAmount: Number(vialAmount) || 0,
                        vialUnit: vialUnit === "mcg" ? "mcg" : "mg",
                        diluentMl: Number(diluent) || 0,
                        targetAmount: Number(target) || 0,
                        targetUnit: targetUnit === "mcg" ? "mcg" : "mg",
                        syringe,
                        created_at: new Date().toISOString(),
                      },
                      ...s.calculations,
                    ],
                  }))
                }
              >
                {atLimit ? "Saved calculation limit reached on Free" : "Save calculation"}
              </Button>
            </div>
          </Card>
        )}
      </Section>

      <Section title="Saved calculations">
        {saved.length === 0 ? (
          <Note>No saved calculations.</Note>
        ) : (
          <ul className="border-t border-hairline">
            {saved.map((c) => (
              <li key={c.id} className="py-3 hairline-b">
                <p className="num text-[14px]">{c.label}</p>
                <p className="num text-[12px] text-muted-foreground">
                  Target {c.targetAmount} {c.targetUnit} · {c.syringe} · {new Date(c.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section>
        <Note>The calculator converts an amount you enter. It never proposes an amount.</Note>
      </Section>
    </Screen>
  );
}
