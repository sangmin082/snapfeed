import Link from "next/link";
import { requireUserAndBaby } from "@/lib/auth";
import { serverSupabase, serviceSupabase } from "@/lib/supabase-server";
import { RecordsTable, type FeedRow, type EventRow } from "@/components/RecordsTable";

export const dynamic = "force-dynamic";

export default async function RecordsPage() {
  const { baby } = await requireUserAndBaby();
  const supabase = await serverSupabase();

  const [{ data: feeds }, { data: events }] = await Promise.all([
    supabase
      .from("feeds")
      .select("id,start_at,volume_ml,feed_type,notes,source_photo")
      .eq("baby_id", baby.id)
      .order("start_at", { ascending: false })
      .limit(500),
    supabase
      .from("events")
      .select("id,at,event_type,details,source_photo")
      .eq("baby_id", baby.id)
      .order("at", { ascending: false })
      .limit(500),
  ]);

  const feedRows = (feeds ?? []) as FeedRow[];
  const eventRows = (events ?? []) as EventRow[];
  const total = feedRows.length + eventRows.length;

  // Sign every unique source_photo path so the table can show originals
  // inline. We use the service client because feed photos uploaded by
  // OpenNext live under a path the RLS-bound user client may not be
  // allowed to read.
  const uniquePaths = new Set<string>();
  for (const r of feedRows) if (r.source_photo) uniquePaths.add(r.source_photo);
  for (const r of eventRows) if (r.source_photo) uniquePaths.add(r.source_photo);

  const photoUrls: Record<string, string> = {};
  if (uniquePaths.size > 0) {
    const admin = serviceSupabase();
    const { data: signed } = await admin.storage
      .from("feed-photos")
      .createSignedUrls(Array.from(uniquePaths), 60 * 60);
    if (signed) {
      for (const item of signed) {
        if (item.path && item.signedUrl) photoUrls[item.path] = item.signedUrl;
      }
    }
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">기록 목록</h1>
          <p className="text-sm text-gray-500 dark:text-neutral-500">
            {baby.name} · 총 {total}건
          </p>
        </div>
        <Link href="/" className="text-sm text-gray-500 underline-offset-4 hover:text-gray-900 hover:underline dark:text-neutral-500 dark:hover:text-neutral-100">
          홈
        </Link>
      </header>

      <RecordsTable feeds={feedRows} events={eventRows} photoUrls={photoUrls} />
    </main>
  );
}
