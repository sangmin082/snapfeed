// Google service-account → OAuth2 access token flow that runs on the Cloudflare
// Workers runtime (no Node crypto). Signs a JWT with Web Crypto (RS256), exchanges
// it at https://oauth2.googleapis.com/token, caches the access_token in KV.

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/cloud-vision";
const CACHE_KEY = "gcp:vision:access_token";

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(body);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function signJwt(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: SCOPE,
    aud: sa.token_uri ?? TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };
  const input = `${b64url(new TextEncoder().encode(JSON.stringify(header)))}.${b64url(
    new TextEncoder().encode(JSON.stringify(claim)),
  )}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(input));
  return `${input}.${b64url(sig)}`;
}

export async function getVisionAccessToken(kv?: KVNamespace): Promise<string> {
  if (kv) {
    const cached = await kv.get(CACHE_KEY);
    if (cached) return cached;
  }
  const raw = process.env.GCP_SA_KEY_JSON;
  if (!raw) throw new Error("GCP_SA_KEY_JSON missing");
  const sa = JSON.parse(raw) as ServiceAccount;
  const jwt = await signJwt(sa);
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`GCP token exchange failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  if (kv) {
    await kv.put(CACHE_KEY, json.access_token, {
      expirationTtl: Math.max(60, json.expires_in - 300),
    });
  }
  return json.access_token;
}
