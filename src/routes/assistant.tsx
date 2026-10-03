import { Link } from "@tanstack/react-router";
import { anchorId, parseAnswer, type AiSource } from "@/lib/ai-sources";
import type { AiMessageSource } from "@/lib/store";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/AppShell";
import { Button, Note, Section, inputClass } from "@/components/kit";
import {
  appendMessage,
  askAssistant,
  enqueue,
  isOnline,
  removeQueued,
  retryQueued,
  rollAiWeek,
  useOnline,
} from "@/lib/ai-queue";
import { useEntitlement } from "@/lib/entitlements";
import { formatDateTime } from "@/lib/format";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "Assistant — Peptide Lens" },
      { name: "description", content: "Ask questions about your own recorded protocols, doses, vials, sites, and symptoms." },
      { property: "og:title", content: "Assistant — Peptide Lens" },
      { property: "og:description", content: "Grounded in your records. It does not recommend doses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Assistant,
});

function Assistant() {
  const state = useStore((s) => s);
  const { isPro, limits } = useEntitlement();
  const online = useOnline();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const remaining = Math.max(0, limits.aiPerWeek - state.aiUsedThisWeek);
  const outOfAllowance = !isPro && remaining <= 0;
  const sharing = state.preferences.ai_sharing;

  const ask = async () => {
    const question = q.trim();
    if (!question || busy) return;
    if (outOfAllowance) {
      setNotice("You have used this week's questions. Pro removes the limit.");
      return;
    }
    rollAiWeek();
    setNotice(null);
    appendMessage("user", question);
    setQ("");

    if (!isOnline()) {
      enqueue(question);
      setNotice("You are offline. The question is queued and sends automatically when you reconnect.");
      return;
    }

    setBusy(true);
    const result = await askAssistant(question); // usage is counted only on success
    setBusy(false);
    if (result.ok) {
      appendMessage("assistant", result.text, result.categories, false, result.refs);
    } else {
      enqueue(question);
      setNotice(`${result.error} The question stays queued — retry below.`);
    }
  };

  return (
    <Screen
      title="Assistant"
      eyebrow={isPro ? "Pro" : `${remaining} questions remaining this week`}
      back={{ to: "/", label: "Today" }}
    >
      <Section>
        <div className="flex gap-3">
          <input
            className={inputClass + " font-sans text-[15px]"}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void ask();
            }}
            placeholder="Ask about your records"
          />
          <Button className="min-h-[44px] text-[14px]" disabled={busy || !q.trim()} onClick={() => void ask()}>
            {busy ? "Asking" : online ? "Ask" : "Queue"}
          </Button>
        </div>
        {!online && (
          <p className="mt-3">
            <Note>Offline. Questions are held on this device and sent when connectivity returns.</Note>
          </p>
        )}
        {!sharing && (
          <p className="mt-3">
            <Note>
              Record sharing is off in Settings, so the assistant receives no records and can only
              say that it has nothing to describe.
            </Note>
          </p>
        )}
        {notice && <p className="mt-3 text-[12px] text-destructive">{notice}</p>}
      </Section>

      {state.aiQueue.length > 0 && (
        <Section title="Queued">
          <ul>
            {state.aiQueue.map((item) => (
              <li key={item.id} className="py-3 hairline-b">
                <p className="eyebrow">
                  {item.status === "failed"
                    ? "Did not send"
                    : item.status === "processing"
                      ? "Sending"
                      : "Waiting for connection"}
                </p>
                <p className="mt-1 text-[14px] leading-relaxed">{item.question}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Queued {formatDateTime(item.created_at)}
                  {item.attempts > 0 ? ` · ${item.attempts} attempt${item.attempts === 1 ? "" : "s"}` : ""}
                  {item.error ? ` · ${item.error}` : ""}
                </p>
                <div className="mt-2 flex gap-4">
                  <button className="text-[12px] underline underline-offset-4" onClick={() => retryQueued(item.id)}>
                    Retry now
                  </button>
                  <button
                    className="text-[12px] text-muted-foreground underline underline-offset-4"
                    onClick={() => removeQueued(item.id)}
                  >
                    Discard
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Conversation">
        {state.aiMessages.length === 0 ? (
          <Note>No questions asked. Try: when did I last use my left thigh, or summarize the last eight weeks.</Note>
        ) : (
          <ul>
            {state.aiMessages.map((m) => (
              <li key={m.id} className="py-3 hairline-b">
                <p className="eyebrow">{m.role === "user" ? "You" : "Assistant"}</p>
                <p className="mt-1 text-[14px] leading-relaxed">
                  {m.role === "assistant" ? <AnswerText text={m.text} refs={m.refs ?? []} /> : m.text}
                </p>
                {(m.refs?.length ?? 0) > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.refs!.map((r) => (
                      <SourceLink key={r.ref} source={r} />
                    ))}
                  </div>
                )}
                {m.sources.length > 0 && (
                  <p className="mt-1 text-[12px] text-muted-foreground">Records used: {m.sources.join(", ")}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section>
        <Note>
          Answers describe your records. The assistant does not prescribe, diagnose, or assess
          medical appropriateness. Questions asked offline queue on this device.
        </Note>
      </Section>
    </Screen>
  );
}

/** Renders an answer with its inline citations as tappable source links. */
function AnswerText({ text, refs }: { text: string; refs: AiMessageSource[] }) {
  const segments = parseAnswer(text, refs as AiSource[]);
  return (
    <>
      {segments.map((seg, i) =>
        seg.type === "text" ? (
          <span key={i}>{seg.text}</span>
        ) : (
          <SourceLink key={i} source={seg.source} inline />
        ),
      )}
    </>
  );
}

function SourceLink({ source, inline }: { source: AiMessageSource; inline?: boolean }) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={source.to as any}
      hash={anchorId(source.recordId)}
      className={
        inline
          ? "mx-[2px] align-baseline text-[11px] text-primary underline underline-offset-4"
          : "border border-hairline px-2 py-1 text-[11px] text-primary"
      }
      title={source.label}
    >
      {inline ? `[${source.ref}]` : `${source.ref} · ${source.label}`}
    </Link>
  );
}
