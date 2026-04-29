type Feed = {
  start_at: string;
  end_at: string | null;
  feed_type: string | null;
};

const pad = (n: number) => String(n).padStart(2, "0");

const COLOR: Record<string, string> = {
  formula: "#60a5fa",
  breast_pumped: "#c4b5fd",
  breast_direct: "#f9a8d4",
};
const FALLBACK = "#9ca3af";

const HOUR_LABELS = [0, 3, 6, 9, 12, 15, 18, 21, 24];

function kstYmd(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function kstMinOfDay(iso: string): number {
  const d = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function shiftYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function WeekColumns({
  feeds,
  endDate,
}: {
  feeds: Feed[];
  endDate: string; // YYYY-MM-DD (last day of the 7-day window)
}) {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) days.push(shiftYmd(endDate, -i));

  const feedsByDay = new Map<string, Feed[]>();
  for (const d of days) feedsByDay.set(d, []);
  for (const f of feeds) {
    const list = feedsByDay.get(kstYmd(f.start_at));
    if (list) list.push(f);
  }

  return (
    <div className="rounded-2xl bg-white p-4 pb-2 dark:bg-neutral-900">
      <div className="grid grid-cols-[28px_repeat(7,minmax(0,1fr))_28px] gap-x-1">
        <div className="relative h-[480px]">
          {HOUR_LABELS.map((h) => (
            <span
              key={`l${h}`}
              style={{ top: `${(h / 24) * 100}%` }}
              className="absolute right-1 -translate-y-1/2 text-[11px] tabular-nums text-gray-400 dark:text-neutral-500"
            >
              {pad(h)}
            </span>
          ))}
        </div>

        {days.map((day) => {
          const list = feedsByDay.get(day) ?? [];
          return (
            <div
              key={day}
              className="relative h-[480px] rounded-sm bg-gray-50/80 dark:bg-neutral-800/60"
            >
              {HOUR_LABELS.slice(1, -1).map((h) => (
                <div
                  key={`g${h}`}
                  style={{ top: `${(h / 24) * 100}%` }}
                  className="pointer-events-none absolute inset-x-0 border-t border-gray-100 dark:border-neutral-800"
                />
              ))}
              {list.map((f, i) => {
                const start = kstMinOfDay(f.start_at);
                const end = f.end_at ? kstMinOfDay(f.end_at) : start + 12;
                const top = (start / 1440) * 100;
                const heightPct = Math.max(((end - start) / 1440) * 100, 0.6);
                const color = COLOR[f.feed_type ?? ""] ?? FALLBACK;
                return (
                  <div
                    key={i}
                    style={{
                      top: `${top}%`,
                      height: `${heightPct}%`,
                      background: color,
                    }}
                    className="absolute inset-x-0.5 rounded-[2px]"
                  />
                );
              })}
            </div>
          );
        })}

        <div className="relative h-[480px]">
          {HOUR_LABELS.map((h) => (
            <span
              key={`r${h}`}
              style={{ top: `${(h / 24) * 100}%` }}
              className="absolute left-1 -translate-y-1/2 text-[11px] tabular-nums text-gray-400 dark:text-neutral-500"
            >
              {pad(h)}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-1 grid grid-cols-[28px_repeat(7,minmax(0,1fr))_28px] gap-x-1">
        <div />
        {days.map((day) => {
          const d = Number(day.slice(-2));
          return (
            <div
              key={`d${day}`}
              className="text-center text-[11px] tabular-nums text-gray-500 dark:text-neutral-400"
            >
              {d}일
            </div>
          );
        })}
        <div />
      </div>
    </div>
  );
}
