import Anthropic from "@anthropic-ai/sdk";
import { ExtractResult } from "./schema";

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM = `You convert OCR text from a handwritten Korean baby feeding log into a strict JSON object.

Return ONLY valid JSON matching this TypeScript type (no prose, no markdown):

{
  feeds: Array<{
    start_at: string;          // ISO 8601 with timezone
    end_at: string | null;
    volume_ml: number | null;
    feed_type: "breast_direct" | "breast_pumped" | "formula" | null;
    notes: string | null;
  }>;
  events: Array<{
    event_type: "diaper_pee" | "diaper_poop" | "sleep" | "note";
    at: string;                // ISO 8601
    end_at: string | null;
    details: Record<string, unknown> | null;
  }>;
}

Rules:
- Use the provided reference_date (KST, Asia/Seoul) for times that only have clock values. Output ISO strings with +09:00.
- Korean synonyms: 모유직수/직수 → breast_direct; 유축/짜둔 → breast_pumped; 분유 → formula.
- 대변/응가 → diaper_poop; 소변/쉬/오줌 → diaper_pee; 수면/잠 → sleep (pair start+end when both given).
- If a field is unclear or missing, use null. Never invent numbers.
- Keep free-text observations in the notes/details fields verbatim.`;

export async function structureFromOcr(ocrText: string, referenceDate: string): Promise<ExtractResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");
  const client = new Anthropic({ apiKey });

  const user = `reference_date: ${referenceDate}\n\nOCR_TEXT:\n"""\n${ocrText}\n"""`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM,
      messages: [{ role: "user", content: user }],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    const jsonText = text.startsWith("```")
      ? text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "")
      : text;
    try {
      return ExtractResult.parse(JSON.parse(jsonText));
    } catch (err) {
      if (attempt === 1) throw err;
    }
  }
  throw new Error("unreachable");
}
