import { NextResponse, type NextRequest } from "next/server";
import { serverSupabase, serviceSupabase } from "@/lib/supabase-server";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ date: string }> }) {
  const { date } = await ctx.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }

  const supabase = await serverSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = serviceSupabase();
  const { data: member } = await admin
    .from("baby_members")
    .select("baby_id")
    .eq("user_id", auth.user.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!member?.baby_id) return NextResponse.json({ error: "no baby context" }, { status: 400 });
  const babyId = member.baby_id;

  // KST day window [date 00:00, date 24:00) in UTC
  const startIso = new Date(`${date}T00:00:00+09:00`).toISOString();
  const endIso = new Date(`${date}T00:00:00+09:00`);
  endIso.setUTCDate(endIso.getUTCDate() + 1);
  const endIsoStr = endIso.toISOString();

  const feedDel = await admin
    .from("feeds")
    .delete()
    .eq("baby_id", babyId)
    .gte("start_at", startIso)
    .lt("start_at", endIsoStr);
  if (feedDel.error) return NextResponse.json({ error: feedDel.error.message }, { status: 500 });

  const eventDel = await admin
    .from("events")
    .delete()
    .eq("baby_id", babyId)
    .gte("at", startIso)
    .lt("at", endIsoStr);
  if (eventDel.error) return NextResponse.json({ error: eventDel.error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
