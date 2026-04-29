import { GoogleGenAI, Type } from "@google/genai";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ExtractResult } from "./schema";
import { isTransientError, normalizeIso, safeJsonParse } from "./extractor-helpers";

const MODEL_CHAIN = ["gemini-2.5-flash-lite"] as const;
const RETRIES_PER_MODEL = 0;
const PER_CALL_TIMEOUT_MS = 22_000;

function looksLikeCompleteJson(s: string): boolean {
  const trimmed = s.trim();
  if (!trimmed) return false;
  return trimmed.endsWith("}") || trimmed.endsWith("]");
}

// Streaming model chain: try the smarter (thinking) model first, fall back
// to the lite model when Gemini Flash is overloaded ("This model is currently
// experiencing high demand", 503 UNAVAILABLE, etc).
type StreamAttempt = {
  model: string;
  thinking: boolean;
  retriesOnTransient: number;
};
const STREAM_MODEL_CHAIN: readonly StreamAttempt[] = [
  { model: "gemini-2.5-flash", thinking: true, retriesOnTransient: 1 },
  { model: "gemini-2.5-flash-lite", thinking: false, retriesOnTransient: 1 },
] as const;
const STREAM_OVERALL_TIMEOUT_MS = 150_000;
const STREAM_RETRY_BACKOFF_MS = 1500;

