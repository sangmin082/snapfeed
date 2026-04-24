import { redirect } from "next/navigation";
import { serverSupabase } from "./supabase-server";

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

export type PrimaryBaby = { id: string; name: string; birth_date: string };

export async function getPrimaryBaby(userId: string): Promise<PrimaryBaby | null> {
  const supabase = await serverSupabase();
  const { data } = await supabase
    .from("baby_members")
    .select("baby_id, babies(id,name,birth_date)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const baby = data?.babies as unknown as PrimaryBaby | null;
  return baby ?? null;
}

export async function requireUserAndBaby() {
  const user = await requireUser();
  const baby = await getPrimaryBaby(user.id);
  if (!baby) redirect("/onboarding");
  return { user, baby };
}
