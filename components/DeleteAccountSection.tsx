"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteAccount } from "@/app/profile/actions";

const PHRASE = "삭제합니다";

function SubmitButton({ enabled }: { enabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={!enabled || pending}
      className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "삭제 중…" : "내 계정 영구 삭제"}
    </button>
  );
}

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const enabled = confirm.trim() === PHRASE;

  return (
    <section className="mt-2 rounded-2xl border border-red-200 bg-red-50/50 p-5 dark:border-red-900/60 dark:bg-red-950/20">
      <h2 className="text-base font-semibold text-red-900 dark:text-red-200">계정 삭제</h2>
      <p className="mt-2 text-sm leading-relaxed text-red-900/80 dark:text-red-200/80">
        계정과 회원님의 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 rounded-full border border-red-300 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 active:scale-[0.98] dark:border-red-800 dark:bg-neutral-900 dark:text-red-300 dark:hover:bg-red-950/40"
        >
          계정 삭제…
        </button>
      ) : (
        <form action={deleteAccount} className="mt-4 flex flex-col gap-3">
          <ul className="list-disc space-y-1 pl-5 text-sm text-red-900/80 dark:text-red-200/80">
            <li>회원님만 보던 아이 정보와 모든 수유·배설·수면 기록</li>
            <li>업로드한 수기 기록 사진 원본</li>
            <li>로그인 계정 정보</li>
          </ul>
          <p className="text-xs leading-relaxed text-red-900/70 dark:text-red-200/70">
            가족과 함께 보던 아이는 삭제되지 않고 다른 보호자에게 그대로 남습니다.
          </p>

          <label className="flex flex-col gap-1 text-sm font-medium text-red-900 dark:text-red-200">
            계속하려면 <span className="font-bold">{PHRASE}</span> 를 입력하세요
            <input
              name="confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder={PHRASE}
              className="rounded-lg border border-red-300 bg-white px-3 py-2.5 text-base text-gray-900 focus:border-red-500 focus:outline-none dark:border-red-800 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-600"
            />
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirm("");
              }}
              className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 active:scale-[0.98] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              취소
            </button>
            <SubmitButton enabled={enabled} />
          </div>
        </form>
      )}
    </section>
  );
}
