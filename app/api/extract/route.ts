import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { extractFromImage } from "@/lib/extractor";
import { serverSupabase, serviceSupabase } from "@/lib/supabase-server";
import { allow, DAILY_EXTRACT, MONTHLY_EXTRACT } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const supabase = await serverSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("baby_members")
    .select("baby_id")
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const babyId = member?.baby_id;
  if (!babyId) return NextResponse.json({ error: "no baby context" }, { status: 400 });

  const { env } = getCloudflareContext();

  const form = await req.formData();
  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "field 'image' is required" }, { status: 400 });
  }

  const refRaw = form.get("reference_date");
  const referenceDate =
    typeof refRaw === "string" && refRaw.length > 0
      ? refRaw
      : new Date().toISOString().slice(0, 10);

  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local";

  if (env.RATE_LIMIT) {
    const dailyOk = await allow(env.RATE_LIMIT, `extract:day:${ip}`, DAILY_EXTRACT);
    const monthlyOk = await allow(env.RATE_LIMIT, `extract:month:${ip}`, MONTHLY_EXTRACT);
    if (!dailyOk || !monthlyOk) {
      return NextResponse.json({ error: "rate limit exceeded" }, { status: 429 });
    }
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = file.type || "image/jpeg";

  const admin = serviceSupabase();
  const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const photoPath = `${babyId}/${crypto.randomUUID()}.${ext}`;
  const upload = await admin.storage.from("feed-photos").upload(photoPath, bytes, {
    contentType: mimeType,
    upsert: false,
  });
  if (upload.error) {
    return NextResponse.json({ error: `storage: ${upload.error.message}` }, { status: 500 });
  }

  try {
    const bundle = await extractFromImage(bytes, mimeType, referenceDate);
    return NextResponse.json({
      source_photo: photoPath,
      baby_id: babyId,
      transcript: bundle.transcript,
      result: { feeds: bundle.feeds, events: bundle.events },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        source_photo: photoPath,
        baby_id: babyId,
        transcript: "",
        result: { feeds: [], events: [] },
        warning: `extraction failed: ${message} — manual entry required`,
      },
      { status: 200 },
    );
  }
}
