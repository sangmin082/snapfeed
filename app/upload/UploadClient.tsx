"use client";

import Link from "next/link";
import { useState } from "react";
import { PhotoUploader, type ExtractResponse } from "@/components/PhotoUploader";
import { ExtractPreview } from "@/components/ExtractPreview";

function todayKstYmd(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shiftKstYmd(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00+09:00`);
  d.setUTCDate(d.getUTCDate() + days);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const mo = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const da = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

export function UploadClient({ babyName }: { babyName: string }) {
  const [extracted, setExtracted] = useState<ExtractResponse | null>(null);
  const [saved, setSaved] = useState(false);
  const [referenceDate, setReferenceDate] = useState<string>(todayKstYmd);
  const today = todayKstYmd();
  const yesterday = shiftKstYmd(today, -1);
  const dayBefore = shiftKstYmd(today, -2);

  if (saved) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-emerald-50 p-8 text-center dark:bg-emerald-950/40">
          <div className="text-5xl">✅</div>
          <h1 className="text-2xl font-bold text-emerald-900 sm:text-3xl dark:text-emerald-100">저장 완료</h1>
          <p className="text-base text-emerald-800 dark:text-emerald-200">기록이 성공적으로 저장되었습니다.</p>
        </div>
        <Link
          href="/stats"
          className="rounded-full bg-emerald-600 px-6 py-4 text-center text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
        >
          📊 패턴 보기
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setExtracted(null);
              setSaved(false);
            }}
            className="flex-1 rounded-full border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-900 transition hover:bg-gray-50 active:scale-[0.98] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
          >
            📷 다른 사진 기록하기
          </button>
          <Link
            href="/records"
            className="flex-1 rounded-full border border-gray-300 bg-white px-6 py-3 text-center text-base font-medium text-gray-900 transition hover:bg-gray-50 active:scale-[0.98]"
          >
            전체 기록 목록
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">사진으로 기록</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-neutral-500">👶 {babyName}</p>
        </div>
        <Link href="/" className="text-sm font-medium text-gray-500 underline-offset-4 hover:text-gray-900 hover:underline dark:text-neutral-500 dark:hover:text-neutral-100">
          홈
        </Link>
      </header>

      {!extracted ? (
        <>
          <p className="text-base leading-relaxed text-gray-600 dark:text-neutral-400">
            수기 수유 기록지를 촬영하면 AI가 자동으로 인식해서 수정 가능한 표로 보여줍니다.
          </p>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 text-sm leading-relaxed text-emerald-900 sm:p-6 sm:text-base dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
            <p className="font-semibold">📝 잘 찍는 팁</p>
            <ul className="mt-3 flex flex-col gap-1.5 pl-1">
              <li>· 기록지 전체가 프레임에 들어오게</li>
              <li>· 글씨가 선명하게 보이도록 밝은 곳에서</li>
              <li>· 그림자나 반사광을 피하세요</li>
              <li>· 손글씨도 인식합니다 — 너무 흐리지만 않으면 OK</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">
              이 사진은 며칠 기록인가요?
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: today, label: "오늘" },
                { value: yesterday, label: "어제" },
                { value: dayBefore, label: "그저께" },
              ].map((opt) => {
                const active = referenceDate === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setReferenceDate(opt.value)}
                    className={
                      active
                        ? "rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm"
                        : "rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
              <input
                type="date"
                value={referenceDate}
                max={today}
                onChange={(e) => setReferenceDate(e.target.value || today)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-neutral-500">
              사진 속 시간(0AM~11PM)이 이 날짜의 시간으로 저장됩니다.
            </p>
          </div>

          <PhotoUploader referenceDate={referenceDate} onExtracted={setExtracted} />
        </>
      ) : (
        <>
          {extracted.warning ? (
            <p className="rounded bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              ⚠️ {extracted.warning}
            </p>
          ) : null}
          <ExtractPreview
            initial={extracted.result}
            sourcePhoto={extracted.source_photo}
            previewUrl={extracted.preview_url}
            onSaved={() => setSaved(true)}
          />
          {extracted.transcript ? (
            <details className="text-xs text-gray-500 dark:text-neutral-500">
              <summary>Gemini 전사 결과</summary>
              <pre className="mt-2 whitespace-pre-wrap">{extracted.transcript}</pre>
            </details>
          ) : null}
          <button
            type="button"
            onClick={() => setExtracted(null)}
            className="self-start text-sm text-gray-500 underline dark:text-neutral-500"
          >
            다시 찍기
          </button>
        </>
      )}
    </div>
  );
}
