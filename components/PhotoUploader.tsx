"use client";

import { useRef, useState } from "react";
import { resizeImageToBlob } from "@/lib/resizeImage";
import type { ExtractResult } from "@/lib/schema";

export type ExtractResponse = {
  source_photo: string;
  transcript: string;
  result: ExtractResult;
  warning?: string;
};

type Props = {
  referenceDate?: string;
  onExtracted: (resp: ExtractResponse) => void;
};

export function PhotoUploader({ referenceDate, onExtracted }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "resizing" | "uploading">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      setState("resizing");
      const blob = await resizeImageToBlob(file);

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
      onExtracted(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setState("idle");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const busy = state !== "idle";
  const label =
    state === "resizing" ? "사진 압축 중…" : state === "uploading" ? "인식 중…" : "📷 사진 찍어 기록하기";

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
        disabled={busy}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="rounded-xl bg-black px-6 py-4 text-lg font-medium text-white shadow-sm disabled:opacity-50"
      >
        {label}
      </button>
      {error ? <p className="text-sm text-red-600">오류: {error}</p> : null}
    </div>
  );
}
