type Feed = {
  start_at: string;
  volume_ml: number | null;
};

const pad = (n: number) => String(n).padStart(2, "0");

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dayLabel(key: string): string {
  const d = new Date(key + "T00:00:00+09:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function RangeBarChart({
  feeds,
  startDate,
  days,
}: {
  feeds: Feed[];
  startDate: string; // YYYY-MM-DD
  days: number;
}) {
  const start = new Date(startDate + "T00:00:00+09:00");

  const keys: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    keys.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  }

  const totals = new Map<string, { count: number; ml: number }>();
  for (const k of keys) totals.set(k, { count: 0, ml: 0 });
  for (const f of feeds) {
    const k = dayKey(f.start_at);
    const cur = totals.get(k);
    if (!cur) continue;
    cur.count += 1;
    cur.ml += f.volume_ml ?? 0;
  }
  const maxMl = [...totals.values()].reduce((m, v) => Math.max(m, v.ml), 0);
  const maxCount = [...totals.values()].reduce((m, v) => Math.max(m, v.count), 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700">일별 수유량</h3>
      <p className="mt-1 text-xs text-gray-500">
        {dayLabel(keys[0])} – {dayLabel(keys[keys.length - 1])} ({days}일)
      </p>
      <ul className="mt-4 flex flex-col gap-1 text-xs">
        {keys.map((k) => {
          const v = totals.get(k) ?? { count: 0, ml: 0 };
          const wMl = maxMl > 0 ? (v.ml / maxMl) * 100 : 0;
          return (
            <li key={k} className="flex items-center gap-2">
              <span className="w-12 tabular-nums text-gray-600">{dayLabel(k)}</span>
              <div className="relative h-4 flex-1 rounded bg-gray-100">
                <div
                  className="h-4 rounded bg-emerald-500"
                  style={{ width: `${wMl}%` }}
                />
              </div>
              <span className="w-28 text-right tabular-nums text-gray-700">
                {v.ml > 0 ? `${v.ml}ml · ${v.count}회` : "—"}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-gray-400">
        최대: {maxMl > 0 ? `${maxMl}ml` : "—"} / {maxCount}회
      </p>
    </div>
  );
}
