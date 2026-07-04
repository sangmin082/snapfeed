import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { serverSupabase } from "@/lib/supabase-server";

// Email confirmation endpoint using token_hash (verifyOtp).
//
// The default PKCE `?code=` confirmation only works in the same browser that
// started the sign-up — broken when users sign up inside the iOS app but the
// mail link opens in Safari. token_hash verification is browser-independent.
//
// Requires the Supabase "Confirm signup" email template to link to:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = (url.searchParams.get("type") ?? "email") as EmailOtpType;
  const from = url.searchParams.get("from") ?? "/";

  if (!token_hash) {
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent("잘못된 확인 링크입니다."), req.url),
    );
  }

  const supabase = await serverSupabase();
  const { error } = await supabase.auth.verifyOtp({ token_hash, type });
  if (error) {
    return NextResponse.redirect(
      new URL(
        "/login?error=" + encodeURIComponent(`이메일 확인 실패: ${error.message}`),
        req.url,
      ),
    );
  }

  // Confirmed — this browser now has a session. If the user signed up inside
  // the iOS app, tell them to head back there and sign in.
  return NextResponse.redirect(new URL(from === "/" ? "/?confirmed=1" : from, req.url));
}
