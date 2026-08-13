import { formatDateTime, formatPercent, formatConfidence } from './formatters';
import { getTemplateById } from './reportTemplates';

/** "Executive Summary Report" style title from a template id. */
export function formatReportTitle(templateId) {
  const template = getTemplateById(templateId);
  return `${template.label} Report`;
}

/** Falls back to a clear placeholder rather than a blank/undefined string
 *  if a user record is somehow missing (e.g. deleted account, stale session). */
export function formatGeneratedBy(user) {
  if (!user) return 'Unknown user';
  return user.fullName || user.username || 'Unknown user';
}

/** Thin, report-context-named wrapper over the existing date formatter --
 *  no new date logic, just a name that reads clearly at ReportBuilder call sites. */
export function formatGeneratedAt(date) {
  return formatDateTime(date);
}

/** Renders any metric value consistently: numbers pass through, null/
 *  undefined become an em dash, everything else is stringified as-is. This
 *  is the single place ReportMetricGrid-consuming code decides how to
 *  display a "value" without each call site repeating the same null-check. */
export function formatMetricValue(value) {
  if (value === null || value === undefined) return '—';
  return typeof value === 'number' ? value.toLocaleString() : String(value);
}

/** "Jan 1, 2026 – Jan 31, 2026" style range, or a single date if only one
 *  bound is set, or "All time" if neither is -- used on the report cover
 *  when date-range filters are active. */
export function formatReportDateRange(dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return 'All time';
  const from = dateFrom ? new Date(dateFrom).toLocaleDateString() : 'the beginning';
  const to = dateTo ? new Date(dateTo).toLocaleDateString() : 'now';
  return `${from} – ${to}`;
}

/** Milliseconds -> "123 ms" (or an em dash for a missing value) -- reused by
 *  every latency-related metric in the report instead of each formatting
 *  `Math.round(v) + ' ms'` inline. */
export function formatReportDuration(ms) {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return '—';
  return `${Math.round(ms)} ms`;
}

/** Report-context wrapper over formatPercent (already handles null safely). */
export function formatReportPercentage(value) {
  return formatPercent(value);
}

/** Report-context wrapper over formatConfidence (a 0..1 fraction -> "NN.N%"). */
export function formatReportConfidence(value) {
  return formatConfidence(value);
}
