"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "홈", icon: HomeIcon },
  { href: "/records", label: "기록", icon: ListIcon },
  { href: "/upload", label: "", icon: CameraIcon, primary: true },
  { href: "/stats", label: "패턴", icon: ChartIcon },
  { href: "/settings", label: "설정", icon: GearIcon },
] as const;

// Native-app style bottom tab bar on mobile widths. Shown to guests too —
// auth-gated tabs simply redirect to /login when tapped.
export default function BottomTabBar() {
  const pathname = usePathname();

  const hidden = ["/login", "/onboarding", "/invite"].some((p) =>
    pathname.startsWith(p),
  );
  if (hidden) return null;

  return (
    <>
      {/* spacer so page content never hides behind the fixed bar */}
      <div aria-hidden className="h-20 sm:hidden" />
      <nav
        aria-label="주요 메뉴"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200/70 bg-white/95 backdrop-blur sm:hidden dark:border-neutral-800 dark:bg-neutral-950/95 [padding-bottom:env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto flex h-16 max-w-2xl items-stretch justify-around px-2">
          {TABS.map((tab) => {
            const active =
              tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
            const Icon = tab.icon;
            if ("primary" in tab && tab.primary) {
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-label="사진으로 기록하기"
                  className="flex items-center justify-center px-2"
                >
                  <span className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full bg-amber-300 text-amber-950 shadow-lg shadow-amber-400/40 ring-4 ring-white transition active:scale-95 dark:ring-neutral-950">
                    <Icon className="h-6 w-6" />
                  </span>
                </Link>
              );
            }
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition ${
                  active
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                }`}
              >
                <Icon className="h-6 w-6" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

type IconProps = { className?: string };

function HomeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
    </svg>
  );
}

function ListIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CameraIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h2.5l1.5-2.5h8L17.5 8H20a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </svg>
  );
}

function ChartIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M10 20V4M16 20v-8M21 20H3" />
    </svg>
  );
}

function GearIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.08A1.7 1.7 0 0 0 10.12 3V3a2 2 0 1 1 4 0v.09c0 .66.39 1.26 1.03 1.56.6.27 1.3.14 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08c.3.64.9 1.03 1.56 1.03H21a2 2 0 1 1 0 4h-.09c-.66 0-1.26.39-1.51 1.03Z" />
    </svg>
  );
}
