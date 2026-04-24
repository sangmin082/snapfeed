"use client";

import { useRouter } from "next/navigation";

type View = "day" | "week" | "month";

const VIEW_LABEL: Record<View, string> = {
  day: "일",
  week: "주",
  month: "월",
};

function formatDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00+09:00");
  const w = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} (${w})`;
}

export function StatsControls({
  currentView,
  currentDate,
  availableDates,
}: {
  currentView: View;
  currentDate: string;
  availableDates: string[];
}) {
  const router = useRouter();

  function navigate(view: View, date: string) {
    const params = new URLSearchParams({ view, date });
    router.push(`/stats?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex rounded-full border border-gray-200 bg-gray-50 p-1">
        {(["day", "week", "month"] as View[]).map((v) => {
          const active = v === currentView;
          return (
            <button
              key={v}
              type="button"
              onClick={() => navigate(v, currentDate)}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {VIEW_LABEL[v]}
            </button>
          );
        })}
      </div>

      {availableDates.length > 0 ? (
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          기준 날짜 (기록 있는 날만)
          <select
            value={currentDate}
            onChange={(e) => navigate(currentView, e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
          >
            {availableDates.map((d) => (
              <option key={d} value={d}>
                {formatDateLabel(d)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}
