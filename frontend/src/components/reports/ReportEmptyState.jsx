import EmptyState from '../ui/EmptyState';

export default function ReportEmptyState({ title = 'No data for this report', description, action }) {
  return (
    <EmptyState
      title={title}
      description={description || 'Try widening your filters or choosing a different date range.'}
      action={action}
    />
  );
}
