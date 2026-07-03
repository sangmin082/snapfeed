import { getCloudflareContext } from "@opennextjs/cloudflare";

export function readEnv(name: string): string | undefined {
  try {
    const cfEnv = getCloudflareContext().env as unknown as Record<string, string | undefined>;
    if (cfEnv?.[name]) return cfEnv[name];
  } catch {
    // Outside of a Cloudflare request context (e.g. local `next dev`)
  }
  return process.env[name];
}
