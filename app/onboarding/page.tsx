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
    <main className="mx-auto w-full max-w-md">
      {errorMsg ? (
        <div className="mx-6 mt-4 rounded-xl bg-red-50 p-4 text-center text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          {errorMsg}
        </div>
      ) : null}
      <OnboardingForm />
    </main>
  );
}
