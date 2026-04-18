import { z } from "zod";

const isoDateTime = () => z.string().datetime({ offset: true });

export const FeedRecord = z.object({
  start_at: isoDateTime(),
  end_at: isoDateTime().nullable(),
  volume_ml: z.number().int().nullable(),
  feed_type: z.enum(["breast_direct", "breast_pumped", "formula"]).nullable(),
  notes: z.string().nullable(),
});
export type FeedRecord = z.infer<typeof FeedRecord>;

export const EventRecord = z.object({
  event_type: z.enum(["diaper_pee", "diaper_poop", "sleep", "note"]),
  at: isoDateTime(),
  end_at: isoDateTime().nullable(),
  details: z.record(z.string(), z.unknown()).nullable(),
});
export type EventRecord = z.infer<typeof EventRecord>;

export const ExtractResult = z.object({
  feeds: z.array(FeedRecord),
  events: z.array(EventRecord),
});
export type ExtractResult = z.infer<typeof ExtractResult>;
