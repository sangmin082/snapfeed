"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CameraIcon,
  ChartIcon,
  GearIcon,
  HomeIcon,
  ListIcon,
} from "@/components/icons";

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

