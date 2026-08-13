/**
 * A shimmer placeholder shaped like the content that's loading, so the
 * layout doesn't jump once real data arrives. Use `SkeletonTable` for list
 * screens and `SkeletonCard` for dashboard widgets; `Skeleton` itself is the
 * raw building block for anything more custom.
 */
export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-slate-100 ${className}`} />;
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-6 px-4 py-3">
            {Array.from({ length: columns }).map((__, colIndex) => (
              <Skeleton key={colIndex} className={`h-4 ${colIndex === 0 ? 'w-32' : 'w-20'}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3 p-5">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-28" />
    </div>
  );
}
