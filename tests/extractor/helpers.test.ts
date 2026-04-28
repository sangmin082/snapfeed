import { describe, expect, it } from "vitest";
import {
  isTransientError,
  normalizeIso,
  safeJsonParse,
} from "@/lib/extractor-helpers";
import { asUploadedBlob } from "@/lib/formdata-utils";

const REF = "2026-04-22";

describe("normalizeIso", () => {
  it("attaches reference date and KST offset to bare HH:MM", () => {
    expect(normalizeIso("01:35", REF)).toBe("2026-04-22T01:35:00+09:00");
    expect(normalizeIso("9:05", REF)).toBe("2026-04-22T09:05:00+09:00");
  });

  it("preserves seconds when given HH:MM:SS", () => {
    expect(normalizeIso("01:35:42", REF)).toBe("2026-04-22T01:35:42+09:00");
  });

  it("rewrites a fully qualified ISO into KST", () => {
    expect(normalizeIso("2026-04-22T01:35:00+09:00", REF)).toBe(
      "2026-04-22T01:35:00+09:00",
    );
  });

  it("converts a UTC ISO timestamp into KST", () => {
    // 16:35 UTC == 01:35 next day KST
    expect(normalizeIso("2026-04-21T16:35:00Z", REF)).toBe(
      "2026-04-22T01:35:00+09:00",
    );
  });

  it("returns null for empty / unparseable input", () => {
    expect(normalizeIso(null, REF)).toBeNull();
    expect(normalizeIso(undefined, REF)).toBeNull();
    expect(normalizeIso("", REF)).toBeNull();
    expect(normalizeIso("   ", REF)).toBeNull();
    expect(normalizeIso("not a time", REF)).toBeNull();
  });

  it("does not invent seconds beyond the input precision", () => {
    expect(normalizeIso("13:00", REF)).toBe("2026-04-22T13:00:00+09:00");
  });
});

describe("safeJsonParse", () => {
  it("parses a valid JSON object", () => {
    expect(safeJsonParse('{"a":1,"b":"x"}')).toEqual({ a: 1, b: "x" });
  });

  it("wraps a JSON array under raw", () => {
    expect(safeJsonParse("[1,2,3]")).toEqual({ raw: "[1,2,3]" });
  });

  it("wraps a JSON primitive under raw", () => {
    expect(safeJsonParse('"hello"')).toEqual({ raw: '"hello"' });
    expect(safeJsonParse("42")).toEqual({ raw: "42" });
    expect(safeJsonParse("null")).toEqual({ raw: "null" });
  });

  it("wraps malformed JSON under raw", () => {
    expect(safeJsonParse("not json")).toEqual({ raw: "not json" });
    expect(safeJsonParse("{")).toEqual({ raw: "{" });
  });

  it("returns the original empty string verbatim under raw", () => {
    expect(safeJsonParse("")).toEqual({ raw: "" });
  });
});

describe("isTransientError", () => {
  it.each([
    "429 Too Many Requests",
    "HTTP 500 internal",
    "503 service unavailable",
    "UNAVAILABLE: backend overloaded",
    "RESOURCE_EXHAUSTED quota",
    "model is overloaded right now",
    "high demand",
  ])("flags %j as transient", (msg) => {
    expect(isTransientError(new Error(msg))).toBe(true);
  });

  it.each([
    "400 Bad Request",
    "401 unauthorized",
    "404 not found",
    "schema validation failed",
    "GEMINI_API_KEY missing",
  ])("does NOT flag %j as transient", (msg) => {
    expect(isTransientError(new Error(msg))).toBe(false);
  });

  it("accepts plain strings too", () => {
    expect(isTransientError("502 bad gateway")).toBe(true);
    expect(isTransientError("everything is fine")).toBe(false);
  });
});

describe("asUploadedBlob", () => {
  it("returns null for null", () => {
    expect(asUploadedBlob(null)).toBeNull();
  });

  it("returns null for plain strings", () => {
    expect(asUploadedBlob("hello")).toBeNull();
    expect(asUploadedBlob("")).toBeNull();
  });

  it("returns null for zero-length blobs", () => {
    expect(asUploadedBlob(new Blob([]))).toBeNull();
  });

  it("returns the blob for a non-empty Blob", () => {
    const blob = new Blob(["payload"], { type: "image/jpeg" });
    const got = asUploadedBlob(blob);
    expect(got).not.toBeNull();
    expect(got?.size).toBe(blob.size);
    expect(got?.type).toBe("image/jpeg");
  });

  it("accepts a File (which extends Blob)", () => {
    const file = new File(["payload"], "feed.jpg", { type: "image/jpeg" });
    const got = asUploadedBlob(file);
    expect(got).not.toBeNull();
    expect(got?.size).toBe(file.size);
  });

  it("returns null for an object that doesn't quack like a blob", () => {
    const fake = { size: 10 } as unknown as FormDataEntryValue;
    expect(asUploadedBlob(fake)).toBeNull();
  });
});
