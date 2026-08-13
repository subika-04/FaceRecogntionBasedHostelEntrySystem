/**
 * Single implementation of "filter an already-fetched array of
 * RecognitionHistoryResponse-shaped records client-side." Used by
 * RecognitionFilters (Recognition Module), AnalyticsFilterPanel (Analytics
 * Module), and available for Reports to reuse rather than reimplement.
 *
 * Every field here is club-side only by necessity, not by choice -- the
 * backend's /recognition/history endpoint only supports studentId/status/
 * camera/triggeredById as real query params (verified directly against
 * RecognitionController). Department, name search, date range, confidence
 * range, and latency range have no server-side equivalent, so they can only
 * ever filter whatever sample of records was already fetched. That
 * limitation is real and is surfaced in the UI copy of both filter panels,
 * not hidden.
 *
 * filters shape (all optional):
 * { studentQuery, department, dateFrom, dateTo, minConfidence, maxConfidence,
 *   minLatencyMs, maxLatencyMs, status, camera }
 */
export function applyRecordFilters(records, filters = {}) {
  return (records || []).filter((r) => {
    if (filters.status && r.status !== filters.status) return false;
    if (filters.camera && r.recognizedByCamera !== filters.camera) return false;

    if (filters.studentQuery) {
      const q = filters.studentQuery.toLowerCase();
      const name = r.student?.fullName?.toLowerCase() || '';
      const reg = r.student?.registerNumber?.toLowerCase() || '';
      if (!name.includes(q) && !reg.includes(q)) return false;
    }

    if (filters.department && r.student?.department !== filters.department) return false;

    if (filters.dateFrom && new Date(r.recognizedAt) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(r.recognizedAt) > new Date(filters.dateTo + 'T23:59:59')) return false;

    const confidencePct = (r.confidence ?? 0) * 100;
    if (filters.minConfidence !== '' && filters.minConfidence != null && confidencePct < Number(filters.minConfidence)) return false;
    if (filters.maxConfidence !== '' && filters.maxConfidence != null && confidencePct > Number(filters.maxConfidence)) return false;

    const latency = r.recognitionDurationMs ?? null;
    if (filters.minLatencyMs !== '' && filters.minLatencyMs != null) {
      if (latency === null || latency < Number(filters.minLatencyMs)) return false;
    }
    if (filters.maxLatencyMs !== '' && filters.maxLatencyMs != null) {
      if (latency === null || latency > Number(filters.maxLatencyMs)) return false;
    }

    return true;
  });
}
