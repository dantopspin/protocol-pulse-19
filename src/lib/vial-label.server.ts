import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "./ai-gateway/run-id.ts";
import { sdkImage } from "./ai-gateway/media-parts.ts";
import type { LabelResult } from "./vial-label.functions";

const labelSchema = z.object({
  compound: z.string().describe("Visible compound name, or empty string"),
  concentration: z.string().describe("Exactly the concentration or strength as printed, including units, or empty string"),
  totalAmount: z.string().describe("Total amount per vial only if explicitly printed, including mg or mcg; not an inferred amount, otherwise empty string"),
  lot: z.string().describe("Visible batch or lot identifier, or empty string"),
  expiry: z.string().describe("Visible expiry date exactly as printed, or empty string"),
  supplier: z.string().describe("Visible supplier or clinic, or empty string"),
});

export async function extractVialLabel(image: string, key: string): Promise<LabelResult> {
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: key,
    headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    output: Output.object({ schema: labelSchema }),
    messages: [{
      role: "user",
      content: [
        { type: "text", text: "Read ONLY visible text on this peptide vial label. Extract the compound name, printed concentration/strength, total vial amount if separately explicit, lot number, expiry date and supplier. Do not infer, calculate, verify authenticity, identify unprinted information, or provide medical advice. Leave unreadable or missing fields empty. Do not confuse a dose or mg/mL concentration with total vial amount." },
        sdkImage(image),
      ],
    }],
    providerOptions: { openai: {
      forceReasoning: true,
      reasoningEffort: "low",
      reasoningSummary: "auto",
      store: false,
      include: ["reasoning.encrypted_content"],
    } },
  });
  const details = await result.output;
  if (!details || !Object.values(details).some((value) => value.trim())) {
    return { ok: false, error: "No readable label details were found. Try a clearer photo." };
  }
  return { ok: true, details };
}