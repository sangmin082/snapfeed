import { NextResponse, type NextRequest } from "next/server";
import { serverSupabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const from = url.searchParams.get("from") ?? "/";

  if (code) {
    const supabase = await serverSupabase();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(from, req.url));
}
