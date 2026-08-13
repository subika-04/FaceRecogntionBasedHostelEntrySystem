import { downloadCsv, downloadJson } from './csvExport';
import { formatConfidence, formatDateTime } from './formatters';

/** Standard column set for exporting a recognition-record sample. Shared so
 * Analytics and (later) Reports produce identically-shaped CSVs for the same
 * underlying data, rather than each defining its own column list. */
export const RECOGNITION_RECORD_CSV_COLUMNS = [
  { label: 'Recognized At', value: (r) => formatDateTime(r.recognizedAt) },
  { label: 'Student', value: (r) => r.student?.fullName || 'Unrecognized' },
  { label: 'Register No.', value: (r) => r.student?.registerNumber || '—' },
  { label: 'Department', value: (r) => r.student?.department || '—' },
  { label: 'Status', value: 'status' },
  { label: 'Confidence', value: (r) => formatConfidence(r.confidence) },
  { label: 'Latency (ms)', value: 'recognitionDurationMs' },
  { label: 'Camera', value: 'recognizedByCamera' },
];

export function exportRecognitionRecordsCsv(records, filename = 'recognition-records.csv') {
  downloadCsv(filename, records, RECOGNITION_RECORD_CSV_COLUMNS);
}

export function exportRecognitionRecordsJson(records, filename = 'recognition-records.json') {
  downloadJson(filename, records);
}

/** Flattens a DashboardSummaryResponse (or any flat KPI object) into a
 * single-row CSV -- used for "export summaries" (Analytics's KPI cards). */
export function exportSummaryCsv(summary, filename = 'analytics-summary.csv') {
  if (!summary) return;
  const columns = Object.keys(summary).map((key) => ({ label: key, value: key }));
  downloadCsv(filename, [summary], columns);
}

export function exportSummaryJson(summary, filename = 'analytics-summary.json') {
  if (!summary) return;
  downloadJson(filename, summary);
}

/**
 * "Export as PDF" hook point: this project has no PDF-generation library
 * installed, so this triggers the browser's native print flow (same
 * approach as the Print button on Reports) rather than pretending to
 * produce a PDF file directly. If/when a library like jspdf becomes
 * available, this is the one place to swap the implementation --
 * AnalyticsPage and Reports both call this function rather than each
 * calling window.print() directly, so upgrading later touches one file.
 */
export function exportAsPdf() {
  window.print();
}
