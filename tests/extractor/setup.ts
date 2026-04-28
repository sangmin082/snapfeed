/**
 * Tiny constants shared across the fixture tests. Each fixture file does
 * its own `vi.mock` for @google/genai and @opennextjs/cloudflare because
 * vi.hoisted bindings cannot cross module boundaries.
 */
export const TINY_JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

export const REF_DATE = "2026-04-22";
