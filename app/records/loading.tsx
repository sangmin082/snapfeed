export default function Loading() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-32 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
          <div className="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
        </div>
        <div className="h-5 w-10 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
      </header>

      {[0, 1].map((i) => (
        <section key={i} className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="h-5 w-44 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
              <div className="h-3 w-56 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
            </div>
            <div className="h-7 w-32 animate-pulse rounded-full bg-red-100 dark:bg-red-950/40" />
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-neutral-800">
            <div className="h-9 w-full bg-gray-50 dark:bg-neutral-900/60" />
            {[0, 1, 2, 3].map((r) => (
              <div
                key={r}
                className="flex items-center gap-4 border-t border-gray-100 px-3 py-2 dark:border-neutral-800"
              >
                <div className="h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
                <div className="h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
                <div className="h-4 flex-1 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
                <div className="h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
