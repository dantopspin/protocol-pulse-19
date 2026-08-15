import { createServerFn } from "@tanstack/react-start";

/**
 * Server-side assistant. The API key never reaches the browser; the client
 * sends only the record summary the user has permitted, and the model is
 * instructed to describe those records and refuse dose or protocol advice.
 */

export type AskAiInput = {
  question: string;
  /** Pre-summarised, non-identifying record context assembled on the client. */
  context: string;
  /** Names of the record categories included in `context`. */
  categories: string[];
};

export type AskAiResult =
  | { ok: true; text: string; categories: string[] }
  | { ok: false; error: string };

const SYSTEM = [
  "You are the Peptide Lens assistant.",
  "You describe and summarise ONLY the user's own recorded data, supplied below as RECORDS.",
  "Absolute rules:",
  "- Never recommend, suggest, imply, or calculate a dose, amount, frequency, schedule, compound, stack, or protocol change.",
  "- Never give medical, diagnostic, safety, legal, or sourcing advice, and never assess whether anything is normal, safe, or appropriate.",
  "- If the question asks for any of the above, reply exactly with the REFUSAL text and nothing else.",
  "- Never invent records. If RECORDS does not contain the answer, say the records do not contain it.",
  "- Describe timing relationships as temporal only; never state or imply causation.",
  "- Answer in at most 120 words, plain sentences, no markdown headings.",
].join("\n");

export const REFUSAL_TEXT =
  "I cannot recommend a dose or protocol change. Review the instructions you were given or contact a qualified healthcare professional. I can summarize your recorded history for that conversation.";

export const askAi = createServerFn({ method: "POST" })
  .inputValidator((input: AskAiInput) => {
    const question = String(input?.question ?? "").slice(0, 1000).trim();
    if (!question) throw new Error("A question is required.");
    return {
      question,
      context: String(input?.context ?? "").slice(0, 20000),
      categories: Array.isArray(input?.categories) ? input.categories.slice(0, 20).map(String) : [],
    };
  })
  .handler(async ({ data }): Promise<AskAiResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false, error: "The assistant is not configured in this build." };

    let response: Response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: `${SYSTEM}\n\nREFUSAL: ${REFUSAL_TEXT}` },
            {
              role: "user",
              content: `RECORDS (categories: ${data.categories.join(", ") || "none"}):\n${data.context}\n\nQUESTION: ${data.question}`,
            },
          ],
        }),
      });
    } catch {
      return { ok: false, error: "The assistant could not be reached. Your question stays queued." };
    }

    if (response.status === 429)
      return { ok: false, error: "The assistant is rate limited. Try again shortly." };
    if (response.status === 402)
      return { ok: false, error: "The assistant workspace has no remaining credits." };
    if (!response.ok) return { ok: false, error: `The assistant returned an error (${response.status}).` };

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = payload.choices?.[0]?.message?.content?.trim();
    if (!text) return { ok: false, error: "The assistant returned an empty answer." };
    return { ok: true, text, categories: data.categories };
  });
