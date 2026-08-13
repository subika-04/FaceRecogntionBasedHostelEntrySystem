import RecognitionStatistics from './RecognitionStatistics';
import TrendChart from '../analytics/TrendChart';

/**
 * Deliberately thin: the KPI-widget logic lives entirely in
 * RecognitionStatistics (so there is exactly one place that computes
 * total/successful/failed/avg-confidence/avg-duration, not two), and the
 * trend visualization reuses Analytics' existing TrendChart rather than a
 * new chart component built just for this page.
 */
export default function RecognitionSummary({ records = [], trendData }) {
  return (
    <div className="space-y-4">
      <RecognitionStatistics records={records} />
      {trendData && trendData.length > 0 && (
        <div className="card p-4">
          <h2 className="mb-2 font-display text-sm font-semibold text-ink dark:text-slate-100">Recognition Trend</h2>
          <TrendChart data={trendData} />
        </div>
      )}
    </div>
  );
}
