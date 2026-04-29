"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

type View = "day" | "week";

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

function fmtMonthDay(ymd: string): string {
  const [, m, d] = ymd.split("-");
  return `${m}월 ${Number(d)}일`;
}

export function StatsControls({
  currentView,
  currentDate,
}: {
  currentView: View;
  currentDate: string;
}) {
  const router = useRouter();
  const today = todayKstYmd();
  const dateInputRef = useRef<HTMLInputElement>(null);

  function navigate(view: View, date: string) {
    const params = new URLSearchParams({ view, date });
    router.push(`/stats?${params.toString()}`);
  }

  function openDatePicker() {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
        return;
      } catch {
        // fall through to focus/click on browsers that reject showPicker
      }
    }
    input.focus();
    input.click();
  }

  const step = currentView === "week" ? 7 : 1;
  const prevDate = shiftYmd(currentDate, -step);
  const nextDate = shiftYmd(currentDate, step);
  const canGoNext = nextDate <= today;

  let label: string;
  if (currentView === "day") {
    label = `${fmtMonthDay(currentDate)}${currentDate === today ? " (오늘)" : ""}`;
  } else {
    const start = shiftYmd(currentDate, -6);
    label = `${fmtMonthDay(start)} ~ ${fmtMonthDay(currentDate)}`;
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex rounded-full bg-gray-100 p-1 dark:bg-neutral-800">
        {(["day", "week"] as View[]).map((v) => {
          const active = v === currentView;
          return (
            <button
              key={v}
              type="button"
              onClick={() => navigate(v, currentDate)}
              className={`min-w-20 rounded-full px-6 py-1.5 text-sm font-semibold transition ${
                active
                  ? v === "day"
                    ? "bg-white text-pink-500 shadow-sm ring-1 ring-pink-200 dark:bg-neutral-900 dark:text-pink-300 dark:ring-pink-900"
                    : "bg-white text-emerald-500 shadow-sm ring-1 ring-emerald-200 dark:bg-neutral-900 dark:text-emerald-300 dark:ring-emerald-900"
                  : "text-gray-400 dark:text-neutral-500"
              }`}
            >
              {v === "day" ? "일" : "주"}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 text-gray-700 dark:text-neutral-200">
        <button
          type="button"
          onClick={() => navigate(currentView, prevDate)}
          aria-label="이전"
          className="grid h-7 w-7 place-items-center text-gray-400 hover:text-gray-700 dark:text-neutral-500 dark:hover:text-neutral-200"
        >
          ‹
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={openDatePicker}
            className="flex items-center gap-2 text-base font-semibold tabular-nums hover:text-gray-900 dark:hover:text-neutral-50"
          >
            <span aria-hidden className="text-gray-500 dark:text-neutral-400">📅</span>
            <span>{label}</span>
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={currentDate}
            max={today}
            onChange={(e) => {
              const v = e.target.value;
              if (v && v <= today) navigate(currentView, v);
            }}
            aria-label="날짜 선택"
            tabIndex={-1}
            className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          />
        </div>
        <button
          type="button"
          onClick={() => canGoNext && navigate(currentView, nextDate)}
          aria-label="다음"
          disabled={!canGoNext}
          className="grid h-7 w-7 place-items-center text-gray-400 hover:text-gray-700 disabled:opacity-30 dark:text-neutral-500 dark:hover:text-neutral-200"
        >
          ›
        </button>
      </div>
    </div>
  );
}
