export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
          <div className="h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-neutral-800" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-800"
            />
          ))}
        </div>
        <div className="h-12 animate-pulse rounded-full bg-amber-200 dark:bg-amber-900/40" />
      </div>
    </main>
  );
}
