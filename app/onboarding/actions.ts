"use server";

import { redirect } from "next/navigation";
import { serverSupabase, serviceSupabase } from "@/lib/supabase-server";

function asUploadedBlob(v: FormDataEntryValue | null): Blob | null {
  if (v === null || typeof v === "string") return null;
  const b = v as unknown as Blob;
  if (typeof b.arrayBuffer !== "function" || typeof b.size !== "number" || b.size <= 0) {
    return null;
  }
  return b;
}

export async function createBaby(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const birthDate = String(formData.get("birth_date") ?? "").trim();
  const relationship = String(formData.get("relationship") ?? "").trim();
  const weightRaw = String(formData.get("birth_weight_kg") ?? "").trim();
  const heightRaw = String(formData.get("birth_height_cm") ?? "").trim();

  if (!name || !birthDate || !relationship) return redirect("/onboarding?error=required");

  const birth_weight_kg = weightRaw === "" ? null : Number.parseFloat(weightRaw);
  const birth_height_cm = heightRaw === "" ? null : Number.parseFloat(heightRaw);
  if (
    (weightRaw !== "" && !Number.isFinite(birth_weight_kg)) ||
    (heightRaw !== "" && !Number.isFinite(birth_height_cm))
  ) {
    return redirect("/onboarding?error=number");
  }

  const supabase = await serverSupabase();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return redirect("/login");
  const userId = authData.user.id;

  const admin = serviceSupabase();

  let photo_path: string | null = null;
  const photoBlob = asUploadedBlob(formData.get("photo"));
  if (photoBlob) {
    const ext = (photoBlob.type.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
    photo_path = `baby-profile/${crypto.randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await photoBlob.arrayBuffer());
    const up = await admin.storage.from("feed-photos").upload(photo_path, bytes, {
      contentType: photoBlob.type || "image/jpeg",
      upsert: false,
    });
    if (up.error) {
      console.error("[onboarding] storage upload failed", up.error);
      return redirect(`/onboarding?error=${encodeURIComponent(`upload: ${up.error.message}`)}`);
    }
  }

  const { data: baby, error: insertErr } = await admin
    .from("babies")
    .insert({
      name,
      birth_date: birthDate,
      birth_weight_kg,
      birth_height_cm,
      photo_path,
      created_by: userId,
    })
    .select("id")
    .single();
  if (insertErr || !baby) {
    console.error("[onboarding] babies insert failed via admin client", insertErr);
    return redirect(`/onboarding?error=${encodeURIComponent(`babies-insert: ${insertErr?.message ?? "unknown"}`)}`);
  }

  const { error: memberErr } = await admin
    .from("baby_members")
    .insert({ baby_id: baby.id, user_id: userId, role: "owner", relationship });
  if (memberErr) {
    console.error("[onboarding] baby_members insert failed via admin client", memberErr);
    return redirect(`/onboarding?error=${encodeURIComponent(`members-insert: ${memberErr.message}`)}`);
  }

  redirect("/");
}
