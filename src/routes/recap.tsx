import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/AppShell";
import { Button, Note, Section, inputClass } from "@/components/kit";
import { anchorId, parseAnswer, type AiSource } from "@/lib/ai-sources";
import { isOnline, requestRecap, rollAiWeek } from "@/lib/ai-queue";
import { useEntitlement } from "@/lib/entitlements";
import { formatISODate } from "@/lib/format";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/recap")({
  head: () => ({
    meta: [
      { title: "Change recap — Peptide Lens" },
      {
        name: "description",
        content: "A neutral, source-linked chronological recap of your recorded protocol changes for any date range.",
      },
      { property: "og:title", content: "Change recap — Peptide Lens" },
      { property: "og:description", content: "Pick a date range and read a cited recap of what you recorded." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecapPage,
});

type Result = { text: string; refs: AiSource[]; categories: string[]; from: string; to: string };

function RecapPage() {
  const state = useStore((s) => s);
  const { isPro, limits } = useEntitlement();
  const [from, setFrom] = useState(() => formatISODate(Date.now() - 30 * 86400000));
  const [to, setTo] = useState(() => formatISODate(Date.now()));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const remaining = Math.max(0, limits.aiPerWeek - state.aiUsedThisWeek);
  const invalid = !from || !to || from > to;

  const run = async () => {
    if (invalid || busy) return;
    if (!isPro && remaining <= 0) return setError("You have used this week's questions. Pro removes the limit.");
    if (!isOnline()) return setError("You are offline. Connect to generate a recap.");
    rollAiWeek();
    setError(null);
    setBusy(true);
    const r = await requestRecap({ from, to });
    setBusy(false);
    if (r.ok) setResult({ text: r.text, refs: r.refs, categories: r.categories, from, to });
    else setError(r.error);
  };

  return (
    <Screen
      title="Change recap"
      eyebrow={isPro ? "Pro" : `${remaining} questions remaining this week`}
      back={{ to: "/timeline", label: "Timeline" }}
    >
      <Section title="Date range">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-[12px] text-muted-foreground">
            From
            <input type="date" className={inputClass} value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="text-[12px] text-muted-foreground">
            To
            <input type="date" className={inputClass} value={to} min={from} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
        {invalid && <p className="mt-2 text-[12px] text-destructive">The start date must be on or before the end date.</p>}
        <Button full className="mt-4 min-h-[44px]" disabled={invalid || busy} onClick={() => void run()}>
          {busy ? "Writing recap" : "Generate recap"}
        </Button>
        {!state.preferences.ai_sharing && (
          <p className="mt-3"><Note>Record sharing is off in Settings, so a recap cannot be generated.</Note></p>
        )}
        {error && <p className="mt-3 text-[12px] text-destructive">{error}</p>}
      </Section>

      {result && (
        <Section title={`Recap · ${result.from} to ${result.to}`}>
          <p className="text-[14px] leading-relaxed whitespace-pre-line">
            {parseAnswer(result.text, result.refs).map((seg, i) =>
              seg.type === "text" ? <span key={i}>{seg.text}</span> : <Chip key={i} source={seg.source} inline />,
            )}
          </p>
          {result.refs.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {result.refs.map((r) => <Chip key={r.ref} source={r} />)}
            </div>
          )}
          {result.categories.length > 0 && (
            <p className="mt-2 text-[12px] text-muted-foreground">Records used: {result.categories.join(", ")}</p>
          )}
        </Section>
      )}

      <Section>
        <Note>The recap describes what you recorded, in order. It does not establish causation or give medical advice.</Note>
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
      className={
        inline
          ? "mx-[2px] text-[11px] text-primary underline underline-offset-4"
          : "border border-hairline px-2 py-1 text-[11px] text-primary"
      }
    >
      {inline ? `[${source.ref}]` : `${source.ref} · ${source.label}`}
    </Link>
  );
}
