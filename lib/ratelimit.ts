// Simple KV-backed counter: N per rolling window. Returns true if allowed.

type Limit = { max: number; windowSec: number };

export async function allow(kv: KVNamespace, key: string, limit: Limit): Promise<boolean> {
  const bucket = `${key}:${Math.floor(Date.now() / 1000 / limit.windowSec)}`;
  const raw = await kv.get(bucket);
  const count = raw ? Number(raw) : 0;
  if (count >= limit.max) return false;
  await kv.put(bucket, String(count + 1), { expirationTtl: limit.windowSec + 60 });
  return true;
}

export const DAILY_EXTRACT: Limit = { max: 50, windowSec: 86_400 };
export const MONTHLY_EXTRACT: Limit = { max: 900, windowSec: 30 * 86_400 };
