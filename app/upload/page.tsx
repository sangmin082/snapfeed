"use client";

import Link from "next/link";
import { useState } from "react";
import { PhotoUploader, type ExtractResponse } from "@/components/PhotoUploader";
import { ExtractPreview } from "@/components/ExtractPreview";

export default function UploadPage() {
  const [extracted, setExtracted] = useState<ExtractResponse | null>(null);
  const [saved, setSaved] = useState(false);

  if (saved) {
    return (
      <main className="mx-auto flex max-w-xl flex-col gap-6 p-6 sm:gap-8 sm:p-8">
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-emerald-50 p-8 text-center">
          <div className="text-5xl">✅</div>
          <h1 className="text-2xl font-bold text-emerald-900 sm:text-3xl">저장 완료</h1>
          <p className="text-base text-emerald-800">기록이 성공적으로 저장되었습니다.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setExtracted(null);
              setSaved(false);
            }}
            className="flex-1 rounded-full bg-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            📷 다른 사진 기록하기
          </button>
          <Link
            href="/records"
            className="flex-1 rounded-full border border-gray-300 bg-white px-6 py-4 text-center text-base font-semibold text-gray-900 transition hover:bg-gray-50 active:scale-[0.98]"
          >
            기록 보기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-6 sm:gap-8 sm:p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">사진으로 기록</h1>
        <Link href="/" className="text-sm font-medium text-gray-500 underline-offset-4 hover:text-gray-900 hover:underline">
          홈
        </Link>
      </header>

      {!extracted ? (
        <>
          <p className="text-base leading-relaxed text-gray-600">
            수기 수유 기록지를 촬영하면 AI가 자동으로 인식해서 수정 가능한 표로 보여줍니다.
          </p>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 text-sm leading-relaxed text-emerald-900 sm:p-6 sm:text-base">
            <p className="font-semibold">📝 잘 찍는 팁</p>
            <ul className="mt-3 flex flex-col gap-1.5 pl-1">
              <li>· 기록지 전체가 프레임에 들어오게</li>
              <li>· 글씨가 선명하게 보이도록 밝은 곳에서</li>
              <li>· 그림자나 반사광을 피하세요</li>
              <li>· 손글씨도 인식합니다 — 너무 흐리지만 않으면 OK</li>
            </ul>
          </div>
          <PhotoUploader onExtracted={setExtracted} />
        </>
      ) : (
        <>
          {extracted.warning ? (
            <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">
              ⚠️ {extracted.warning}
            </p>
          ) : null}
          <ExtractPreview
            initial={extracted.result}
            sourcePhoto={extracted.source_photo}
            onSaved={() => setSaved(true)}
          />
          {extracted.transcript ? (
            <details className="text-xs text-gray-500">
              <summary>Gemini 전사 결과</summary>
              <pre className="mt-2 whitespace-pre-wrap">{extracted.transcript}</pre>
            </details>
          ) : null}
          <button
            type="button"
            onClick={() => setExtracted(null)}
            className="self-start text-sm text-gray-500 underline"
          >
            다시 찍기
          </button>
        </>
      )}
    </main>
  );
}
