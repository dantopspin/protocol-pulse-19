import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  image: z.string().max(6_000_000),
});

export type LabelDetails = {
  compound: string;
  concentration: string;
  totalAmount: string;
  lot: string;
  expiry: string;
  supplier: string;
};

export type LabelResult = { ok: true; details: LabelDetails } | { ok: false; error: string };

export const readVialLabel = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<LabelResult> => {
    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(data.image)) {
      return { ok: false, error: "Choose a JPG, PNG, or WebP photo." };
    }
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, error: "Photo reading is not available right now." };
    try {
      const { extractVialLabel } = await import("./vial-label.server");
      return await extractVialLabel(data.image, key);
    } catch (error) {
      const status = (error as { statusCode?: number; status?: number })?.statusCode ?? (error as { status?: number })?.status;
      const body = (error as { responseBody?: string })?.responseBody;
      let safeMessage = "";
      try {
        const parsed = JSON.parse(body ?? "") as { error?: { message?: string }; message?: string };
        safeMessage = String(parsed.error?.message ?? parsed.message ?? "").slice(0, 300);
      } catch { /* no response body */ }
      if (status === 401) return { ok: false, error: "Photo reading is not configured correctly." };
      if (status === 402 || status === 403) return { ok: false, error: safeMessage || "Photo reading is currently unavailable for this workspace." };
      if (status === 429) return { ok: false, error: safeMessage || "Photo reading is busy. Please try again later." };
      if (status === 400) return { ok: false, error: safeMessage || "This photo could not be read. Try a clearer image." };
      if (status === 404) return { ok: false, error: "Photo reading is currently unavailable." };
      return { ok: false, error: status && status >= 500 ? "Photo reading is temporarily unavailable. Try again later." : "The label could not be read. Try another photo." };
    }
  });