"use client";

import { useState, useTransition } from "react";
import { createInviteLink } from "@/app/actions/invite";

export function InviteButton() {
  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function generate() {
    setError(null);
    setLink(null);
    startTransition(async () => {
      const result = await createInviteLink();
      if ("error" in result) setError(result.error);
      else setLink(result.url);
    });
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("복사 실패 — 링크를 직접 선택해주세요.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {!link ? (
        <button
          type="button"
          disabled={pending}
          onClick={generate}
          className="rounded-full border border-emerald-300 bg-emerald-50 px-6 py-3 text-base font-semibold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.98] disabled:opacity-50"
        >
          {pending ? "초대 링크 생성 중…" : "👨‍👩‍👧 가족 초대 링크 만들기"}
        </button>
      ) : (
        <div className="flex flex-col gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-medium text-emerald-800">
            7일 동안 유효합니다. 이 링크를 공유하면 가족이 같은 아이 기록을 볼 수 있어요.
          </p>
          <input
            readOnly
            value={link}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm text-gray-900"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copy}
              className="flex-1 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              {copied ? "복사됨 ✓" : "링크 복사"}
            </button>
            <button
              type="button"
              onClick={() => setLink(null)}
              className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              닫기
            </button>
          </div>
        </div>
      )}
      {error ? <p className="text-sm text-red-600">오류: {error}</p> : null}
    </div>
  );
}
