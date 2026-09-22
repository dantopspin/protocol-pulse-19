import { flushAiQueue, removeQueued, retryQueued, useOnline } from "@/lib/ai-queue";
import { useStore } from "@/lib/store";

/**
 * Global status strip for the offline assistant queue. It only appears when
 * something is waiting or has failed, so it never covers ordinary screens.
 */
export function AiQueueBanner() {
  const online = useOnline();
  const queue = useStore((s) => s.aiQueue);
  if (queue.length === 0) return null;

  const failed = queue.filter((q) => q.status === "failed");
  const waiting = queue.filter((q) => q.status !== "failed");

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-background/95 px-5 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur">
      {waiting.length > 0 && (
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          {online
            ? `${waiting.length} assistant ${waiting.length === 1 ? "question is" : "questions are"} being answered.`
            : `${waiting.length} assistant ${waiting.length === 1 ? "question is" : "questions are"} queued. They send automatically when you are back online.`}
        </p>
      )}
      {failed.map((q) => (
        <div key={q.id} className="mt-2 flex items-center justify-between gap-3">
          <p className="min-w-0 flex-1 truncate text-[12px] text-destructive">
            {q.error ?? "That question did not go through."}
          </p>
          <button
            className="text-[12px] underline underline-offset-4"
            onClick={() => retryQueued(q.id)}
          >
            Retry
          </button>
          <button
            className="text-[12px] text-muted-foreground underline underline-offset-4"
            onClick={() => removeQueued(q.id)}
          >
            Discard
          </button>
        </div>
      ))}
      {online && waiting.length > 0 && (
        <button
          className="mt-2 text-[12px] text-muted-foreground underline underline-offset-4"
          onClick={() => void flushAiQueue()}
        >
          Send now
        </button>
      )}
    </div>
  );
}
