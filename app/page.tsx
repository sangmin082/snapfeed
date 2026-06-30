import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { getUser, getPrimaryBaby, babyPhotoUrl } from "@/lib/auth";
import { InviteButton } from "@/components/InviteButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getUser();
  const baby = user ? await getPrimaryBaby(user.id) : null;
  const photoUrl = baby ? await babyPhotoUrl(baby.photo_path) : null;
  if (baby) {
    console.log("[home] baby photo state", {
      babyId: baby.id,
      photoPath: baby.photo_path,
      hasSignedUrl: !!photoUrl,
    });
  }

  return (
    <main className="flex flex-col">
      <UserBar user={user} baby={baby} />

      {user && baby ? <DashboardBlock baby={baby} photoUrl={photoUrl} /> : null}
      {user && !baby ? <OnboardingPrompt /> : null}

      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white dark:from-emerald-950/40 dark:via-neutral-950 dark:to-neutral-950">
        <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl animate-float-slow dark:bg-emerald-700/20" />
        <div className="pointer-events-none absolute top-40 -left-24 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl animate-float dark:bg-sky-700/20" />
        <div className="relative mx-auto max-w-2xl px-6 pt-12 pb-14 sm:pt-20 sm:pb-20">
          <div className="flex flex-col items-center gap-6 text-center sm:gap-8">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 animate-fade-up sm:text-sm dark:bg-emerald-900/40 dark:text-emerald-300" style={{ animationDelay: "0ms" }}>
              어르신·산후도우미 ↔ 부모를 잇는
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 animate-fade-up sm:text-5xl dark:text-neutral-100" style={{ animationDelay: "80ms" }}>
              손으로 적어주신 수유 기록,<br />
              <span className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient dark:from-emerald-400 dark:via-emerald-300 dark:to-emerald-400">
                찰칵 한 번
              </span>
              이면 디지털로 정리
            </h1>
            <p className="max-w-md text-base leading-relaxed text-gray-600 animate-fade-up sm:text-lg dark:text-neutral-400" style={{ animationDelay: "160ms" }}>
              할머니·할아버지·산후도우미가 수기로 남겨주신 수유 기록을,
              부모가 한 번에 디지털로 정리해 전체 패턴을 한눈에 확인합니다.
            </p>
            <div className="flex w-full flex-col gap-3 pt-2 animate-fade-up sm:w-auto sm:flex-row sm:justify-center" style={{ animationDelay: "240ms" }}>
              <Link
                href={user ? "/upload" : "/login?mode=signup"}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-4 text-lg font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/40 active:scale-[0.98]"
              >
                {user ? "📷 지금 기록하기" : "무료로 시작하기"}
              </Link>
              <Link
                href={user ? "/records" : "/login"}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-8 py-4 text-lg font-semibold text-gray-900 transition hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md active:scale-[0.98] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
              >
                {user ? "기록 보기" : "로그인"}
              </Link>
              {user ? (
                <Link
                  href="/stats"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-8 py-4 text-lg font-semibold text-gray-900 transition hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md active:scale-[0.98] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
                >
                  📊 패턴 보기
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-2xl px-6 py-14 sm:py-20">
        <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-neutral-100">
          이런 상황을 위해 만들었습니다
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 sm:p-6 dark:border-amber-900 dark:bg-amber-950/40">
            <div className="text-2xl">👵🏻</div>
            <h3 className="mt-3 text-base font-semibold text-amber-900 sm:text-lg dark:text-amber-200">돌봐주시는 분</h3>
            <p className="mt-2 text-sm leading-relaxed text-amber-900/80 sm:text-base dark:text-amber-200/80">
              어르신(할머니·할아버지)이나 산후도우미는 앱 설치·입력이 번거롭습니다.
              수첩에 손으로 편하게 기록하는 게 가장 자연스럽습니다.
            </p>
          </div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-5 sm:p-6 dark:border-sky-900 dark:bg-sky-950/40">
            <div className="text-2xl">👨‍👩‍👧</div>
            <h3 className="mt-3 text-base font-semibold text-sky-900 sm:text-lg dark:text-sky-200">부모</h3>
            <p className="mt-2 text-sm leading-relaxed text-sky-900/80 sm:text-base dark:text-sky-200/80">
              흩어진 수첩 기록을 모아 수유 간격·총량·시간대 패턴을 확인하고 싶은데,
              하나하나 입력할 시간이 없습니다.
            </p>
          </div>
        </div>
        <div className="mt-6 rounded-2xl bg-emerald-50 p-5 text-center text-sm font-medium text-emerald-900 sm:p-6 sm:text-base dark:bg-emerald-950/40 dark:text-emerald-100">
          snapfeed가 이 두 과정을 연결합니다 — 사진 한 장으로.
        </div>
      </section>

      <section className="mx-auto w-full max-w-2xl px-6 pb-10 sm:pb-12">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-neutral-800 dark:bg-neutral-900">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            왜 만들었나요
          </span>
          <h2 className="mt-3 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl dark:text-neutral-100">
            앱은 편하지만, 종이가 마음 편할 때가 있죠
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-neutral-400">
            육아 앱들은 모두 매번 손으로 한 건씩 입력해야 합니다.
            새벽에 일어나 분유 타고, 트림 시키고, 기저귀 갈고 나면
            폰에 앉아 12개 항목을 입력할 여력이 안 남습니다.
            그렇다고 손글씨로만 적자니, 며칠 뒤 패턴을 한눈에 보기가 어렵죠.
          </p>
          <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <li className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
              <div className="text-xl">📓</div>
              <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-neutral-100">
                아날로그 감성으로 수기 수유 기록을 남기고 싶으신 분
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-neutral-400">
                수첩에 한 줄씩 또박또박 적어가는 그 시간을 그대로 두고,
                기록만 디지털로 보관하고 싶으신 분.
              </p>
            </li>
            <li className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
              <div className="text-xl">😮‍💨</div>
              <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-neutral-100">
                여러 육아 앱에 일일이 입력하는 게 너무 귀찮으신 분
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-neutral-400">
                바쁜 육아 후 화면을 켜서 항목 하나하나 누르는 대신,
                하루 끝에 사진 한 장으로 끝내고 싶으신 분.
              </p>
            </li>
          </ul>
          <p className="mt-5 text-xs leading-relaxed text-gray-500 dark:text-neutral-500">
            이 두 분 모두를 위해 snapfeed를 만들었습니다.
            손은 종이에 두고, 디지털화는 AI가 한 장의 사진으로 대신합니다.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-2xl px-6 pb-4 sm:pb-6">
        <div className="rounded-3xl border-2 border-dashed border-pink-300 bg-pink-50/50 p-6 sm:p-8 dark:border-pink-800 dark:bg-pink-950/30">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
            <div className="flex h-28 w-full flex-shrink-0 items-center justify-center rounded-xl border border-pink-200 bg-white text-5xl sm:h-32 sm:w-28 dark:border-pink-900 dark:bg-neutral-900">
              <span className="animate-float inline-block">📋</span>
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <div>
                <span className="rounded-full bg-pink-200 px-2.5 py-0.5 text-xs font-semibold text-pink-800 dark:bg-pink-900/60 dark:text-pink-200">
                  FREE
                </span>
                <h2 className="mt-2 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl dark:text-neutral-100">
                  인쇄용 신생아 양육 기록지
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-neutral-300">
                0AM–11PM 24시간 칸에 <strong>수유(시간·형태·양)</strong>, <strong>배설(소변·대변·구토)</strong>,
                <strong> 체중·체온</strong>까지 손으로 바로 적을 수 있는 표준 양식.
                프린트해서 어르신·산후도우미께 드리고, 하루 끝에 사진 한 장으로 snapfeed에 올리시면 됩니다.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <a
                  href="/baby-chart.xls"
                  download
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-pink-600 hover:shadow-md active:scale-[0.98]"
                >
                  📄 엑셀 (.xls) 다운로드
                </a>
                <a
                  href="/baby-chart.pdf"
                  download
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-pink-400 bg-white px-5 py-2.5 text-sm font-semibold text-pink-700 transition hover:-translate-y-0.5 hover:bg-pink-50 hover:shadow-md active:scale-[0.98] dark:border-pink-700 dark:bg-neutral-900 dark:text-pink-300 dark:hover:bg-pink-950/40"
                >
                  📑 PDF 다운로드
                </a>
              </div>
              <p className="text-xs text-gray-500 dark:text-neutral-500">
                A4 1장에 3일치가 들어갑니다. 프린트 후 칸마다 채워 넣기만 하면 됩니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-6 py-14 sm:py-20">
        <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-neutral-100">
          이렇게 사용하세요
        </h2>
        <p className="mt-3 text-center text-sm text-gray-500 sm:text-base dark:text-neutral-500">
          종이 한 장에서 시작해 디지털 패턴 분석까지, 5단계로 끝
        </p>

        <ol className="mt-10 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:justify-between sm:gap-1">
          {STEPS.map((s, i) => (
            <Fragment key={i}>
              <li
                className="group flex min-w-0 flex-1 items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition animate-fade-up hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md sm:flex-col sm:items-center sm:gap-3 sm:p-4 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-700"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-3xl transition group-hover:bg-emerald-200 animate-float dark:bg-emerald-900/40 dark:group-hover:bg-emerald-800/60"
                  style={{ animationDelay: `${i * 200}ms` }}
                >
                  {s.emoji}
                </div>
                <div className="flex flex-col sm:items-center sm:text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    Step {i + 1}
                  </span>
                  <span className="text-sm font-bold text-gray-900 sm:text-base dark:text-neutral-100">
                    {s.title}
                  </span>
                  <span className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-neutral-500">
                    {s.body}
                  </span>
                </div>
              </li>
              {i < STEPS.length - 1 ? (
                <li
                  aria-hidden
                  className="flex shrink-0 items-center justify-center text-xl text-emerald-400 animate-arrow-pulse sm:text-2xl dark:text-emerald-500"
                >
                  <span className="sm:hidden">↓</span>
                  <span className="hidden sm:inline">→</span>
                </li>
              ) : null}
            </Fragment>
          ))}
        </ol>

        <p className="mt-8 text-center text-xs text-gray-400 dark:text-neutral-500">
          1~2단계는 종이로, 3~5단계는 1분 안에 끝납니다.
        </p>
      </section>

      <section className="bg-gray-50 dark:bg-neutral-900/50">
        <div className="mx-auto w-full max-w-2xl px-6 py-14 sm:py-20">
          <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-neutral-100">
            왜 snapfeed인가요?
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group rounded-2xl bg-white p-5 shadow-sm transition animate-fade-up hover:-translate-y-0.5 hover:shadow-md dark:bg-neutral-900"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="text-2xl transition-transform group-hover:scale-110">{f.emoji}</div>
                <h3 className="mt-3 text-base font-semibold text-gray-900 sm:text-lg dark:text-neutral-100">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-neutral-400">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-2xl px-6 py-14 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 bg-[length:200%_200%] p-8 text-center text-white shadow-lg animate-gradient sm:p-12 dark:from-emerald-600 dark:via-emerald-700 dark:to-emerald-800">
          <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl animate-float-slow" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/10 blur-2xl animate-float" />
          <div className="relative">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {user ? "오늘 수첩부터 시작해보세요" : "지금 바로 시작하기"}
            </h2>
            <p className="mt-3 text-base text-emerald-50 sm:text-lg">
              {user
                ? "가장 최근에 받은 수유 기록 수첩 한 장을 찍어보시면 됩니다."
                : "이메일 또는 구글 계정으로 1분 내 시작할 수 있습니다."}
            </p>
            <Link
              href={user ? "/upload" : "/login?mode=signup"}
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-emerald-700 shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-lg active:scale-[0.98]"
            >
              {user ? "📷 사진 찍으러 가기" : "가입하고 시작하기"}
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-2xl px-6 pb-10">
        <nav className="flex flex-row justify-center gap-6 border-t border-gray-200 pt-6 text-sm text-gray-600 dark:border-neutral-800 dark:text-neutral-400">
          {user ? (
            <>
              <Link href="/records" className="underline-offset-4 hover:text-gray-900 hover:underline dark:hover:text-neutral-100">기록 목록</Link>
              <Link href="/stats" className="underline-offset-4 hover:text-gray-900 hover:underline dark:hover:text-neutral-100">패턴 분석</Link>
              <Link href="/upload" className="underline-offset-4 hover:text-gray-900 hover:underline dark:hover:text-neutral-100">사진 업로드</Link>
            </>
          ) : (
            <>
              <Link href="/login" className="underline-offset-4 hover:text-gray-900 hover:underline dark:hover:text-neutral-100">로그인</Link>
              <Link href="/login?mode=signup" className="underline-offset-4 hover:text-gray-900 hover:underline dark:hover:text-neutral-100">가입하기</Link>
            </>
          )}
        </nav>
        <nav className="mt-5 flex flex-row justify-center gap-5 text-xs text-gray-400 dark:text-neutral-500">
          <Link href="/privacy" className="underline-offset-4 hover:text-gray-700 hover:underline dark:hover:text-neutral-300">개인정보처리방침</Link>
          <Link href="/terms" className="underline-offset-4 hover:text-gray-700 hover:underline dark:hover:text-neutral-300">이용약관</Link>
        </nav>
        <p className="mt-4 text-center text-xs text-gray-400 dark:text-neutral-500">
          snapfeed · MVP · 본인 · 가족 전용
        </p>
      </footer>
    </main>
  );
}

type UserBarProps = {
  user: { email?: string | null } | null;
  baby: { id: string; name: string } | null;
};

function UserBar({ user, baby }: UserBarProps) {
  return (
    <div className="border-b border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
          snapfeed
        </Link>
        {user ? (
          <div className="flex items-center gap-3 text-sm">
            {baby ? <span className="text-gray-500 dark:text-neutral-400">👶 {baby.name}</span> : null}
            <form action="/auth/logout" method="post">
              <button type="submit" className="text-gray-500 underline-offset-4 hover:text-gray-900 hover:underline dark:text-neutral-400 dark:hover:text-neutral-100">
                로그아웃
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-100">로그인</Link>
            <Link
              href="/login?mode=signup"
              className="rounded-full bg-emerald-600 px-4 py-1.5 font-semibold text-white hover:bg-emerald-700"
            >
              시작하기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function OnboardingPrompt() {
  return (
    <section className="bg-amber-50 dark:bg-amber-950/40">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-6 py-4">
        <p className="text-sm text-amber-900 dark:text-amber-200">
          아이 정보 등록이 아직 완료되지 않았어요.
        </p>
        <Link
          href="/onboarding"
          className="rounded-full bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          이어서 등록
        </Link>
      </div>
    </section>
  );
}

function DashboardBlock({
  baby,
  photoUrl,
}: {
  baby: { id: string; name: string; birth_date: string };
  photoUrl: string | null;
}) {
  return (
    <section className="bg-emerald-600/5 dark:bg-emerald-900/10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-6">
        <div className="flex items-center gap-4">
          <Link
            href="/profile"
            aria-label="프로필 수정"
            className="group relative inline-block rounded-full transition hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={baby.name}
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-white shadow-sm dark:ring-neutral-800"
                unoptimized
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl ring-2 ring-white shadow-sm dark:bg-emerald-900/40 dark:ring-neutral-800">
                👶
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] text-white ring-2 ring-white shadow-sm transition group-hover:bg-emerald-700 dark:ring-neutral-950">
              {photoUrl ? "✎" : "+"}
            </span>
          </Link>
          <div className="flex flex-1 flex-col">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">안녕하세요 👋</h2>
            <span className="text-xs text-gray-500 dark:text-neutral-500">
              {baby.name} · {baby.birth_date}
            </span>
            <Link
              href="/profile"
              className="mt-0.5 text-xs font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
            >
              프로필 수정
            </Link>
          </div>
        </div>
        <InviteButton />
      </div>
    </section>
  );
}

const STEPS = [
  { emoji: "🖨️", title: "인쇄", body: "양육표 PDF를 A4에 출력" },
  { emoji: "✏️", title: "수기 기록", body: "어르신·도우미가 손으로 작성" },
  { emoji: "📷", title: "사진 촬영", body: "완성된 페이지를 스마트폰으로" },
  { emoji: "🤖", title: "AI 인식", body: "Gemini가 자동 디지털화" },
  { emoji: "📊", title: "패턴 보기", body: "일·주·월 단위로 추이 확인" },
];

const FEATURES = [
  { emoji: "⚡", title: "한 번에 여러 기록", body: "하루치 10건, 20건이든 사진 한 장으로 전부 한 번에 처리합니다." },
  { emoji: "🇰🇷", title: "한국어 완벽 지원", body: "직수·유축·분유, 대변·소변·수면 등 한국 부모가 쓰는 표현 그대로." },
  { emoji: "📊", title: "자동 패턴 분석", body: "일일 총량·시간대 분포·평균 수유 간격을 그래프로 시각화합니다." },
  { emoji: "🔒", title: "가족 공유", body: "부모 각자 가입해 같은 아이 기록을 함께 보고 기록합니다." },
];
