import { NextResponse, type NextRequest } from "next/server";
import { serverSupabase, serviceSupabase } from "@/lib/supabase-server";

type Body = { dates?: unknown };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: NextRequest) {
  const supabase = await serverSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!Array.isArray(body.dates)) {
    return NextResponse.json({ error: "dates: string[] required" }, { status: 400 });
  }
  const dates = body.dates
    .filter((d): d is string => typeof d === "string" && DATE.test(d))
    .slice(0, 50);
  if (dates.length === 0) {
    return NextResponse.json({ counts: {} });
  }

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

  const counts: Record<string, { feeds: number; events: number }> = {};
  await Promise.all(
    dates.map(async (date) => {
      const startIso = new Date(`${date}T00:00:00+09:00`).toISOString();
      const endDate = new Date(`${date}T00:00:00+09:00`);
      endDate.setUTCDate(endDate.getUTCDate() + 1);
      const endIso = endDate.toISOString();
      const [{ count: feeds }, { count: events }] = await Promise.all([
        admin
          .from("feeds")
          .select("id", { count: "exact", head: true })
          .eq("baby_id", babyId)
          .gte("start_at", startIso)
          .lt("start_at", endIso),
        admin
          .from("events")
          .select("id", { count: "exact", head: true })
          .eq("baby_id", babyId)
          .gte("at", startIso)
          .lt("at", endIso),
      ]);
      counts[date] = { feeds: feeds ?? 0, events: events ?? 0 };
    }),
  );

  return NextResponse.json({ counts });
}
