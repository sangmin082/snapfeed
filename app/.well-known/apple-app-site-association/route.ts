import { NextResponse } from "next/server";
import { readEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

// Apple App Site Association — lets the iOS wrapper app (App Store build)
// claim universal links for this domain. Configure via Cloudflare vars:
//   APPLE_APP_ID  "<TEAM_ID>.<BUNDLE_ID>", e.g. "ABCDE12345.app.snapfeed.ios"
export async function GET() {
  const appId = readEnv("APPLE_APP_ID");
  if (!appId) {
    return NextResponse.json({ error: "not configured" }, { status: 404 });
  }

  return NextResponse.json(
    {
      applinks: {
        apps: [],
        details: [
          {
            appIDs: [appId],
            components: [{ "/": "/*" }],
          },
        ],
      },
      webcredentials: {
        apps: [appId],
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
