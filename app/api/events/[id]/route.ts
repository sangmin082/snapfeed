import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { serverSupabase, serviceSupabase } from "@/lib/supabase-server";

const PatchBody = z.object({
  at: z.string().datetime({ offset: true }).optional(),
  event_type: z.enum(["diaper_pee", "diaper_poop", "sleep", "note"]).optional(),
  details: z.record(z.string(), z.unknown()).nullable().optional(),
});

async function authorize(id: string) {
  const supabase = await serverSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false as const, status: 401, message: "unauthorized" };
  const admin = serviceSupabase();
  const { data: row } = await admin.from("events").select("baby_id").eq("id", id).maybeSingle();
  if (!row) return { ok: false as const, status: 404, message: "not found" };
  const { data: member } = await admin
    .from("baby_members")
    .select("user_id")
    .eq("baby_id", row.baby_id)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!member) return { ok: false as const, status: 403, message: "forbidden" };
  return { ok: true as const, admin };
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = await authorize(id);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const body = await req.json().catch(() => null);
  const parsed = PatchBody.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const { error } = await auth.admin.from("events").update(parsed.data).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = await authorize(id);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const { error } = await auth.admin.from("events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
