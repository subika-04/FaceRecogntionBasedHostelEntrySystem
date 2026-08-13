import { Layers, CheckCircle2, XCircle, Gauge, Timer, CalendarClock } from 'lucide-react';

function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function isWithinLastDays(dateStr, days) {
  const d = new Date(dateStr).getTime();
  return d >= Date.now() - days * 24 * 60 * 60 * 1000;
}

/**
 * All numbers here are computed from whatever `records` array the caller
 * already fetched -- there is no dedicated "/recognition/statistics"
 * backend endpoint, so these are necessarily bounded by however many
 * records were loaded (e.g. "today" only reflects today's entries that are
 * actually present in `records`, not a true full-day server-side count).
 * Callers should fetch a reasonably sized, recent page for this to be
 * meaningful -- see RecognitionPage's usage.
 */
function computeStats(records) {
  const total = records.length;
  const successful = records.filter((r) => r.status === 'MATCHED').length;
  const failed = total - successful;
  const avgConfidence = total ? records.reduce((sum, r) => sum + (r.confidence || 0), 0) / total : 0;
  const withDuration = records.filter((r) => typeof r.recognitionDurationMs === 'number');
  const avgDurationMs = withDuration.length
    ? withDuration.reduce((sum, r) => sum + r.recognitionDurationMs, 0) / withDuration.length
    : null;
  const todayCount = records.filter((r) => isToday(r.recognizedAt)).length;
  const weekCount = records.filter((r) => isWithinLastDays(r.recognizedAt, 7)).length;

  return { total, successful, failed, avgConfidence, avgDurationMs, todayCount, weekCount };
}

function StatBlock({ label, value, tone = 'default', icon: Icon }) {
  const toneClass = { default: 'text-ink dark:text-slate-100', verified: 'text-verified-600', denied: 'text-denied-600' }[tone];
  const chipClass = { default: 'bg-brass-50 text-brass-600', verified: 'bg-verified-50 text-verified-600', denied: 'bg-denied-50 text-denied-600' }[tone];
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${chipClass}`} aria-hidden="true">
          <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
        </span>
      </div>
      <p className={`mt-1 font-display text-xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

// records: RecognitionHistoryResponse[] -- the sample this batch of stats is computed over.
export default function RecognitionStatistics({ records = [] }) {
  const stats = computeStats(records);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatBlock label="Total (sample)" value={stats.total} icon={Layers} />
      <StatBlock label="Successful" value={stats.successful} tone="verified" icon={CheckCircle2} />
      <StatBlock label="Failed" value={stats.failed} tone={stats.failed > 0 ? 'denied' : 'default'} icon={XCircle} />
      <StatBlock label="Avg. Confidence" value={`${(stats.avgConfidence * 100).toFixed(1)}%`} icon={Gauge} />
      <StatBlock label="Avg. Response" value={stats.avgDurationMs != null ? `${Math.round(stats.avgDurationMs)} ms` : '—'} icon={Timer} />
      <StatBlock label="Today / 7 Days" value={`${stats.todayCount} / ${stats.weekCount}`} icon={CalendarClock} />
    </div>
  );
}
