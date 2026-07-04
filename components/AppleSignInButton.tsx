"use client";

import { useState } from "react";
import { useIsNative } from "@/lib/native";
import { browserSupabase } from "@/lib/supabase-browser";

// Native Sign in with Apple (shown only inside the iOS shell). Uses the OS
// authorization sheet — no Safari bounce — then exchanges Apple's identity
// token for a Supabase session in this WebView via signInWithIdToken.
//
// Requires: "Sign In with Apple" capability on the App ID, and the bundle id
// (com.snapfeed.com) listed under Supabase → Auth → Providers → Apple →
// Authorized Client IDs.
export function AppleSignInButton({ from = "/" }: { from?: string }) {
  const native = useIsNative();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!native) return null;

  async function onClick() {
    setBusy(true);
    setError(null);
    try {
      const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");
      const res = await SignInWithApple.authorize({
        clientId: "com.snapfeed.com",
        redirectURI: "https://snapfeed.sangmin082.workers.dev/auth/callback",
        scopes: "email name",
      });
      const idToken = res.response?.identityToken;
      if (!idToken) throw new Error("Apple 인증 토큰을 받지 못했습니다.");

      const supabase = browserSupabase();
      const { error: authErr } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: idToken,
      });
      if (authErr) throw authErr;

      // Full navigation so the server sees the new session cookie.
      window.location.href = from || "/";
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // User dismissing the Apple sheet throws (error 1001) — not an error.
      if (!/cancel|1001/i.test(msg)) setError(msg);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={onClick}
        className="flex w-full items-center justify-center gap-3 rounded-full bg-black px-6 py-3 text-base font-medium text-white transition active:scale-[0.98] disabled:opacity-60 dark:bg-white dark:text-black"
      >
        <AppleMark />
        {busy ? "로그인 중…" : "Apple로 계속하기"}
      </button>
      {error ? (
        <p className="text-center text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
      <path d="M16.365 12.79c.024 2.617 2.296 3.489 2.321 3.5-.019.061-.363 1.243-1.197 2.462-.721 1.055-1.47 2.106-2.65 2.128-1.16.021-1.533-.688-2.858-.688-1.326 0-1.74.667-2.838.71-1.139.042-2.007-1.14-2.734-2.19-1.486-2.149-2.62-6.07-1.096-8.719.757-1.315 2.11-2.148 3.578-2.169 1.119-.021 2.174.752 2.858.752.683 0 1.966-.93 3.314-.794.564.024 2.15.228 3.168 1.717-.082.05-1.892 1.104-1.866 3.291zM14.19 5.53c.604-.732 1.011-1.75.9-2.764-.87.035-1.923.58-2.548 1.311-.56.648-1.05 1.685-.918 2.678.97.075 1.961-.492 2.566-1.225z" />
    </svg>
  );
}
