import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Screen } from "@/components/AppShell";
import { Button, Choice, Field, Note, Row, Section, inputClass, selectClass } from "@/components/kit";
import { fmt, reconstitute } from "@/lib/calc";
import { COMPOUNDS } from "@/lib/compounds";
import { hydrate, recordEvent, setState, uid, useStore } from "@/lib/store";
import type { AmountUnit, ScheduleRule, SyringeType } from "@/lib/types";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your protocol — Peptide Lens" },
      {
        name: "description",
        content:
          "Configure one existing protocol, vial, and calculation, then review a personalized Today screen.",
      },
      { property: "og:title", content: "Set up your protocol — Peptide Lens" },
      {
        property: "og:description",
        content: "Eleven short steps to record an existing protocol accurately.",
      },
    ],
  }),
  component: Onboarding,
});

const OBJECTIVES = [
  "Keep doses and schedules organized",
  "Check reconstitution calculations",
  "Track vial inventory",
  "Rotate injection sites",
  "Record weight and progress",
  "Connect symptoms to my timeline",
  "Prepare records for appointments",
  "Learn about compounds",
];

const EXPERIENCE = [
  "New to it",
  "I track manually",
  "I use notes or spreadsheets",
  "I use another tracker",
  "I manage multiple protocols",
];

const DIFFICULTIES = [
  "Remembering scheduled doses",
  "Reconstitution math",
  "Switching between mg, mcg, mL, and units",
  "Managing multiple compounds",
  "Knowing what remains in a vial",
  "Remembering injection sites",
  "Recording side effects",
  "Understanding what changed",
  "Preparing a complete history",
  "Other",
];

