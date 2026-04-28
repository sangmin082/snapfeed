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

describe("Robustness — empty / sparse fixtures", () => {
  it("returns an empty bundle when Gemini reports no entries (blank chart)", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({ feeds: [], events: [] }),
    });

    const bundle = await extractFromImage(TINY_JPEG, "image/jpeg", REF_DATE);
    expect(bundle.feeds).toEqual([]);
    expect(bundle.events).toEqual([]);
    expect(bundle.transcript).toBe("");
  });

  it("preserves null volume_ml / end_at / notes verbatim", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        feeds: [
          {
            start_at: "08:00",
            end_at: null,
            volume_ml: null,
            feed_type: "breast_direct",
            notes: null,
          },
        ],
        events: [
          {
            event_type: "note",
            at: "10:00",
            end_at: null,
            details: null,
          },
        ],
      }),
    });

    const bundle = await extractFromImage(TINY_JPEG, "image/jpeg", REF_DATE);
    expect(bundle.feeds[0]).toMatchObject({
      end_at: null,
      volume_ml: null,
      notes: null,
    });
    expect(bundle.events[0]).toMatchObject({
      end_at: null,
      details: null,
    });
  });

  it("keeps a row that only has a note, even with empty 양(ml)", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        feeds: [],
        events: [
          {
            event_type: "note",
            at: "07:00",
            end_at: null,
            details: '{"raw":"비타민D"}',
          },
        ],
      }),
    });

    const bundle = await extractFromImage(TINY_JPEG, "image/jpeg", REF_DATE);
    expect(bundle.feeds).toEqual([]);
    expect(bundle.events).toHaveLength(1);
    expect(bundle.events[0].at).toBe("2026-04-22T07:00:00+09:00");
    expect(bundle.events[0].details).toEqual({ raw: "비타민D" });
  });

  it("rejects malformed Gemini JSON output by throwing", async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: "not-json" });

    await expect(
      extractFromImage(TINY_JPEG, "image/jpeg", REF_DATE),
    ).rejects.toThrow();
  });

  it("rejects schema-invalid output (bad feed_type) by throwing", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        feeds: [
          {
            start_at: "07:00",
            end_at: null,
            volume_ml: 80,
            feed_type: "soylent",
            notes: null,
          },
        ],
        events: [],
      }),
    });

    await expect(
      extractFromImage(TINY_JPEG, "image/jpeg", REF_DATE),
    ).rejects.toThrow();
  });

  it("falls back to { raw } when details cell is not JSON", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        feeds: [],
        events: [
          {
            event_type: "note",
            at: "13:00",
            end_at: null,
            details: "헐 그냥 텍스트",
          },
        ],
      }),
    });

    const bundle = await extractFromImage(TINY_JPEG, "image/jpeg", REF_DATE);
    expect(bundle.events[0].details).toEqual({ raw: "헐 그냥 텍스트" });
  });

  it("drops timestamps the parser cannot understand by leaving them null on end_at", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        feeds: [
          {
            start_at: "12:00",
            end_at: "this is garbage",
            volume_ml: 90,
            feed_type: "formula",
            notes: null,
          },
        ],
        events: [],
      }),
    });

    const bundle = await extractFromImage(TINY_JPEG, "image/jpeg", REF_DATE);
    expect(bundle.feeds[0].start_at).toBe("2026-04-22T12:00:00+09:00");
    expect(bundle.feeds[0].end_at).toBeNull();
  });
});
