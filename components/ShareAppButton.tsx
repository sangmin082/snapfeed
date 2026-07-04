"use client";

import { useState } from "react";

const SHARE_URL = "https://snapfeed.sangmin082.workers.dev";
const SHARE_TEXT =
  "수첩에 손으로 적은 수유 기록, 사진 한 장이면 AI가 정리해줘요 — snapfeed";

// Native share sheet when available (iOS WebView supports navigator.share),
// clipboard fallback on desktop web.
export function ShareAppButton({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "snapfeed", text: SHARE_TEXT, url: SHARE_URL });
      } catch {
        // user dismissed the sheet — fine
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${SHARE_TEXT}\n${SHARE_URL}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — nothing sensible to do
    }
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {copied ? "링크를 복사했어요 ✓" : "육아 친구에게 snapfeed 공유하기"}
    </button>
  );
}
