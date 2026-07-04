"use client";

import { useEffect } from "react";
import { isNativePlatform } from "@/lib/native";

// Universal-link handler for the native shell. When iOS opens the app from a
// link on our domain (e.g. the email-confirmation link), Capacitor fires
// appUrlOpen — navigate the WebView to that path so the flow continues
// inside the app instead of Safari.
export function DeepLinkListener() {
  useEffect(() => {
    if (!isNativePlatform()) return;
    let remove: (() => void) | undefined;
    import("@capacitor/app").then(({ App }) => {
      App.addListener("appUrlOpen", ({ url }) => {
        try {
          const u = new URL(url);
          window.location.href = u.pathname + u.search + u.hash;
        } catch {
          // Non-URL payload — ignore.
        }
      }).then((handle) => {
        remove = () => handle.remove();
      });
    });
    return () => remove?.();
  }, []);
  return null;
}
