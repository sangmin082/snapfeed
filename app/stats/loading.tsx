export default function Loading() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-4 pb-10">
      <header className="relative flex h-10 items-center justify-center">
        <div className="absolute left-0 h-6 w-6 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
        <div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
        <div className="absolute right-0 h-5 w-16 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
      </header>

      <div className="flex flex-col items-center gap-5">
        <div className="h-9 w-44 animate-pulse rounded-full bg-gray-100 dark:bg-neutral-800" />
        <div className="h-7 w-48 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <div className="h-9 w-20 animate-pulse rounded-full bg-blue-50 dark:bg-blue-950/40" />
        <div className="h-9 w-20 animate-pulse rounded-full bg-violet-50 dark:bg-violet-950/40" />
        <div className="h-9 w-20 animate-pulse rounded-full bg-amber-50 dark:bg-amber-950/40" />
      </div>

      <div className="flex justify-center">
        <div className="h-72 w-72 animate-pulse rounded-full bg-gray-100 dark:bg-neutral-800" />
      </div>

      <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm dark:border-amber-900 dark:bg-neutral-900">
        <div className="h-5 w-48 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
