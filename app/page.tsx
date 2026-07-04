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

  // Signed-in users get an app-style home (paired with the bottom tab
  // bar); the marketing landing is for visitors only.
  if (user) return <AppHome baby={baby} photoUrl={photoUrl} />;

  return (
    <main className="flex flex-col">
      <UserBar user={user} baby={null} />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[linear-gradient(175deg,#faf3e3_0%,#fdf8ec_55%,#fdfbf5_100%)] dark:bg-[linear-gradient(175deg,#16130c_0%,#141108_55%,#0a0a0a_100%)]">
        <div className="relative mx-auto w-full max-w-2xl px-6 pt-14 pb-16 sm:pt-20 sm:pb-20">
          <div className="flex flex-col items-center gap-5 text-center">
            <span
              className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-xs font-medium text-gray-600 shadow-sm ring-1 ring-gray-900/5 backdrop-blur animate-fade-up sm:text-sm dark:bg-neutral-900/80 dark:text-neutral-300 dark:ring-white/10"
              style={{ animationDelay: "0ms" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              어르신 · 산후도우미와 부모를 잇는 기록
            </span>

            <h1
              className="text-[2.15rem] font-extrabold leading-[1.25] tracking-[-0.02em] text-gray-900 animate-fade-up sm:text-5xl sm:leading-[1.2] dark:text-neutral-50"
              style={{ animationDelay: "70ms" }}
            >
              손으로 적은 육아 수첩,
              <br />
              <span className="text-amber-600 dark:text-amber-400">찰칵 한 번</span>이면
              기록 끝
            </h1>

            <p
              className="max-w-sm text-[15px] leading-relaxed text-gray-500 animate-fade-up sm:max-w-md sm:text-lg dark:text-neutral-400"
              style={{ animationDelay: "140ms" }}
            >
              할머니 · 산후도우미가 수첩에 남겨주신 수유 기록,
              사진 한 장이면 AI가 알아서 정리해드려요.
            </p>

            <div
              className="flex w-full flex-col gap-2.5 pt-3 animate-fade-up sm:w-auto sm:flex-row"
              style={{ animationDelay: "210ms" }}
            >
              <Link
                href={user ? "/upload" : "/login?mode=signup"}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-300 px-8 py-4 text-base font-bold text-amber-950 shadow-lg shadow-amber-400/30 transition hover:-translate-y-0.5 hover:bg-amber-400 active:scale-[0.98] sm:text-lg dark:bg-amber-300 dark:hover:bg-amber-200"
              >
                {user ? "📷 지금 기록하기" : "무료로 시작하기"}
              </Link>
              <Link
                href={user ? "/records" : "/login"}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-gray-700 ring-1 ring-gray-900/10 transition hover:-translate-y-0.5 hover:bg-gray-50 active:scale-[0.98] sm:text-lg dark:bg-neutral-900 dark:text-neutral-200 dark:ring-white/10 dark:hover:bg-neutral-800"
              >
                {user ? "기록 보기" : "로그인"}
              </Link>
            </div>
          </div>

          <HeroMockup />

          <div className="mx-auto mt-12 grid max-w-md grid-cols-3 divide-x divide-gray-200/70 text-center animate-fade-up dark:divide-neutral-800" style={{ animationDelay: "350ms" }}>
            {[
              ["사진 1장", "필요한 건 그게 다"],
              ["20건+", "하루치를 한 번에"],
              ["1분", "촬영부터 저장까지"],
            ].map(([big, small]) => (
              <div key={big} className="flex flex-col gap-0.5 px-2">
                <span className="text-lg font-extrabold tracking-tight text-gray-900 sm:text-xl dark:text-neutral-100">{big}</span>
                <span className="text-[11px] text-gray-400 sm:text-xs dark:text-neutral-500">{small}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 공감 섹션 ────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-20">
        <p className="text-center text-sm font-semibold text-amber-600 dark:text-amber-400">이런 마음, 아시죠?</p>
        <h2 className="mt-2 text-center text-[1.55rem] font-extrabold tracking-tight text-gray-900 sm:text-3xl dark:text-neutral-100">
          기록은 남기고 싶고,
          <br className="sm:hidden" /> 입력은 버겁고
        </h2>
        <div className="mt-9 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="rounded-3xl bg-stone-100/70 p-6 ring-1 ring-stone-200/70 dark:bg-stone-900/40 dark:ring-stone-800">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-neutral-900">👵🏻</span>
            <h3 className="mt-4 text-[17px] font-bold text-gray-900 dark:text-neutral-100">돌봐주시는 분은</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-neutral-400">
              앱 설치도, 화면 입력도 번거로워요.
              수첩에 손으로 적는 게 제일 편하고 자연스럽죠.
            </p>
          </div>
          <div className="rounded-3xl bg-sky-50/70 p-6 ring-1 ring-sky-100 dark:bg-sky-950/20 dark:ring-sky-900/40">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-neutral-900">🤱</span>
            <h3 className="mt-4 text-[17px] font-bold text-gray-900 dark:text-neutral-100">엄마 아빠는</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-neutral-400">
              수유 간격 · 총량 · 패턴은 보고 싶은데,
              흩어진 수첩을 하나하나 옮겨 적을 시간이 없어요.
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-3xl bg-amber-300 p-6 text-center dark:bg-amber-300">
          <p className="text-[15px] font-bold text-amber-950 sm:text-base">
            손은 종이에, 정리는 AI에게.
            <span className="font-medium opacity-80"> snapfeed가 두 마음을 잇습니다.</span>
          </p>
        </div>
      </section>

      {/* ── 사용 순서 ────────────────────────────────────── */}
      <section className="bg-stone-100/50 dark:bg-neutral-900/40">
        <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-20">
          <p className="text-center text-sm font-semibold text-amber-600 dark:text-amber-400">how it works</p>
          <h2 className="mt-2 text-center text-[1.55rem] font-extrabold tracking-tight text-gray-900 sm:text-3xl dark:text-neutral-100">
            종이에서 그래프까지, 다섯 걸음
          </h2>
          <ol className="mt-10 flex flex-col gap-0">
            {STEPS.map((s, i) => (
              <Fragment key={s.title}>
                <li
                  className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5 animate-fade-up sm:p-5 dark:bg-neutral-900 dark:ring-white/5"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-2xl dark:bg-amber-950/60">
                    {s.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[11px] font-extrabold text-amber-500 dark:text-amber-400">{String(i + 1).padStart(2, "0")}</span>
                      <h3 className="text-[15px] font-bold text-gray-900 sm:text-base dark:text-neutral-100">{s.title}</h3>
                    </div>
                    <p className="mt-0.5 text-[13px] text-gray-500 sm:text-sm dark:text-neutral-400">{s.body}</p>
                  </div>
                </li>
                {i < STEPS.length - 1 ? (
                  <li aria-hidden className="flex justify-center py-1 text-gray-300 dark:text-neutral-700">
                    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" className="opacity-80">
                      <path d="M6 0v11m0 0l-4.5-4M6 11l4.5-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </li>
                ) : null}
              </Fragment>
            ))}
          </ol>
          <p className="mt-7 text-center text-xs text-gray-400 dark:text-neutral-500">
            1 ~ 2단계는 종이에서, 3 ~ 5단계는 1분이면 충분해요.
          </p>
        </div>
      </section>

      {/* ── 무료 기록지 ──────────────────────────────────── */}
      <section className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-20">
        <div className="overflow-hidden rounded-[2rem] bg-amber-50/80 ring-1 ring-amber-100 dark:bg-amber-950/20 dark:ring-amber-900/40">
          <div className="flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:p-9">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-white text-5xl shadow-sm sm:h-28 sm:w-28 dark:bg-neutral-900">
              📋
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <div>
                <span className="rounded-full bg-gray-900 px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-amber-300 dark:bg-neutral-100 dark:text-amber-700">
                  FREE
                </span>
                <h2 className="mt-2.5 text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl dark:text-neutral-100">
                  인쇄해서 바로 쓰는
                  <br className="sm:hidden" /> 신생아 기록지
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-neutral-400">
                24시간 칸에 수유 · 배설 · 체온까지 손으로 적는 표준 양식.
                프린트해서 드리고, 하루 끝에 사진 한 장만 올리면 돼요.
                A4 한 장에 3일치가 들어갑니다.
              </p>
              <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                <a
                  href="/baby-chart.pdf"
                  download
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800 active:scale-[0.98] dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                >
                  PDF 다운로드
                </a>
                <a
                  href="/baby-chart.xls"
                  download
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-700 ring-1 ring-gray-900/10 transition hover:bg-gray-50 active:scale-[0.98] dark:bg-neutral-900 dark:text-neutral-200 dark:ring-white/10 dark:hover:bg-neutral-800"
                >
                  엑셀 (.xls)
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 특징 ─────────────────────────────────────────── */}
      <section className="bg-stone-100/50 dark:bg-neutral-900/40">
        <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-20">
          <p className="text-center text-sm font-semibold text-amber-600 dark:text-amber-400">why snapfeed</p>
          <h2 className="mt-2 text-center text-[1.55rem] font-extrabold tracking-tight text-gray-900 sm:text-3xl dark:text-neutral-100">
            육아 기록, 이렇게 가벼워져요
          </h2>
          <div className="mt-9 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition animate-fade-up hover:-translate-y-0.5 hover:shadow-md dark:bg-neutral-900 dark:ring-white/5"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-50 text-2xl dark:bg-neutral-800">
                  {f.emoji}
                </span>
                <h3 className="mt-4 text-[17px] font-bold text-gray-900 dark:text-neutral-100">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500 dark:text-neutral-400">{f.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-9 rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-gray-900/5 sm:p-9 dark:bg-neutral-900 dark:ring-white/5">
            <h3 className="text-lg font-extrabold tracking-tight text-gray-900 sm:text-xl dark:text-neutral-100">
              앱은 편하지만, 종이가 마음 편할 때가 있으니까
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-[15px] dark:text-neutral-400">
              새벽 수유 끝나고 폰 화면에서 12개 항목을 누를 여력은 없죠.
              그렇다고 손글씨로만 남기면 패턴이 안 보이고요.
              한 줄씩 또박또박 적는 그 시간은 그대로 두고,
              디지털화만 AI가 사진 한 장으로 대신합니다.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-gray-900 p-8 text-center sm:p-12 dark:bg-amber-300">
          <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-amber-400/25 blur-3xl dark:bg-white/25" />
          <div className="relative">
            <p className="text-3xl">🍼</p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl dark:text-amber-950">
              {user ? "오늘 수첩부터 찍어보세요" : "첫 사진, 지금 올려보세요"}
            </h2>
            <p className="mt-2.5 text-[15px] text-gray-400 sm:text-base dark:text-amber-900">
              {user
                ? "가장 최근 수유 기록 한 장이면 충분해요."
                : "이메일이나 구글 계정으로 1분 안에 시작해요."}
            </p>
            <Link
              href={user ? "/upload" : "/login?mode=signup"}
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-gray-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-gray-50 active:scale-[0.98] sm:text-lg dark:bg-amber-950 dark:text-amber-50 dark:hover:bg-amber-900"
            >
              {user ? "📷 사진 찍으러 가기" : "무료로 시작하기"}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="mx-auto w-full max-w-2xl px-6 pb-12">
        <nav className="flex flex-row justify-center gap-6 border-t border-gray-100 pt-7 text-sm text-gray-500 dark:border-neutral-900 dark:text-neutral-400">
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
          <Link href="/privacy" className="underline-offset-4 hover:text-gray-600 hover:underline dark:hover:text-neutral-300">개인정보처리방침</Link>
          <Link href="/terms" className="underline-offset-4 hover:text-gray-600 hover:underline dark:hover:text-neutral-300">이용약관</Link>
        </nav>
        <p className="mt-4 text-center text-xs text-gray-300 dark:text-neutral-600">
          snapfeed — 우리 가족의 육아 기록
        </p>
      </footer>
    </main>
  );
}

/* 로그인 사용자용 앱 홈 — 하단 탭바와 짝을 이루는 대시보드형 첫 화면 */
function AppHome({
  baby,
  photoUrl,
}: {
  baby: { id: string; name: string; birth_date: string } | null;
  photoUrl: string | null;
}) {
  return (
    <main className="flex min-h-screen flex-col">
      <UserBar user={{ email: null }} baby={baby} />
      {baby ? <DashboardBlock baby={baby} photoUrl={photoUrl} /> : <OnboardingPrompt />}

      <section className="mx-auto w-full max-w-2xl flex-1 px-5 py-6">
        {/* 메인 액션 */}
        <Link
          href="/upload"
          className="flex items-center gap-4 rounded-3xl bg-amber-300 p-5 shadow-lg shadow-amber-400/30 transition hover:-translate-y-0.5 hover:bg-amber-400 active:scale-[0.99]"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/60 text-3xl">
            📷
          </span>
          <span className="flex flex-col">
            <span className="text-lg font-extrabold text-amber-950">사진으로 기록하기</span>
            <span className="text-sm font-medium text-amber-900/70">
              수첩 한 페이지, 찰칵이면 끝나요
            </span>
          </span>
        </Link>

        {/* 보조 액션 */}
        <div className="mt-3.5 grid grid-cols-2 gap-3.5">
          <Link
            href="/records"
            className="flex flex-col gap-2 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5 transition hover:-translate-y-0.5 hover:shadow-md dark:bg-neutral-900 dark:ring-white/5"
          >
            <span className="text-2xl">📋</span>
            <span className="text-[15px] font-bold text-gray-900 dark:text-neutral-100">기록 보기</span>
            <span className="text-xs text-gray-500 dark:text-neutral-400">날짜별 수유 · 배변 내역</span>
          </Link>
          <Link
            href="/stats"
            className="flex flex-col gap-2 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5 transition hover:-translate-y-0.5 hover:shadow-md dark:bg-neutral-900 dark:ring-white/5"
          >
            <span className="text-2xl">📊</span>
            <span className="text-[15px] font-bold text-gray-900 dark:text-neutral-100">패턴 분석</span>
            <span className="text-xs text-gray-500 dark:text-neutral-400">총량 · 간격 그래프</span>
          </Link>
        </div>

        {/* 기록지 */}
        <div className="mt-3.5 flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5 dark:bg-neutral-900 dark:ring-white/5">
          <span className="text-2xl">🖨️</span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-gray-900 dark:text-neutral-100">신생아 기록지</p>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              인쇄해서 돌봐주시는 분께 드리세요
            </p>
          </div>
          <a
            href="/baby-chart.pdf"
            download
            className="shrink-0 rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-gray-800 dark:bg-neutral-100 dark:text-neutral-900"
          >
            PDF
          </a>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-gray-400 dark:text-neutral-500">
          하루가 끝나면 수첩 페이지를 찍어 올려주세요.
          <br />
          AI가 시간 · 양 · 배변까지 자동으로 정리합니다.
        </p>
      </section>

      <footer className="mx-auto w-full max-w-2xl px-6 pb-8">
        <nav className="flex flex-row justify-center gap-5 border-t border-gray-100 pt-5 text-xs text-gray-400 dark:border-neutral-900 dark:text-neutral-500">
          <Link href="/profile" className="underline-offset-4 hover:text-gray-600 hover:underline dark:hover:text-neutral-300">내 정보</Link>
          <Link href="/privacy" className="underline-offset-4 hover:text-gray-600 hover:underline dark:hover:text-neutral-300">개인정보처리방침</Link>
          <Link href="/terms" className="underline-offset-4 hover:text-gray-600 hover:underline dark:hover:text-neutral-300">이용약관</Link>
        </nav>
      </footer>
    </main>
  );
}

/* 수첩(손글씨) → 앱(정리된 기록) 변환을 보여주는 CSS 목업 */
function HeroMockup() {
  return (
    <div className="mx-auto mt-12 max-w-lg animate-fade-up" style={{ animationDelay: "280ms" }}>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        {/* 손글씨 수첩 */}
        <div className="rotate-[-2.5deg] rounded-2xl bg-[#fffdf5] p-4 shadow-lg shadow-amber-900/5 ring-1 ring-amber-900/10 dark:bg-[#1c1a14] dark:ring-amber-100/10">
          <p className="text-[10px] font-semibold tracking-wide text-amber-700/60 dark:text-amber-200/50">4월 22일 (화)</p>
          <div className="mt-1 flex flex-col [background-image:repeating-linear-gradient(transparent,transparent_27px,#00000014_28px)] dark:[background-image:repeating-linear-gradient(transparent,transparent_27px,#ffffff1a_28px)]">
            {[
              "6:30  분유 120",
              "9:10  소변 ✓",
              "11:40 분유 100",
              "2:20  대변 ○",
              "4:50  분유 140",
            ].map((line, i) => (
              <span
                key={line}
                className="h-7 font-hand text-[17px] leading-7 text-slate-700 sm:text-[19px] dark:text-slate-300"
                style={{ transform: `rotate(${i % 2 === 0 ? -0.6 : 0.5}deg)` }}
              >
                {line}
              </span>
            ))}
          </div>
        </div>

        {/* 가운데: 카메라 */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-600 text-lg shadow-lg shadow-amber-600/30 animate-float sm:h-13 sm:w-13 sm:text-xl dark:bg-amber-500">
            📷
          </span>
          <svg width="26" height="10" viewBox="0 0 26 10" fill="none" className="text-amber-500 animate-arrow-pulse">
            <path d="M0 5h22m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* 정리된 앱 화면 */}
        <div className="rotate-[2deg] rounded-2xl bg-white p-4 shadow-xl shadow-amber-900/10 ring-1 ring-gray-900/5 dark:bg-neutral-900 dark:ring-white/10">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-900 dark:text-neutral-100">4월 22일</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <span className="h-1 w-1 rounded-full bg-amber-500" />
              자동 정리
            </span>
          </div>
          <div className="mt-2.5 flex flex-col gap-1.5">
            {[
              ["🍼", "06:30", "분유 120ml"],
              ["💧", "09:10", "소변"],
              ["🍼", "11:40", "분유 100ml"],
              ["🍼", "16:50", "분유 140ml"],
            ].map(([emoji, time, label]) => (
              <div key={time} className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1.5 dark:bg-neutral-800/70">
                <span className="text-[10px]">{emoji}</span>
                <span className="text-[9px] font-bold tabular-nums text-gray-400 dark:text-neutral-500">{time}</span>
                <span className="truncate text-[9px] font-semibold text-gray-700 dark:text-neutral-300">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-2.5 flex items-end justify-between rounded-lg bg-amber-50/70 px-2.5 py-2 dark:bg-amber-950/40">
            <span className="text-[8px] font-semibold text-amber-700 dark:text-amber-300">오늘 총 수유량</span>
            <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400">360ml</span>
          </div>
        </div>
      </div>
    </div>
  );
}

type UserBarProps = {
  user: { email?: string | null } | null;
  baby: { id: string; name: string } | null;
};

function UserBar({ user, baby }: UserBarProps) {
  return (
    <div className="border-b border-stone-200/60 bg-[#fdfbf5] dark:border-neutral-900 dark:bg-neutral-950">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-neutral-50">
          snap<span className="text-amber-600 dark:text-amber-400">feed</span>
        </Link>
        {user ? (
          <div className="flex items-center gap-3 text-sm">
            {baby ? <span className="text-gray-500 dark:text-neutral-400">👶 {baby.name}</span> : null}
            <form action="/auth/logout" method="post">
              <button type="submit" className="text-gray-400 underline-offset-4 hover:text-gray-900 hover:underline dark:text-neutral-500 dark:hover:text-neutral-100">
                로그아웃
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="font-medium text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-100">로그인</Link>
            <Link
              href="/login?mode=signup"
              className="rounded-xl bg-amber-300 px-4 py-2 font-bold text-amber-950 transition hover:bg-amber-400 dark:bg-amber-300 dark:hover:bg-amber-200"
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
          className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700"
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
    <section className="bg-amber-600/5 dark:bg-amber-900/10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-6">
        <div className="flex items-center gap-4">
          <Link
            href="/profile"
            aria-label="프로필 수정"
            className="group relative inline-block rounded-full transition hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
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
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl ring-2 ring-white shadow-sm dark:bg-amber-900/40 dark:ring-neutral-800">
                👶
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[11px] text-white ring-2 ring-white shadow-sm transition group-hover:bg-amber-700 dark:ring-neutral-950">
              {photoUrl ? "✎" : "+"}
            </span>
          </Link>
          <div className="flex flex-1 flex-col">
            <h2 className="text-lg font-bold text-gray-900 dark:text-neutral-100">안녕하세요 👋</h2>
            <span className="text-xs text-gray-500 dark:text-neutral-500">
              {baby.name} · {baby.birth_date}
            </span>
            <Link
              href="/profile"
              className="mt-0.5 text-xs font-medium text-amber-700 underline-offset-4 hover:underline dark:text-amber-300"
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
  { emoji: "🖨️", title: "기록지 인쇄", body: "무료 양식을 A4에 출력해서 준비해요" },
  { emoji: "✏️", title: "손으로 기록", body: "돌봐주시는 분이 편하게 적어주세요" },
  { emoji: "📷", title: "사진 한 장", body: "하루 끝에 페이지를 찰칵" },
  { emoji: "🤖", title: "AI가 정리", body: "시간·양·형태까지 자동으로 입력돼요" },
  { emoji: "📊", title: "패턴 확인", body: "수유 간격과 총량을 그래프로 봐요" },
];

const FEATURES = [
  { emoji: "⚡", title: "하루치를 한 번에", body: "10건이든 20건이든, 사진 한 장으로 전부 저장돼요." },
  { emoji: "🇰🇷", title: "한국어 그대로", body: "직수 · 유축 · 분유, 소변 · 대변까지 우리가 쓰는 말 그대로 읽어요." },
  { emoji: "📊", title: "패턴이 보여요", body: "일일 총량, 시간대 분포, 평균 수유 간격을 자동으로 그려드려요." },
  { emoji: "👨‍👩‍👧", title: "가족이 함께", body: "초대 코드 하나로 같은 아이 기록을 함께 보고 남겨요." },
];