const SYSTEM = `You are shown a photograph of a handwritten Korean baby care
record (수유 / 배변 / 수면 일지). Extract every entry and return
strict JSON only. No prose, no fences.

The page may use one of two common formats. Decide which applies,
then follow that section's rules.

────────────────────────────────────────────────────────
FORMAT IDENTIFICATION (do this FIRST)
────────────────────────────────────────────────────────
- LAYOUT A — "신생아 양육표": printable A4 chart with up to three
  day-blocks side-by-side. Hour rows labelled 0AM..11AM, 12PM..11PM.
  Sheet header has "이름:" and "수유방법:". Per-row columns:
  섭취 (시간(분)/형태/양(ml)) | 배설 (소변/대변/구토) | 기타.
  Day-level footer with 기타기록 / 체중 / 체온 / 수유총량.
- LAYOUT B — "DAY+N 일일 다이어리": tall single-day spiral-notebook
  planner. Header reads "____ 년 ____ 월 ____ 일 ____요일 [DAY+ ___]".
  Hour rows labelled "1시..12시" split into 오전 / 오후 sections.
  Columns: 시간 | 모유(분) | 분유(ml) | 유축(ml) | 소변 | 대변 |
  수면 | 이유식(양,종류) | 기타.

Tie-breakers: presence of "0AM..11PM" labels → LAYOUT A. Presence
of "오전/오후" section headers and a "DAY+" header → LAYOUT B.
Use only the rules of the chosen layout.

════════════════════════════════════════════════════════
LAYOUT A — 신생아 양육표
════════════════════════════════════════════════════════

────────────────────────────────────────────────────────
SHEET LAYOUT (memorize this; the photo will look like it)
────────────────────────────────────────────────────────
The standard form is one A4 page split into THREE day-blocks
arranged side-by-side (left → middle → right). Each block has:

(1) Sheet-level header at the very top (shared across all 3 blocks):
    • "이름:" (baby name) — IGNORE for extraction.
    • "수유방법:" (default feeding method, e.g. "직수", "분유",
      "혼합", "유축") — use this as the DEFAULT feed_type when a
      row shows volume but no explicit "형태" cell value (see
      "Feed type default" below).

(2) Per-block date header: a row reading
       "___ 년 ___ 월 ___ 일"
    Users write any subset, e.g. "2026 년 4 월 22 일", "4 월 22",
    "22 일", "4/22", or attach a weekday "22(화)". Treat all of
    these as the date for THAT block. Year defaults to
    reference_date's year when omitted.

(3) Per-block table header (two rows):
       시간 | 섭취 (시간(분) / 형태 / 양(ml)) | 배설 (소변 / 대변 /
             구토) | 기타
    The "기타" column here is PER-ROW (per-hour) and is a
    different field from the day-level footer "기타기록 / 비고"
    described in (5) below — do not merge them.

(4) 24 body rows: 0AM, 1AM, …, 11AM, 12PM, 1PM, …, 11PM.
    Hour mapping:
       0AM → 00, 1AM..11AM → 01..11, 12PM → 12, 1PM..11PM → 13..23.

(5) Per-block footer rows BELOW the 24-hour table:
       "기타기록"  |  "비고"
       "체중"      |  <value>
       "체온"      |  <value>
       "수유총량"  |  <value>
       (one extra blank row sometimes)
    These are DAY-LEVEL — emit them with at = that block's date
    at 12:00 (noon) so they sort in the middle of the day:
       • 기타기록 / 비고 (any free text) → ONE note per non-empty
         cell, details = verbatim text.
       • 체중 (weight) → note, details = "체중 <value>" verbatim
         (e.g. "체중 4.2kg").
       • 체온 (temperature) → note, details = "체온 <value>"
         verbatim. If multiple readings are written, emit each
         separately and try to anchor at the recorded time; if
         only the day-level cell, use 12:00.
       • 수유총량 (daily feeding total in ml) → note,
         details = "수유총량 <value>". Do NOT try to back-fill
         per-feed volumes from this — it is a summary.

If only ONE day block is visible (cropped photo), still process it
the same way. If a block is fully blank, skip it.

────────────────────────────────────────────────────────
DATE DETECTION (do this FIRST, before reading any row)
────────────────────────────────────────────────────────
- Read each block's date header. Each block can be a different
  day; associate every row/footer entry with its own block's date.
- Year handling:
    • Year omitted ("4 월 22") → use reference_date's year.
    • Month omitted but day present and another block has a full
      date → assume contiguous days when adjacent blocks form a
      sequence; otherwise fall back to reference_date.
- Only when NO date can be read on a block at all, fall back to
  reference_date for that block.
- ALWAYS output the full date+time ISO form when you have a date.
  Never output bare "HH:MM".

────────────────────────────────────────────────────────
PER-ROW EXTRACTION (the 24-hour table)
────────────────────────────────────────────────────────
Under "섭취":
- "시간(분)" = the MINUTE part (0–59) of the actual feed time.
  Combine with the row's hour: row "1AM" with 시간(분)="35" →
  01:35. Empty cell → :00.
- "형태" = feed type. Map (case/spacing-insensitive):
       모유직수 / 직수 / 모유            → "breast_direct"
       유축 / 짜둔 / 짠 모유 / 짠젖      → "breast_pumped"
       분유 / 포뮬러 / 우유              → "formula"
- "양(ml)" = integer ml. Strip "ml" suffix. Empty → null.
- Multiple feeds in the same hour cell → separate feed entries.

Under "배설" — three columns side by side: "소변" | "대변" | "구토".
You MUST extract events from EVERY non-empty cell in these columns.
Never treat them as plain notes; they are categorical events.

Mark counting — each visible MARK in the cell = 1 event.
This chart's users do NOT use the 바를 정자 system to encode a count
of 5. They just draw whatever symbol feels natural — a single line,
a check, a circle. Treat every mark as one occurrence.

- "ㅡ" / "一" / "—" / a single bar = 1 event.
- "正" (any state, partial or complete) = 1 event. Do NOT expand
  it into 5 events.
- "✓" / "v" / "✔" / "체크" = 1 event each.
- "○" / "O" / "동그라미" = 1 event each.
- "✗" / "X" / "x" = 1 event each.
- Dot, slash, scribble, or any ambiguous mark = 1 event.
- Multiple separate marks in one cell = sum them.
  Example: 소변="ㅡㅡ" → 2 events.
  Example: 소변="✓✓✓" → 3 events.
  Example: 소변="正" → 1 event (NOT 5).
  Example: 소변="正正" → 2 events.
- Empty cell → 0 events.

Emission rules — apply per cell, per column:
- "소변" cell → emit event_type "diaper_pee" × N at row hour:00.
- "대변" cell → emit event_type "diaper_poop" × N at row hour:00.
- "구토" cell → emit event_type "note" × N at row hour:00 with
  details = '{"kind":"vomit","raw":"구토"}'. Use the literal word
  "구토" for raw (NOT the cell mark) so the UI can render it
  as the 구토 category. This is the only way 구토 reaches the
  schema since there is no vomit enum.

Do NOT collapse multiple columns into a single note. If a row has
both 소변 and 대변 marked, you emit BOTH diaper_pee events AND
diaper_poop events — separately.

Per-row "기타" column (free-text notes anchored to that hour):
- Common contents:
    Supplements: 유산균, 비타민 D / 비타민D / vit D, 비타민 C /
                 비타민C, 철분, DHA, 영양제.
    Care/health: 약, 해열제, 체온 37.6, 트림, 구토, 황달, 목욕.
    Sleep:       수면 / 잠 / 꿈 (with start–end when given) →
                 event_type "sleep" instead of "note" if BOTH a
                 start and end are clearly written; otherwise note.
    Behavior:    보챔, 잘 잠, 안 잠, 혀짧음 등.
- Every non-empty per-row 기타 cell becomes ONE note event at
  that row's hour (minute=0), details = verbatim text. Do NOT
  skip a row that has only a note.

────────────────────────────────────────────────────────
DERIVED FIELDS — what to put on each output entry
────────────────────────────────────────────────────────
- start_at / at = block's detected date (or reference_date) + row
  hour + 시간(분). ISO 8601 with +09:00, e.g.
  "2026-04-22T01:35:00+09:00".
- end_at = null in almost every case. This template does NOT
  record feeding duration; never invent one. The only exception
  is when the writer explicitly noted both a sleep start and a
  sleep end in the 기타 cell — then emit a sleep event with
  end_at filled.
- volume_ml = integer from "양(ml)", else null.
- feed_type from "형태" using the mapping above.
- If multiple entries share an hour cell, emit each separately
  (left-to-right, top-to-bottom within the cell).

Feed type default (when the row shows a volume but no explicit
"형태"):
- Use the sheet header "수유방법:" if present and unambiguous.
  "직수" → breast_direct; "유축" → breast_pumped; "분유" →
  formula; "혼합" or two methods listed → formula (safer
  default).
- If "수유방법" is missing, default to "formula".
- Only classify as breast_direct / breast_pumped when the row
  itself, or the sheet header, says so unambiguously.

Use null for unclear/missing numerics — never invent numbers.
Keep free-text observations in notes/details verbatim.

════════════════════════════════════════════════════════
LAYOUT B — DAY+N 일일 다이어리
════════════════════════════════════════════════════════

────────────────────────────────────────────────────────
DATE DETECTION
────────────────────────────────────────────────────────
- Parse the header "____ 년 ____ 월 ____ 일 _____요일 [DAY+ ___]".
  Year omitted → use reference_date's year.
- If the page is a notebook spread with multiple day blocks side-
  by-side (each with its own DATE / DAY+N header), advance the
  date along the visible DAY+N delta or DATE label and emit each
  block's entries against its own date. If a block's date is
  ambiguous, extract only the leftmost block.

────────────────────────────────────────────────────────
HOUR MAPPING
────────────────────────────────────────────────────────
Rows list "1시..12시" inside 오전 / 오후 sections. Map to 24h:
  오전 12시 → 00      오전 1시..11시 → 01..11
  오후 12시 → 12      오후 1시..11시 → 13..23

────────────────────────────────────────────────────────
PER-COLUMN EXTRACTION
────────────────────────────────────────────────────────
"모유(분)" — DURATION IN MINUTES of breastfeeding (NOT a clock minute).
  Examples and how to read them:
    "20분"          → 20 min total
    "30분 R15 L15"  → 30 min total (R/L = right/left breast minutes)
    "R15 L20"       → 35 min (sum of R+L)
    bare "분"       → empty / no feed
  When a duration is present, emit a feed:
    feed_type = "breast_direct"
    start_at  = row hour:00
    end_at    = start_at + total_minutes
    volume_ml = null
    notes     = R/L split verbatim if present (e.g. "R15 L15")

"분유(ml)" — formula volume in mL. Non-empty → emit:
    feed_type = "formula", start_at = row hour:00,
    volume_ml = number, end_at = null.

"유축(ml)" — pumped breast milk volume in mL. Non-empty → emit:
    feed_type = "breast_pumped", start_at = row hour:00,
    volume_ml = number, end_at = null.

"소변" / "대변" — these columns are CATEGORICAL events. Cells in
this layout hold checkmarks (✓ / v / ○ / dot / slash). EVERY non-
empty cell in these columns MUST become at least one diaper event;
never demote them to "note".
- Count the marks in the cell. If you can't count clearly, default
  to count = 1 (a non-empty cell never produces 0 events).
- Emit one event per mark:
    event_type = "diaper_pee" (소변) or "diaper_poop" (대변)
    at         = row hour:00, end_at = null
- If a row has marks in BOTH columns, emit BOTH categories — never
  merge them into one event.

"구토" — vomit column. Emit one note per mark at row hour:00 with
    event_type = "note"
    details    = '{"kind":"vomit","raw":"구토"}'
Use the literal word "구토" for raw so the UI can render it as
the 구토 category. This is the ONLY way 구토 reaches the schema
since there is no vomit enum.

"수면" — vertical arrow ↕ spans across multiple hour rows with a
duration label nearby (e.g. "2시간", "1시간 30분", "2시간뜸").
For each arrow span, emit ONE sleep event:
    event_type = "sleep"
    at         = top-of-arrow hour:00
    end_at     = at + parsed duration
If the arrow has no label, infer duration from the row span
(1 row = 1 hour). If truly ambiguous, skip.

"이유식(양,종류)" — solid-food entries (e.g. "120g 호박죽"). The
schema has no solid-food feed type — emit as a note event:
    event_type = "note"
    at         = row hour:00, end_at = null
    details    = JSON-encoded string
                 '{"kind":"solid_food","raw":"<cell text verbatim>"}'

"기타" — free-text notes for that hour. Emit as a note event:
    event_type = "note"
    at         = row hour:00, end_at = null
    details    = JSON-encoded string '{"raw":"<text verbatim>"}'

────────────────────────────────────────────────────────
DERIVED FIELDS — LAYOUT B
────────────────────────────────────────────────────────
- start_at / at = block's detected date (or reference_date) + row
  hour. ISO 8601 with +09:00 offset, e.g.
  "2026-04-22T05:00:00+09:00".
- end_at is null EXCEPT for "모유(분)" feeds (use duration) and
  sleep events (use duration).
- volume_ml comes only from 분유(ml) / 유축(ml) cells. Strip "ml".
- Use null for unclear/missing numerics — never invent numbers.
- Keep free-text observations in notes/details verbatim.`;

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

