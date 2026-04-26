import { redirect } from "next/navigation";
import { serverSupabase, serviceSupabase } from "./supabase-server";

export async function getUser() {
  const supabase = await serverSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export type PrimaryBaby = {
  id: string;
  name: string;
  birth_date: string;
  photo_path: string | null;
};

export async function getPrimaryBaby(userId: string): Promise<PrimaryBaby | null> {
  const supabase = await serverSupabase();
  const { data } = await supabase
    .from("baby_members")
    .select("baby_id, babies(id,name,birth_date,photo_path)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const baby = data?.babies as unknown as PrimaryBaby | null;
  return baby ?? null;
}

export async function babyPhotoUrl(photoPath: string | null): Promise<string | null> {
  if (!photoPath) return null;
  const admin = serviceSupabase();
  const { data, error } = await admin.storage
    .from("feed-photos")
    .createSignedUrl(photoPath, 60 * 60); // 1 hour
  if (error || !data?.signedUrl) {
    console.error("[auth] babyPhotoUrl failed", { photoPath, error });
    return null;
  }
  return data.signedUrl;
}

export async function requireUserAndBaby() {
  const user = await requireUser();
  const baby = await getPrimaryBaby(user.id);
  if (!baby) redirect("/onboarding");
  return { user, baby };
}
