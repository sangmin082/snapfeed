import Link from "next/link";
import { requireUserAndBaby } from "@/lib/auth";
import { serverSupabase } from "@/lib/supabase-server";
import { StatsControls } from "@/components/StatsControls";
import { DayClock } from "@/components/DayClock";
import { WeekColumns } from "@/components/WeekColumns";

export const dynamic = "force-dynamic";

type View = "day" | "week";

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

function todayKstYmd(): string {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function shiftYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

function daysBetween(fromYmd: string, toYmd: string): number {
  const [y1, m1, d1] = fromYmd.split("-").map(Number);
  const [y2, m2, d2] = toYmd.split("-").map(Number);
  const a = Date.UTC(y1, m1 - 1, d1);
  const b = Date.UTC(y2, m2 - 1, d2);
  return Math.round((b - a) / 86_400_000);
}

function ageString(birthYmd: string, asOfYmd: string): string {
  const [by, bm, bd] = birthYmd.split("-").map(Number);
  const [ay, am, ad] = asOfYmd.split("-").map(Number);
  let months = (ay - by) * 12 + (am - bm);
  let days = ad - bd;
  if (days < 0) {
    months -= 1;
    const prevMonthDays = new Date(Date.UTC(ay, am - 1, 0)).getUTCDate();
    days += prevMonthDays;
  }
  const manse = Math.floor(months / 12);
  const koreanAge = ay - by + 1;
  return `${months}개월 ${days}일, ${koreanAge}살(만${manse}세)`;
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
  const view: View = sp.view === "week" ? "week" : "day";

  const today = todayKstYmd();
  const requested = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today;
  const selectedDate = requested > today ? today : requested;

  const startKst =
    view === "day"
      ? new Date(selectedDate + "T00:00:00+09:00")
      : new Date(shiftYmd(selectedDate, -6) + "T00:00:00+09:00");
  const rangeDays = view === "day" ? 1 : 7;
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

  const dPlus = view === "day" ? daysBetween(baby.birth_date, selectedDate) + 1 : null;
  const ageLabel = ageString(baby.birth_date, selectedDate);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-4 pb-10">
      <header className="relative flex h-10 items-center justify-center">
        <Link
          href="/"
          aria-label="뒤로"
          className="absolute left-0 grid h-10 w-10 place-items-center text-2xl text-gray-700 dark:text-neutral-300"
        >
          ‹
        </Link>
        <h1 className="text-base font-semibold tracking-tight text-gray-900 dark:text-neutral-100">
          기록 패턴
        </h1>
      </header>

      <StatsControls currentView={view} currentDate={selectedDate} />

      <CategoryChips />

      {view === "day" ? (
        <>
          <DayClock feeds={feeds} dPlus={dPlus} />
          <p className="text-center text-sm text-gray-500 dark:text-neutral-500">
            <span className="text-gray-700 dark:text-neutral-300">{baby.name}</span>
            <span className="mx-1.5 text-gray-300 dark:text-neutral-700">•</span>
            {ageLabel}
          </p>
        </>
      ) : (
        <>
          <WeekColumns feeds={feeds} endDate={selectedDate} />
          <p className="text-center text-sm text-gray-500 dark:text-neutral-500">
            <span className="text-gray-700 dark:text-neutral-300">{baby.name}</span>
            <span className="mx-1.5 text-gray-300 dark:text-neutral-700">•</span>
            {ageLabel}
          </p>
        </>
      )}

      <section className="rounded-2xl border border-pink-200 bg-white p-4 shadow-sm dark:border-pink-900 dark:bg-neutral-900">
        <header className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-neutral-200">
            🍼 분유/유축/모유 수유 통계
          </h2>
          <span className="text-gray-300 dark:text-neutral-600">›</span>
        </header>
        <div className="mt-4 space-y-3 text-sm">
          <StatRow label="횟수" value={`${totalCount}회`} />
          <StatRow label="용량" value={totalMl > 0 ? `${totalMl}ml` : "— ml"} />
          <StatRow
            label="평균 텀"
            value={avgInterval != null ? intervalText(avgInterval) : "—"}
          />
        </div>
      </section>
    </main>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500 dark:text-neutral-500">{label}</span>
      <span className="font-semibold tabular-nums text-gray-900 dark:text-neutral-100">{value}</span>
    </div>
  );
}

const CHIPS: { key: string; label: string; tone: string; emoji: string }[] = [
  {
    key: "formula",
    label: "분유",
    tone: "ring-blue-200 bg-blue-50 dark:ring-blue-900 dark:bg-blue-950/40",
    emoji: "🍼",
  },
  {
    key: "breast_pumped",
    label: "유축",
    tone: "ring-violet-200 bg-violet-50 dark:ring-violet-900 dark:bg-violet-950/40",
    emoji: "📣",
  },
  {
    key: "breast_direct",
    label: "모유",
    tone: "ring-pink-200 bg-pink-50 dark:ring-pink-900 dark:bg-pink-950/40",
    emoji: "🤱",
  },
];

function CategoryChips() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {CHIPS.map((c) => (
        <span
          key={c.key}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium text-gray-700 ring-1 dark:text-neutral-200 ${c.tone}`}
        >
          <span aria-hidden>{c.emoji}</span>
          {c.label}
        </span>
      ))}
    </div>
  );
}
