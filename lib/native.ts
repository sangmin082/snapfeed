"use client";

import { useSyncExternalStore } from "react";

// Detect whether we're running inside the Capacitor native shell (iOS/Android)
// vs a plain browser/PWA. Uses the global Capacitor injects at runtime so we
// never import @capacitor/core during SSR (avoids hydration/runtime issues).
type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  isNative?: boolean;
  getPlatform?: () => string;
};

function cap(): CapacitorGlobal | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
}

export function isNativePlatform(): boolean {
  const c = cap();
  return Boolean(c?.isNativePlatform?.() ?? c?.isNative);
}

export function platform(): "ios" | "android" | "web" {
  const p = cap()?.getPlatform?.();
  return p === "ios" || p === "android" ? p : "web";
}

// SSR-safe React hook: returns false during server render / hydration, then the
// real value on the client. Uses useSyncExternalStore (no effect) so it avoids
// the set-state-in-effect lint and any hydration mismatch.
const subscribe = () => () => {};
export function useIsNative(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isNativePlatform(),
    () => false,
  );
}
