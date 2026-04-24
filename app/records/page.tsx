import Link from "next/link";
import { requireUserAndBaby } from "@/lib/auth";
import { serverSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const FEED_TYPE_LABEL: Record<string, string> = {
  breast_direct: "직수",
  breast_pumped: "유축",
  formula: "분유",
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  diaper_pee: "소변",
  diaper_poop: "대변",
  sleep: "수면",
  note: "메모",
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", { hour12: false });
}

export default async function RecordsPage() {
  const { baby } = await requireUserAndBaby();
  const supabase = await serverSupabase();

  const [{ data: feeds, error: feedErr }, { data: events, error: eventErr }] = await Promise.all([
    supabase
      .from("feeds")
      .select("*")
      .eq("baby_id", baby.id)
      .order("start_at", { ascending: false })
      .limit(100),
    supabase
      .from("events")
      .select("*")
      .eq("baby_id", baby.id)
      .order("at", { ascending: false })
      .limit(100),
  ]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">기록 목록</h1>
          <p className="text-sm text-gray-500">{baby.name}</p>
        </div>
        <Link href="/" className="text-sm text-gray-500 underline">홈</Link>
      </header>

      <section>
        <h2 className="mb-2 text-lg font-semibold">수유 ({feeds?.length ?? 0})</h2>
        {feedErr ? (
          <p className="text-sm text-red-600">불러오기 실패: {feedErr.message}</p>
        ) : !feeds || feeds.length === 0 ? (
          <p className="text-sm text-gray-500">아직 기록이 없습니다.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {feeds.map((f) => (
              <li key={f.id} className="p-3 text-sm">
                <div className="flex justify-between">
                  <span>{fmt(f.start_at)}</span>
                  <span className="text-gray-500">
                    {FEED_TYPE_LABEL[f.feed_type] ?? "—"} · {f.volume_ml ?? "—"} ml
                  </span>
                </div>
                {f.notes ? <div className="mt-1 text-gray-600">{f.notes}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">이벤트 ({events?.length ?? 0})</h2>
        {eventErr ? (
          <p className="text-sm text-red-600">불러오기 실패: {eventErr.message}</p>
        ) : !events || events.length === 0 ? (
          <p className="text-sm text-gray-500">아직 이벤트가 없습니다.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {events.map((e) => (
              <li key={e.id} className="p-3 text-sm">
                <div className="flex justify-between">
                  <span>{fmt(e.at)}</span>
                  <span className="text-gray-500">{EVENT_TYPE_LABEL[e.event_type] ?? e.event_type}</span>
                </div>
                {e.details ? (
                  <div className="mt-1 text-gray-600">{JSON.stringify(e.details)}</div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
