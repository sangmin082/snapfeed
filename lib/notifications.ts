"use client";

import { isNativePlatform } from "./native";

// Local (on-device) feeding reminders. Native value-add that helps satisfy
// App Store Guideline 4.2 — this is genuine app functionality a plain website
// can't offer. No server / push infra needed; everything is on-device.

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const current = await LocalNotifications.checkPermissions();
  if (current.display === "granted") return true;
  if (current.display === "denied") return false;
  const requested = await LocalNotifications.requestPermissions();
  return requested.display === "granted";
}

/**
 * Schedule a one-off "time to feed" reminder `hoursFromNow` from now.
 * Returns false if not native or permission was refused.
 */
export async function scheduleFeedReminder(hoursFromNow = 3): Promise<boolean> {
  const granted = await ensureNotificationPermission();
  if (!granted) return false;

  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const at = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);

  await LocalNotifications.schedule({
    notifications: [
      {
        // Keep ids in a stable small range so we can cancel/replace.
        id: 1001,
        title: "수유 시간이에요 🍼",
        body: `마지막 기록에서 약 ${hoursFromNow}시간이 지났어요. 수유를 기록해보세요.`,
        schedule: { at },
      },
    ],
  });
  return true;
}

export async function cancelFeedReminder(): Promise<void> {
  if (!isNativePlatform()) return;
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });
}

// ── Daily "photograph the notebook" reminder ────────────────────────────
// Repeats every evening on-device. Targets the retention gap where a page
// gets written all day but never photographed.

const DAILY_REMINDER_ID = 1002;

export async function scheduleDailyReminder(hour = 21, minute = 0): Promise<boolean> {
  const granted = await ensureNotificationPermission();
  if (!granted) return false;

  const { LocalNotifications } = await import("@capacitor/local-notifications");
  await LocalNotifications.schedule({
    notifications: [
      {
        id: DAILY_REMINDER_ID,
        title: "오늘 수첩 찍으셨나요? 📷",
        body: "하루가 끝나기 전에 수유 수첩을 찰칵 — 1분이면 기록 끝!",
        schedule: { on: { hour, minute }, allowWhileIdle: true },
      },
    ],
  });
  return true;
}

export async function cancelDailyReminder(): Promise<void> {
  if (!isNativePlatform()) return;
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  await LocalNotifications.cancel({ notifications: [{ id: DAILY_REMINDER_ID }] });
}

export async function isDailyReminderScheduled(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const pending = await LocalNotifications.getPending();
  return pending.notifications.some((n) => n.id === DAILY_REMINDER_ID);
}
