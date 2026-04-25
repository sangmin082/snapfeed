"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { serverSupabase, serviceSupabase } from "@/lib/supabase-server";

export async function updateBaby(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const birthDate = String(formData.get("birth_date") ?? "").trim();
  const relationship = String(formData.get("relationship") ?? "").trim();
  const weightRaw = String(formData.get("birth_weight_kg") ?? "").trim();
  const heightRaw = String(formData.get("birth_height_cm") ?? "").trim();
  const removePhoto = String(formData.get("remove_photo") ?? "") === "1";

  if (!name || !birthDate || !relationship) return redirect("/profile?error=required");

  const birth_weight_kg = weightRaw === "" ? null : Number.parseFloat(weightRaw);
  const birth_height_cm = heightRaw === "" ? null : Number.parseFloat(heightRaw);
  if (
    (weightRaw !== "" && !Number.isFinite(birth_weight_kg)) ||
    (heightRaw !== "" && !Number.isFinite(birth_height_cm))
  ) {
    return redirect("/profile?error=number");
  }

  const supabase = await serverSupabase();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return redirect("/login");
  const userId = authData.user.id;

  const admin = serviceSupabase();

  const { data: member, error: memberFetchErr } = await admin
    .from("baby_members")
    .select("baby_id, babies(id, photo_path)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (memberFetchErr || !member) return redirect("/onboarding");

  const baby = member.babies as unknown as { id: string; photo_path: string | null } | null;
  if (!baby) return redirect("/onboarding");

  const oldPhotoPath = baby.photo_path;
  let newPhotoPath: string | null | undefined; // undefined = no change

  const photoFile = formData.get("photo");
  if (photoFile instanceof File && photoFile.size > 0) {
    const ext = (photoFile.type.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
    const candidate = `baby-profile/${crypto.randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await photoFile.arrayBuffer());
    const up = await admin.storage.from("feed-photos").upload(candidate, bytes, {
      contentType: photoFile.type || "image/jpeg",
      upsert: false,
    });
    if (!up.error) newPhotoPath = candidate;
  } else if (removePhoto) {
    newPhotoPath = null;
  }

  const update: Record<string, unknown> = {
    name,
    birth_date: birthDate,
    birth_weight_kg,
    birth_height_cm,
  };
  if (newPhotoPath !== undefined) update.photo_path = newPhotoPath;

  const { error: updateErr } = await admin.from("babies").update(update).eq("id", baby.id);
  if (updateErr) {
    return redirect(`/profile?error=${encodeURIComponent(`update: ${updateErr.message}`)}`);
  }

  const { error: relationshipErr } = await admin
    .from("baby_members")
    .update({ relationship })
    .eq("baby_id", baby.id)
    .eq("user_id", userId);
  if (relationshipErr) {
    return redirect(`/profile?error=${encodeURIComponent(`relationship: ${relationshipErr.message}`)}`);
  }

  if (newPhotoPath !== undefined && oldPhotoPath && oldPhotoPath !== newPhotoPath) {
    await admin.storage.from("feed-photos").remove([oldPhotoPath]);
  }

  revalidatePath("/");
  revalidatePath("/profile");
  redirect("/?profile=saved");
}
