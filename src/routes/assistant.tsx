import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/AppShell";
import { Button, Note, Section, inputClass } from "@/components/kit";
import { adherence, compoundName } from "@/lib/domain";
import { useEntitlement } from "@/lib/entitlements";
import { setState, uid, useStore } from "@/lib/store";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "Assistant — Peptide Lens" },
      { name: "description", content: "Ask questions about your own recorded protocols, doses, vials, sites, and symptoms." },
      { property: "og:title", content: "Assistant — Peptide Lens" },
      { property: "og:description", content: "Grounded in your records. It does not recommend doses." },
    ],
  }),
  component: Assistant,
});

const REFUSAL =
  "I cannot recommend a dose or protocol change. Review the instructions you were given or contact a qualified healthcare professional. I can summarize your recorded history for that conversation.";

function answer(q: string, summary: string) {
  const lowered = q.toLowerCase();
  if (/(should i|what dose|increase|decrease|stack|safe|buy|supplier|stop taking|normal)/.test(lowered)) return REFUSAL;
  return summary;
}

function Assistant() {
  const state = useStore((s) => s);
  const { isPro, limits } = useEntitlement();
  const [q, setQ] = useState("");
  const a = adherence(state, 30);
  const summary = `Records available: ${state.doses.length} dose entries, ${state.vials.length} vials, ${state.symptoms.length} symptom entries. Adherence over 30 days: ${a.pct == null ? "not enough records" : a.pct + "%"}. Last entry: ${state.doses[0] ? `${compoundName(state.doses[0].compound_id)} on ${new Date(state.doses[0].logged_at).toLocaleString()}` : "none recorded"}.`;
  const remaining = Math.max(0, limits.aiPerWeek - state.aiUsedThisWeek);

  const ask = () => {
    if (!q.trim()) return;
    if (!isPro && remaining <= 0) return;
    const text = answer(q, summary);
    setState((s) => ({
      ...s,
      aiUsedThisWeek: s.aiUsedThisWeek + 1,
      aiMessages: [
        { id: uid(), role: "assistant", text, sources: ["Dose history", "Vials", "Symptoms"], queued: false, created_at: new Date().toISOString() },
        { id: uid(), role: "user", text: q, sources: [], queued: false, created_at: new Date().toISOString() },
        ...s.aiMessages,
      ],
    }));
    setQ("");
  };

  return (
    <Screen title="Assistant" eyebrow={isPro ? "Pro" : `${remaining} questions remaining this week`} back={{ to: "/", label: "Today" }}>
      <Section>
        <div className="flex gap-3">
          <input className={inputClass + " font-sans text-[15px]"} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about your records" />
          <Button className="min-h-[44px] text-[14px]" onClick={ask}>Ask</Button>
        </div>
      </Section>
      <Section title="Conversation">
        {state.aiMessages.length === 0 ? (
          <Note>No questions asked. Try: when did I last use my left thigh, or summarize the last eight weeks.</Note>
        ) : (
          <ul>
            {state.aiMessages.map((m) => (
              <li key={m.id} className="py-3 hairline-b">
                <p className="eyebrow">{m.role === "user" ? "You" : "Assistant"}</p>
                <p className="mt-1 text-[14px] leading-relaxed">{m.text}</p>
                {m.sources.length > 0 && <p className="mt-1 text-[12px] text-muted-foreground">Records used: {m.sources.join(", ")}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section><Note>Answers describe your records. The assistant does not prescribe, diagnose, or assess medical appropriateness. Summaries queue locally when offline.</Note></Section>
    </Screen>
  );
}
