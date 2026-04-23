import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { serverClient } from "@/lib/supabase";
import { EventRecord } from "@/lib/schema";

const DEFAULT_USER = "default";

const PostBody = z.object({
  user_id: z.string().default(DEFAULT_USER),
  baby_id: z.string().nullable().optional(),
  source_photo: z.string().nullable().optional(),
  events: z.array(EventRecord).min(1),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = PostBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { user_id, baby_id = null, source_photo = null, events } = parsed.data;
  const rows = events.map((e) => ({
    user_id,
    baby_id,
    source_photo,
    event_type: e.event_type,
    at: e.at,
    end_at: e.end_at,
    details: e.details,
  }));
  const { data, error } = await serverClient().from("events").insert(rows).select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ inserted: data?.length ?? 0, ids: data?.map((r) => r.id) ?? [] });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const user_id = url.searchParams.get("user_id") ?? DEFAULT_USER;
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let q = serverClient()
    .from("events")
    .select("*")
    .eq("user_id", user_id)
    .order("at", { ascending: false })
    .limit(500);
  if (from) q = q.gte("at", from);
  if (to) q = q.lte("at", to);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data });
}
