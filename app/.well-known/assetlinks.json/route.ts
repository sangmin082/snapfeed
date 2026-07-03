import { NextResponse } from "next/server";
import { readEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

// Digital Asset Links for the Play Store TWA (Trusted Web Activity).
// Android verifies this file to hide the browser UI inside the packaged app.
// Configure via Cloudflare vars:
//   ANDROID_PACKAGE_NAME        e.g. "app.snapfeed.twa"
//   ANDROID_SHA256_FINGERPRINTS comma-separated signing-cert fingerprints
//                               (Play App Signing cert + local upload cert)
export async function GET() {
  const packageName = readEnv("ANDROID_PACKAGE_NAME");
  const fingerprints = readEnv("ANDROID_SHA256_FINGERPRINTS");
  if (!packageName || !fingerprints) {
    return NextResponse.json({ error: "not configured" }, { status: 404 });
  }

  return NextResponse.json(
    [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: packageName,
          sha256_cert_fingerprints: fingerprints
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean),
        },
      },
    ],
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
