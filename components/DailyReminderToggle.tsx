"use client";

import { useEffect, useState } from "react";
import { useIsNative } from "@/lib/native";
import {
  cancelDailyReminder,
  isDailyReminderScheduled,
  scheduleDailyReminder,
} from "@/lib/notifications";
import { BellIcon } from "@/components/icons";

const REMINDER_HOUR = 21;

// Native-only settings row: an every-evening on-device nudge to photograph
// today's notebook page. Hidden entirely on the plain web.
export function DailyReminderToggle() {
  const native = useIsNative();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!native) return;
    isDailyReminderScheduled().then(setOn).catch(() => undefined);
  }, [native]);

  if (!native) return null;

  async function toggle() {
    setBusy(true);
    setDenied(false);
    try {
      if (on) {
        await cancelDailyReminder();
        setOn(false);
      } else {
        const ok = await scheduleDailyReminder(REMINDER_HOUR, 0);
        setOn(ok);
        if (!ok) setDenied(true);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            <BellIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-neutral-100">
              저녁 기록 알림
            </p>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              매일 밤 {REMINDER_HOUR - 12}시에 &ldquo;수첩 찍기&rdquo;를 알려드려요
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          disabled={busy}
          onClick={toggle}
          className={`relative h-8 w-14 shrink-0 rounded-full transition disabled:opacity-50 ${
            on ? "bg-amber-400" : "bg-gray-200 dark:bg-neutral-700"
          }`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
              on ? "left-7" : "left-1"
            }`}
          />
        </button>
      </div>
      {denied ? (
        <p className="mt-2 text-xs text-gray-500 dark:text-neutral-500">
          알림 권한이 꺼져 있어요. 아이폰 설정 → snapfeed에서 알림을 허용해주세요.
        </p>
      ) : null}
    </div>
  );
}
