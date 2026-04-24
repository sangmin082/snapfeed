import { redirect } from "next/navigation";
import { getPrimaryBaby, requireUser } from "@/lib/auth";
import { createBaby } from "./actions";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

const ERROR_MESSAGE: Record<string, string> = {
  required: "이름과 생년월일은 필수입니다.",
  number: "몸무게(g)와 키(cm)는 숫자로 입력해주세요.",
};

export default async function OnboardingPage({ searchParams }: Props) {
  const user = await requireUser();
  const existing = await getPrimaryBaby(user.id);
  if (existing) redirect("/");

  const sp = await searchParams;
  const errorMsg = sp.error ? ERROR_MESSAGE[sp.error] ?? sp.error : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <span className="mx-auto rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
            환영합니다 👋
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            아이 정보를 알려주세요
          </h1>
          <p className="text-sm text-gray-600 sm:text-base">
            기본 정보는 언제든 수정할 수 있고, 가족 초대 후에도 공유됩니다.
          </p>
        </div>

        {errorMsg ? (
          <div className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-800">
            {errorMsg}
          </div>
        ) : null}

        <form action={createBaby} className="flex flex-col gap-4">
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
              출생 몸무게 (g)
              <input
                type="number"
                inputMode="numeric"
                name="birth_weight_g"
                min={0}
                step={10}
                className="rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-emerald-500 focus:outline-none"
                placeholder="예: 3200"
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
          <p className="text-xs text-gray-500">몸무게와 키는 나중에 입력해도 됩니다.</p>

          <button
            type="submit"
            className="mt-4 rounded-full bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            시작하기
          </button>
        </form>
      </div>
    </main>
  );
}
