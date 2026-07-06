"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createBaby } from "./actions";
import { BottleIcon, CameraIcon } from "@/components/icons";

const RELATIONSHIPS = [
  "엄마",
  "아빠",
  "친할머니",
  "친할아버지",
  "외할머니",
  "외할아버지",
  "산후도우미",
  "기타",
] as const;

// Full-screen, one-question-per-step wizard (native-app style onboarding):
// 환영 → 이름 → 생일 → 관계 → 사진(선택) → 완료 🎉
export function OnboardingForm() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [rel, setRel] = useState("");
  const [relCustom, setRelCustom] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const relationship = rel === "기타" ? relCustom.trim() : rel;
  const LAST = 5;

  const canNext =
    step === 1 ? name.trim().length > 0
    : step === 2 ? birth.length > 0
    : step === 3 ? relationship.length > 0
    : true;

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(f ? URL.createObjectURL(f) : null);
  }

  return (
    <form
      action={createBaby}
      className="flex min-h-[calc(100dvh-3rem)] flex-col"
    >
      {/* values collected across steps */}
      <input type="hidden" name="name" value={name.trim()} />
      <input type="hidden" name="birth_date" value={birth} />
      <input type="hidden" name="relationship" value={relationship} />
      {/* keep the file input always mounted so its FileList survives step changes */}
      <input
        ref={photoRef}
        type="file"
        name="photo"
        accept="image/*"
        className="hidden"
        onChange={onPhotoChange}
      />

      {/* ── step body ── */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        {step === 0 ? (
          <>
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <BottleIcon className="h-8 w-8" />
            </span>
            <h1 className="text-2xl font-extrabold leading-snug tracking-tight text-gray-900 sm:text-3xl dark:text-neutral-100">
              snapfeed에
              <br />
              오신 걸 환영합니다
            </h1>
            <p className="text-sm leading-relaxed text-gray-500 dark:text-neutral-400">
              수첩에 적은 수유 기록, 사진 한 장으로 정리해드려요.
              <br />
              먼저 아기 정보를 알려주세요.
            </p>
          </>
        ) : null}

        {step === 1 ? (
          <StepField label="아기 이름">
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="입력하기"
              className="w-full rounded-2xl bg-gray-100 px-5 py-4 text-center text-lg text-gray-900 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-amber-300 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </StepField>
        ) : null}

        {step === 2 ? (
          <StepField label="아기 생일">
            <input
              type="date"
              value={birth}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setBirth(e.target.value)}
              onFocus={(e) => e.currentTarget.showPicker?.()}
              className="w-full rounded-2xl bg-gray-100 px-5 py-4 text-center text-lg text-gray-900 outline-none focus:ring-2 focus:ring-amber-300 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </StepField>
        ) : null}

        {step === 3 ? (
          <StepField label="아기와 어떤 사이세요?">
            <div className="grid w-full grid-cols-2 gap-2">
              {RELATIONSHIPS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRel(r)}
                  className={`rounded-2xl px-4 py-3.5 text-base font-medium transition ${
                    rel === r
                      ? "bg-amber-300 text-amber-950 shadow-sm"
                      : "bg-gray-100 text-gray-700 dark:bg-neutral-900 dark:text-neutral-300"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            {rel === "기타" ? (
              <input
                autoFocus
                type="text"
                value={relCustom}
                onChange={(e) => setRelCustom(e.target.value)}
                placeholder="관계를 입력해주세요"
                className="w-full rounded-2xl bg-gray-100 px-5 py-4 text-center text-base text-gray-900 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-amber-300 dark:bg-neutral-900 dark:text-neutral-100"
              />
            ) : null}
          </StepField>
        ) : null}

        {step === 4 ? (
          <StepField label="아기 사진 (선택)">
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              className="mx-auto flex h-40 w-40 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-gray-400 dark:bg-neutral-900 dark:text-neutral-500"
            >
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="아기 사진 미리보기" className="h-full w-full object-cover" />
              ) : (
                <CameraIcon className="h-10 w-10" />
              )}
            </button>
            <p className="text-sm text-gray-500 dark:text-neutral-400">
              {photoPreview ? "탭해서 다시 선택할 수 있어요." : "탭해서 사진을 선택하세요. 건너뛰어도 돼요."}
            </p>
          </StepField>
        ) : null}

        {step === LAST ? (
          <>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl dark:text-neutral-100">
              좋아요. 모든 준비가 끝났어요 🎉
            </h1>
            <p className="text-base leading-relaxed text-gray-500 dark:text-neutral-400">
              어려운 육아 생활에
              <br />
              조금이라도 도움이 되면 좋겠습니다.
            </p>
            <p className="text-base text-gray-500 dark:text-neutral-400">행복 육아 하세요~!</p>
          </>
        ) : null}
      </div>

      {/* ── bottom nav ── */}
      <div className="flex gap-3 px-6 pb-6 [padding-bottom:calc(env(safe-area-inset-bottom)+1.5rem)]">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 rounded-2xl bg-gray-100 px-6 py-4 text-base font-semibold text-gray-600 transition active:scale-[0.98] dark:bg-neutral-900 dark:text-neutral-300"
          >
            이전으로
          </button>
        ) : null}
        {step < LAST ? (
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
            className="flex-1 rounded-2xl bg-amber-300 px-6 py-4 text-base font-bold text-amber-950 shadow-sm transition active:scale-[0.98] disabled:opacity-40"
          >
            {step === 0 ? "시작하기" : "다음으로"}
          </button>
        ) : (
          <SubmitButton />
        )}
      </div>
    </form>
  );
}

function StepField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-neutral-100">
        {label}
      </h1>
      {children}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 rounded-2xl bg-amber-300 px-6 py-4 text-base font-bold text-amber-950 shadow-sm transition active:scale-[0.98] disabled:opacity-50"
    >
      {pending ? "준비 중…" : "시작하기"}
    </button>
  );
}
