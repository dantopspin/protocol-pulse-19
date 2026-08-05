import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HeaderActions, Screen } from "@/components/AppShell";
import { Button, Card, EmptyState, LinkButton, Note, Row, Section, StatusTag } from "@/components/kit";
import { LogDoseSheet } from "@/components/LogDoseSheet";
import { fmt, toMcg, toMg } from "@/lib/calc";
import { siteLabel } from "@/lib/compounds";
import {
  adherence,
  compoundName,
  dosesRemaining,
  entriesForDay,
  reconFor,
  vialFor,
} from "@/lib/domain";
import { hydrate, useStore } from "@/lib/store";
import type { ProtocolCompound } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Peptide Lens" },
      {
        name: "description",
        content:
          "Review the next scheduled entry, verify the calculation, and log a dose in seconds.",
      },
      { property: "og:title", content: "Today — Peptide Lens" },
      {
        property: "og:description",
        content: "Your next scheduled entry, vial balance, and site rotation in one view.",
      },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const navigate = useNavigate();
  const state = useStore((s) => s);
  const [target, setTarget] = useState<{ pc: ProtocolCompound; id: string; at: Date } | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (state.preferences.onboarded === false && state.protocols.length === 0) {
      navigate({ to: "/onboarding" });
    }
  }, [state.preferences.onboarded, state.protocols.length, navigate]);

  const today = new Date();
  const entries = entriesForDay(state, today);
  const next = entries.find((e) => !e.logged) ?? null;
  const recentChange = state.events.find((e) =>
    ["amount_changed", "schedule_changed", "vial_opened", "vial_changed"].includes(e.event_type),
  );
  const a = adherence(state, 7);

  const dateLabel = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <Screen title="Today" eyebrow={dateLabel} right={<HeaderActions />}>
      {state.protocols.length === 0 ? (
        <Section>
          <EmptyState
            title="No active protocol"
            body="Add an existing schedule to populate Today."
            action={<LinkButton to="/protocols/new">Add protocol</LinkButton>}
          />
        </Section>
      ) : (
        <>
          <Section title="Next scheduled entry">
            {next ? (
              <NextEntry
                pcId={next.pc.id}
                time={next.time}
                onLog={() => setTarget({ pc: next.pc, id: next.id, at: next.at })}
              />
            ) : (
              <EmptyState
                title="Nothing scheduled remaining"
                body="All scheduled entries for today are recorded. Add a manual entry if you administered something else."
                action={
                  entries[0] ? (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setTarget({ pc: entries[0]!.pc, id: entries[0]!.id, at: entries[0]!.at })
                      }
                    >
                      Add manual entry
                    </Button>
                  ) : undefined
                }
              />
            )}
          </Section>

          <Section title="Today's entries">
            <ul className="border-t border-hairline">
              {entries.length === 0 && (
                <li className="py-4">
                  <Note>No scheduled entries today.</Note>
                </li>
              )}
              {entries.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-4 py-3 hairline-b">
                  <div>
                    <p className="text-[15px]">{compoundName(e.pc.compound_id)}</p>
                    <p className="num text-[12px] text-muted-foreground">
                      {e.time} · {fmt(e.pc.scheduled_amount, 3)} {e.pc.amount_unit}
                    </p>
                  </div>
                  {e.logged ? (
                    <StatusTag
                      tone={
                        e.logged.status === "skipped"
                          ? "neutral"
                          : e.logged.protocol_check_result?.severity === "mismatch"
                            ? "critical"
                            : "accent"
                      }
                    >
                      {e.logged.status === "skipped"
                        ? "Skipped"
                        : e.logged.protocol_check_result?.severity === "mismatch"
                          ? "Needs review"
                          : "Logged"}
                    </StatusTag>
                  ) : (
                    <Button
                      variant="secondary"
                      className="min-h-[40px] px-3 text-[13px]"
                      onClick={() => setTarget({ pc: e.pc, id: e.id, at: e.at })}
                    >
                      Log
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Inventory" action={<Link to="/vials" className="text-[13px] text-primary">All vials</Link>}>
            <InventoryPanel />
          </Section>

          <Section title="This week">
            <Card>
              <Row label="Scheduled entries" value={a.scheduled} />
              <Row label="Logged entries" value={a.logged} />
              <Row
                label="Adherence"
                value={a.pct == null ? "—" : `${a.pct}%`}
                className="border-b-0"
              />
              <div className="mt-4 flex gap-3">
                <LinkButton to="/weekly-review" variant="secondary" className="min-h-[44px] text-[14px]">
                  Weekly review
                </LinkButton>
                <LinkButton to="/timeline" variant="secondary" className="min-h-[44px] text-[14px]">
                  Change Timeline
                </LinkButton>
              </div>
            </Card>
          </Section>

          {recentChange && (
            <Section title="Recent change">
              <Link to="/timeline" className="block border border-hairline p-4">
                <p className="text-[14px]">
                  {recentChange.event_type.replace(/_/g, " ")}
                  {recentChange.new_value ? ` — ${recentChange.new_value}` : ""}
                </p>
                <p className="num mt-1 text-[12px] text-muted-foreground">
                  Changed{" "}
                  {Math.max(
                    0,
                    Math.round(
                      (Date.now() - new Date(recentChange.timestamp).getTime()) / 86400000,
                    ),
                  )}{" "}
                  days ago · View timeline
                </p>
              </Link>
            </Section>
          )}
        </>
      )}

      <Section>
        <Note>
          Peptide Lens records and converts information you provide. It does not prescribe or verify
          medical appropriateness.
        </Note>
      </Section>

      <LogDoseSheet
        open={!!target}
        onClose={() => setTarget(null)}
        pc={target?.pc ?? null}
        scheduledEntryId={target?.id ?? null}
        scheduledAt={target?.at ?? null}

        onLogged={() => setConfirmation("Dose logged")}
      />

      {confirmation && <Toast text={confirmation} onDone={() => setConfirmation(null)} />}
    </Screen>
  );
}

