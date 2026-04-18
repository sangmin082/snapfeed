import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { detectDocumentText } from "@/lib/vision";
import { structureFromOcr } from "@/lib/extractor";
import { serverClient } from "@/lib/supabase";
import { allow, DAILY_EXTRACT, MONTHLY_EXTRACT } from "@/lib/ratelimit";

export const runtime = "edge";

export async function POST(req: NextRequest) {
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

  const supabase = serverClient();
  const ext = (file.type?.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const photoPath = `default/${crypto.randomUUID()}.${ext}`;
  const upload = await supabase.storage.from("feed-photos").upload(photoPath, bytes, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (upload.error) {
    return NextResponse.json({ error: `storage: ${upload.error.message}` }, { status: 500 });
  }

  const ocrText = await detectDocumentText(bytes, env.TOKEN_CACHE);
  if (!ocrText.trim()) {
    return NextResponse.json({
      source_photo: photoPath,
      ocr_text: "",
      result: { feeds: [], events: [] },
      warning: "OCR returned no text — manual entry required",
    });
  }

  const result = await structureFromOcr(ocrText, referenceDate);
  return NextResponse.json({ source_photo: photoPath, ocr_text: ocrText, result });
}
