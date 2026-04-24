import { NextResponse, type NextRequest } from "next/server";
import { serverSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const supabase = await serverSupabase();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
}