function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="rise fixed inset-x-0 bottom-[80px] z-50 mx-auto max-w-[520px] page-x">
      <div className="border border-hairline bg-primary px-4 py-3 text-[14px] text-primary-foreground">
        {text}
      </div>
    </div>
  );
}

function NextEntry({ pcId, time, onLog }: { pcId: string; time: string; onLog: () => void }) {
  const state = useStore((s) => s);
  const pc = state.protocolCompounds.find((p) => p.id === pcId);
  if (!pc) return null;
  const vial = vialFor(state, pc);
  const recon = reconFor(state, pc, vial);
  const lastSite = state.sites[0]?.site_key ?? null;

  return (
    <Card className="rise">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[19px] font-semibold">{compoundName(pc.compound_id)}</p>
          <p className="num text-[13px] text-muted-foreground">{time}</p>
        </div>
        <StatusTag tone="accent">Scheduled</StatusTag>
      </div>
      <p className="num mt-4 text-[24px] font-semibold tracking-tight">
        {fmt(toMcg(pc.scheduled_amount, pc.amount_unit), 0)} mcg
      </p>
      <p className="num mt-1 text-[13px] text-muted-foreground">
        {fmt(toMg(pc.scheduled_amount, pc.amount_unit), 3)} mg
        {recon ? ` · ${fmt(recon.volumeMl, 3)} mL · ${fmt(recon.syringeUnits, 1)} units` : ""}
      </p>

      <div className="mt-4">
        <Row label="Active vial" value={vial ? vial.name : "None selected"} />
        <Row
          label="Vial remaining"
          value={
            vial
              ? `${fmt(vial.manual_remaining_amount ?? vial.estimated_remaining_amount, 2)} ${vial.amount_unit}`
              : "—"
          }
        />
        <Row label="Last site" value={siteLabel(lastSite)} mono={false} className="border-b-0" />
      </div>

      <div className="mt-5 space-y-3">
        <Button full onClick={onLog}>
          Log dose
        </Button>
        <div className="flex gap-3">
          <LinkButton
            to="/protocols/$protocolId"
            params={{ protocolId: pc.protocol_id }}
            variant="secondary"
            full
            className="min-h-[44px] text-[14px]"
          >
            View details
          </LinkButton>
          <LinkButton to="/calculator" variant="secondary" full className="min-h-[44px] text-[14px]">
            Check calculation
          </LinkButton>
        </div>
      </div>
    </Card>
  );
}

function InventoryPanel() {
  const state = useStore((s) => s);
  const active = state.vials.filter((v) => v.status === "active" || v.status === "low");
  if (active.length === 0) {
    return (
      <EmptyState
        title="No active vial"
        body="Add a vial to estimate remaining doses."
        action={<LinkButton to="/vials" variant="secondary">Add vial</LinkButton>}
      />
    );
  }
  return (
    <ul className="border-t border-hairline">
      {active.map((v) => {
        const pc = state.protocolCompounds.find((p) => p.active_vial_id === v.id);
        const remaining = dosesRemaining(state, v, pc);
        return (
          <li key={v.id} className="py-3 hairline-b">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[15px]">{v.name}</p>
              <StatusTag tone={v.status === "low" ? "warning" : "neutral"}>{v.status}</StatusTag>
            </div>
            <p className="num mt-1 text-[12px] text-muted-foreground">
              {compoundName(v.compound_id)} ·{" "}
              {fmt(v.manual_remaining_amount ?? v.estimated_remaining_amount, 2)} {v.amount_unit}{" "}
              remaining
              {remaining != null ? ` · ${remaining} recorded doses remain` : ""}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
