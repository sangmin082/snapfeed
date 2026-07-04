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
