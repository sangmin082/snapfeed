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

function geminiOk(json: unknown) {
  mockGenerateContent.mockResolvedValueOnce({ text: JSON.stringify(json) });
}

afterEach(() => {
  mockGenerateContent.mockReset();
});

describe("LAYOUT A — single day block", () => {
  it("normalizes feed and event timestamps using the detected block date", async () => {
    geminiOk({
      feeds: [
        {
          start_at: "2026-04-22T01:35:00+09:00",
          end_at: null,
          volume_ml: null,
          feed_type: "breast_direct",
          notes: null,
        },
        {
          start_at: "2026-04-22T04:00:00+09:00",
          end_at: null,
          volume_ml: 80,
          feed_type: "formula",
          notes: null,
        },
      ],
      events: [
        {
          event_type: "diaper_pee",
          at: "2026-04-22T03:00:00+09:00",
          end_at: null,
          details: null,
        },
        {
          event_type: "diaper_pee",
          at: "2026-04-22T03:00:00+09:00",
          end_at: null,
          details: null,
        },
        {
          event_type: "note",
          at: "2026-04-22T09:00:00+09:00",
          end_at: null,
          details: '{"raw":"유산균"}',
        },
        {
          event_type: "note",
          at: "2026-04-22T12:00:00+09:00",
          end_at: null,
          details: '{"raw":"체중 4.2kg"}',
        },
        {
          event_type: "note",
          at: "2026-04-22T12:00:00+09:00",
          end_at: null,
          details: '{"raw":"체온 36.7"}',
        },
        {
          event_type: "note",
          at: "2026-04-22T12:00:00+09:00",
          end_at: null,
          details: '{"raw":"수유총량 640ml"}',
        },
      ],
    });

    const bundle = await extractFromImage(TINY_JPEG, "image/jpeg", REF_DATE);

    expect(bundle.feeds).toHaveLength(2);
    expect(bundle.feeds[0]).toMatchObject({
      start_at: "2026-04-22T01:35:00+09:00",
      end_at: null,
      volume_ml: null,
      feed_type: "breast_direct",
    });
    expect(bundle.feeds[1]).toMatchObject({
      start_at: "2026-04-22T04:00:00+09:00",
      volume_ml: 80,
      feed_type: "formula",
    });

    expect(bundle.events).toHaveLength(6);
    const peeAt03 = bundle.events.filter(
      (e) =>
        e.event_type === "diaper_pee" && e.at === "2026-04-22T03:00:00+09:00",
    );
    expect(peeAt03).toHaveLength(2);

    const noteAt09 = bundle.events.find(
      (e) => e.at === "2026-04-22T09:00:00+09:00",
    );
    expect(noteAt09?.event_type).toBe("note");
    expect(noteAt09?.details).toEqual({ raw: "유산균" });

    const footers = bundle.events.filter(
      (e) => e.at === "2026-04-22T12:00:00+09:00",
    );
    expect(footers).toHaveLength(3);
    expect(
      footers.map((e) => (e.details as { raw: string }).raw).sort(),
    ).toEqual(["수유총량 640ml", "체온 36.7", "체중 4.2kg"]);
  });

  it("falls back to reference_date when Gemini emits bare HH:MM", async () => {
    geminiOk({
      feeds: [
        {
          start_at: "07:30",
          end_at: null,
          volume_ml: 90,
          feed_type: "formula",
          notes: null,
        },
      ],
      events: [],
    });

    const bundle = await extractFromImage(TINY_JPEG, "image/jpeg", REF_DATE);
    expect(bundle.feeds[0].start_at).toBe("2026-04-22T07:30:00+09:00");
  });

  it("preserves verbatim notes on per-row 기타 entries", async () => {
    geminiOk({
      feeds: [],
      events: [
        {
          event_type: "note",
          at: "2026-04-22T11:00:00+09:00",
          end_at: null,
          details: '{"raw":"비타민D 한 방울"}',
        },
      ],
    });

    const bundle = await extractFromImage(TINY_JPEG, "image/jpeg", REF_DATE);
    expect(bundle.events[0].details).toEqual({ raw: "비타민D 한 방울" });
  });
});
