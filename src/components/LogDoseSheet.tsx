import { useEffect, useMemo, useState } from "react";
import { fmt, reconstitute, toMcg, toMg } from "@/lib/calc";
import { siteLabel } from "@/lib/compounds";
import { compoundName, logDose, suggestedSite, vialFor } from "@/lib/domain";
import { runProtocolCheck } from "@/lib/protocol-check";
import { getState, useStore } from "@/lib/store";
import type { AmountUnit, DoseLog, ProtocolCompound } from "@/lib/types";
import { CHECK_LABEL } from "@/lib/protocol-check";
import { Button, Field, Note, Sheet, StatusTag, inputClass, selectClass } from "@/components/kit";
import { SITES } from "@/lib/compounds";

export function LogDoseSheet({
  open,
  onClose,
  pc,
  scheduledEntryId,
  scheduledAt,
  onLogged,
}: {
  open: boolean;
  onClose: () => void;
  pc: ProtocolCompound | null;
  scheduledEntryId?: string | null;
  scheduledAt?: Date | null;
  onLogged?: (d: DoseLog) => void;
}) {
  const state = useStore((s) => s);
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<AmountUnit>("mcg");
  const [vialId, setVialId] = useState<string | null>(null);
  const [site, setSite] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [review, setReview] = useState(false);

  useEffect(() => {
    if (!open || !pc) return;
    setAmount(String(pc.scheduled_amount));
    setUnit(pc.amount_unit);
    setVialId(vialFor(getState(), pc)?.id ?? null);
    setSite(suggestedSite(getState()));
    setNotes("");
    setExpanded(false);
    setReview(false);
  }, [open, pc]);

  const vial = state.vials.find((v) => v.id === vialId) ?? null;
  const numericAmount = Number(amount) || 0;

  const recon = useMemo(
    () =>
      vial
        ? reconstitute({
            vialAmount: vial.original_amount,
            vialUnit: vial.amount_unit,
            diluentMl: vial.diluent_volume_ml,
            targetAmount: numericAmount,
            targetUnit: unit,
            syringe: state.preferences.syringe_type,
          })
        : null,
    [vial, numericAmount, unit, state.preferences.syringe_type],
  );

  const check = useMemo(() => {
    if (!pc) return null;
    return runProtocolCheck({
      pc,
      vial,
      amount: numericAmount,
      unit,
      syringe: state.preferences.syringe_type,
      syringeCapacityMl: state.preferences.syringe_capacity_ml,
      recent: state.doses.filter((d) => d.protocol_compound_id === pc.id),
      loggedAt: new Date(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pc, vial, numericAmount, unit, state.doses, state.preferences]);

  if (!pc) return null;

  const save = (status: DoseLog["status"]) => {
    if (status !== "skipped" && check && check.severity === "mismatch" && !review) {
      setReview(true);
      return;
    }
    const d = logDose({
      pc,
      vial,
      amount: numericAmount,
      unit,
      volumeMl: recon?.volumeMl ?? null,
      syringeUnits: recon?.syringeUnits ?? null,
      siteKey: site,
      notes,
      status,
      scheduledEntryId: scheduledEntryId ?? null,
      scheduledAt: scheduledAt ?? null,
      check,
    });
    onLogged?.(d);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Log dose">
      <div className="page-x pt-4">
        <p className="eyebrow">{compoundName(pc.compound_id)}</p>
        <p className="num mt-1 text-[26px] font-semibold">
          {fmt(numericAmount, 3)} {unit}
        </p>
        <p className="num mt-1 text-[13px] text-muted-foreground">
          {fmt(toMg(numericAmount, unit), 3)} mg · {fmt(toMcg(numericAmount, unit), 0)} mcg
          {recon ? ` · ${fmt(recon.volumeMl, 3)} mL · ${fmt(recon.syringeUnits, 1)} units` : ""}
        </p>

        <div className="mt-4 border border-hairline p-3">
          <div className="flex items-center justify-between gap-3">
            <StatusTag
              tone={
                check?.severity === "mismatch"
                  ? "critical"
                  : check?.severity === "explainable"
                    ? "warning"
                    : "accent"
              }
            >
              Protocol Check
            </StatusTag>
            <span className="text-[13px]">{CHECK_LABEL[check?.severity ?? "consistent"]}</span>
          </div>
          {check && check.findings.length > 0 && (
            <ul className="mt-3 space-y-2">
              {check.findings.map((f, i) => (
                <li key={i} className="text-[13px] leading-relaxed">
                  <span className="eyebrow block">{f.field}</span>
                  {f.detail}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4">
          <button
            className="w-full py-3 text-left text-[13px] text-muted-foreground hairline-b"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Hide details" : "Change amount, vial, site, or notes"}
          </button>
        </div>

        {expanded && (
          <div className="rise">
            <Field label="Amount">
              <div className="flex gap-3">
                <input
                  className={inputClass}
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <select
                  className={selectClass + " max-w-[110px]"}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as AmountUnit)}
                >
                  <option value="mcg">mcg</option>
                  <option value="mg">mg</option>
                  <option value="units">units</option>
                  <option value="mL">mL</option>
                </select>
              </div>
            </Field>
            <Field label="Vial">
              <select
                className={selectClass}
                value={vialId ?? ""}
                onChange={(e) => setVialId(e.target.value || null)}
              >
                <option value="">No vial</option>
                {state.vials.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} — {compoundName(v.compound_id)} ({v.status})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Injection site" hint={`Suggested from recorded use: ${siteLabel(site)}`}>
              <select
                className={selectClass}
                value={site ?? ""}
                onChange={(e) => setSite(e.target.value || null)}
              >
                <option value="">Not recorded</option>
                {SITES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Note">
              <input
                className={inputClass + " font-sans text-[15px]"}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
              />
            </Field>
          </div>
        )}

        {review && (
          <div className="rise mt-4 border border-destructive/40 p-3">
            <p className="text-[14px] font-medium">Review this entry</p>
            <Note>
              The values below differ from your configured protocol. Save as entered to preserve
              the record, or cancel and correct it.
            </Note>
          </div>
        )}

        <div className="mt-6 space-y-3">
          <Button full onClick={() => save("logged")}>
            {review ? "Save as entered" : "Log dose"}
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" full onClick={() => save("skipped")}>
              Skip
            </Button>
            <Button variant="secondary" full onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
        <p className="mt-4">
          <Note>
            Protocol Check compares this entry with values you entered. It does not assess medical
            appropriateness.
          </Note>
        </p>
      </div>
    </Sheet>
  );
}
