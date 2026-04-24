import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { serverSupabase } from "@/lib/supabase-server";
import { FeedRecord } from "@/lib/schema";

const PostBody = z.object({
  baby_id: z.string().uuid().optional(),
  source_photo: z.string().nullable().optional(),
  feeds: z.array(FeedRecord).min(1),
});

export async function POST(req: NextRequest) {
  const supabase = await serverSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = PostBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const babyId = parsed.data.baby_id ?? (await resolveFirstBabyId(supabase));
  if (!babyId) return NextResponse.json({ error: "no baby context" }, { status: 400 });

  const { source_photo = null, feeds } = parsed.data;
  const rows = feeds.map((f) => ({
    baby_id: babyId,
    uploaded_by: auth.user.id,
    source_photo,
    start_at: f.start_at,
    end_at: f.end_at,
    volume_ml: f.volume_ml,
    feed_type: f.feed_type,
    notes: f.notes,
  }));
  const { data, error } = await supabase.from("feeds").insert(rows).select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ inserted: data?.length ?? 0, ids: data?.map((r) => r.id) ?? [] });
}

export async function GET(req: NextRequest) {
  const supabase = await serverSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const babyId = url.searchParams.get("baby_id") ?? (await resolveFirstBabyId(supabase));
  if (!babyId) return NextResponse.json({ error: "no baby context" }, { status: 400 });

  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let q = supabase
    .from("feeds")
    .select("*")
    .eq("baby_id", babyId)
    .order("start_at", { ascending: false })
    .limit(500);
  if (from) q = q.gte("start_at", from);
  if (to) q = q.lte("start_at", to);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ feeds: data });
}

async function resolveFirstBabyId(supabase: Awaited<ReturnType<typeof serverSupabase>>): Promise<string | null> {
  const { data } = await supabase
    .from("baby_members")
    .select("baby_id")
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.baby_id ?? null;
}
