"use client";

import { useRef, useState } from "react";
import { useIsNative } from "@/lib/native";
import {
  drawWeeklyReportCard,
  type WeeklyReportData,
} from "@/lib/report-card";

// Renders the "share this week" block on /stats: generates a 1080×1350
// image card on canvas and hands it to the OS share sheet (KakaoTalk etc.),
// falling back to a plain download where Web Share can't send files.
export function WeeklyReportCard({ data }: { data: WeeklyReportData }) {
  const native = useIsNative();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveHint, setSaveHint] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function makeBlob(): Promise<Blob> {
    const canvas = canvasRef.current ?? document.createElement("canvas");
    canvasRef.current = canvas;
    const fontFamily = getComputedStyle(document.body).fontFamily;
    drawWeeklyReportCard(canvas, data, fontFamily);
    // Wait for document fonts so Korean text isn't drawn with a fallback face.
    await document.fonts?.ready?.catch?.(() => undefined);
    drawWeeklyReportCard(canvas, data, fontFamily);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("이미지 생성 실패"))),
        "image/png",
      ),
    );
  }

  async function handleShare() {
    setBusy(true);
    setError(null);
    try {
      const blob = await makeBlob();
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });
      const file = new File([blob], "snapfeed-weekly.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "snapfeed 주간 리포트" });
          return;
        } catch (err) {
          // User cancelling the sheet is not an error.
          if (err instanceof Error && err.name === "AbortError") return;
        }
      }
      if (native) {
        // WKWebView ignores the download attribute and would navigate the
        // whole (back-button-less) webview into the image — never do that.
        // The preview is already rendered; tell the user to long-press it.
        setSaveHint(true);
        return;
      }
      // Web fallback: download the image.
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "snapfeed-weekly.png";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm dark:border-amber-900 dark:bg-neutral-900">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-neutral-200">
          주간 리포트 카드
        </h2>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          공유
        </span>
      </header>
      <p className="mt-1.5 text-xs leading-relaxed text-gray-500 dark:text-neutral-400">
        최근 7일 수유 요약을 이미지 한 장으로 만들어 가족에게 공유해보세요.
      </p>
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="주간 리포트 미리보기"
          className="mt-3 w-full rounded-xl ring-1 ring-gray-900/5"
        />
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={handleShare}
        className="mt-3 w-full rounded-xl bg-amber-300 px-4 py-3 text-sm font-bold text-amber-950 transition hover:bg-amber-400 active:scale-[0.99] disabled:opacity-50"
      >
        {busy ? "이미지 만드는 중…" : previewUrl ? "다시 공유하기" : "이미지 카드 만들어 공유"}
      </button>
      {saveHint ? (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
          위 미리보기 이미지를 길게 눌러 &ldquo;사진에 추가&rdquo;로 저장할 수 있어요.
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">오류: {error}</p>
      ) : null}
    </section>
  );
}
