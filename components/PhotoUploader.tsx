"use client";

import { useRef, useState } from "react";
import { resizeImageToBlob } from "@/lib/resizeImage";
import { useIsNative } from "@/lib/native";
import { CameraIcon, PictureIcon } from "@/components/icons";
import type { ExtractResult } from "@/lib/schema";

function todayKstYmd(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export type ExtractResponse = {
  source_photo: string;
  transcript: string;
  result: ExtractResult;
  warning?: string;
  /** Local blob URL for the resized image, for visual verification. */
  preview_url?: string;
};

export type ProgressEvent =
  | { type: "status"; text: string }
  | { type: "thought"; text: string };

type Props = {
  referenceDate?: string;
  onExtracted: (resp: ExtractResponse) => void;
  onProgress?: (ev: ProgressEvent) => void;
  onStart?: () => void;
};

type StreamEvent =
  | { type: "meta"; source_photo: string; baby_id: string }
  | { type: "status"; text: string }
  | { type: "thought"; text: string }
  | { type: "result"; bundle: { transcript: string } & ExtractResult }
  | { type: "error"; message: string };

export function PhotoUploader({ referenceDate, onExtracted, onProgress, onStart }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "resizing" | "uploading">("idle");
  const [error, setError] = useState<string | null>(null);
  // false during SSR/hydration, true once mounted inside the native shell.
  const native = useIsNative();

  // Core pipeline: resize → stream to /api/extract → hand off the result.
  // Shared by the web <input> path and the native camera path.
  async function processBlob(file: Blob) {
    setError(null);
    onStart?.();
    let previewUrl: string | undefined;
    try {
      setState("resizing");
      const blob = await resizeImageToBlob(file);
      previewUrl = URL.createObjectURL(blob);

      setState("uploading");
      const form = new FormData();
      form.append("image", blob, "feed.jpg");
      form.append("reference_date", referenceDate ?? todayKstYmd());

      const controller = new AbortController();
      // Idle-based timeout: abort only if server stops sending heartbeats too.
      // Server emits a heartbeat every 5s, so 60s without any chunk means
      // the connection is genuinely dead.
      let lastChunkAt = Date.now();
      const watchdog = setInterval(() => {
        if (Date.now() - lastChunkAt > 60_000) {
          controller.abort();
        }
      }, 2000);

      let res: Response;
      try {
        res = await fetch("/api/extract", {
          method: "POST",
          body: form,
          signal: controller.signal,
        });
      } catch (err) {
        clearInterval(watchdog);
        if (controller.signal.aborted) {
          throw new Error("응답이 너무 느립니다. 사진을 다시 찍거나 잠시 후 다시 시도해주세요.");
        }
        throw err;
      }

      if (!res.ok || !res.body) {
        clearInterval(watchdog);
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let meta: { source_photo: string; baby_id: string } | null = null;
      let bundle: { transcript: string } & ExtractResult = {
        transcript: "",
        feeds: [],
        events: [],
      };
      let warning: string | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        lastChunkAt = Date.now();
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          let ev: StreamEvent;
          try {
            ev = JSON.parse(trimmed) as StreamEvent;
          } catch {
            continue;
          }
          if (ev.type === "meta") {
            meta = { source_photo: ev.source_photo, baby_id: ev.baby_id };
          } else if (ev.type === "status" || ev.type === "thought") {
            onProgress?.(ev);
          } else if (ev.type === "result") {
            bundle = ev.bundle;
          } else if (ev.type === "error") {
            warning = `extraction failed: ${ev.message} — manual entry required`;
          }
        }
      }
      clearInterval(watchdog);

      if (!meta) throw new Error("응답이 손상되었습니다 (meta 없음)");

      onExtracted({
        source_photo: meta.source_photo,
        transcript: bundle.transcript,
        result: { feeds: bundle.feeds, events: bundle.events },
        warning,
        preview_url: previewUrl,
      });
      previewUrl = undefined; // ownership handed off
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    } finally {
      setState("idle");
    }
  }

  // Web path: <input type=file> change handler.
  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    try {
      await processBlob(file);
    } finally {
      input.value = "";
    }
  }

  // Native path: use the OS camera / photo library via Capacitor.
  // Base64 (not Uri): the app page runs on the remote https origin, so it
  // can't fetch capacitor://-scheme file URLs — that fetch dies with
  // WebKit's "Load failed".
  async function captureNative(source: "camera" | "photos") {
    if (busy) return;
    try {
      const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
      const photo = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.Base64,
        source: source === "camera" ? CameraSource.Camera : CameraSource.Photos,
        presentationStyle: "fullscreen",
      });
      if (!photo.base64String) return;
      const bin = atob(photo.base64String);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: `image/${photo.format ?? "jpeg"}` });
      await processBlob(blob);
    } catch (err) {
      // User cancelling the camera throws — treat cancel as a no-op.
      const msg = err instanceof Error ? err.message : String(err);
      if (/cancel/i.test(msg)) return;
      setError(msg);
    }
  }

  const busy = state !== "idle";
  const cameraLabel =
    state === "resizing" ? "사진 압축 중…" : state === "uploading" ? "인식 중…" : "사진 찍어 기록하기";

  return (
    <div className="flex flex-col gap-2">
      {!native ? (
        <>
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
        </>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => (native ? captureNative("camera") : cameraRef.current?.click())}
        className="flex items-center justify-center gap-2.5 rounded-xl bg-black px-6 py-4 text-lg font-medium text-white shadow-sm disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {!busy ? <CameraIcon className="h-5 w-5" /> : null}
        {cameraLabel}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => (native ? captureNative("photos") : libraryRef.current?.click())}
        className="flex items-center justify-center gap-2.5 rounded-xl border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-800 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
      >
        <PictureIcon className="h-5 w-5 text-gray-500 dark:text-neutral-400" />
        사진 선택하기
      </button>
      {error ? <p className="text-sm text-red-600 dark:text-red-400">오류: {error}</p> : null}
    </div>
  );
}
