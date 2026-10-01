import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/AppShell";
import { Button, Note, Section, inputClass } from "@/components/kit";
import { anchorId, parseAnswer, type AiSource } from "@/lib/ai-sources";
import { isOnline, requestComparison, rollAiWeek } from "@/lib/ai-queue";
import { useEntitlement } from "@/lib/entitlements";
import { formatDateTime } from "@/lib/format";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Before and after a change — Peptide Lens" },
      { name: "description", content: "Neutral, source-linked observations of what you recorded before and after a protocol change." },
      { property: "og:title", content: "Before and after a change — Peptide Lens" },
      { property: "og:description", content: "Pick a recorded change and a window to compare your logged records." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ComparePage,
});

const WINDOWS = [7, 14, 30];
type Result = { text: string; refs: AiSource[]; categories: string[]; before: number; after: number; days: number };

function ComparePage() {
  const state = useStore((s) => s);
  const { isPro, limits } = useEntitlement();
  const events = state.events;
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [days, setDays] = useState(14);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const remaining = Math.max(0, limits.aiPerWeek - state.aiUsedThisWeek);

  const run = async () => {
    if (!eventId || busy) return;
    if (!isPro && remaining <= 0) return setError("You have used this week's questions. Pro removes the limit.");
    if (!isOnline()) return setError("You are offline. Connect to generate observations.");
    rollAiWeek();
    setError(null);
    setBusy(true);
    const r = await requestComparison(eventId, days);
    setBusy(false);
    if (r.ok) setResult({ text: r.text, refs: r.refs, categories: r.categories, before: r.before, after: r.after, days });
    else setError(r.error);
  };

  return (
    <Screen title="Before and after" eyebrow={isPro ? "Pro" : `${remaining} questions remaining this week`} back={{ to: "/timeline", label: "Timeline" }}>
      <Section title="Change and window">
        {events.length === 0 ? (
          <Note>No protocol changes recorded yet. Changes appear here once you edit a protocol amount, schedule or vial.</Note>
        ) : (
          <>
            <label className="text-[12px] text-muted-foreground">
              Recorded change
              <select className={inputClass} value={eventId} onChange={(e) => { setEventId(e.target.value); setResult(null); }}>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {formatDateTime(e.timestamp)} · {e.event_type.replace(/_/g, " ")}{e.new_value ? ` → ${e.new_value}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {WINDOWS.map((w) => (
                <Button key={w} variant={w === days ? "primary" : "secondary"} className="min-h-[44px]" onClick={() => { setDays(w); setResult(null); }}>
                  ±{w} days
                </Button>
              ))}
            </div>
            <Button full className="mt-4 min-h-[44px]" disabled={!eventId || busy} onClick={() => void run()}>
              {busy ? "Writing observations" : "Compare before and after"}
            </Button>
          </>
        )}
        {!state.preferences.ai_sharing && <p className="mt-3"><Note>Record sharing is off in Settings, so observations cannot be generated.</Note></p>}
        {error && <p className="mt-3 text-[12px] text-destructive">{error}</p>}
      </Section>

      {result && (
        <Section title={`Observations · ${result.days} days each side`}>
          <p className="mb-2 text-[12px] text-muted-foreground tabular-nums">{result.before} records before · {result.after} records after</p>
          <p className="text-[14px] leading-relaxed whitespace-pre-line">
            {parseAnswer(result.text, result.refs).map((seg, i) =>
              seg.type === "text" ? <span key={i}>{seg.text}</span> : <Chip key={i} source={seg.source} inline />,
            )}
          </p>
          {result.refs.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">{result.refs.map((r) => <Chip key={r.ref} source={r} />)}</div>
          )}
          {result.categories.length > 0 && <p className="mt-2 text-[12px] text-muted-foreground">Records used: {result.categories.join(", ")}</p>}
        </Section>
      )}

      <Section>
        <Note>These observations describe what you recorded around a change. They do not establish causation or give medical advice.</Note>
      </Section>
    </Screen>
  );
}

function Chip({ source, inline }: { source: AiSource; inline?: boolean }) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={source.to as any}
      hash={anchorId(source.recordId)}
      title={source.label}
      className={inline ? "mx-[2px] text-[11px] text-primary underline underline-offset-4" : "border border-hairline px-2 py-1 text-[11px] text-primary"}
    >
      {inline ? `[${source.ref}]` : `${source.ref} · ${source.label}`}
    </Link>
  );
}