function toggle(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function Onboarding() {
  const navigate = useNavigate();
  const prefs = useStore((s) => s.preferences);
  const [step, setStep] = useState(1);

  const [objectives, setObjectives] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [compounds, setCompounds] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [system, setSystem] = useState<"metric" | "imperial">("metric");
  const [display, setDisplay] = useState<"mg" | "mcg" | "both">("both");
  const [syringe, setSyringe] = useState<SyringeType>("U-100 insulin");
  const [capacity, setCapacity] = useState("1");
  const [format, setFormat] = useState("Vial");

  const [pName, setPName] = useState("Protocol 01");
  const [pCompound, setPCompound] = useState("bpc-157");
  const [pAmount, setPAmount] = useState("250");
  const [pUnit, setPUnit] = useState<AmountUnit>("mcg");
  const [pFreq, setPFreq] = useState<ScheduleRule["kind"]>("daily");
  const [pTime, setPTime] = useState("20:00");
  const [pSource, setPSource] = useState("Prescriber instructions");

  const [vName, setVName] = useState("Vial 01");
  const [vAmount, setVAmount] = useState("10");
  const [vUnit, setVUnit] = useState<AmountUnit>("mg");
  const [vDiluent, setVDiluent] = useState("2");
  const [vExpiry, setVExpiry] = useState("");
  const [vBatch, setVBatch] = useState("");
  const [skipVial, setSkipVial] = useState(false);

  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [aiSharing, setAiSharing] = useState(false);

  useEffect(() => {
    hydrate();
  }, []);

  const recon = useMemo(
    () =>
      reconstitute({
        vialAmount: Number(vAmount) || 0,
        vialUnit: vUnit,
        diluentMl: Number(vDiluent) || 0,
        targetAmount: Number(pAmount) || 0,
        targetUnit: pUnit,
        syringe,
      }),
    [vAmount, vUnit, vDiluent, pAmount, pUnit, syringe],
  );

  const next = () => setStep((s) => Math.min(11, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const finish = () => {
    const now = new Date().toISOString();
    const protocolId = uid();
    const vialId = uid();
    const rule: ScheduleRule =
      pFreq === "every_n_days"
        ? { kind: "every_n_days", n: 2 }
        : pFreq === "weekly"
          ? { kind: "weekly", day: new Date().getDay() }
          : pFreq === "times_per_week"
            ? { kind: "times_per_week", n: 3 }
            : pFreq === "as_recorded"
              ? { kind: "as_recorded" }
              : { kind: "daily" };

    setState((s) => ({
      ...s,
      preferences: {
        ...s.preferences,
        measurement_system: system,
        amount_display: display,
        syringe_type: syringe,
        syringe_capacity_ml: Number(capacity) || 1,
        administration_format: format,
        objectives,
        experience,
        difficulties,
        disclaimer_accepted: accepted,
        ai_sharing: aiSharing,
        onboarded: true,
      },
      activeProtocolId: protocolId,
      protocols: [
        {
          id: protocolId,
          name: pName || "Protocol 01",
          status: "active",
          instruction_source: pSource,
          start_date: now,
          end_date: null,
          notes: "",
          created_at: now,
          updated_at: now,
          archived_at: null,
        },
        ...s.protocols,
      ],
      protocolCompounds: [
        {
          id: uid(),
          protocol_id: protocolId,
          compound_id: pCompound,
          administration_format: format,
          scheduled_amount: Number(pAmount) || 0,
          amount_unit: pUnit,
          schedule_rule: rule,
          preferred_times: [pTime],
          active_vial_id: skipVial ? null : vialId,
          reminder_enabled: true,
          started_at: now,
          stopped_at: null,
        },
        ...s.protocolCompounds,
      ],
      vials: skipVial
        ? s.vials
        : [
            {
              id: vialId,
              compound_id: pCompound,
              protocol_ids: [protocolId],
              name: vName || "Vial 01",
              status: "active",
              original_amount: Number(vAmount) || 0,
              amount_unit: vUnit,
              diluent_volume_ml: Number(vDiluent) || 0,
              reconstitution_date: now,
              user_expiry_date: vExpiry || null,
              batch_number: vBatch,
              supplier_or_clinic: "",
              label_photo_uri: null,
              storage_notes: "",
              estimated_remaining_amount: Number(vAmount) || 0,
              manual_remaining_amount: null,
              created_at: now,
              depleted_at: null,
              archived_at: null,
            },
            ...s.vials,
          ],
    }));
    recordEvent("protocol_created", { protocol_id: protocolId, new_value: pName });
    recordEvent("protocol_activated", { protocol_id: protocolId });
    if (!skipVial) recordEvent("vial_opened", { protocol_id: protocolId, vial_id: vialId, new_value: vName });
    setStep(11);
  };

  return (
    <Screen hideTabs>
      <div className="page-x pt-8 pb-4">
        <p className="eyebrow">
          Step {step} of 11
        </p>
        <div className="mt-3 h-[2px] w-full bg-surface">
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${(step / 11) * 100}%` }}
          />
        </div>
      </div>

      <div className="rise" key={step}>
        {step === 1 && (
          <Section>
            <h1 className="text-[32px] font-semibold leading-tight">Peptide Lens</h1>
            <p className="mt-6 text-[20px] leading-snug">Your protocol, clearly recorded.</p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Track doses, calculations, vials, sites, symptoms, and protocol changes in one place.
            </p>
            <div className="mt-10 space-y-4">
              <Button full onClick={next}>
                Set up your protocol
              </Button>
              <button
                className="w-full text-[14px] text-muted-foreground underline underline-offset-4"
                onClick={() => {
                  setState((s) => ({ ...s, preferences: { ...s.preferences, onboarded: true } }));
                  navigate({ to: "/library" });
                }}
              >
                Explore without setup
              </button>
            </div>
          </Section>
        )}

        {step === 2 && (
          <StepList
            title="What do you need most?"
            note="Used only to prioritize modules and explanations."
            options={OBJECTIVES}
            selected={objectives}
            onToggle={(v) => setObjectives((l) => toggle(l, v))}
            onNext={next}
            onBack={back}
          />
        )}

        {step === 3 && (
          <StepList
            title="How familiar are you with protocol tracking?"
            note="This controls explanation depth only."
            options={EXPERIENCE}
            selected={experience ? [experience] : []}
            onToggle={(v) => setExperience(v)}
            onNext={next}
            onBack={back}
          />
        )}

        {step === 4 && (
          <Section>
            <h1 className="text-[26px] font-semibold leading-tight">
              What are you currently recording?
            </h1>
            <Note>No compound below is recommended. Categories describe status only.</Note>
            <div className="mt-5 space-y-2">
              {COMPOUNDS.map((c) => (
                <Choice
                  key={c.id}
                  title={c.name}
                  detail={`${c.category} · ${c.regulatory_status}`}
                  selected={compounds.includes(c.id)}
                  onClick={() => setCompounds((l) => toggle(l, c.id))}
                />
              ))}
              <Choice
                title="Nothing yet"
                selected={compounds.includes("none")}
                onClick={() => setCompounds((l) => toggle(l, "none"))}
              />
              <Choice
                title="I prefer not to add this now"
                selected={compounds.includes("private")}
                onClick={() => setCompounds((l) => toggle(l, "private"))}
              />
            </div>
            <Nav onBack={back} onNext={next} />
          </Section>
        )}

        {step === 5 && (
          <StepList
            title="What usually becomes difficult?"
            note="Used to personalize your first Today screen."
            options={DIFFICULTIES}
            selected={difficulties}
            onToggle={(v) => setDifficulties((l) => toggle(l, v))}
            onNext={next}
            onBack={back}
          />
        )}

        {step === 6 && (
          <Section>
            <h1 className="text-[26px] font-semibold leading-tight">Units and equipment</h1>
            <div className="mt-4">
              <Field label="Body measurements">
                <select
                  className={selectClass}
                  value={system}
                  onChange={(e) => setSystem(e.target.value as "metric" | "imperial")}
                >
                  <option value="metric">Metric</option>
                  <option value="imperial">Imperial</option>
                </select>
              </Field>
              <Field label="Amount display">
                <select
                  className={selectClass}
                  value={display}
                  onChange={(e) => setDisplay(e.target.value as "mg" | "mcg" | "both")}
                >
                  <option value="both">mg and mcg</option>
                  <option value="mg">mg</option>
                  <option value="mcg">mcg</option>
                </select>
              </Field>
              <Field label="Syringe type">
                <select
                  className={selectClass}
                  value={syringe}
                  onChange={(e) => setSyringe(e.target.value as SyringeType)}
                >
                  <option>U-100 insulin</option>
                  <option>U-50 insulin</option>
                  <option>1 mL syringe</option>
                  <option>3 mL syringe</option>
                  <option>Pen</option>
                </select>
              </Field>
              <Field label="Syringe capacity (mL)">
                <input
                  className={inputClass}
                  inputMode="decimal"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </Field>
              <Field label="Administration format">
                <select
                  className={selectClass}
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                >
                  <option>Vial</option>
                  <option>Pen</option>
                  <option>Prefilled device</option>
                  <option>Other</option>
                </select>
              </Field>
            </div>
            <Note>
              Critical amounts display in multiple representations. Entered values are never
              replaced.
            </Note>
            <Nav onBack={back} onNext={next} />
          </Section>
        )}

        {step === 7 && (
          <Section>
            <h1 className="text-[26px] font-semibold leading-tight">First protocol</h1>
            <Note>Record instructions you already have. Peptide Lens does not create schedules.</Note>
            <div className="mt-4">
              <Field label="Protocol name">
                <input
                  className={inputClass + " font-sans"}
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                />
              </Field>
              <Field label="Compound">
                <select
                  className={selectClass}
                  value={pCompound}
                  onChange={(e) => setPCompound(e.target.value)}
                >
                  {COMPOUNDS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Scheduled amount">
                <div className="flex gap-3">
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    value={pAmount}
                    onChange={(e) => setPAmount(e.target.value)}
                  />
                  <select
                    className={selectClass + " max-w-[110px]"}
                    value={pUnit}
                    onChange={(e) => setPUnit(e.target.value as AmountUnit)}
                  >
                    <option value="mcg">mcg</option>
                    <option value="mg">mg</option>
                    <option value="units">units</option>
                    <option value="mL">mL</option>
                  </select>
                </div>
              </Field>
              <Field label="Frequency">
                <select
                  className={selectClass}
                  value={pFreq}
                  onChange={(e) => setPFreq(e.target.value as ScheduleRule["kind"])}
                >
                  <option value="daily">Daily</option>
                  <option value="weekdays">Specific weekdays</option>
                  <option value="every_n_days">Every number of days</option>
                  <option value="weekly">Weekly</option>
                  <option value="times_per_week">Multiple times per week</option>
                  <option value="as_recorded">As recorded, without reminders</option>
                </select>
              </Field>
              <Field label="Preferred time">
                <input
                  type="time"
                  className={inputClass}
                  value={pTime}
                  onChange={(e) => setPTime(e.target.value)}
                />
              </Field>
              <Field label="Source of instructions">
                <select
                  className={selectClass}
                  value={pSource}
                  onChange={(e) => setPSource(e.target.value)}
                >
                  <option>Prescriber instructions</option>
                  <option>Clinic instructions</option>
                  <option>Product label</option>
                  <option>Personal record</option>
                  <option>Imported from another tracker</option>
                  <option>Other</option>
                </select>
              </Field>
            </div>
            <div className="mt-6 border border-hairline p-4">
              <p className="eyebrow">Pro schedules</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                On/off cycles, 5-on/2-off, multiple daily doses, custom intervals, phase-based
                schedules, and titration records are available with Pro.
              </p>
            </div>
            <Nav onBack={back} onNext={next} />
          </Section>
        )}

        {step === 8 && (
          <Section>
            <h1 className="text-[26px] font-semibold leading-tight">First vial</h1>
            <div className="mt-4">
              <Field label="Vial name">
                <input
                  className={inputClass + " font-sans"}
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                />
              </Field>
              <Field label="Vial amount">
                <div className="flex gap-3">
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    value={vAmount}
                    onChange={(e) => setVAmount(e.target.value)}
                  />
                  <select
                    className={selectClass + " max-w-[110px]"}
                    value={vUnit}
                    onChange={(e) => setVUnit(e.target.value as AmountUnit)}
                  >
                    <option value="mg">mg</option>
                    <option value="mcg">mcg</option>
                  </select>
                </div>
              </Field>
              <Field label="Diluent volume (mL)">
                <input
                  className={inputClass}
                  inputMode="decimal"
                  value={vDiluent}
                  onChange={(e) => setVDiluent(e.target.value)}
                />
              </Field>
              <Field label="Expiry or discard date" hint="Your own entry. Not verified.">
                <input
                  type="date"
                  className={inputClass}
                  value={vExpiry}
                  onChange={(e) => setVExpiry(e.target.value)}
                />
              </Field>
              <Field label="Batch or lot number">
                <input
                  className={inputClass}
                  value={vBatch}
                  onChange={(e) => setVBatch(e.target.value)}
                  placeholder="Optional"
                />
              </Field>
              <Field label="Label photo" hint="Camera access is requested only when used.">
                <button className="w-full border border-dashed border-hairline py-4 text-[13px] text-muted-foreground">
                  Add label photo — extracted values require review before saving
                </button>
              </Field>
            </div>
            <button
              className="mt-6 text-[14px] text-muted-foreground underline underline-offset-4"
              onClick={() => {
                setSkipVial(true);
                next();
              }}
            >
              Skip vial tracking
            </button>
            <Nav onBack={back} onNext={next} />
          </Section>
        )}

        {step === 9 && (
          <Section>
            <h1 className="text-[26px] font-semibold leading-tight">Verify your protocol</h1>
            <Note>Confirm that these values match your existing instructions.</Note>
            <div className="mt-5 border border-hairline p-4">
              <Row label="Compound" value={COMPOUNDS.find((c) => c.id === pCompound)?.name ?? "—"} mono={false} />
              <Row label="Scheduled amount" value={`${pAmount} ${pUnit}`} />
              <Row label="Frequency" value={pFreq.replace(/_/g, " ")} mono={false} />
              <Row label="Active vial" value={skipVial ? "None" : vName} mono={false} />
              <Row
                label="Concentration"
                value={recon ? `${fmt(recon.concentrationMgMl)} mg/mL` : "—"}
              />
              <Row label="Draw volume" value={recon ? `${fmt(recon.volumeMl, 3)} mL` : "—"} />
              <Row label="Syringe units" value={recon ? `${fmt(recon.syringeUnits, 1)} units` : "—"} />
              <Row label="Syringe type" value={syringe} mono={false} />
              <Row label="Projected doses" value={recon ? recon.dosesPerVial : "—"} className="border-b-0" />
            </div>
            {recon && (
              <div className="mt-4 border border-hairline bg-surface p-4">
                <p className="eyebrow">Derivation</p>
                <ul className="num mt-2 space-y-1 text-[13px]">
                  {recon.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6 space-y-2">
              {["Scheduled amount", "Vial concentration", "Draw volume", "Syringe type"].map((v) => (
                <Choice
                  key={v}
                  title={`Confirm ${v.toLowerCase()}`}
                  selected={confirmed.includes(v)}
                  onClick={() => setConfirmed((l) => toggle(l, v))}
                />
              ))}
            </div>
            <div className="mt-6 space-y-3">
              <Button full disabled={confirmed.length < 4} onClick={next}>
                Confirm protocol
              </Button>
              <Button variant="secondary" full onClick={back}>
                Edit vial or schedule
              </Button>
            </div>
          </Section>
        )}

        {step === 10 && (
          <Section>
            <h1 className="text-[26px] font-semibold leading-tight">Disclaimer and data</h1>
            <ul className="mt-4 space-y-2 text-[14px] leading-relaxed text-muted-foreground">
              <li>The app organizes user-entered records.</li>
              <li>It does not provide medical advice.</li>
              <li>It does not recommend doses or combinations.</li>
              <li>Calculations depend on the values you enter.</li>
              <li>Verify instructions with a qualified healthcare professional.</li>
              <li>Urgent or severe symptoms require medical care, not an app response.</li>
            </ul>
            <div className="mt-6 space-y-2">
              <Choice
                title="I understand that Peptide Lens records and converts information I provide. It does not prescribe or verify medical appropriateness."
                selected={accepted}
                onClick={() => setAccepted((v) => !v)}
              />
              <Choice
                title="Keep all records on this device"
                detail="Default"
                selected={!aiSharing}
                onClick={() => setAiSharing(false)}
              />
              <Choice
                title="Allow selected records to be sent for AI summaries"
                selected={aiSharing}
                onClick={() => setAiSharing(true)}
              />
            </div>
            <div className="mt-6">
              <Button full disabled={!accepted} onClick={finish}>
                Continue
              </Button>
            </div>
          </Section>
        )}

        {step === 11 && (
          <Section>
            <p className="eyebrow">Your Today screen</p>
            <h1 className="mt-1 text-[26px] font-semibold leading-tight">Ready</h1>
            <div className="mt-5 border border-hairline p-4">
              <p className="text-[18px] font-semibold">
                {COMPOUNDS.find((c) => c.id === pCompound)?.name}
              </p>
              <p className="num text-[13px] text-muted-foreground">{pTime}</p>
              <p className="num mt-3 text-[20px] font-semibold">
                {pAmount} {pUnit}
                {recon ? ` · ${fmt(recon.volumeMl, 3)} mL · ${fmt(recon.syringeUnits, 1)} units` : ""}
              </p>
              <div className="mt-4">
                <Row label="Active vial" value={skipVial ? "None" : vName} mono={false} />
                <Row label="Protocol Check" value="Runs before every save" mono={false} className="border-b-0" />
              </div>
            </div>
            <div className="mt-6 border border-hairline bg-surface p-4">
              <p className="eyebrow">Reminders</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Allow reminders for scheduled entries and low inventory.
              </p>
              <div className="mt-3 flex gap-3">
                <Button
                  variant="secondary"
                  className="min-h-[44px] text-[14px]"
                  onClick={() =>
                    setState((s) => ({ ...s, notificationsGranted: true }))
                  }
                >
                  Allow reminders
                </Button>
                <Button
                  variant="secondary"
                  className="min-h-[44px] text-[14px]"
                  onClick={() => setState((s) => ({ ...s, notificationsGranted: false }))}
                >
                  Not now
                </Button>
              </div>
            </div>
            <div className="mt-8">
              <Button full onClick={() => navigate({ to: "/" })}>
                Open Today
              </Button>
            </div>
          </Section>
        )}
      </div>

      {prefs.onboarded && step < 11 && (
        <Section>
          <button
            className="text-[13px] text-muted-foreground underline underline-offset-4"
            onClick={() => navigate({ to: "/" })}
          >
            Return to Today
          </button>
        </Section>
      )}
    </Screen>
  );
}

function StepList({
  title,
  note,
  options,
  selected,
  onToggle,
  onNext,
  onBack,
}: {
  title: string;
  note: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <Section>
      <h1 className="text-[26px] font-semibold leading-tight">{title}</h1>
      <Note>{note}</Note>
      <div className="mt-5 space-y-2">
        {options.map((o) => (
          <Choice key={o} title={o} selected={selected.includes(o)} onClick={() => onToggle(o)} />
        ))}
      </div>
      <Nav onBack={onBack} onNext={onNext} />
    </Section>
  );
}

function Nav({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="mt-8 flex gap-3">
      <Button variant="secondary" onClick={onBack} className="min-w-[96px]">
        Back
      </Button>
      <Button full onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}
