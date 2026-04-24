import Link from "next/link";
import { requireUserAndBaby } from "@/lib/auth";
import { serverSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Feed = {
  start_at: string;
  volume_ml: number | null;
};

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function StatsPage() {
  const { baby } = await requireUserAndBaby();
  const supabase = await serverSupabase();

  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("feeds")
    .select("start_at,volume_ml")
    .eq("baby_id", baby.id)
    .gte("start_at", since.toISOString())
    .order("start_at", { ascending: true });

  if (error) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-bold">패턴 분석</h1>
        <p className="mt-4 text-sm text-red-600">불러오기 실패: {error.message}</p>
      </main>
    );
  }

  const feeds = (data ?? []) as Feed[];

  const dailyMap = new Map<string, { count: number; totalMl: number }>();
  const hourCounts = new Array<number>(24).fill(0);
  const intervalsMin: number[] = [];
  let prev: Date | null = null;

  for (const f of feeds) {
    const d = new Date(f.start_at);
    const k = dayKey(f.start_at);
    const cur = dailyMap.get(k) ?? { count: 0, totalMl: 0 };
    cur.count += 1;
    cur.totalMl += f.volume_ml ?? 0;
    dailyMap.set(k, cur);

    hourCounts[d.getHours()] += 1;

    if (prev) {
      const diff = (d.getTime() - prev.getTime()) / 60_000;
      if (diff > 0 && diff < 24 * 60) intervalsMin.push(diff);
    }
    prev = d;
  }

  const days = [...dailyMap.entries()].sort(([a], [b]) => (a < b ? 1 : -1));
  const maxTotal = days.reduce((m, [, v]) => Math.max(m, v.totalMl), 0);
  const maxHour = hourCounts.reduce((m, v) => Math.max(m, v), 0);
  const avgInterval =
    intervalsMin.length > 0
      ? Math.round(intervalsMin.reduce((s, v) => s + v, 0) / intervalsMin.length)
      : null;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">패턴 분석</h1>
          <p className="text-sm text-gray-500">{baby.name}</p>
        </div>
        <Link href="/" className="text-sm text-gray-500 underline">홈</Link>
      </header>

      <section>
        <h2 className="mb-2 text-lg font-semibold">일일 수유량 (최근 14일)</h2>
        {days.length === 0 ? (
          <p className="text-sm text-gray-500">아직 데이터가 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {days.map(([day, v]) => (
              <li key={day} className="flex items-center gap-2">
                <span className="w-24 text-gray-600">{day}</span>
                <div className="h-4 flex-1 rounded bg-gray-100">
                  <div
                    className="h-4 rounded bg-emerald-500"
                    style={{ width: `${maxTotal > 0 ? (v.totalMl / maxTotal) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-24 text-right text-gray-700">
                  {v.totalMl} ml · {v.count}회
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">시간대 분포 (0–23시)</h2>
        <div className="grid grid-cols-12 gap-1">
          {hourCounts.map((c, h) => (
            <div key={h} className="flex flex-col items-center gap-1 text-[10px] text-gray-500">
              <div
                className="w-full rounded bg-indigo-500"
                style={{
                  height: `${maxHour > 0 ? 6 + (c / maxHour) * 40 : 6}px`,
                  opacity: c > 0 ? 1 : 0.15,
                }}
              />
              <span>{h}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">평균 수유 간격</h2>
        <p className="text-3xl font-semibold">
          {avgInterval ? `${Math.floor(avgInterval / 60)}시간 ${avgInterval % 60}분` : "—"}
        </p>
        <p className="text-xs text-gray-500">연속된 수유 간 간격의 평균 ({intervalsMin.length}개 샘플)</p>
      </section>
    </main>
  );
}
