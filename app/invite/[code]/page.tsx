import Link from "next/link";
import { getUser } from "@/lib/auth";
import { serviceSupabase } from "@/lib/supabase-server";
import { acceptInvite } from "./actions";

type Props = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ error?: string }>;
};

const ERROR_MESSAGE: Record<string, string> = {
  notfound: "초대 코드를 찾을 수 없습니다.",
  revoked: "이 초대는 취소되었습니다.",
  expired: "이 초대는 만료되었습니다.",
};

export default async function InvitePage({ params, searchParams }: Props) {
  const { code } = await params;
  const sp = await searchParams;
  const errorMsg = sp.error ? (ERROR_MESSAGE[sp.error] ?? sp.error) : null;

  const admin = serviceSupabase();
  const { data: invite } = await admin
    .from("baby_invites")
    .select("code, revoked_at, expires_at, baby_id, babies(name)")
    .eq("code", code)
    .maybeSingle();

  const baby = invite?.babies as unknown as { name: string } | null;
  const invalid =
    !invite || invite.revoked_at || (invite.expires_at && new Date(invite.expires_at) < new Date());
  const user = await getUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="flex flex-col gap-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-4xl">👨‍👩‍👧</div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">가족 초대</h1>
          {baby ? (
            <p className="text-base text-gray-600">
              <span className="font-semibold text-gray-900">{baby.name}</span>의 기록을 함께 볼 수 있게
              초대받으셨어요.
            </p>
          ) : (
            <p className="text-sm text-gray-500">초대 링크 정보를 확인하는 중입니다.</p>
          )}
        </div>

        {errorMsg ? (
          <div className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-800">
            {errorMsg}
          </div>
        ) : null}

        {invalid ? (
          <p className="text-center text-sm text-gray-500">
            링크를 다시 확인하거나 초대한 분에게 문의해주세요.
          </p>
        ) : user ? (
          <form action={acceptInvite} className="flex flex-col gap-3">
            <input type="hidden" name="code" value={code} />
            <button
              type="submit"
              className="rounded-full bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              수락하고 가족으로 참여
            </button>
            <p className="text-center text-xs text-gray-500">
              {user.email}으로 로그인된 상태입니다.
            </p>
          </form>
        ) : (
          <Link
            href={{ pathname: "/login", query: { from: `/invite/${code}` } }}
            className="rounded-full bg-emerald-600 px-6 py-3 text-center text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            로그인하고 수락하기
          </Link>
        )}
      </div>
    </main>
  );
}
