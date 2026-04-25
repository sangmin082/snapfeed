import Link from "next/link";
import { requireUserAndBaby } from "@/lib/auth";
import { serverSupabase } from "@/lib/supabase-server";
import { RecordsTable, type FeedRow, type EventRow } from "@/components/RecordsTable";

export const dynamic = "force-dynamic";

export default async function RecordsPage() {
  const { baby } = await requireUserAndBaby();
  const supabase = await serverSupabase();

  const [{ data: feeds }, { data: events }] = await Promise.all([
    supabase
      .from("feeds")
      .select("id,start_at,volume_ml,feed_type,notes")
      .eq("baby_id", baby.id)
      .order("start_at", { ascending: false })
      .limit(500),
    supabase
      .from("events")
      .select("id,at,event_type,details")
      .eq("baby_id", baby.id)
      .order("at", { ascending: false })
      .limit(500),
  ]);

  const total = (feeds?.length ?? 0) + (events?.length ?? 0);

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

      <RecordsTable feeds={(feeds ?? []) as FeedRow[]} events={(events ?? []) as EventRow[]} />
    </main>
  );
}
