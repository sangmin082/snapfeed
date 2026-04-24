import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { signInWithPassword, signUpWithPassword, signInWithGoogle } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ from?: string; error?: string; notice?: string; mode?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const user = await getUser();
  if (user) redirect(sp.from ?? "/");
  const from = sp.from ?? "/";
  const mode = sp.mode === "signup" ? "signup" : "signin";
  const isSignup = mode === "signup";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="flex flex-col gap-6">
        <Link href="/" className="mx-auto text-2xl font-bold tracking-tight text-emerald-600">
          snapfeed
        </Link>
        <h1 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
          {isSignup ? "가입하기" : "로그인"}
        </h1>

        {sp.notice === "check-email" ? (
          <div className="rounded-xl bg-emerald-50 p-4 text-center text-sm text-emerald-900">
            이메일로 확인 링크를 보냈습니다. 링크를 눌러 가입을 완료해주세요.
          </div>
        ) : null}
        {sp.error ? (
          <div className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-800">
            {sp.error}
          </div>
        ) : null}

        <form action={signInWithGoogle}>
          <input type="hidden" name="from" value={from} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-900 transition hover:bg-gray-50 active:scale-[0.98]"
          >
            <GoogleMark />
            Google로 계속하기
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs text-gray-400">
          <div className="h-px flex-1 bg-gray-200" />
          또는
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <form
          action={isSignup ? signUpWithPassword : signInWithPassword}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="from" value={from} />
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            이메일
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              className="rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-emerald-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            비밀번호
            <input
              required
              type="password"
              name="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={6}
              className="rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-emerald-500 focus:outline-none"
              placeholder="6자 이상"
            />
          </label>
          <button
            type="submit"
            className="mt-2 rounded-full bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            {isSignup ? "가입" : "로그인"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          {isSignup ? (
            <>
              이미 계정이 있나요?{" "}
              <Link
                href={{ pathname: "/login", query: { from, mode: "signin" } }}
                className="font-medium text-emerald-700 underline-offset-4 hover:underline"
              >
                로그인
              </Link>
            </>
          ) : (
            <>
              처음 방문하셨나요?{" "}
              <Link
                href={{ pathname: "/login", query: { from, mode: "signup" } }}
                className="font-medium text-emerald-700 underline-offset-4 hover:underline"
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
