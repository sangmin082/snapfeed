"use client";

import { useEffect, useState, useTransition } from "react";
import { resizeImageToBlob } from "@/lib/resizeImage";
import { createBaby } from "./actions";

export function OnboardingForm() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prepError, setPrepError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPrepError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    if (photo) {
      try {
        const blob = await resizeImageToBlob(photo, 800, 0.85);
        formData.set("photo", blob, "baby.jpg");
      } catch (err) {
        setPrepError(err instanceof Error ? err.message : "사진 처리 실패");
        return;
      }
    } else {
      formData.delete("photo");
    }

    startTransition(() => {
      createBaby(formData);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm text-gray-700">
        이름 (애칭)
        <input
          required
          name="name"
          maxLength={40}
          className="rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-emerald-500 focus:outline-none"
          placeholder="예: 복덩이"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-700">
        생년월일
        <input
          required
          type="date"
          name="birth_date"
          className="rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-emerald-500 focus:outline-none"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          출생 몸무게 (kg)
          <input
            type="number"
            inputMode="decimal"
            name="birth_weight_kg"
            min={0}
            step={0.01}
            className="rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-emerald-500 focus:outline-none"
            placeholder="예: 3.20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          출생 키 (cm)
          <input
            type="number"
            inputMode="decimal"
            name="birth_height_cm"
            min={0}
            step={0.1}
            className="rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-emerald-500 focus:outline-none"
            placeholder="예: 49.5"
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          아이 사진 (선택)
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
          />
          <span className="text-xs text-gray-500">
            프로필용 사진. 업로드 전에 자동으로 800px로 줄여집니다.
          </span>
        </label>

        {previewUrl ? (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="미리보기"
              className="h-20 w-20 rounded-full object-cover ring-2 ring-white shadow-sm"
            />
            <div className="flex flex-1 flex-col">
              <span className="text-sm font-medium text-gray-900">미리보기</span>
              <span className="text-xs text-gray-500">
                {photo ? `${(photo.size / 1024).toFixed(0)} KB` : ""}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPhoto(null)}
              className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
            >
              제거
            </button>
          </div>
        ) : null}
      </div>

      {prepError ? (
        <p className="text-sm text-red-600">사진 처리 오류: {prepError}</p>
      ) : null}

      <p className="text-xs text-gray-500">몸무게·키·사진은 나중에 입력해도 됩니다.</p>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-full bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "저장 중…" : "시작하기"}
      </button>
    </form>
  );
}
