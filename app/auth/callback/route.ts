import { NextResponse, type NextRequest } from "next/server";
import { serverSupabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const from = url.searchParams.get("from") ?? "/";

  if (code) {
    const supabase = await serverSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // Surface the failure instead of silently landing on the homepage,
      // still logged out. Most common cause: the link was opened in a
      // different browser than the one that started the flow (PKCE).
      const msg =
        "확인에 실패했습니다. 가입을 진행한 브라우저(또는 앱)에서 다시 시도하거나, 로그인해보세요.";
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(msg)}`, req.url),
      );
    }
  }
  return NextResponse.redirect(new URL(from, req.url));
}
