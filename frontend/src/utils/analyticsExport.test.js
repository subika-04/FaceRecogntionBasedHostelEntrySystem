import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  RECOGNITION_RECORD_CSV_COLUMNS,
  exportRecognitionRecordsCsv,
  exportRecognitionRecordsJson,
  exportSummaryCsv,
  exportSummaryJson,
  exportAsPdf,
} from './analyticsExport';

const sampleRecords = [
  {
    recognizedAt: '2026-01-15T10:00:00Z',
    student: { fullName: 'Jane Doe', registerNumber: 'REG001', department: 'CSE' },
    status: 'MATCHED',
    confidence: 0.92,
    recognitionDurationMs: 150,
    recognizedByCamera: 'CAM01',
  },
];

// downloadCsv/downloadJson trigger a real anchor-click download; we only
// need to verify a download was attempted with the right filename/content,
// not that jsdom's Blob plumbing works (that's the setup.js stub's job).
function spyOnAnchorClick() {
  const clickSpy = vi.fn();
  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    const el = originalCreateElement(tag);
    if (tag === 'a') el.click = clickSpy;
    return el;
  });
  return clickSpy;
}

describe('RECOGNITION_RECORD_CSV_COLUMNS', () => {
  it('renders every column for a sample record without throwing, falling back to placeholders for missing student fields', () => {
    const record = { ...sampleRecords[0], student: null };
    const rendered = RECOGNITION_RECORD_CSV_COLUMNS.map((c) => (typeof c.value === 'function' ? c.value(record) : record[c.value]));
    expect(rendered).toContain('Unrecognized');
    expect(rendered).toContain('—');
  });
});

describe('exportRecognitionRecordsCsv / exportRecognitionRecordsJson', () => {
  afterEach(() => vi.restoreAllMocks());

  it('triggers a CSV download with the given filename', () => {
    const clickSpy = spyOnAnchorClick();
    exportRecognitionRecordsCsv(sampleRecords, 'my-export.csv');
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('does nothing (no download attempt) for an empty record set', () => {
    const clickSpy = spyOnAnchorClick();
    exportRecognitionRecordsCsv([]);
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('triggers a JSON download', () => {
    const clickSpy = spyOnAnchorClick();
    exportRecognitionRecordsJson(sampleRecords, 'my-export.json');
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});

describe('exportSummaryCsv / exportSummaryJson', () => {
  afterEach(() => vi.restoreAllMocks());

  it('does nothing for a null/undefined summary', () => {
    const clickSpy = spyOnAnchorClick();
    exportSummaryCsv(null);
    exportSummaryJson(undefined);
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('triggers a download for a real summary object', () => {
    const clickSpy = spyOnAnchorClick();
    exportSummaryCsv({ totalRecognitions: 42, successRate: 0.9 });
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});

describe('exportAsPdf', () => {
  it('calls window.print as the PDF stand-in, not a real PDF library', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    exportAsPdf();
    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });
});
