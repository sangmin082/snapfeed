export default function Loading() {
  return (
    <main className="flex flex-col">
      <div className="border-b border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
          <div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
          <div className="h-5 w-20 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
        </div>
      </div>

      <section className="bg-amber-600/5 dark:bg-amber-900/10">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 animate-pulse rounded-full bg-amber-100 dark:bg-amber-900/40" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
              <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
            </div>
          </div>
          <div className="h-12 w-full animate-pulse rounded-full bg-gray-200 dark:bg-neutral-800" />
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50 via-white to-white dark:from-amber-950/40 dark:via-neutral-950 dark:to-neutral-950">
        <div className="mx-auto max-w-2xl px-6 pt-12 pb-14 sm:pt-20 sm:pb-20">
          <div className="flex flex-col items-center gap-6">
            <div className="h-6 w-48 animate-pulse rounded-full bg-amber-100 dark:bg-amber-900/40" />
            <div className="h-12 w-full max-w-xl animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
            <div className="h-12 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
            <div className="mt-4 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <div className="h-14 w-full animate-pulse rounded-full bg-amber-200 dark:bg-amber-900/40 sm:w-44" />
              <div className="h-14 w-full animate-pulse rounded-full bg-gray-200 dark:bg-neutral-800 sm:w-44" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
