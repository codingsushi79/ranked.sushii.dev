import { Skeleton } from "@/components/ui/skeleton";

export function SiteLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-in fade-in duration-300 px-4 py-16">
      <Skeleton className="mb-8 h-24 w-full max-w-xl rounded-xl" />
      <Skeleton className="mb-4 h-10 w-64" />
      <Skeleton className="mb-2 h-6 w-full max-w-2xl" />
      <Skeleton className="mb-10 h-6 w-3/4 max-w-xl" />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="mt-20 grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-40 w-full rounded-xl"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
