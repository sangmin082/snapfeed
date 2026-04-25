import { Fragment } from "react";

type Feed = {
  start_at: string;
  end_at: string | null;
  volume_ml: number | null;
  feed_type: string | null;
};

const pad = (n: number) => String(n).padStart(2, "0");

function hhmm(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function durationMin(f: Feed): number | null {
  if (!f.end_at) return null;
  const m = Math.round((new Date(f.end_at).getTime() - new Date(f.start_at).getTime()) / 60_000);
  return m > 0 ? m : null;
}

function pillLabel(f: Feed): string {
  const d = durationMin(f);
  if (d != null) return `${hhmm(f.start_at)} (${d}분)`;
  if (f.volume_ml != null) return `${hhmm(f.start_at)} (${f.volume_ml}ml)`;
  return hhmm(f.start_at);
}

function intervalLabel(a: string, b: string): string {
  const mins = (new Date(b).getTime() - new Date(a).getTime()) / 60_000;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}분 간격`;
  if (m === 0) return `${h}시간 간격`;
  return `${h}시간 ${m}분 간격`;
}

export function DayTimeline({ feeds }: { feeds: Feed[] }) {
  if (feeds.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-500">
        이 날은 수유 기록이 없습니다.
      </div>
    );
  }

  const sorted = [...feeds].sort((a, b) => a.start_at.localeCompare(b.start_at));
  const feedByHour = new Map<number, Feed[]>();
  for (const f of sorted) {
    const h = new Date(f.start_at).getHours();
    const list = feedByHour.get(h) ?? [];
    list.push(f);
    feedByHour.set(h, list);
  }
  const hoursWithFeed = [...feedByHour.keys()].sort((a, b) => a - b);
  const minH = hoursWithFeed[0];
  const maxH = hoursWithFeed[hoursWithFeed.length - 1];
  const hours: number[] = [];
  for (let h = minH; h <= maxH; h++) hours.push(h);

  const midLabels = new Map<number, string>();
  for (let i = 1; i < sorted.length; i++) {
    const prevH = new Date(sorted[i - 1].start_at).getHours();
    const currH = new Date(sorted[i].start_at).getHours();
    if (currH - prevH < 2) continue;
    const midH = Math.floor((prevH + currH) / 2);
    if (!feedByHour.has(midH)) {
      midLabels.set(midH, intervalLabel(sorted[i - 1].start_at, sorted[i].start_at));
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-pink-200 bg-white shadow-sm dark:border-pink-900 dark:bg-neutral-900">
      <div className="grid grid-cols-[4rem_1fr] bg-pink-100 text-xs font-semibold text-pink-700 dark:bg-pink-950/50 dark:text-pink-300">
        <div className="px-2 py-2 text-center">시간(시)</div>
        <div className="px-2 py-2 text-center">수유 간격</div>
      </div>
      <div className="grid grid-cols-[4rem_1fr]">
        {hours.map((h) => {
          const feedsAtHour = feedByHour.get(h);
          const midLabel = midLabels.get(h);
          return (
            <Fragment key={h}>
              <div className="flex h-12 items-center justify-center border-t border-pink-100 text-sm tabular-nums text-gray-600 dark:border-pink-950/60 dark:text-neutral-400">
                {h}
              </div>
              <div className="relative flex h-12 items-center border-t border-pink-100 px-4 dark:border-pink-950/60">
                <div className="pointer-events-none absolute top-0 bottom-0 left-6 w-px border-l border-dashed border-pink-300 dark:border-pink-800" />
                {feedsAtHour ? (
                  <div className="relative z-10 flex flex-wrap gap-1">
                    {feedsAtHour.map((f, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-pink-400 px-3 py-1 text-xs font-semibold text-white shadow-sm dark:bg-pink-500"
                      >
                        {pillLabel(f)}
                      </span>
                    ))}
                  </div>
                ) : null}
                {midLabel ? (
                  <span className="relative z-10 ml-auto text-xs font-medium text-gray-700 dark:text-neutral-300">
                    {midLabel}
                  </span>
                ) : null}
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
