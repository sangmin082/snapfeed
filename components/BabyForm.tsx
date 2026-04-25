"use client";

import { useEffect, useState, useTransition } from "react";
import { resizeImageToBlob } from "@/lib/resizeImage";
import { RelationshipPicker } from "@/components/RelationshipPicker";

export type BabyFormDefaults = {
  name?: string;
  birth_date?: string;
  relationship?: string;
  birth_weight_kg?: number | null;
  birth_height_cm?: number | null;
  photoUrl?: string | null;
};

type Props = {
  action: (formData: FormData) => Promise<unknown> | unknown;
  defaults?: BabyFormDefaults;
  submitLabel: string;
  pendingLabel?: string;
  /** Show the "기존 사진 제거" toggle when editing an existing photo. */
  allowPhotoRemoval?: boolean;
};

export function BabyForm({
  action,
  defaults = {},
  submitLabel,
  pendingLabel = "저장 중…",
  allowPhotoRemoval = false,
}: Props) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
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

  const showExistingPhoto =
    !photo && !removeExisting && !!defaults.photoUrl;

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

    if (allowPhotoRemoval && removeExisting && !photo) {
      formData.set("remove_photo", "1");
    }

    startTransition(() => {
      action(formData);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-neutral-300">
        이름 (애칭)
        <input
          required
          name="name"
          maxLength={40}
          defaultValue={defaults.name ?? ""}
          className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          placeholder="예: 복덩이"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-neutral-300">
        생년월일
        <input
          required
          type="date"
          name="birth_date"
          defaultValue={defaults.birth_date ?? ""}
          className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
        />
      </label>

      <RelationshipPicker defaultValue={defaults.relationship ?? ""} />

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-neutral-300">
          출생 몸무게 (kg)
          <input
            type="number"
            inputMode="decimal"
            name="birth_weight_kg"
            min={0}
            step={0.01}
            defaultValue={defaults.birth_weight_kg ?? ""}
            className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            placeholder="예: 3.20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-neutral-300">
          출생 키 (cm)
          <input
            type="number"
            inputMode="decimal"
            name="birth_height_cm"
            min={0}
            step={0.1}
            defaultValue={defaults.birth_height_cm ?? ""}
            className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            placeholder="예: 49.5"
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-neutral-300">
          아이 사진 {allowPhotoRemoval ? "(교체)" : "(선택)"}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              setPhoto(e.target.files?.[0] ?? null);
              setRemoveExisting(false);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:file:bg-emerald-900/40 dark:file:text-emerald-300 dark:hover:file:bg-emerald-900/60"
          />
          <span className="text-xs text-gray-500 dark:text-neutral-500">
            프로필용 사진. 업로드 전에 자동으로 800px로 줄여집니다.
          </span>
        </label>

        {showExistingPhoto ? (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={defaults.photoUrl ?? ""}
              alt="현재 사진"
              className="h-20 w-20 rounded-full object-cover ring-2 ring-white shadow-sm dark:ring-neutral-800"
            />
            <div className="flex flex-1 flex-col">
              <span className="text-sm font-medium text-gray-900 dark:text-neutral-100">현재 사진</span>
              <span className="text-xs text-gray-500 dark:text-neutral-500">
                새 사진을 선택하면 교체됩니다.
              </span>
            </div>
            {allowPhotoRemoval ? (
              <button
                type="button"
                onClick={() => setRemoveExisting(true)}
                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                제거
              </button>
            ) : null}
          </div>
        ) : null}

        {previewUrl ? (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="미리보기"
              className="h-20 w-20 rounded-full object-cover ring-2 ring-white shadow-sm dark:ring-neutral-800"
            />
            <div className="flex flex-1 flex-col">
              <span className="text-sm font-medium text-gray-900 dark:text-neutral-100">새 사진</span>
              <span className="text-xs text-gray-500 dark:text-neutral-500">
                {photo ? `${(photo.size / 1024).toFixed(0)} KB` : ""}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPhoto(null)}
              className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              취소
            </button>
          </div>
        ) : null}

        {allowPhotoRemoval && removeExisting && !photo ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
            <span className="text-sm text-amber-900 dark:text-amber-200">
              저장 시 현재 사진이 제거됩니다.
            </span>
            <button
              type="button"
              onClick={() => setRemoveExisting(false)}
              className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-neutral-900 dark:text-amber-200 dark:hover:bg-amber-900/40"
            >
              취소
            </button>
          </div>
        ) : null}
      </div>

      {prepError ? (
        <p className="text-sm text-red-600 dark:text-red-400">사진 처리 오류: {prepError}</p>
      ) : null}

      <p className="text-xs text-gray-500 dark:text-neutral-500">몸무게·키·사진은 비워두어도 됩니다.</p>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-full bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
