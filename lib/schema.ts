import { z } from "zod";

export const FeedRecord = z.object({
  start_at: z.string().datetime(),
  end_at: z.string().datetime().nullable(),
  volume_ml: z.number().int().nullable(),
  feed_type: z.enum(["breast_direct", "breast_pumped", "formula"]).nullable(),
  notes: z.string().nullable(),
});
export type FeedRecord = z.infer<typeof FeedRecord>;

export const EventRecord = z.object({
  event_type: z.enum(["diaper_pee", "diaper_poop", "sleep", "note"]),
  at: z.string().datetime(),
  end_at: z.string().datetime().nullable(),
  details: z.record(z.string(), z.unknown()).nullable(),
});
export type EventRecord = z.infer<typeof EventRecord>;

export const ExtractResult = z.object({
  feeds: z.array(FeedRecord),
  events: z.array(EventRecord),
});
export type ExtractResult = z.infer<typeof ExtractResult>;
