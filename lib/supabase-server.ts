import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function readEnv(name: string): string | undefined {
  try {
    const cfEnv = getCloudflareContext().env as unknown as Record<string, string | undefined>;
    if (cfEnv?.[name]) return cfEnv[name];
  } catch {
    // Outside of a Cloudflare request context (e.g. local `next dev`)
  }
  return process.env[name];
}

export async function serverSupabase() {
  const cookieStore = await cookies();
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anon = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !anon) throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing");
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server components can't set cookies — fine; proxy.ts handles refresh writes.
        }
      },
    },
  });
}

// Service-role client for admin operations (invite redemption, photo upload bookkeeping).
// Uses Supabase SERVICE_ROLE_KEY — never reach this from user-triggered RLS-sensitive code paths
// without also verifying the caller's identity via serverSupabase().auth.getUser().
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function serviceSupabase(): SupabaseClient {
  const url = readEnv("SUPABASE_URL");
  const key = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(url, key, { auth: { persistSession: false } });
}
