import { computeLatencyPercentiles, computeConfidenceExtremes, computeBusiestHour, computeBusiestWeekday } from '../../utils/analyticsUtils';
import { formatConfidence } from '../../utils/formatters';

function StatBlock({ label, value }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-display text-lg font-semibold text-ink dark:text-slate-100">{value}</p>
    </div>
  );
}

const ms = (v) => (v == null ? '—' : `${Math.round(v)} ms`);

// records: RecognitionHistoryResponse[] -- the same sample already fetched
// for the other Analytics panels (heatmap, histograms, filters).
export default function AdvancedStatsCards({ records = [] }) {
  const { p50, p95, p99 } = computeLatencyPercentiles(records);
  const { highest, lowest } = computeConfidenceExtremes(records);
  const busiestHour = computeBusiestHour(records);
  const busiestWeekday = computeBusiestWeekday(records);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
      <StatBlock label="Latency P50" value={ms(p50)} />
      <StatBlock label="Latency P95" value={ms(p95)} />
      <StatBlock label="Latency P99" value={ms(p99)} />
      <StatBlock label="Highest Confidence" value={highest != null ? formatConfidence(highest) : '—'} />
      <StatBlock label="Lowest Confidence" value={lowest != null ? formatConfidence(lowest) : '—'} />
      <StatBlock label="Busiest Hour" value={busiestHour ? busiestHour.hour : '—'} />
      <StatBlock label="Busiest Weekday" value={busiestWeekday ? busiestWeekday.day : '—'} />
    </div>
  );
}
