import Heatmap from '../ui/Heatmap';
import EmptyState from '../ui/EmptyState';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Grouped into 4-hour bands rather than all 24 hours -- 24 columns would be
// unreadably cramped on a typical card width, especially on mobile.
const HOUR_BANDS = [
  { label: '12–4a', start: 0, end: 4 },
  { label: '4–8a', start: 4, end: 8 },
  { label: '8a–12p', start: 8, end: 12 },
  { label: '12–4p', start: 12, end: 16 },
  { label: '4–8p', start: 16, end: 20 },
  { label: '8p–12a', start: 20, end: 24 },
];

/**
 * Built entirely from the `recognizedAt` timestamps already present on
 * whatever recognition-history sample the caller fetched -- there is no
 * backend endpoint that returns a day/hour matrix directly, and adding one
 * would be new architecture for what a client-side reduce over already-
 * fetched records can do just as well (bounded by the same "only reflects
 * the fetched sample" caveat as RecognitionStatistics/RecognitionSummary).
 */
export default function RecognitionHeatmap({ records = [] }) {
  if (records.length === 0) {
    return <EmptyState title="No activity yet" description="A day/time pattern will appear here once recognition attempts are logged." />;
  }

  const matrix = DAY_LABELS.map(() => HOUR_BANDS.map(() => 0));

  records.forEach((r) => {
    const date = new Date(r.recognizedAt);
    const day = date.getDay();
    const hour = date.getHours();
    const bandIndex = HOUR_BANDS.findIndex((b) => hour >= b.start && hour < b.end);
    if (bandIndex >= 0) matrix[day][bandIndex]++;
  });

  return (
    <div>
      <Heatmap matrix={matrix} rowLabels={DAY_LABELS} colLabels={HOUR_BANDS.map((b) => b.label)} />
      <p className="mt-2 text-xs text-slate-400">
        Based on the {records.length} most recent recognition attempts loaded on this page.
      </p>
    </div>
  );
}
