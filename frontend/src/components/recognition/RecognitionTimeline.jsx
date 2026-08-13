import RecognitionEventCard from './RecognitionEventCard';
import { SkeletonCard } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

// records: RecognitionHistoryResponse[], loading: bool, emptyMessage: string
export default function RecognitionTimeline({ records, loading, emptyMessage = 'No recognition events in this range.' }) {
  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!records || records.length === 0) {
    return <EmptyState title="No activity yet" description={emptyMessage} />;
  }

  return (
    <ol className="relative space-y-3 before:absolute before:bottom-0 before:left-[15px] before:top-2 before:w-px before:bg-slate-200 dark:before:bg-slate-700">
      {records.map((record) => (
        <li key={record.id} className="relative pl-8">
          <span
            className="absolute left-[10px] top-5 h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-300 dark:border-ink-light dark:bg-slate-600"
            aria-hidden="true"
          />
          <RecognitionEventCard record={record} />
        </li>
      ))}
    </ol>
  );
}
