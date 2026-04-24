"use server";

import { redirect } from "next/navigation";
import { serviceSupabase, serverSupabase } from "@/lib/supabase-server";

export async function acceptInvite(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return redirect("/");

  const supabase = await serverSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return redirect(`/login?from=${encodeURIComponent(`/invite/${code}`)}`);

  const admin = serviceSupabase();
  const { data: invite, error: inviteErr } = await admin
    .from("baby_invites")
    .select("code, baby_id, revoked_at, expires_at")
    .eq("code", code)
    .maybeSingle();
  if (inviteErr || !invite) return redirect(`/invite/${code}?error=notfound`);
  if (invite.revoked_at) return redirect(`/invite/${code}?error=revoked`);
  if (invite.expires_at && new Date(invite.expires_at) < new Date())
    return redirect(`/invite/${code}?error=expired`);

  const { error: joinErr } = await supabase
    .from("baby_members")
    .upsert(
      { baby_id: invite.baby_id, user_id: auth.user.id, role: "member" },
      { onConflict: "baby_id,user_id", ignoreDuplicates: true },
    );
  if (joinErr) return redirect(`/invite/${code}?error=${encodeURIComponent(joinErr.message)}`);

  redirect("/");
}
