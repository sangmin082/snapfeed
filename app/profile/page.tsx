import Link from "next/link";
import { redirect } from "next/navigation";
import { babyPhotoUrl, requireUser } from "@/lib/auth";
import { serviceSupabase } from "@/lib/supabase-server";
import { BabyForm } from "@/components/BabyForm";
import { updateBaby } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

const ERROR_MESSAGE: Record<string, string> = {
  required: "이름·생년월일·아이와의 관계는 필수입니다.",
  number: "몸무게(kg)와 키(cm)는 숫자로 입력해주세요.",
};

export default async function ProfilePage({ searchParams }: Props) {
  const user = await requireUser();
  const sp = await searchParams;
  const errorMsg = sp.error ? (ERROR_MESSAGE[sp.error] ?? sp.error) : null;

  const admin = serviceSupabase();
  const { data: member } = await admin
    .from("baby_members")
    .select(
      "relationship, babies(id, name, birth_date, birth_weight_kg, birth_height_cm, photo_path)",
    )
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const baby = member?.babies as unknown as {
    id: string;
    name: string;
    birth_date: string;
    birth_weight_kg: number | null;
    birth_height_cm: number | null;
    photo_path: string | null;
  } | null;
  if (!baby) redirect("/onboarding");

  const photoUrl = await babyPhotoUrl(baby.photo_path);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-neutral-100">
            프로필 수정
          </h1>
          <p className="text-sm text-gray-600 sm:text-base dark:text-neutral-400">
            이름·생년월일·관계, 그리고 프로필 사진을 변경할 수 있어요.
          </p>
        </div>

        {errorMsg ? (
          <div className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
            {errorMsg}
          </div>
        ) : null}

        <BabyForm
          action={updateBaby}
          submitLabel="저장"
          pendingLabel="저장 중…"
          allowPhotoRemoval
          defaults={{
            name: baby.name,
            birth_date: baby.birth_date,
            relationship: member?.relationship ?? "",
            birth_weight_kg: baby.birth_weight_kg,
            birth_height_cm: baby.birth_height_cm,
            photoUrl,
          }}
        />

        <Link
          href="/"
          className="text-center text-sm text-gray-500 underline-offset-4 hover:text-gray-900 hover:underline dark:text-neutral-500 dark:hover:text-neutral-100"
        >
          취소하고 돌아가기
        </Link>
      </div>
    </main>
  );
}
