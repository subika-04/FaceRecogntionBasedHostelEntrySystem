/**
 * The backend has two DTOs for what is conceptually the same value:
 *  - RecognitionResponse (POST /recognition/identify, live capture result)
 *    uses the field name `confidence`.
 *  - RecognitionHistoryResponse (GET /recognition/history,
 *    /analytics/recent/successful, /analytics/recent/activity) uses
 *    `confidenceScore` instead.
 *
 * Every frontend component that renders a recognition record (RecognitionEventCard,
 * RecognitionStatistics, RecognitionFilters, the various CSV export column
 * definitions, StudentProfileDrawer, ConfidenceDistributionChart) was written
 * against `.confidence` -- which is exactly what a raw RecognitionHistoryResponse
 * does NOT have, since it comes back from the API as `.confidenceScore`. Rather
 * than hunt down and patch every one of those call sites individually, this
 * function normalizes the field once, at the point history records enter the
 * frontend (recognitionApi.js / analyticsApi.js), so `.confidence` is reliably
 * present everywhere downstream.
 */
export function normalizeRecognitionRecord(record) {
  if (!record) return record;
  return {
    ...record,
    confidence: record.confidence ?? record.confidenceScore ?? null,
  };
}

export function normalizeRecognitionRecords(records) {
  return (records || []).map(normalizeRecognitionRecord);
}
