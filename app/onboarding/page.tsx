import Link from "next/link";
import { redirect } from "next/navigation";
import { getPrimaryBaby, requireUser } from "@/lib/auth";
import { OnboardingForm } from "./OnboardingForm";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

const ERROR_MESSAGE: Record<string, string> = {
  required: "이름·생년월일·아이와의 관계는 필수입니다.",
  number: "몸무게(kg)와 키(cm)는 숫자로 입력해주세요.",
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

        <OnboardingForm />

        <Link
          href="/"
          className="text-center text-sm text-gray-500 underline-offset-4 hover:text-gray-900 hover:underline"
        >
          나중에 하기
        </Link>
      </div>
    </main>
  );
}
