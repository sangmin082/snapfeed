"use client";

import { useState } from "react";
import { useIsNative } from "@/lib/native";
import { scheduleFeedReminder } from "@/lib/notifications";

// Shown only inside the native shell — lets the parent schedule an on-device
// "time to feed" reminder. This is real native functionality (local
// notifications) that the plain web app can't offer.
export function FeedReminderButton({ hoursFromNow = 3 }: { hoursFromNow?: number }) {
  const native = useIsNative();
  const [status, setStatus] = useState<"idle" | "scheduling" | "scheduled" | "denied">("idle");

  if (!native) return null;

  async function onClick() {
    setStatus("scheduling");
    const ok = await scheduleFeedReminder(hoursFromNow);
    setStatus(ok ? "scheduled" : "denied");
  }

  if (status === "scheduled") {
    return (
      <p className="text-center text-sm text-emerald-700 dark:text-emerald-300">
        🔔 {hoursFromNow}시간 후 수유 알림을 예약했어요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={status === "scheduling"}
        onClick={onClick}
        className="rounded-full border border-emerald-600 px-6 py-3 text-center text-base font-semibold text-emerald-700 disabled:opacity-50 dark:border-emerald-400 dark:text-emerald-300"
      >
        {status === "scheduling" ? "예약 중…" : `🔔 ${hoursFromNow}시간 후 수유 알림 받기`}
      </button>
      {status === "denied" ? (
        <p className="text-center text-xs text-gray-500 dark:text-neutral-500">
          알림 권한이 꺼져 있어요. 설정에서 알림을 켜주세요.
        </p>
      ) : null}
    </div>
  );
}
