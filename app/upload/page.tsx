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
      <main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-bold">저장 완료</h1>
        <p className="text-gray-700">기록이 저장되었습니다.</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setExtracted(null);
              setSaved(false);
            }}
            className="rounded border px-4 py-2"
          >
            다른 사진 찍기
          </button>
          <Link href="/records" className="rounded border px-4 py-2">
            기록 보기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">사진으로 기록</h1>
        <Link href="/" className="text-sm text-gray-500 underline">
          홈
        </Link>
      </header>

      {!extracted ? (
        <>
          <p className="text-sm text-gray-600">
            수기 수유 기록지를 촬영하면 자동으로 인식해서 수정 가능한 폼을 보여줍니다.
          </p>
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
          <details className="text-xs text-gray-500">
            <summary>Gemini 전사 결과</summary>
            <pre className="mt-2 whitespace-pre-wrap">{extracted.transcript}</pre>
          </details>
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
