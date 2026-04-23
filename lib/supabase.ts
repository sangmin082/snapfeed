import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export function serverClient(): SupabaseClient {
  const cfEnv = getCloudflareContext().env as unknown as Record<string, string | undefined>;
  const url = cfEnv.SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = cfEnv.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    const cfKeys = Object.keys(cfEnv).sort().join(",");
    const processKeys = Object.keys(process.env).filter((k) => /SUPA|GEMINI|NEXT_/.test(k)).sort().join(",");
    throw new Error(
      `SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing. cf.env keys=[${cfKeys}] process.env keys=[${processKeys}]`,
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export function browserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing");
  return createClient(url, key);
}
