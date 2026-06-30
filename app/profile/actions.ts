"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { serverSupabase, serviceSupabase } from "@/lib/supabase-server";
import { asUploadedBlob } from "@/lib/formdata-utils";

const DELETE_PHRASE = "삭제합니다";

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

  const rawPhoto = formData.get("photo");
  const photoBlob = asUploadedBlob(rawPhoto);
  console.log("[profile] photo intake", {
    rawType: rawPhoto === null ? "null" : typeof rawPhoto,
    isBlobish: photoBlob != null,
    size: photoBlob?.size ?? null,
    mime: photoBlob?.type ?? null,
    removePhoto,
  });
  if (photoBlob) {
    const ext = (photoBlob.type.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
    const candidate = `baby-profile/${crypto.randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await photoBlob.arrayBuffer());
    const up = await admin.storage.from("feed-photos").upload(candidate, bytes, {
      contentType: photoBlob.type || "image/jpeg",
      upsert: false,
    });
    if (up.error) {
      console.error("[profile] storage upload failed", up.error);
      return redirect(`/profile?error=${encodeURIComponent(`upload: ${up.error.message}`)}`);
    }
    newPhotoPath = candidate;
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

// Best-effort removal of every storage object tied to a baby (profile photo +
// every source chart photo on its feeds/events). Storage isn't covered by the
// DB cascade, so we sweep it explicitly. Failures are logged, not fatal —
// an orphaned private blob must never block a user from deleting their account.
async function purgeBabyStorage(
  admin: ReturnType<typeof serviceSupabase>,
  babyId: string,
) {
  const paths = new Set<string>();

  const { data: baby } = await admin
    .from("babies")
    .select("photo_path")
    .eq("id", babyId)
    .maybeSingle();
  if (baby?.photo_path) paths.add(baby.photo_path);

  const { data: feeds } = await admin.from("feeds").select("source_photo").eq("baby_id", babyId);
  for (const f of feeds ?? []) if (f.source_photo) paths.add(f.source_photo as string);

  const { data: events } = await admin.from("events").select("source_photo").eq("baby_id", babyId);
  for (const e of events ?? []) if (e.source_photo) paths.add(e.source_photo as string);

  if (paths.size > 0) {
    const { error } = await admin.storage.from("feed-photos").remove([...paths]);
    if (error) console.error("[delete-account] storage purge failed", { babyId, error });
  }
}

// Permanently delete the signed-in user's account and personal data.
// Required for App Store / Play Store: a user who can create an account must be
// able to delete it (and their data) from within the app.
//
// Shared babies (co-parent / caregiver invites) are handled carefully:
//   - Solo baby (no other members): fully deleted, storage swept.
//   - Shared baby where the user is the creator: ownership is handed to another
//     member first, otherwise deleting the auth user would cascade-delete the
//     baby and wipe the remaining caregivers' records.
//   - Shared baby where the user is just a member: nothing to do — the auth-user
//     delete cascade removes only their own membership row.
export async function deleteAccount(formData: FormData) {
  const confirm = String(formData.get("confirm") ?? "").trim();
  if (confirm !== DELETE_PHRASE) return redirect("/profile?error=confirm");

  const supabase = await serverSupabase();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return redirect("/login");
  const userId = authData.user.id;

  const admin = serviceSupabase();

  const { data: memberships, error: memErr } = await admin
    .from("baby_members")
    .select("baby_id")
    .eq("user_id", userId);
  if (memErr) {
    console.error("[delete-account] membership fetch failed", memErr);
    return redirect(`/profile?error=${encodeURIComponent(`delete: ${memErr.message}`)}`);
  }

  for (const m of memberships ?? []) {
    const babyId = m.baby_id as string;

    const { data: others, error: othersErr } = await admin
      .from("baby_members")
      .select("user_id, joined_at")
      .eq("baby_id", babyId)
      .neq("user_id", userId)
      .order("joined_at", { ascending: true });
    if (othersErr) {
      console.error("[delete-account] co-member fetch failed", { babyId, othersErr });
      return redirect(`/profile?error=${encodeURIComponent(`delete: ${othersErr.message}`)}`);
    }

    if (!others || others.length === 0) {
      // Solo baby — this user's private data. Sweep storage, then delete the
      // baby row (cascades feeds / events / members / invites).
      await purgeBabyStorage(admin, babyId);
      const { error: babyDelErr } = await admin.from("babies").delete().eq("id", babyId);
      if (babyDelErr) {
        console.error("[delete-account] baby delete failed", { babyId, babyDelErr });
        return redirect(`/profile?error=${encodeURIComponent(`delete: ${babyDelErr.message}`)}`);
      }
      continue;
    }

    // Shared baby — keep it for the remaining caregivers.
    const { data: baby, error: babyFetchErr } = await admin
      .from("babies")
      .select("created_by")
      .eq("id", babyId)
      .maybeSingle();
    if (babyFetchErr) {
      console.error("[delete-account] baby fetch failed", { babyId, babyFetchErr });
      return redirect(`/profile?error=${encodeURIComponent(`delete: ${babyFetchErr.message}`)}`);
    }

    if (baby && baby.created_by === userId) {
      const heir = others[0];
      const { error: reassignErr } = await admin
        .from("babies")
        .update({ created_by: heir.user_id })
        .eq("id", babyId);
      if (reassignErr) {
        // Aborting is safer than risking a cascade that wipes shared data.
        console.error("[delete-account] ownership handover failed", { babyId, reassignErr });
        return redirect(`/profile?error=${encodeURIComponent(`delete: ${reassignErr.message}`)}`);
      }
      const { error: promoteErr } = await admin
        .from("baby_members")
        .update({ role: "owner" })
        .eq("baby_id", babyId)
        .eq("user_id", heir.user_id);
      if (promoteErr) {
        // Non-fatal: ownership already moved, but the heir keeps edit rights only
        // once promoted. Log so it can be reconciled.
        console.error("[delete-account] heir promotion failed", { babyId, promoteErr });
      }
    }
  }

  // Removes the user from auth + cascades remaining memberships / invites they
  // created; feeds.uploaded_by / events.uploaded_by are set null (records kept
  // for shared babies, de-identified).
  const { error: authDelErr } = await admin.auth.admin.deleteUser(userId);
  if (authDelErr) {
    console.error("[delete-account] auth user delete failed", authDelErr);
    return redirect(`/profile?error=${encodeURIComponent(`delete: ${authDelErr.message}`)}`);
  }

  // Clear the now-orphaned session cookies (local scope — the user is gone, no
  // server round-trip needed) before sending them to the goodbye notice.
  await supabase.auth.signOut({ scope: "local" }).catch(() => {});
  revalidatePath("/");
  redirect("/login?notice=deleted");
}
