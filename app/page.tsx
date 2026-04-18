import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">snapfeed</h1>
        <p className="text-sm text-gray-600">수기 수유 기록을 사진 한 장으로 디지털화</p>
      </header>

      <Link
        href="/upload"
        className="rounded-2xl bg-black px-6 py-8 text-center text-xl font-medium text-white shadow-sm"
      >
        📷 사진 찍어 기록하기
      </Link>

      <nav className="flex gap-3 text-sm">
        <Link href="/records" className="flex-1 rounded-lg border px-4 py-3 text-center">
          기록 목록
        </Link>
        <Link href="/stats" className="flex-1 rounded-lg border px-4 py-3 text-center">
          패턴 분석
        </Link>
      </nav>

      <footer className="mt-auto pt-8 text-xs text-gray-400">
        MVP · 본인 · 가족 전용
      </footer>
    </main>
  );
}
