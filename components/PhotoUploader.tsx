"use client";

import { useRef, useState } from "react";
import { resizeImageToBlob } from "@/lib/resizeImage";
import type { ExtractResult } from "@/lib/schema";

export type ExtractResponse = {
  source_photo: string;
  transcript: string;
  result: ExtractResult;
  warning?: string;
  /** Local blob URL for the resized image, for visual verification. */
  preview_url?: string;
};

type Props = {
  referenceDate?: string;
  onExtracted: (resp: ExtractResponse) => void;
};

export function PhotoUploader({ referenceDate, onExtracted }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "resizing" | "uploading">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    setError(null);
    let previewUrl: string | undefined;
    try {
      setState("resizing");
      const blob = await resizeImageToBlob(file);
      previewUrl = URL.createObjectURL(blob);

      setState("uploading");
      const form = new FormData();
      form.append("image", blob, "feed.jpg");
      form.append(
        "reference_date",
        referenceDate ?? new Date().toISOString().slice(0, 10),
      );
      const res = await fetch("/api/extract", { method: "POST", body: form });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json = (await res.json()) as ExtractResponse;
      onExtracted({ ...json, preview_url: previewUrl });
      previewUrl = undefined; // ownership handed off
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    } finally {
      setState("idle");
      input.value = "";
    }
  }

  const busy = state !== "idle";
  const cameraLabel =
    state === "resizing" ? "사진 압축 중…" : state === "uploading" ? "인식 중…" : "📷 사진 찍어 기록하기";

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
        disabled={busy}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={busy}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => cameraRef.current?.click()}
        className="rounded-xl bg-black px-6 py-4 text-lg font-medium text-white shadow-sm disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {cameraLabel}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => libraryRef.current?.click()}
        className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-800 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
      >
        🖼️ 사진 선택하기
      </button>
      {error ? <p className="text-sm text-red-600 dark:text-red-400">오류: {error}</p> : null}
    </div>
  );
}
