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

describe("LAYOUT B — DAY+N 일일 다이어리", () => {
  it("emits 모유 feed with end_at = start + duration, formula and pumped with end_at null", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        feeds: [
          // 모유(분) 30분 at 오전 2시 → 02:00 → end 02:30
          {
            start_at: "2026-04-22T02:00:00+09:00",
            end_at: "2026-04-22T02:30:00+09:00",
            volume_ml: null,
            feed_type: "breast_direct",
            notes: "R15 L15",
          },
          // 분유(ml) 80ml at 오전 5시 → 05:00, end null
          {
            start_at: "2026-04-22T05:00:00+09:00",
            end_at: null,
            volume_ml: 80,
            feed_type: "formula",
            notes: null,
          },
          // 유축(ml) 60ml at 오후 1시 → 13:00, end null
          {
            start_at: "2026-04-22T13:00:00+09:00",
            end_at: null,
            volume_ml: 60,
            feed_type: "breast_pumped",
            notes: null,
          },
        ],
        events: [
          // 수면 arrow 22:00 → 24:00 (2시간)
          {
            event_type: "sleep",
            at: "2026-04-22T22:00:00+09:00",
            end_at: "2026-04-23T00:00:00+09:00",
            details: null,
          },
          // 소변 ✓ at 03:00
          {
            event_type: "diaper_pee",
            at: "2026-04-22T03:00:00+09:00",
            end_at: null,
            details: null,
          },
          // 대변 ✓ at 09:00
          {
            event_type: "diaper_poop",
            at: "2026-04-22T09:00:00+09:00",
            end_at: null,
            details: null,
          },
          // 이유식 (solid food) note at 12:00
          {
            event_type: "note",
            at: "2026-04-22T12:00:00+09:00",
            end_at: null,
            details: '{"kind":"solid_food","raw":"120g 호박죽"}',
          },
        ],
      }),
    });

    const bundle = await extractFromImage(TINY_JPEG, "image/jpeg", REF_DATE);

    expect(bundle.feeds).toHaveLength(3);

    const breast = bundle.feeds.find((f) => f.feed_type === "breast_direct")!;
    expect(breast.start_at).toBe("2026-04-22T02:00:00+09:00");
    expect(breast.end_at).toBe("2026-04-22T02:30:00+09:00");
    expect(breast.volume_ml).toBeNull();
    expect(breast.notes).toBe("R15 L15");

    const formula = bundle.feeds.find((f) => f.feed_type === "formula")!;
    expect(formula.end_at).toBeNull();
    expect(formula.volume_ml).toBe(80);

    const pumped = bundle.feeds.find((f) => f.feed_type === "breast_pumped")!;
    expect(pumped.volume_ml).toBe(60);
    expect(pumped.end_at).toBeNull();

    const sleep = bundle.events.find((e) => e.event_type === "sleep")!;
    expect(sleep.at).toBe("2026-04-22T22:00:00+09:00");
    expect(sleep.end_at).toBe("2026-04-23T00:00:00+09:00");

    const solidFood = bundle.events.find(
      (e) =>
        e.event_type === "note" &&
        (e.details as { kind?: string } | null)?.kind === "solid_food",
    )!;
    expect(solidFood.details).toEqual({ kind: "solid_food", raw: "120g 호박죽" });
  });

  it("uses reference_date when DAY+N header date is fully missing", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        feeds: [
          {
            start_at: "06:30",
            end_at: null,
            volume_ml: 70,
            feed_type: "formula",
            notes: null,
          },
        ],
        events: [
          {
            event_type: "diaper_pee",
            at: "08:00",
            end_at: null,
            details: null,
          },
        ],
      }),
    });

    const bundle = await extractFromImage(TINY_JPEG, "image/jpeg", REF_DATE);
    expect(bundle.feeds[0].start_at).toBe("2026-04-22T06:30:00+09:00");
    expect(bundle.events[0].at).toBe("2026-04-22T08:00:00+09:00");
  });
});
