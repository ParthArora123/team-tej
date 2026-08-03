/**
 * Lightweight skeleton primitives used while public content is loading, so
 * sections reserve their final height instead of flashing empty states.
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`rounded-md bg-muted/60 ${className}`}
    />
  );
}

/** Placeholder matching the workshop/program card layout. */
export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
      <Skeleton className="w-full aspect-[16/10] rounded-none" />
      <div className="p-5 flex-1 flex flex-col gap-3">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <div className="mt-4 flex items-end justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

