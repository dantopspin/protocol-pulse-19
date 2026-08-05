import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/AppShell";
import { Button, Field, Note, Section, inputClass, selectClass } from "@/components/kit";
import { COMPOUNDS } from "@/lib/compounds";
import { useEntitlement } from "@/lib/entitlements";
import { recordEvent, setState, uid } from "@/lib/store";
import type { AmountUnit, ScheduleRule } from "@/lib/types";

export const Route = createFileRoute("/protocols/new")({
  head: () => ({
    meta: [
      { title: "Protocol builder — Peptide Lens" },
      { name: "description", content: "Record an existing protocol: compound, amount, schedule, source, and vial." },
      { property: "og:title", content: "Protocol builder — Peptide Lens" },
      { property: "og:description", content: "Record instructions you already have. No schedule is generated." },
    ],
  }),
  component: ProtocolBuilder,
});

function ProtocolBuilder() {
  const navigate = useNavigate();
  const { isPro } = useEntitlement();
  const [name, setName] = useState("");
  const [compound, setCompound] = useState(COMPOUNDS[0]!.id);
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<AmountUnit>("mcg");
  const [freq, setFreq] = useState<ScheduleRule["kind"]>("daily");
  const [time, setTime] = useState("08:00");
  const [source, setSource] = useState("Prescriber instructions");
  const [notes, setNotes] = useState("");

  const save = () => {
    const now = new Date().toISOString();
    const id = uid();
    const rule: ScheduleRule =
      freq === "every_n_days"
        ? { kind: "every_n_days", n: 2 }
        : freq === "weekly"
          ? { kind: "weekly", day: new Date().getDay() }
          : freq === "times_per_week"
            ? { kind: "times_per_week", n: 3 }
            : freq === "as_recorded"
              ? { kind: "as_recorded" }
              : { kind: "daily" };
    setState((s) => ({
      ...s,
      protocols: [
        {
          id,
          name: name || "Untitled protocol",
          status: "active",
          instruction_source: source,
          start_date: now,
          end_date: null,
          notes,
          created_at: now,
          updated_at: now,
          archived_at: null,
        },
        ...s.protocols,
      ],
      protocolCompounds: [
        {
          id: uid(),
          protocol_id: id,
          compound_id: compound,
          administration_format: s.preferences.administration_format,
          scheduled_amount: Number(amount) || 0,
          amount_unit: unit,
          schedule_rule: rule,
          preferred_times: [time],
          active_vial_id: null,
          reminder_enabled: true,
          started_at: now,
          stopped_at: null,
        },
        ...s.protocolCompounds,
      ],
    }));
    recordEvent("protocol_created", { protocol_id: id, new_value: name });
    navigate({ to: "/protocols" });
  };

  return (
    <Screen title="Protocol builder" back={{ to: "/protocols", label: "Protocols" }} hideTabs>
      <Section>
        <Field label="Name">
          <input className={inputClass + " font-sans"} value={name} onChange={(e) => setName(e.target.value)} placeholder="Protocol 02" />
        </Field>
        <Field label="Compound">
          <select className={selectClass} value={compound} onChange={(e) => setCompound(e.target.value)}>
            {COMPOUNDS.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Scheduled amount">
          <div className="flex gap-3">
            <input className={inputClass} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <select className={selectClass + " max-w-[110px]"} value={unit} onChange={(e) => setUnit(e.target.value as AmountUnit)}>
              <option value="mcg">mcg</option>
              <option value="mg">mg</option>
              <option value="units">units</option>
              <option value="mL">mL</option>
            </select>
          </div>
        </Field>
        <Field label="Schedule">
          <select className={selectClass} value={freq} onChange={(e) => setFreq(e.target.value as ScheduleRule["kind"])}>
            <option value="daily">Daily</option>
            <option value="weekdays">Specific weekdays</option>
            <option value="every_n_days">Every number of days</option>
            <option value="weekly">Weekly</option>
            <option value="times_per_week">Multiple times per week</option>
            <option value="as_recorded">As recorded, without reminders</option>
          </select>
        </Field>
        <Field label="Preferred time">
          <input type="time" className={inputClass} value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
        <Field label="Instruction source">
          <select className={selectClass} value={source} onChange={(e) => setSource(e.target.value)}>
            <option>Prescriber instructions</option>
            <option>Clinic instructions</option>
            <option>Product label</option>
            <option>Personal record</option>
            <option>Imported from another tracker</option>
            <option>Other</option>
          </select>
        </Field>
        <Field label="Notes">
          <input className={inputClass + " font-sans text-[15px]"} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
        </Field>
      </Section>
      {!isPro && (
        <Section title="Pro scheduling">
          <div className="border border-hairline p-4">
            <p className="text-[13px] text-muted-foreground">
              Cycles, 5-on/2-off patterns, multiple daily doses, custom intervals, phase-based
              schedules, titration records, and travel adjustments are recorded with Pro.
            </p>
          </div>
        </Section>
      )}
      <Section>
        <Button full onClick={save}>Save protocol</Button>
        <p className="mt-4"><Note>Record instructions you already have. Peptide Lens does not generate schedules.</Note></p>
      </Section>
    </Screen>
  );
}
