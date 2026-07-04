/**
 * Helpers used by the Gemini extractor pipeline. Pulled out so they can
 * be unit-tested without spinning up the model client.
 */

/**
 * Accept whatever Gemini emits for a timestamp ("01:35", "2026-04-24T01:35+09:00",
 * missing seconds, "Z" instead of offset, …) and return a strict ISO 8601
 * string with seconds and +09:00. Returns null if the input can't be parsed.
 */
export function normalizeIso(
  input: string | null | undefined,
  referenceDate: string,
): string | null {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (!trimmed) return null;

  // Time-only "HH:MM" or "HH:MM:SS" → attach reference date + KST offset.
  const hhmm = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (hhmm) {
    if (!isValidClock(hhmm[1], hhmm[2], hhmm[3])) return null;
    const h = hhmm[1].padStart(2, "0");
    const m = hhmm[2];
    const s = (hhmm[3] ?? "00").padStart(2, "0");
    return `${referenceDate}T${h}:${m}:${s}+09:00`;
  }

  // Offset-less "YYYY-MM-DD(T| )HH:MM(:SS)" — the model wrote KST wall-clock
  // time and just dropped the offset. Attach +09:00 verbatim; running it
  // through Date() would interpret it as UTC and shift the time by 9 hours.
  const wall =
    /^(\d{4}-\d{2}-\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (wall) {
    if (!isValidClock(wall[2], wall[3], wall[4])) return null;
    const h = wall[2].padStart(2, "0");
    const s = (wall[4] ?? "00").padStart(2, "0");
    return `${wall[1]}T${h}:${wall[3]}:${s}+09:00`;
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

function isValidClock(h: string, m: string, s?: string): boolean {
  if (Number(h) > 23 || Number(m) > 59) return false;
  if (s !== undefined && Number(s) > 59) return false;
  return true;
}

// ── Post-extraction sanity pass ──────────────────────────────────────────
// Gemini reads handwriting; these are the plausibility guards for the ways
// it misreads. One bad entry must degrade to a dropped/nulled field — never
// fail the whole photo.

const MAX_VOLUME_ML = 500; // matches the prompt's 양(ml) contract
const MAX_FEED_DURATION_MS = 3 * 60 * 60 * 1000;
const MAX_SLEEP_DURATION_MS = 16 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

type SanitizeFeed = {
  start_at: string | null;
  end_at: string | null;
  volume_ml: number | null;
  feed_type: "breast_direct" | "breast_pumped" | "formula" | null;
  notes: string | null;
};
type SanitizeEvent = {
  event_type: "diaper_pee" | "diaper_poop" | "sleep" | "note";
  at: string | null;
  end_at: string | null;
  details: Record<string, unknown> | null;
};

export function sanitizeExtract<F extends SanitizeFeed, E extends SanitizeEvent>(
  rawFeeds: F[],
  rawEvents: E[],
  referenceDate: string,
): {
  feeds: Array<F & { start_at: string }>;
  events: Array<E & { at: string }>;
  dropped: number;
} {
  // A 3-block LAYOUT A sheet legitimately runs up to reference_date + 2
  // days, so only dates further out than +3 days are treated as misread
  // (wrong year / wrong month) and re-anchored to the reference day.
  const futureCutoff =
    new Date(`${referenceDate}T23:59:59+09:00`).getTime() + 3 * DAY_MS;

  const reanchor = (iso: string): string => {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t) || t <= futureCutoff) return iso;
    return `${referenceDate}${iso.slice(10)}`;
  };

  let dropped = 0;
  const feeds: Array<F & { start_at: string }> = [];
  for (const f of rawFeeds) {
    // A single unreadable timestamp drops that entry, not the whole batch.
    if (!f.start_at) {
      dropped++;
      continue;
    }
    const start_at = reanchor(f.start_at);
    let end_at = f.end_at ? reanchor(f.end_at) : null;
    let volume_ml = f.volume_ml;
    let notes = f.notes;

    if (volume_ml !== null && (volume_ml < 1 || volume_ml > MAX_VOLUME_ML)) {
      const flag = `양(ml) 확인 필요: 원본 판독값 ${volume_ml}`;
      notes = notes ? `${notes} · ${flag}` : flag;
      volume_ml = null;
    }

    if (end_at) {
      const start = new Date(start_at).getTime();
      let end = new Date(end_at).getTime();
      if (end <= start) {
        // Assume the entry crossed midnight (e.g. 23:40 → 00:20).
        end += DAY_MS;
        end_at = shiftToKstString(end);
      }
      if (end - start > MAX_FEED_DURATION_MS) {
        end_at = null; // no feed lasts hours — misread duration
      }
    }

    feeds.push({ ...f, start_at, end_at, volume_ml, notes });
  }

  const events: Array<E & { at: string }> = [];
  for (const e of rawEvents) {
    if (!e.at) {
      dropped++;
      continue;
    }
    const at = reanchor(e.at);
    let end_at = e.end_at ? reanchor(e.end_at) : null;

    if (end_at) {
      const start = new Date(at).getTime();
      let end = new Date(end_at).getTime();
      if (end <= start) {
        end += DAY_MS;
        end_at = shiftToKstString(end);
      }
      const maxMs =
        e.event_type === "sleep" ? MAX_SLEEP_DURATION_MS : MAX_FEED_DURATION_MS;
      if (end - start > maxMs) end_at = null;
    }

    events.push({ ...e, at, end_at });
  }

  // Identical feeds are NOT deduped: two direct breastfeeds in the same
  // hour cell legitimately produce identical rows (hour:00, null volume).
  // Diaper events are legitimately repeated too (1 event per mark) — only
  // identical note/sleep payloads are deduped (double-emitted column pass).
  const seenEvents = new Map<string, number>();
  const uniqueEvents = events.filter((e) => {
    if (e.event_type === "diaper_pee" || e.event_type === "diaper_poop") return true;
    const key = `${e.event_type}|${e.at}|${e.end_at}|${JSON.stringify(e.details)}`;
    const n = (seenEvents.get(key) ?? 0) + 1;
    seenEvents.set(key, n);
    return n === 1;
  });

  return { feeds, events: uniqueEvents, dropped };
}

function shiftToKstString(epochMs: number): string {
  const kst = new Date(epochMs + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const mo = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const da = String(kst.getUTCDate()).padStart(2, "0");
  const hh = String(kst.getUTCHours()).padStart(2, "0");
  const mm = String(kst.getUTCMinutes()).padStart(2, "0");
  const ss = String(kst.getUTCSeconds()).padStart(2, "0");
  return `${y}-${mo}-${da}T${hh}:${mm}:${ss}+09:00`;
}

/**
 * Try to parse `s` as JSON; if it parses to an object, return it. Otherwise
 * wrap the original string under `{ raw }` so callers always get an object.
 */
export function safeJsonParse(s: string): Record<string, unknown> {
  try {
    const v = JSON.parse(s);
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return v as Record<string, unknown>;
    }
    return { raw: s };
  } catch {
    return { raw: s };
  }
}

/**
 * Match the subset of error strings we treat as transient and worth retrying.
 * Covers HTTP 408/429/5xx, Google-specific `UNAVAILABLE` /
 * `RESOURCE_EXHAUSTED`, plus the SDK-side truncation signatures we see when
 * a streamed JSON response gets cut off ("Incomplete JSON segment at the
 * end", "Unterminated string", "MAX_TOKENS").
 */
export function isTransientError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  if (
    /\b(408|429|500|502|503|504|522|523|524|UNAVAILABLE|overloaded|high demand|RESOURCE_EXHAUSTED)\b/i.test(
      msg,
    )
  ) {
    return true;
  }
  return /(Incomplete JSON|Unterminated string|MAX_TOKENS|truncated)/i.test(msg);
}
