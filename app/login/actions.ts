"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { serverSupabase } from "@/lib/supabase-server";

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "/");
  if (!email || !password) return redirect("/login?error=fields");

  const supabase = await serverSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect(from || "/");
}

export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "/");
  if (!email || !password) return redirect("/login?error=fields");

  const supabase = await serverSupabase();
  const origin = (await headers()).get("origin") ?? "";
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback?from=${encodeURIComponent(from)}` },
  });
  if (error) return redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/login?notice=check-email");
}

export async function signInWithGoogle(formData: FormData) {
  const from = String(formData.get("from") ?? "/");
  const supabase = await serverSupabase();
  const origin = (await headers()).get("origin") ?? "";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?from=${encodeURIComponent(from)}` },
  });
  if (error || !data.url) return redirect(`/login?error=${encodeURIComponent(error?.message ?? "oauth")}`);
  redirect(data.url);
}
