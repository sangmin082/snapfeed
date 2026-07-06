import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { babyPhotoUrl, getPrimaryBaby, requireUser } from "@/lib/auth";
import { InviteButton } from "@/components/InviteButton";
import { DeleteAccountSection } from "@/components/DeleteAccountSection";
import { FeedReminderButton } from "@/components/FeedReminderButton";
import { ShareAppButton } from "@/components/ShareAppButton";
import ThemeToggle from "@/components/ThemeToggle";
import { BabyIcon, BellIcon, MailIcon, MoonIcon, UsersIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "설정" };

const CONTACT = "sangmin082@gmail.com";

export default async function SettingsPage() {
  const user = await requireUser();
  const baby = await getPrimaryBaby(user.id);
  const photoUrl = baby ? await babyPhotoUrl(baby.photo_path) : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-5 py-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-neutral-100">
        설정
      </h1>

      {/* ── 아기 프로필 ── */}
      <Card>
        <Link href="/profile" className="flex items-center gap-4 p-4">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={baby?.name ?? "아기"}
              width={52}
              height={52}
              className="h-13 w-13 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-13 w-13 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <BabyIcon className="h-6 w-6" />
            </span>
          )}
          <span className="flex flex-1 flex-col">
            <span className="text-base font-semibold text-gray-900 dark:text-neutral-100">
              {baby?.name ?? "아기 등록하기"}
            </span>
            <span className="text-sm text-gray-500 dark:text-neutral-400">
              {baby?.birth_date ?? "아직 아기 정보가 없어요"}
            </span>
          </span>
          <Chevron />
        </Link>
      </Card>

      {/* ── 가족 함께 쓰기 ── */}
      <Card>
        <div className="flex flex-col gap-3 p-4">
          <p className="flex items-center gap-2.5 text-sm font-semibold text-gray-900 dark:text-neutral-100">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
              <UsersIcon className="h-4.5 w-4.5" />
            </span>
            가족 초대하기
          </p>
          <p className="text-xs leading-relaxed text-gray-500 dark:text-neutral-400">
            초대 링크로 배우자·조부모님과 같은 아기 기록을 함께 봐요.
          </p>
          <InviteButton />
        </div>
      </Card>

      {/* ── 앱 설정 ── */}
      <Card>
        <div className="flex items-center justify-between p-4">
          <span className="flex items-center gap-2.5 text-sm font-medium text-gray-900 dark:text-neutral-100">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-500 dark:bg-indigo-900/40 dark:text-indigo-400">
              <MoonIcon className="h-4.5 w-4.5" />
            </span>
            다크모드
          </span>
          <ThemeToggle />
        </div>
        <Divider />
        <div className="p-4">
          {/* Native-only: schedules an on-device feeding reminder */}
          <FeedReminderButton hoursFromNow={3} />
          <p className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-neutral-500">
            <BellIcon className="h-3.5 w-3.5" />
            수유 알림은 앱에서만 사용할 수 있어요.
          </p>
        </div>
      </Card>

      {/* ── 지원 ── */}
      <Card>
        <a href={`mailto:${CONTACT}?subject=${encodeURIComponent("[snapfeed] 문의")}`} className="flex items-center justify-between p-4">
          <span className="flex items-center gap-2.5 text-sm font-medium text-gray-900 dark:text-neutral-100">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">
              <MailIcon className="h-4.5 w-4.5" />
            </span>
            문의하기
          </span>
          <Chevron />
        </a>
        <Divider />
        <ShareAppButton className="flex w-full items-center justify-between p-4 text-left text-sm font-medium text-gray-900 dark:text-neutral-100" />
        <Divider />
        <Link href="/privacy" className="flex items-center justify-between p-4">
          <span className="text-sm font-medium text-gray-900 dark:text-neutral-100">개인정보처리방침</span>
          <Chevron />
        </Link>
        <Divider />
        <Link href="/terms" className="flex items-center justify-between p-4">
          <span className="text-sm font-medium text-gray-900 dark:text-neutral-100">이용약관</span>
          <Chevron />
        </Link>
      </Card>

      {/* ── 계정 ── */}
      <Card>
        <form action="/auth/logout" method="post">
          <button
            type="submit"
            className="w-full p-4 text-left text-sm font-medium text-gray-900 dark:text-neutral-100"
          >
            로그아웃
          </button>
        </form>
      </Card>

      {/* 회원 탈퇴 (App Store 5.1.1(v) 필수) */}
      <DeleteAccountSection />

      <p className="pb-4 text-center text-xs text-gray-400 dark:text-neutral-600">
        {user.email ?? ""}
      </p>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5 dark:bg-neutral-900 dark:ring-white/5">
      {children}
    </section>
  );
}

function Divider() {
  return <div className="mx-4 h-px bg-gray-100 dark:bg-neutral-800" />;
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-300 dark:text-neutral-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
