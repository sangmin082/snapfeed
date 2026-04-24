import Link from "next/link";
import Image from "next/image";
import { getUser, getPrimaryBaby, babyPhotoUrl } from "@/lib/auth";
import { InviteButton } from "@/components/InviteButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getUser();
  const baby = user ? await getPrimaryBaby(user.id) : null;
  const photoUrl = baby ? await babyPhotoUrl(baby.photo_path) : null;

  return (
    <main className="flex flex-col">
      <UserBar user={user} baby={baby} />

      {user && baby ? <DashboardBlock baby={baby} photoUrl={photoUrl} /> : null}
      {user && !baby ? <OnboardingPrompt /> : null}

      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white">
        <div className="mx-auto max-w-2xl px-6 pt-12 pb-14 sm:pt-20 sm:pb-20">
          <div className="flex flex-col items-center gap-6 text-center sm:gap-8">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 sm:text-sm">
              어르신·산후도우미 ↔ 부모를 잇는
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl">
              수첩에 쓴 수유 기록,<br />
              <span className="text-emerald-600">사진 한 장</span>으로 통합
            </h1>
            <p className="max-w-md text-base leading-relaxed text-gray-600 sm:text-lg">
              할머니·할아버지·산후도우미가 수기로 남겨주신 수유 기록을,
              부모가 한 번에 디지털로 정리해 전체 패턴을 한눈에 확인합니다.
            </p>
            <div className="flex w-full flex-col gap-3 pt-2 sm:w-auto sm:flex-row sm:justify-center">
              <Link
                href={user ? "/upload" : "/login?mode=signup"}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-4 text-lg font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-700 active:scale-[0.98]"
              >
                {user ? "📷 지금 기록하기" : "무료로 시작하기"}
              </Link>
              <Link
                href={user ? "/records" : "/login"}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-8 py-4 text-lg font-semibold text-gray-900 transition hover:bg-gray-50 active:scale-[0.98]"
              >
                {user ? "기록 보기" : "로그인"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-2xl px-6 py-14 sm:py-20">
        <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          이런 상황을 위해 만들었습니다
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 sm:p-6">
            <div className="text-2xl">👵🏻</div>
            <h3 className="mt-3 text-base font-semibold text-amber-900 sm:text-lg">돌봐주시는 분</h3>
            <p className="mt-2 text-sm leading-relaxed text-amber-900/80 sm:text-base">
              어르신(할머니·할아버지)이나 산후도우미는 앱 설치·입력이 번거롭습니다.
              수첩에 손으로 편하게 기록하는 게 가장 자연스럽습니다.
            </p>
          </div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-5 sm:p-6">
            <div className="text-2xl">👨‍👩‍👧</div>
            <h3 className="mt-3 text-base font-semibold text-sky-900 sm:text-lg">부모</h3>
            <p className="mt-2 text-sm leading-relaxed text-sky-900/80 sm:text-base">
              흩어진 수첩 기록을 모아 수유 간격·총량·시간대 패턴을 확인하고 싶은데,
              하나하나 입력할 시간이 없습니다.
            </p>
          </div>
        </div>
        <div className="mt-6 rounded-2xl bg-emerald-50 p-5 text-center text-sm font-medium text-emerald-900 sm:p-6 sm:text-base">
          snapfeed가 이 두 과정을 연결합니다 — 사진 한 장으로.
        </div>
      </section>

      <section className="mx-auto w-full max-w-2xl px-6 py-14 sm:py-20">
        <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          이렇게 작동합니다
        </h2>
        <p className="mt-3 text-center text-sm text-gray-500 sm:text-base">
          세 단계로 하루치 기록이 디지털로 정리됩니다
        </p>
        <ol className="mt-10 flex flex-col gap-5">
          {STEPS.map((s, i) => (
            <li key={i} className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
                {i + 1}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold text-gray-900 sm:text-lg">{s.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600 sm:text-base">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-2xl px-6 py-14 sm:py-20">
          <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            왜 snapfeed인가요?
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="text-2xl">{f.emoji}</div>
                <h3 className="mt-3 text-base font-semibold text-gray-900 sm:text-lg">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-2xl px-6 py-14 sm:py-20">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 text-center text-white shadow-lg sm:p-12">
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
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-emerald-700 shadow-md transition hover:bg-emerald-50 active:scale-[0.98]"
          >
            {user ? "📷 사진 찍으러 가기" : "가입하고 시작하기"}
          </Link>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-2xl px-6 pb-10">
        <nav className="flex flex-row justify-center gap-6 border-t border-gray-200 pt-6 text-sm text-gray-600">
          {user ? (
            <>
              <Link href="/records" className="underline-offset-4 hover:text-gray-900 hover:underline">기록 목록</Link>
              <Link href="/stats" className="underline-offset-4 hover:text-gray-900 hover:underline">패턴 분석</Link>
              <Link href="/upload" className="underline-offset-4 hover:text-gray-900 hover:underline">사진 업로드</Link>
            </>
          ) : (
            <>
              <Link href="/login" className="underline-offset-4 hover:text-gray-900 hover:underline">로그인</Link>
              <Link href="/login?mode=signup" className="underline-offset-4 hover:text-gray-900 hover:underline">가입하기</Link>
            </>
          )}
        </nav>
        <p className="mt-5 text-center text-xs text-gray-400">
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
    <div className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-emerald-600">
          snapfeed
        </Link>
        {user ? (
          <div className="flex items-center gap-3 text-sm">
            {baby ? <span className="text-gray-500">👶 {baby.name}</span> : null}
            <form action="/auth/logout" method="post">
              <button type="submit" className="text-gray-500 underline-offset-4 hover:text-gray-900 hover:underline">
                로그아웃
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-gray-600 hover:text-gray-900">로그인</Link>
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
    <section className="bg-amber-50">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-6 py-4">
        <p className="text-sm text-amber-900">
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
    <section className="bg-emerald-600/5">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-6">
        <div className="flex items-center gap-4">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={baby.name}
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-white shadow-sm"
              unoptimized
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
              👶
            </div>
          )}
          <div className="flex flex-1 flex-col">
            <h2 className="text-lg font-semibold text-gray-900">안녕하세요 👋</h2>
            <span className="text-xs text-gray-500">
              {baby.name} · {baby.birth_date}
            </span>
          </div>
        </div>
        <InviteButton />
      </div>
    </section>
  );
}

const STEPS = [
  {
    title: "📷 수첩을 사진으로",
    body:
      "어르신·산후도우미가 적어주신 수첩 한 페이지를 휴대폰 카메라로 찍거나 앨범에서 선택합니다. 여러 기록이 섞여 있어도 한 번에 처리됩니다.",
  },
  {
    title: "✨ AI가 한국어로 인식",
    body:
      "Google Gemini가 시간·양·종류(직수·유축·분유)와 배변·수면 메모까지 그대로 읽어냅니다.",
  },
  {
    title: "💾 확인하고 한 번에 저장",
    body:
      "결과를 표로 한눈에 확인하고 필요하면 바로 수정. 저장 버튼 한 번으로 모든 기록이 DB에 들어갑니다.",
  },
];

const FEATURES = [
  { emoji: "⚡", title: "한 번에 여러 기록", body: "하루치 10건, 20건이든 사진 한 장으로 전부 한 번에 처리합니다." },
  { emoji: "🇰🇷", title: "한국어 완벽 지원", body: "직수·유축·분유, 대변·소변·수면 등 한국 부모가 쓰는 표현 그대로." },
  { emoji: "📊", title: "자동 패턴 분석", body: "일일 총량·시간대 분포·평균 수유 간격을 그래프로 시각화합니다." },
  { emoji: "🔒", title: "가족 공유", body: "부모 각자 가입해 같은 아이 기록을 함께 보고 기록합니다." },
];
