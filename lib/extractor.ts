import { GoogleGenAI, Type } from "@google/genai";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ExtractResult } from "./schema";

const MODEL_CHAIN = ["gemini-2.5-flash-lite", "gemini-2.5-flash"] as const;
const RETRIES_PER_MODEL = 1;

const SYSTEM = `You are shown a photograph of a handwritten Korean baby feeding log (수유 기록).
Extract every entry and return strict JSON only. No prose, no markdown fences.

Detect the chart date FIRST, before reading the rows:
- Chart sheets carry a date label per day. Look for any of:
  "날짜", "Date", "_년 _월 _일", "YYYY/MM/DD", "MM/DD",
  "M월 D일", a weekday next to a number (e.g. "23(목)").
- If a single A4 contains multiple days (commonly 2–3 days per
  printable chart), each day block has its OWN date label —
  associate each row with the date of the block it sits in.
- Use the detected date for that block's start_at / at fields.
- Year handling:
    • If only month+day are written (e.g. "4/22"), use the year
      from reference_date.
    • If month+day are missing but a year is, still combine with
      reference_date's month+day (rare).
- ONLY when no date can be read from the photo at all, fall back
  to reference_date for every row.

Common table layout (신생아 양육표 / newborn record chart):
- Leftmost column is an hour label: 0AM..11AM, 12PM..11PM. These label
  the hour of that row, NOT minute values. Map them as:
    0AM → 00, 1AM..11AM → 01..11, 12PM → 12, 1PM..11PM → 13..23.
- Under "섭취" there are sub-columns:
    • "시간(분)" = the MINUTES part of the clock time when the feed
      actually happened (0–59). This is the minute-of-hour, NOT a
      duration. It combines with the row's hour label to form the
      real feed time. E.g. row "1AM" with 시간(분)="35" → 01:35.
      If this cell is empty, the feed time is the hour itself
      (:00).
    • "형태" = feed type (모유직수/유축/분유 등).
    • "양(ml)" = volume in milliliters.
- Under "배설": "소변" / "대변" / "구토" columns hold COUNTS written
  as Korean tally marks (바를 정자 / 正 character system):
    • Individual strokes accumulate: 1 stroke(一)=1, 2(二 or 丁)=2,
      3(三 or 下)=3, 4(正 without the last stroke)=4, complete
      正=5.
    • A single horizontal bar "ㅡ" or "一" drawn alone is a
      shorthand for ONE COMPLETED 正 = 5 events.
    • Sum the strokes / complete 正 characters in the cell to get
      the total count N for that hour row.
    • Emit N separate events with the matching event_type at the
      row's hour (minute=0) and end_at=null. Example: 3AM row with
      소변="ㅡㅡ" → 10 diaper_pee events at 03:00.
- "기타" column holds free-text notes for the row.

Derive fields:
- start_at = (detected chart date for this row's day-block, falling
  back to reference_date) + row hour + 시간(분) minutes (minute=0
  when 시간(분) is empty). Output ISO 8601 with +09:00 offset, e.g.
  "2026-04-22T01:35:00+09:00".
- ALWAYS output the full date+time form when you have a detected
  date. Do not output bare "HH:MM".
- end_at = null. This template does NOT track feeding duration —
  never invent one.
- volume_ml = number from "양(ml)" column, else null.
- feed_type from "형태" per the mapping below.
- If multiple feeds share the same hour row, emit them as separate
  entries (read left-to-right / top-to-bottom within the cell).

Korean term mapping:
- 모유직수 / 직수 → feed_type "breast_direct"
- 유축 / 짜둔 / 짠 모유 → "breast_pumped"
- 분유 / 포뮬러 → "formula"
- 대변 / 응가 → event_type "diaper_poop"
- 소변 / 쉬 / 오줌 → "diaper_pee"
- 수면 / 잠 / 꿈 → "sleep" (pair start+end when both given)
- 다른 자유 메모 → "note"

Feed type default: when a row shows a volume (e.g. "80ml", "60") but
the type is not explicitly 모유/직수/유축/짠젖, treat it as "formula".
Only classify as breast_direct / breast_pumped when the record clearly
says so. When truly ambiguous, prefer "formula" over guessing breast.

Use null for unclear or missing numeric fields. Never invent numbers.
Keep free-text observations in notes/details verbatim.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
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
  required: ["feeds", "events"],
  propertyOrdering: ["feeds", "events"],
};

type GeminiShape = {
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
  const cfEnv = getCloudflareContext().env as unknown as Record<string, string | undefined>;
  const apiKey = cfEnv.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;
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

  const raw = await callWithFallback(ai, imageB64, mimeType, userText);
  const parsed = JSON.parse(raw) as GeminiShape;

  const feeds = parsed.feeds.map((f) => ({
    ...f,
    start_at: normalizeIso(f.start_at, referenceDate)!,
    end_at: normalizeIso(f.end_at, referenceDate),
  }));
  const events = parsed.events.map((e) => ({
    event_type: e.event_type,
    at: normalizeIso(e.at, referenceDate)!,
    end_at: normalizeIso(e.end_at, referenceDate),
    details: e.details ? safeJsonParse(e.details) : null,
  }));

  const bundle: ExtractBundle = {
    transcript: "",
    feeds,
    events,
  };
  ExtractResult.parse({ feeds: bundle.feeds, events: bundle.events });
  return bundle;
}

// Accept what Gemini actually emits (e.g. "01:35", "2026-04-24T01:35+09:00",
// missing seconds, "Z" instead of offset) and return a strict ISO 8601 string
// with seconds and +09:00. Returns null if the input can't be parsed.
function normalizeIso(input: string | null | undefined, referenceDate: string): string | null {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (!trimmed) return null;

  // Time-only "HH:MM" or "HH:MM:SS" → attach reference date + KST offset.
  const hhmm = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (hhmm) {
    const h = hhmm[1].padStart(2, "0");
    const m = hhmm[2];
    const s = (hhmm[3] ?? "00").padStart(2, "0");
    return `${referenceDate}T${h}:${m}:${s}+09:00`;
  }

  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;

  // Reformat as KST (+09:00) with full HH:MM:SS.
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const mo = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const da = String(kst.getUTCDate()).padStart(2, "0");
  const hh = String(kst.getUTCHours()).padStart(2, "0");
  const mm = String(kst.getUTCMinutes()).padStart(2, "0");
  const ss = String(kst.getUTCSeconds()).padStart(2, "0");
  return `${y}-${mo}-${da}T${hh}:${mm}:${ss}+09:00`;
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

function isTransientError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /\b(408|429|500|502|503|504|522|523|524|UNAVAILABLE|overloaded|high demand|RESOURCE_EXHAUSTED)\b/i.test(msg);
}

async function callWithFallback(
  ai: GoogleGenAI,
  imageB64: string,
  mimeType: string,
  userText: string,
): Promise<string> {
  let lastErr: unknown;
  for (const model of MODEL_CHAIN) {
    for (let attempt = 0; attempt <= RETRIES_PER_MODEL; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model,
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
            thinkingConfig: { thinkingBudget: 0 },
          },
        });
        const text = res.text?.trim() ?? "";
        if (!text) throw new Error(`${model}: empty response`);
        return text;
      } catch (err) {
        lastErr = err;
        if (!isTransientError(err)) throw err;
        if (attempt < RETRIES_PER_MODEL) {
          await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
        }
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
