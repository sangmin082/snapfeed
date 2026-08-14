import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth";
import { serviceSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// Owner-only dashboard. Anyone else gets a 404 so the page's existence
// isn't advertised. The Apple-review demo account is deliberately excluded.
const ADMIN_EMAILS = ["sangmin082@gmail.com", "sangmink082@naver.com"];

const KST = "Asia/Seoul";

function kstDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST,
    month: "numeric",
    day: "numeric",
  }).format(new Date(iso));
}

function kstDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST,
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function kstDayKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export default async function AdminPage() {
  const user = await getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) notFound();

  const admin = serviceSupabase();

  const [usersRes, feedCount, eventCount, babiesRes, membersRes, feedsRes] =
    await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
      admin.from("feeds").select("*", { count: "exact", head: true }),
      admin.from("events").select("*", { count: "exact", head: true }),
      admin.from("babies").select("id,name,created_at"),
      admin.from("baby_members").select("baby_id,user_id"),
      // Latest rows for per-user aggregates and the daily trend. PostgREST
      // caps a single select at 1000 rows — totals above still come from the
      // exact head counts, so only the breakdown becomes approximate at scale.
      admin
        .from("feeds")
        .select("uploaded_by,created_at,start_at,baby_id")
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);

  const users = usersRes.data?.users ?? [];
  const babies = babiesRes.data ?? [];
  const members = membersRes.data ?? [];
  const feeds = feedsRes.data ?? [];

  const babyName = new Map(babies.map((b) => [b.id, b.name]));

  type Row = {
    email: string;
    createdAt: string;
    lastSignIn: string | null;
    provider: string;
    babies: string[];
    uploads: number;
    lastUpload: string | null;
  };
  const rows: Row[] = users
    .map((u) => {
      const mine = feeds.filter((f) => f.uploaded_by === u.id);
      return {
        email: u.email ?? u.id.slice(0, 8),
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at ?? null,
        provider: (u.app_metadata?.provider as string | undefined) ?? "email",
        babies: members
          .filter((m) => m.user_id === u.id)
          .map((m) => babyName.get(m.baby_id) ?? "?"),
        uploads: mine.length,
        lastUpload: mine[0]?.created_at ?? null,
      };
    })
    .sort((a, b) => b.uploads - a.uploads);

  // Uploads per day, last 14 days (KST)
  const dayKeys: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dayKeys.push(kstDayKey(d.toISOString()));
  }
  const perDay = new Map(dayKeys.map((k) => [k, 0]));
  for (const f of feeds) {
    const k = kstDayKey(f.created_at);
    if (perDay.has(k)) perDay.set(k, (perDay.get(k) ?? 0) + 1);
  }
  const maxDay = Math.max(1, ...perDay.values());

  const stats = [
    { label: "가입자", value: users.length },
    { label: "아기", value: babies.length },
    { label: "수유 기록", value: feedCount.count ?? 0 },
    { label: "이벤트", value: eventCount.count ?? 0 },
  ];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-neutral-100">
        운영 현황
      </h1>
      <p className="mt-1 text-xs text-gray-400 dark:text-neutral-500">
        본인 계정에만 보이는 페이지 · 시간은 한국 기준
      </p>

      {/* 요약 타일 */}
      <div className="mt-5 grid grid-cols-4 gap-2.5">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-gray-900/5 dark:bg-neutral-900 dark:ring-white/5"
          >
            <p className="text-lg font-extrabold tabular-nums text-gray-900 dark:text-neutral-100">
              {s.value}
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-gray-400 dark:text-neutral-500">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* 최근 14일 업로드 추이 */}
      <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5 dark:bg-neutral-900 dark:ring-white/5">
        <h2 className="text-sm font-bold text-gray-900 dark:text-neutral-100">
          최근 14일 업로드
        </h2>
        <div className="mt-3 flex h-24 items-end gap-1">
          {dayKeys.map((k) => {
            const n = perDay.get(k) ?? 0;
            return (
              <div key={k} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[9px] tabular-nums text-gray-400 dark:text-neutral-500">
                  {n > 0 ? n : ""}
                </span>
                <div
                  className={`w-full rounded-t ${n > 0 ? "bg-amber-300" : "bg-gray-100 dark:bg-neutral-800"}`}
                  style={{ height: `${Math.max(4, (n / maxDay) * 64)}px` }}
                />
                <span className="text-[8px] text-gray-300 dark:text-neutral-600">
                  {k.slice(8)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 사용자별 현황 */}
      <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5 dark:bg-neutral-900 dark:ring-white/5">
        <h2 className="text-sm font-bold text-gray-900 dark:text-neutral-100">
          사용자별 현황
        </h2>
        <div className="mt-3 flex flex-col divide-y divide-gray-100 dark:divide-neutral-800">
          {rows.map((r) => (
            <div key={r.email} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-neutral-100">
                  {r.email}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400 dark:text-neutral-500">
                  {r.provider} · 가입 {kstDate(r.createdAt)}
                  {r.babies.length > 0 ? ` · 👶 ${r.babies.join(", ")}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-extrabold tabular-nums text-gray-900 dark:text-neutral-100">
                  {r.uploads}
                  <span className="ml-0.5 text-[10px] font-medium text-gray-400">건</span>
                </p>
                <p className="text-[10px] text-gray-400 dark:text-neutral-500">
                  {r.uploads > 0 ? `마지막 ${kstDateTime(r.lastUpload)}` : "기록 없음"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-6 text-center text-[11px] leading-relaxed text-gray-300 dark:text-neutral-600">
        수유 기록 합계는 전체 기준, 사용자별 집계는 최근 1,000건 기준입니다.
      </p>
    </main>
  );
}
