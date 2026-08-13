/**
 * Every function here is a pure, client-side calculation over an
 * already-fetched `records` (RecognitionHistoryResponse[]) array -- no new
 * backend endpoint for any of it. Extracted so AnalyticsPage composes these
 * rather than computing them inline (which is where duplicated-calculation
 * risk creeps in as a page grows).
 */

/** Nearest-rank percentile (p as 0-100) over a numeric array. Returns null
 *  for an empty input rather than NaN, so callers can render "—" cleanly. */
export function computePercentile(values, p) {
  const clean = (values || []).filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (clean.length === 0) return null;
  const sorted = [...clean].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, rank))];
}

export function computeLatencyPercentiles(records) {
  const durations = (records || []).map((r) => r.recognitionDurationMs);
  return {
    p50: computePercentile(durations, 50),
    p95: computePercentile(durations, 95),
    p99: computePercentile(durations, 99),
  };
}

/** Highest/lowest confidence seen in the sample, as fractions (0..1) --
 *  callers format as a percentage. Null when there's nothing to compare. */
export function computeConfidenceExtremes(records) {
  const values = (records || [])
    .map((r) => r.confidence)
    .filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (values.length === 0) return { highest: null, lowest: null };
  return { highest: Math.max(...values), lowest: Math.min(...values) };
}

const HOUR_LABEL = (h) => `${String(h).padStart(2, '0')}:00`;
const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Hour (0-23) with the most recognition attempts in the sample. */
export function computeBusiestHour(records) {
  if (!records || records.length === 0) return null;
  const counts = new Array(24).fill(0);
  records.forEach((r) => counts[new Date(r.recognizedAt).getHours()]++);
  const maxCount = Math.max(...counts);
  if (maxCount === 0) return null;
  return { hour: HOUR_LABEL(counts.indexOf(maxCount)), count: maxCount };
}

/** Day of week with the most recognition attempts in the sample. */
export function computeBusiestWeekday(records) {
  if (!records || records.length === 0) return null;
  const counts = new Array(7).fill(0);
  records.forEach((r) => counts[new Date(r.recognizedAt).getDay()]++);
  const maxCount = Math.max(...counts);
  if (maxCount === 0) return null;
  return { day: WEEKDAY_LABELS[counts.indexOf(maxCount)], count: maxCount };
}

/** Distinct, sorted department names present in the sample -- used to
 *  populate AnalyticsFilterPanel's department dropdown with real values only. */
export function extractDepartments(records) {
  const set = new Set();
  (records || []).forEach((r) => {
    if (r.student?.department) set.add(r.student.department);
  });
  return Array.from(set).sort();
}
