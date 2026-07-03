import { afterEach, describe, expect, it, vi } from "vitest";
import { REF_DATE, TINY_JPEG } from "./setup";
import { normalizeIso, sanitizeExtract } from "@/lib/extractor-helpers";

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = {
      generateContent: mockGenerateContent,
      generateContentStream: vi.fn(),
    };
  },
  Type: {
    OBJECT: "OBJECT",
    ARRAY: "ARRAY",
    STRING: "STRING",
    INTEGER: "INTEGER",
  },
}));

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({
    env: { GEMINI_API_KEY: "test-key" } as Record<string, string | undefined>,
  }),
}));

import { extractFromImage } from "@/lib/extractor";

function geminiOk(json: unknown) {
  mockGenerateContent.mockResolvedValueOnce({ text: JSON.stringify(json) });
}

afterEach(() => {
  mockGenerateContent.mockReset();
});

const feed = (over: Partial<Record<string, unknown>> = {}) => ({
  start_at: `${REF_DATE}T09:00:00+09:00`,
  end_at: null,
  volume_ml: 120,
  feed_type: "formula" as const,
  notes: null,
  ...over,
});

describe("normalizeIso hardening", () => {
  it("treats an offset-less full datetime as KST wall-clock (no 9h shift)", () => {
    expect(normalizeIso("2026-04-22T01:35:00", REF_DATE)).toBe(
      "2026-04-22T01:35:00+09:00",
    );
    expect(normalizeIso("2026-04-22 14:20", REF_DATE)).toBe(
      "2026-04-22T14:20:00+09:00",
    );
  });

  it("rejects impossible clock readings instead of emitting broken ISO", () => {
    expect(normalizeIso("25:70", REF_DATE)).toBeNull();
    expect(normalizeIso("12:99", REF_DATE)).toBeNull();
    expect(normalizeIso("2026-04-22T25:00", REF_DATE)).toBeNull();
  });
});

describe("sanitizeExtract", () => {
  it("nullifies implausible volumes and keeps the raw reading in notes", () => {
    const { feeds } = sanitizeExtract([feed({ volume_ml: 1200 })], [], REF_DATE);
    expect(feeds[0].volume_ml).toBeNull();
    expect(feeds[0].notes).toContain("1200");
  });

  it("keeps plausible volumes untouched", () => {
    const { feeds } = sanitizeExtract([feed({ volume_ml: 240 })], [], REF_DATE);
    expect(feeds[0].volume_ml).toBe(240);
    expect(feeds[0].notes).toBeNull();
  });

  it("drops entries whose timestamp could not be parsed instead of failing", () => {
    const { feeds, events, dropped } = sanitizeExtract(
      [feed({ start_at: null })],
      [
        {
          event_type: "diaper_pee",
          at: null,
          end_at: null,
          details: null,
        },
        {
          event_type: "diaper_pee",
          at: `${REF_DATE}T10:00:00+09:00`,
          end_at: null,
          details: null,
        },
      ],
      REF_DATE,
    );
    expect(feeds).toHaveLength(0);
    expect(events).toHaveLength(1);
    expect(dropped).toBe(2);
  });

  it("rolls end_at across midnight when it lands before start_at", () => {
    const { feeds } = sanitizeExtract(
      [
        feed({
          start_at: `${REF_DATE}T23:40:00+09:00`,
          end_at: `${REF_DATE}T00:10:00+09:00`,
          feed_type: "breast_direct",
          volume_ml: null,
        }),
      ],
      [],
      REF_DATE,
    );
    expect(feeds[0].end_at).toBe("2026-04-23T00:10:00+09:00");
  });

  it("nulls a feed end_at implying a multi-hour feed", () => {
    const { feeds } = sanitizeExtract(
      [
        feed({
          start_at: `${REF_DATE}T09:00:00+09:00`,
          end_at: `${REF_DATE}T17:00:00+09:00`,
        }),
      ],
      [],
      REF_DATE,
    );
    expect(feeds[0].end_at).toBeNull();
  });

  it("keeps a long sleep span but nulls an impossible one", () => {
    const { events } = sanitizeExtract(
      [],
      [
        {
          event_type: "sleep",
          at: `${REF_DATE}T13:00:00+09:00`,
          end_at: `${REF_DATE}T15:00:00+09:00`,
          details: null,
        },
        {
          event_type: "sleep",
          at: `${REF_DATE}T01:00:00+09:00`,
          end_at: "2026-04-23T02:00:00+09:00", // 25h "sleep"
          details: null,
        },
      ],
      REF_DATE,
    );
    expect(events[0].end_at).toBe("2026-04-22T15:00:00+09:00");
    expect(events[1].end_at).toBeNull();
  });

  it("re-anchors far-future dates to the reference day", () => {
    const { feeds } = sanitizeExtract(
      [feed({ start_at: "2027-04-22T09:00:00+09:00" })],
      [],
      REF_DATE,
    );
    expect(feeds[0].start_at).toBe(`${REF_DATE}T09:00:00+09:00`);
  });

  it("allows recent-past dates through unchanged (backfilled pages)", () => {
    const { feeds } = sanitizeExtract(
      [feed({ start_at: "2026-04-15T09:00:00+09:00" })],
      [],
      REF_DATE,
    );
    expect(feeds[0].start_at).toBe("2026-04-15T09:00:00+09:00");
  });

  it("never dedupes feeds or diaper marks (legitimate repeats)", () => {
    const pee = {
      event_type: "diaper_pee" as const,
      at: `${REF_DATE}T10:00:00+09:00`,
      end_at: null,
      details: null,
    };
    const { feeds, events } = sanitizeExtract(
      [feed(), feed()],
      [pee, pee, pee],
      REF_DATE,
    );
    expect(feeds).toHaveLength(2);
    expect(events).toHaveLength(3);
  });

  it("dedupes identical notes", () => {
    const note = {
      event_type: "note" as const,
      at: `${REF_DATE}T12:00:00+09:00`,
      end_at: null,
      details: { raw: "체중 4.2kg" },
    };
    const { events } = sanitizeExtract([], [note, note], REF_DATE);
    expect(events).toHaveLength(1);
  });
});

describe("extractFromImage end-to-end sanitization", () => {
  it("survives one broken entry without failing the whole photo", async () => {
    geminiOk({
      feeds: [
        {
          start_at: "25:99", // unreadable — must be dropped, not crash
          end_at: null,
          volume_ml: 120,
          feed_type: "formula",
          notes: null,
        },
        {
          start_at: "2026-04-22T09:10:00", // offset-less → KST wall clock
          end_at: null,
          volume_ml: 9999, // implausible → nulled + flagged
          feed_type: "formula",
          notes: null,
        },
      ],
      events: [],
    });
    const bundle = await extractFromImage(TINY_JPEG, "image/jpeg", REF_DATE);
    expect(bundle.feeds).toHaveLength(1);
    expect(bundle.feeds[0].start_at).toBe("2026-04-22T09:10:00+09:00");
    expect(bundle.feeds[0].volume_ml).toBeNull();
    expect(bundle.feeds[0].notes).toContain("9999");
  });
});