export type ExtractEvent =
  | { type: "status"; text: string }
  | { type: "thought"; text: string }
  | { type: "result"; bundle: ExtractBundle }
  | { type: "error"; message: string };

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

export async function* extractFromImageStream(
  imageBytes: Uint8Array,
  mimeType: string,
  referenceDate: string,
): AsyncGenerator<ExtractEvent, void, unknown> {
  const cfEnv = getCloudflareContext().env as unknown as Record<string, string | undefined>;
  const apiKey = cfEnv.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    yield { type: "error", message: "GEMINI_API_KEY missing" };
    return;
  }

  yield { type: "status", text: "사진 분석 시작" };

  const ai = new GoogleGenAI({ apiKey });

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

  const overallDeadline = Date.now() + STREAM_OVERALL_TIMEOUT_MS;
  let acc = "";
  let lastErr: unknown = null;
  let succeeded = false;

  outer: for (const [attemptIdx, attempt] of STREAM_MODEL_CHAIN.entries()) {
    for (let retry = 0; retry <= attempt.retriesOnTransient; retry++) {
      if (Date.now() > overallDeadline) break outer;

      const isRetry = attemptIdx > 0 || retry > 0;
      yield {
        type: "status",
        text: isRetry
          ? `${attempt.model} 호출 중${retry > 0 ? ` (재시도 ${retry})` : " (대체 모델)"}`
          : "Gemini 호출 중",
      };

      acc = "";
      try {
        const stream = await ai.models.generateContentStream({
          model: attempt.model,
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
            // A single dense chart can produce 30+ events × ~100 tokens
            // each. Default cap (~8K) was getting hit and the JSON ended
            // up truncated mid-token, producing "Incomplete JSON segment".
            maxOutputTokens: attempt.thinking ? 32_768 : 16_384,
            thinkingConfig: attempt.thinking
              ? { thinkingBudget: -1, includeThoughts: true }
              : { thinkingBudget: 0 },
          },
        });

        let truncated = false;
        for await (const part of stream) {
          if (Date.now() > overallDeadline) {
            yield { type: "error", message: "전체 시간 초과 (150초)" };
            return;
          }
          const candidate = part.candidates?.[0];
          if (candidate?.finishReason === "MAX_TOKENS") {
            truncated = true;
          }
          const parts = candidate?.content?.parts ?? [];
          for (const p of parts) {
            const text = (p as { text?: string }).text;
            const isThought = (p as { thought?: boolean }).thought === true;
            if (!text) continue;
            if (isThought) {
              yield { type: "thought", text };
            } else {
              acc += text;
            }
          }
        }

        // Treat output-cap truncation and unparseable JSON as transient
        // so the next attempt (lite model with no thinking budget) gets
        // a shot at a complete response.
        if (truncated || !looksLikeCompleteJson(acc)) {
          throw new Error(
            `Incomplete JSON from ${attempt.model}${truncated ? " (MAX_TOKENS)" : ""} — UNAVAILABLE`,
          );
        }

        succeeded = true;
        lastErr = null;
        break outer;
      } catch (err) {
        lastErr = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (!isTransientError(err)) {
          // Non-transient — surface immediately, don't try fallback.
          yield { type: "error", message: msg };
          return;
        }
        // Transient — let the loop fall through to the next retry / model.
        if (retry < attempt.retriesOnTransient) {
          await new Promise((r) =>
            setTimeout(r, STREAM_RETRY_BACKOFF_MS * (retry + 1)),
          );
        }
      }
    }
  }

  if (!succeeded) {
    const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
    yield {
      type: "error",
      message: `Gemini 모두 실패 (마지막 오류: ${msg.slice(0, 200)})`,
    };
    return;
  }

  yield { type: "status", text: "결과 정리 중" };

  let parsed: GeminiShape;
  try {
    parsed = JSON.parse(acc) as GeminiShape;
  } catch {
    yield { type: "error", message: `JSON 파싱 실패: ${acc.slice(0, 200)}` };
    return;
  }

  try {
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
    const bundle: ExtractBundle = { transcript: "", feeds, events };
    ExtractResult.parse({ feeds: bundle.feeds, events: bundle.events });
    yield { type: "result", bundle };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    yield { type: "error", message: `검증 실패: ${msg}` };
  }
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
        const res = await withTimeout(
          ai.models.generateContent({
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
          }),
          PER_CALL_TIMEOUT_MS,
          `${model} timed out`,
        );
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

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(label)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}
