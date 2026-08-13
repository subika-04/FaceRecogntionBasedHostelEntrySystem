import { SkeletonCard } from '../ui/Skeleton';

/** Shaped like a report-in-progress (cover + a few sections), built entirely
 *  from the existing SkeletonCard primitive rather than new shimmer CSS. */
export default function ReportLoadingSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-4" aria-label="Loading report" role="status">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
