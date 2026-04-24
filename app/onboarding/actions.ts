"use server";

import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase-server";

export async function createBaby(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const birthDate = String(formData.get("birth_date") ?? "").trim();
  const weightRaw = String(formData.get("birth_weight_g") ?? "").trim();
  const heightRaw = String(formData.get("birth_height_cm") ?? "").trim();

  if (!name || !birthDate) return redirect("/onboarding?error=required");

  const birth_weight_g = weightRaw === "" ? null : Number.parseInt(weightRaw, 10);
  const birth_height_cm = heightRaw === "" ? null : Number.parseFloat(heightRaw);
  if (
    (weightRaw !== "" && !Number.isFinite(birth_weight_g)) ||
    (heightRaw !== "" && !Number.isFinite(birth_height_cm))
  ) {
    return redirect("/onboarding?error=number");
  }

  const supabase = await serverSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return redirect("/login");

  const { data: baby, error: insertErr } = await supabase
    .from("babies")
    .insert({
      name,
      birth_date: birthDate,
      birth_weight_g,
      birth_height_cm,
      created_by: auth.user.id,
    })
    .select("id")
    .single();
  if (insertErr || !baby) return redirect(`/onboarding?error=${encodeURIComponent(insertErr?.message ?? "insert")}`);

  const { error: memberErr } = await supabase
    .from("baby_members")
    .insert({ baby_id: baby.id, user_id: auth.user.id, role: "owner" });
  if (memberErr) return redirect(`/onboarding?error=${encodeURIComponent(memberErr.message)}`);

  redirect("/");
}
