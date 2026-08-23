"use client";

import { useState } from "react";
import { useIsNative } from "@/lib/native";

const PDF_URL = "/baby-chart.pdf";
const PDF_NAME = "snapfeed-신생아-기록지.pdf";

// The native shell has no back button, so a plain <a download> navigates the
// whole WebView into the PDF and strands the user. Inside the app we hand the
// file to the iOS share sheet instead (save to Files / send via KakaoTalk —
// which is what the chart is for anyway); if sharing is unavailable we show
// an in-app viewer with an explicit close button. The plain web keeps the
// normal download anchor.
export function ChartPdfButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const native = useIsNative();
  const [busy, setBusy] = useState(false);
  const [viewer, setViewer] = useState(false);

  if (!native) {
    return (
      <a href={PDF_URL} download className={className}>
        {children}
      </a>
    );
  }

  async function open() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(PDF_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const file = new File([blob], PDF_NAME, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "신생아 기록지" });
          return;
        } catch (err) {
          // Cancelling the share sheet is a no-op, not a fallback trigger.
          if (err instanceof Error && err.name === "AbortError") return;
        }
      }
      setViewer(true);
    } catch {
      setViewer(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={open} disabled={busy} className={className}>
        {children}
      </button>
      {viewer ? (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black/85">
          <div className="flex items-center justify-between px-4 pb-2 [padding-top:calc(env(safe-area-inset-top)+0.5rem)]">
            <span className="text-sm font-semibold text-white">신생아 기록지</span>
            <button
              type="button"
              onClick={() => setViewer(false)}
              className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold text-white active:scale-95"
            >
              닫기
            </button>
          </div>
          <iframe src={PDF_URL} title="신생아 기록지" className="w-full flex-1 bg-white" />
        </div>
      ) : null}
    </>
  );
}
