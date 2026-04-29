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
