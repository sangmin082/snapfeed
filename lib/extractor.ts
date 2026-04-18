import { GoogleGenAI, Type } from "@google/genai";
import { ExtractResult } from "./schema";

const MODEL = "gemini-2.5-flash";

const SYSTEM = `You are shown a photograph of a handwritten Korean baby feeding log (수유 기록).
Transcribe every entry and return strict JSON only. No prose, no markdown fences.

Rules:
- Use the provided reference_date (Asia/Seoul). Times without a date use that date.
  Output ISO 8601 with +09:00 offset.
- Korean term mapping:
  • 모유직수 / 직수 → feed_type "breast_direct"
  • 유축 / 짜둔 / 짠 모유 → "breast_pumped"
  • 분유 / 포뮬러 → "formula"
  • 대변 / 응가 → event_type "diaper_poop"
  • 소변 / 쉬 / 오줌 → "diaper_pee"
  • 수면 / 잠 / 꿈 → "sleep" (pair start+end when both given)
  • 다른 자유 메모 → "note"
- Use null for unclear or missing fields. Never invent numbers.
- Keep free-text observations in notes/details verbatim.
- Also return a "transcript" field: your best plain-text transcription of the log, line-by-line.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    transcript: { type: Type.STRING },
    feeds: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          start_at: { type: Type.STRING },
          end_at: { type: Type.STRING, nullable: true },
          volume_ml: { type: Type.INTEGER, nullable: true },
          feed_type: {
            type: Type.STRING,
            enum: ["breast_direct", "breast_pumped", "formula"],
            nullable: true,
          },
          notes: { type: Type.STRING, nullable: true },
        },
        required: ["start_at", "end_at", "volume_ml", "feed_type", "notes"],
        propertyOrdering: ["start_at", "end_at", "volume_ml", "feed_type", "notes"],
      },
    },
    events: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          event_type: {
            type: Type.STRING,
            enum: ["diaper_pee", "diaper_poop", "sleep", "note"],
          },
          at: { type: Type.STRING },
          end_at: { type: Type.STRING, nullable: true },
          details: { type: Type.STRING, nullable: true }, // flattened to string, parsed client-side if JSON
        },
        required: ["event_type", "at", "end_at", "details"],
        propertyOrdering: ["event_type", "at", "end_at", "details"],
      },
    },
  },
  required: ["transcript", "feeds", "events"],
  propertyOrdering: ["transcript", "feeds", "events"],
};

type GeminiShape = {
  transcript: string;
  feeds: Array<{
    start_at: string;
    end_at: string | null;
    volume_ml: number | null;
    feed_type: "breast_direct" | "breast_pumped" | "formula" | null;
    notes: string | null;
  }>;
  events: Array<{
    event_type: "diaper_pee" | "diaper_poop" | "sleep" | "note";
    at: string;
    end_at: string | null;
    details: string | null;
  }>;
};

export type ExtractBundle = { transcript: string } & ExtractResult;

export async function extractFromImage(
  imageBytes: Uint8Array,
  mimeType: string,
  referenceDate: string,
): Promise<ExtractBundle> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");
  const ai = new GoogleGenAI({ apiKey });

  // Chunked base64 to avoid blowing the stack on large images.
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < imageBytes.length; i += chunk) {
    bin += String.fromCharCode.apply(
      null,
      Array.from(imageBytes.subarray(i, i + chunk)),
    );
  }
  const imageB64 = btoa(bin);

  const userText = `reference_date: ${referenceDate}`;

  const res = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: imageB64 } },
          { text: userText },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0,
    },
  });

  const raw = res.text?.trim() ?? "";
  if (!raw) throw new Error("Gemini returned empty response");
  const parsed = JSON.parse(raw) as GeminiShape;

  const events = parsed.events.map((e) => ({
    event_type: e.event_type,
    at: e.at,
    end_at: e.end_at,
    details: e.details ? safeJsonParse(e.details) : null,
  }));

  const bundle: ExtractBundle = {
    transcript: parsed.transcript ?? "",
    feeds: parsed.feeds,
    events,
  };
  ExtractResult.parse({ feeds: bundle.feeds, events: bundle.events });
  return bundle;
}

function safeJsonParse(s: string): Record<string, unknown> {
  try {
    const v = JSON.parse(s);
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
    return { raw: s };
  } catch {
    return { raw: s };
  }
}
