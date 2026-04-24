import Link from "next/link";
import { requireUserAndBaby } from "@/lib/auth";
import { serverSupabase } from "@/lib/supabase-server";
import { StatsControls } from "@/components/StatsControls";
import { DayTimeline } from "@/components/DayTimeline";
import { RangeBarChart } from "@/components/RangeBarChart";

export const dynamic = "force-dynamic";

type View = "day" | "week" | "month";

type Feed = {
  start_at: string;
  end_at: string | null;
  volume_ml: number | null;
  feed_type: string | null;
};

type Props = {
  searchParams: Promise<{ view?: string; date?: string }>;
};

const pad = (n: number) => String(n).padStart(2, "0");

function toKstYmd(iso: string): string {
  const d = new Date(iso);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return `${kst.getUTCFullYear()}-${pad(kst.getUTCMonth() + 1)}-${pad(kst.getUTCDate())}`;
}

function todayKstYmd(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return `${kst.getUTCFullYear()}-${pad(kst.getUTCMonth() + 1)}-${pad(kst.getUTCDate())}`;
}

function intervalText(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

export default async function StatsPage({ searchParams }: Props) {
  const { baby } = await requireUserAndBaby();
  const supabase = await serverSupabase();
  const sp = await searchParams;
  const view: View = sp.view === "week" || sp.view === "month" ? sp.view : "day";

  // All dates that have at least one feed (KST)
  const { data: allFeeds } = await supabase
    .from("feeds")
    .select("start_at")
    .eq("baby_id", baby.id)
    .order("start_at", { ascending: false });

  const availableDatesSet = new Set<string>();
  for (const r of allFeeds ?? []) availableDatesSet.add(toKstYmd(r.start_at));
  const availableDates = [...availableDatesSet].sort().reverse();
  const latestDate = availableDates[0] ?? todayKstYmd();
  const selectedDate =
    sp.date && availableDatesSet.has(sp.date) ? sp.date : latestDate;

  // Compute UTC range based on view, anchored to KST day
  const startKst = new Date(selectedDate + "T00:00:00+09:00");
  const rangeDays = view === "day" ? 1 : view === "week" ? 7 : 30;
  const endKst = new Date(startKst);
  endKst.setDate(endKst.getDate() + rangeDays);

  const { data: rangeFeeds } = await supabase
    .from("feeds")
    .select("start_at,end_at,volume_ml,feed_type")
    .eq("baby_id", baby.id)
    .gte("start_at", startKst.toISOString())
    .lt("start_at", endKst.toISOString())
    .order("start_at", { ascending: true });

  const feeds = (rangeFeeds ?? []) as Feed[];

  // Stats for the range
  const totalCount = feeds.length;
  const totalMl = feeds.reduce((s, f) => s + (f.volume_ml ?? 0), 0);

  const intervals: number[] = [];
  for (let i = 1; i < feeds.length; i++) {
    const diff =
      (new Date(feeds[i].start_at).getTime() -
        new Date(feeds[i - 1].start_at).getTime()) /
      60_000;
    if (diff > 0 && diff < 24 * 60) intervals.push(diff);
  }
  const avgInterval =
    intervals.length > 0
      ? Math.round(intervals.reduce((s, v) => s + v, 0) / intervals.length)
      : null;

  const viewLabel = view === "day" ? "일" : view === "week" ? "주" : "월";

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">패턴 분석</h1>
          <p className="text-sm text-gray-500">{baby.name}</p>
        </div>
        <Link href="/" className="text-sm text-gray-500 underline-offset-4 hover:text-gray-900 hover:underline">
          홈
        </Link>
      </header>

      <StatsControls
        currentView={view}
        currentDate={selectedDate}
        availableDates={availableDates}
      />

      <section className="grid grid-cols-3 gap-3">
        <SummaryCard label={`${viewLabel} 수유 횟수`} value={`${totalCount}회`} />
        <SummaryCard label={`${viewLabel} 합계`} value={totalMl > 0 ? `${totalMl}ml` : "—"} />
        <SummaryCard
          label="평균 수유 텀"
          value={avgInterval != null ? intervalText(avgInterval) : "—"}
          hint={intervals.length > 0 ? `${intervals.length}개 샘플` : undefined}
        />
      </section>

      {view === "day" ? (
        <DayTimeline feeds={feeds} />
      ) : (
        <RangeBarChart
          feeds={feeds}
          startDate={selectedDate}
          days={rangeDays}
        />
      )}

      {availableDates.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
          아직 수유 기록이 없습니다.{" "}
          <Link href="/upload" className="font-medium text-emerald-700 underline-offset-4 hover:underline">
            지금 기록하기
          </Link>
        </div>
      ) : null}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900">{value}</p>
      {hint ? <p className="mt-0.5 text-[10px] text-gray-400">{hint}</p> : null}
    </div>
  );
}
