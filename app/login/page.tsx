import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import {
  signInWithPassword,
  signUpWithPassword,
  signInWithGoogle,
  resendConfirmation,
} from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    from?: string;
    error?: string;
    notice?: string;
    mode?: string;
    email?: string;
  }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const user = await getUser();
  if (user) redirect(sp.from ?? "/");
  const from = sp.from ?? "/";
  const mode = sp.mode === "signup" ? "signup" : "signin";
  const isSignup = mode === "signup";
  const looksLikeBadCreds =
    !!sp.error &&
    /invalid|email not confirmed|credentials/i.test(sp.error);
  const failedEmail = sp.email ?? "";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="flex flex-col gap-6">
        <Link href="/" className="mx-auto text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
          snapfeed
        </Link>
        <h1 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl dark:text-neutral-100">
          {isSignup ? "가입하기" : "로그인"}
        </h1>

        {sp.notice === "deleted" ? (
          <div className="rounded-xl bg-gray-100 p-4 text-center text-sm text-gray-700 dark:bg-neutral-800 dark:text-neutral-200">
            계정과 데이터가 삭제되었습니다. 그동안 이용해주셔서 감사합니다.
          </div>
        ) : null}
        {sp.notice === "check-email" ? (
          <div className="rounded-xl bg-amber-50 p-4 text-center text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            이메일로 확인 링크를 보냈습니다. 링크를 눌러 가입을 완료해주세요.
          </div>
        ) : null}
        {sp.notice === "resent" ? (
          <div className="rounded-xl bg-amber-50 p-4 text-center text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            확인 메일을 다시 보냈습니다. 메일함(스팸 포함)을 확인해주세요.
          </div>
        ) : null}
        {sp.error ? (
          <div className="flex flex-col gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
            <p className="text-center">{sp.error}</p>
            {looksLikeBadCreds ? (
              <div className="flex flex-col gap-2 border-t border-red-200 pt-3 text-center dark:border-red-900">
                <p className="text-xs">
                  최근에 가입하셨다면 이메일로 보낸 확인 링크를 먼저 눌러야 로그인됩니다.
                  메일이 안 왔으면 아래 버튼으로 다시 받을 수 있어요.
                </p>
                <form action={resendConfirmation} className="flex flex-col gap-2 sm:flex-row">
                  <input
                    required
                    type="email"
                    name="email"
                    defaultValue={failedEmail}
                    placeholder="가입한 이메일"
                    className="flex-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-red-900 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                  <input type="hidden" name="from" value={from} />
                  <button
                    type="submit"
                    className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                  >
                    확인 메일 재전송
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        ) : null}

        <form action={signInWithGoogle}>
          <input type="hidden" name="from" value={from} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-900 transition hover:bg-gray-50 active:scale-[0.98] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
          >
            <GoogleMark />
            Google로 계속하기
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-neutral-500">
          <div className="h-px flex-1 bg-gray-200 dark:bg-neutral-800" />
          또는
          <div className="h-px flex-1 bg-gray-200 dark:bg-neutral-800" />
        </div>

        <form
          action={isSignup ? signUpWithPassword : signInWithPassword}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="from" value={from} />
          <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-neutral-300">
            이메일
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 focus:border-amber-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
              placeholder="you@example.com"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-neutral-300">
            비밀번호
            <input
              required
              type="password"
              name="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={6}
              className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 focus:border-amber-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
              placeholder="6자 이상"
            />
          </label>
          <button
            type="submit"
            className="mt-2 rounded-full bg-amber-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-amber-700 active:scale-[0.98]"
          >
            {isSignup ? "가입" : "로그인"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-neutral-400">
          {isSignup ? (
            <>
              이미 계정이 있나요?{" "}
              <Link
                href={{ pathname: "/login", query: { from, mode: "signin" } }}
                className="font-medium text-amber-700 underline-offset-4 hover:underline dark:text-amber-300"
              >
                로그인
              </Link>
            </>
          ) : (
            <>
              처음 방문하셨나요?{" "}
              <Link
                href={{ pathname: "/login", query: { from, mode: "signup" } }}
                className="font-medium text-amber-700 underline-offset-4 hover:underline dark:text-amber-300"
              >
                가입하기
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.9 6.4 29.7 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.9 6.4 29.7 4 24 4 16 4 9 8.5 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.6 0 10.7-2.1 14.5-5.6l-6.7-5.5c-2 1.4-4.7 2.3-7.8 2.3-5.2 0-9.6-3.3-11.2-8L6.1 32C8.7 38.5 15.8 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.7 2-2 3.8-3.8 5l6.7 5.5C42.8 35.1 44 29.9 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
