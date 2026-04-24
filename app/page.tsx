import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col">
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white">
        <div className="mx-auto max-w-2xl px-6 pt-16 pb-14 sm:pt-24 sm:pb-20">
          <div className="flex flex-col items-center gap-6 text-center sm:gap-8">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 sm:text-sm">
              AI 수유 기록 도우미
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl">
              수기 수유 기록을<br />
              <span className="text-emerald-600">사진 한 장</span>으로
            </h1>
            <p className="max-w-md text-base leading-relaxed text-gray-600 sm:text-lg">
              수첩에 적어둔 시간·양·종류를 AI가 한 번에 읽어 정리합니다.
              확인하고 저장만 누르면 끝.
            </p>
            <div className="flex w-full flex-col gap-3 pt-2 sm:w-auto sm:flex-row sm:justify-center">
              <Link
                href="/upload"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-4 text-lg font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-700 active:scale-[0.98]"
              >
                📷 지금 기록하기
              </Link>
              <Link
                href="/records"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-8 py-4 text-lg font-semibold text-gray-900 transition hover:bg-gray-50 active:scale-[0.98]"
              >
                기록 보기
              </Link>
            </div>
          </div>
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
          <li className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
              1
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-gray-900 sm:text-lg">📷 사진으로 찍거나 선택</h3>
              <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
                수기 수유 기록지를 휴대폰 카메라로 찍거나 앨범에서 선택합니다.
                한 페이지에 여러 기록이 있어도 괜찮습니다.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
              2
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-gray-900 sm:text-lg">✨ AI가 한국어로 인식</h3>
              <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
                Google Gemini가 시간·양·종류(직수·유축·분유)와 배변·수면 메모까지
                그대로 읽어냅니다.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
              3
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-gray-900 sm:text-lg">💾 확인하고 한 번에 저장</h3>
              <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
                결과를 표로 한눈에 확인하고 필요하면 바로 수정.
                저장 버튼 한 번으로 모든 기록이 DB에 들어갑니다.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-2xl px-6 py-14 sm:py-20">
          <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            왜 snapfeed인가요?
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="text-2xl">⚡</div>
              <h3 className="mt-3 text-base font-semibold text-gray-900 sm:text-lg">한 번에 여러 기록</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                하루치 10건, 20건이든 사진 한 장으로 전부 한 번에 처리합니다.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="text-2xl">🇰🇷</div>
              <h3 className="mt-3 text-base font-semibold text-gray-900 sm:text-lg">한국어 완벽 지원</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                직수·유축·분유, 대변·소변·수면 등 한국 부모가 쓰는 표현 그대로.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="text-2xl">📊</div>
              <h3 className="mt-3 text-base font-semibold text-gray-900 sm:text-lg">자동 패턴 분석</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                일일 총량·시간대 분포·평균 수유 간격을 그래프로 시각화합니다.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="text-2xl">🔒</div>
              <h3 className="mt-3 text-base font-semibold text-gray-900 sm:text-lg">본인·가족 전용</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                광고 없음, 외부 공유 없음. 내 기록은 내 DB에만 저장됩니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-2xl px-6 py-14 sm:py-20">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 text-center text-white shadow-lg sm:p-12">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            지금 첫 기록 남기기
          </h2>
          <p className="mt-3 text-base text-emerald-50 sm:text-lg">
            가장 최근 수유 기록지를 한 번 찍어보세요.
          </p>
          <Link
            href="/upload"
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-emerald-700 shadow-md transition hover:bg-emerald-50 active:scale-[0.98]"
          >
            📷 사진 찍으러 가기
          </Link>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-2xl px-6 pb-10">
        <nav className="flex flex-row justify-center gap-6 border-t border-gray-200 pt-6 text-sm text-gray-600">
          <Link href="/records" className="underline-offset-4 hover:text-gray-900 hover:underline">
            기록 목록
          </Link>
          <Link href="/stats" className="underline-offset-4 hover:text-gray-900 hover:underline">
            패턴 분석
          </Link>
          <Link href="/upload" className="underline-offset-4 hover:text-gray-900 hover:underline">
            사진 업로드
          </Link>
        </nav>
        <p className="mt-5 text-center text-xs text-gray-400">
          snapfeed · MVP · 본인 · 가족 전용
        </p>
      </footer>
    </main>
  );
}
