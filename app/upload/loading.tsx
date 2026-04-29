export default function Loading() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-40 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
        </div>
        <div className="h-5 w-10 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
      </header>

      <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900 dark:bg-emerald-950/40 sm:p-6">
        <div className="h-5 w-32 animate-pulse rounded bg-emerald-200/60 dark:bg-emerald-900/60" />
        <div className="mt-3 space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-3 w-full animate-pulse rounded bg-emerald-200/40 dark:bg-emerald-900/40"
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="h-16 animate-pulse rounded-xl bg-gray-900/80 dark:bg-neutral-200/80" />
        <div className="h-12 animate-pulse rounded-xl border border-gray-300 bg-white dark:border-neutral-700 dark:bg-neutral-900" />
      </div>
    </div>
  );
}
