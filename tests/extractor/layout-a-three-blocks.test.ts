import { afterEach, describe, expect, it, vi } from "vitest";
import { REF_DATE, TINY_JPEG } from "./setup";

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

afterEach(() => {
  mockGenerateContent.mockReset();
});

describe("LAYOUT A — three day blocks side-by-side, mixed feed types", () => {
  it("keeps each block's entries on its own date and mixes 모유 / 분유 / 유축", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        feeds: [
          // Day 1 (4/22): 모유직수
          {
            start_at: "2026-04-22T02:30:00+09:00",
            end_at: null,
            volume_ml: null,
            feed_type: "breast_direct",
            notes: null,
          },
          {
            start_at: "2026-04-22T05:45:00+09:00",
            end_at: null,
            volume_ml: null,
            feed_type: "breast_direct",
            notes: null,
          },
          // Day 2 (4/23): 유축 + 분유
          {
            start_at: "2026-04-23T03:00:00+09:00",
            end_at: null,
            volume_ml: 60,
            feed_type: "breast_pumped",
            notes: null,
          },
          {
            start_at: "2026-04-23T07:00:00+09:00",
            end_at: null,
            volume_ml: 90,
            feed_type: "formula",
            notes: null,
          },
          // Day 3 (4/24): 분유 only
          {
            start_at: "2026-04-24T02:00:00+09:00",
            end_at: null,
            volume_ml: 100,
            feed_type: "formula",
            notes: null,
          },
          {
            start_at: "2026-04-24T06:00:00+09:00",
            end_at: null,
            volume_ml: 110,
            feed_type: "formula",
            notes: null,
          },
        ],
        events: [
          // Day 1 footer: 체중
          {
            event_type: "note",
            at: "2026-04-22T12:00:00+09:00",
            end_at: null,
            details: '{"raw":"체중 4.20kg"}',
          },
          // Day 2 footer: 체온
          {
            event_type: "note",
            at: "2026-04-23T12:00:00+09:00",
            end_at: null,
            details: '{"raw":"체온 36.9"}',
          },
          // Day 3 footer: 수유총량
          {
            event_type: "note",
            at: "2026-04-24T12:00:00+09:00",
            end_at: null,
            details: '{"raw":"수유총량 720ml"}',
          },
          // Day 2 row note: 유산균 at 09:00
          {
            event_type: "note",
            at: "2026-04-23T09:00:00+09:00",
            end_at: null,
            details: '{"raw":"유산균"}',
          },
          // Day 1 diaper_poop × 1 at 06:00
          {
            event_type: "diaper_poop",
            at: "2026-04-22T06:00:00+09:00",
            end_at: null,
            details: null,
          },
        ],
      }),
    });

    const bundle = await extractFromImage(TINY_JPEG, "image/jpeg", REF_DATE);

    expect(bundle.feeds).toHaveLength(6);

    const day1Feeds = bundle.feeds.filter((f) =>
      f.start_at.startsWith("2026-04-22"),
    );
    const day2Feeds = bundle.feeds.filter((f) =>
      f.start_at.startsWith("2026-04-23"),
    );
    const day3Feeds = bundle.feeds.filter((f) =>
      f.start_at.startsWith("2026-04-24"),
    );

    expect(day1Feeds).toHaveLength(2);
    expect(day1Feeds.every((f) => f.feed_type === "breast_direct")).toBe(true);
    expect(day1Feeds.every((f) => f.volume_ml === null)).toBe(true);

    expect(day2Feeds).toHaveLength(2);
    expect(day2Feeds.map((f) => f.feed_type).sort()).toEqual(
      ["breast_pumped", "formula"],
    );

    expect(day3Feeds).toHaveLength(2);
    expect(day3Feeds.every((f) => f.feed_type === "formula")).toBe(true);

    // Each day-block contributes exactly one footer note at noon
    const noonNotes = bundle.events.filter((e) => e.at.endsWith("T12:00:00+09:00"));
    expect(noonNotes).toHaveLength(3);
    expect(noonNotes.map((e) => e.at).sort()).toEqual([
      "2026-04-22T12:00:00+09:00",
      "2026-04-23T12:00:00+09:00",
      "2026-04-24T12:00:00+09:00",
    ]);

    // diaper_poop stays on day 1
    const poop = bundle.events.filter((e) => e.event_type === "diaper_poop");
    expect(poop).toHaveLength(1);
    expect(poop[0].at).toBe("2026-04-22T06:00:00+09:00");
  });

  it("does not bleed entries from one block into another's date", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        feeds: [
          {
            start_at: "2026-04-22T23:30:00+09:00",
            end_at: null,
            volume_ml: 90,
            feed_type: "formula",
            notes: null,
          },
          {
            start_at: "2026-04-23T00:30:00+09:00",
            end_at: null,
            volume_ml: 80,
            feed_type: "formula",
            notes: null,
          },
        ],
        events: [],
      }),
    });

    const bundle = await extractFromImage(TINY_JPEG, "image/jpeg", REF_DATE);
    expect(bundle.feeds.map((f) => f.start_at)).toEqual([
      "2026-04-22T23:30:00+09:00",
      "2026-04-23T00:30:00+09:00",
    ]);
  });
});
