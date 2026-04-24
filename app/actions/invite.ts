"use server";

import { headers } from "next/headers";
import { serverSupabase } from "@/lib/supabase-server";
import { getPrimaryBaby, requireUser } from "@/lib/auth";

function randomCode(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  const buf = new Uint8Array(10);
  crypto.getRandomValues(buf);
  for (let i = 0; i < buf.length; i++) out += chars[buf[i] % chars.length];
  return out;
}

export async function createInviteLink(): Promise<{ url: string } | { error: string }> {
  const user = await requireUser();
  const baby = await getPrimaryBaby(user.id);
  if (!baby) return { error: "아이 정보 먼저 등록해주세요." };

  const supabase = await serverSupabase();
  const code = randomCode();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(); // 7 days
  const { error } = await supabase
    .from("baby_invites")
    .insert({ code, baby_id: baby.id, created_by: user.id, expires_at: expiresAt });
  if (error) return { error: error.message };

  const h = await headers();
  const origin =
    h.get("origin") ??
    `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host") ?? "snapfeed.sangmin082.workers.dev"}`;
  return { url: `${origin}/invite/${code}` };
}
