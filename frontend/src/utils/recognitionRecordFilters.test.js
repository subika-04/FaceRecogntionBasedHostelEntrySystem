import { describe, it, expect } from 'vitest';
import { applyRecordFilters } from './recognitionRecordFilters';

const records = [
  {
    id: 1,
    status: 'MATCHED',
    recognizedByCamera: 'CAM01',
    recognizedAt: '2026-01-10T09:00:00',
    confidence: 0.95,
    recognitionDurationMs: 120,
    student: { fullName: 'Jane Doe', registerNumber: 'REG001', department: 'CSE' },
  },
  {
    id: 2,
    status: 'UNKNOWN',
    recognizedByCamera: 'CAM02',
    recognizedAt: '2026-01-12T14:00:00',
    confidence: 0.2,
    recognitionDurationMs: 500,
    student: null,
  },
  {
    id: 3,
    status: 'LOW_CONFIDENCE',
    recognizedByCamera: 'CAM01',
    recognizedAt: '2026-01-15T18:00:00',
    confidence: 0.55,
    recognitionDurationMs: 300,
    student: { fullName: 'John Smith', registerNumber: 'REG002', department: 'ECE' },
  },
];

describe('applyRecordFilters', () => {
  it('returns everything when no filters are given', () => {
    expect(applyRecordFilters(records, {})).toHaveLength(3);
    expect(applyRecordFilters(records)).toHaveLength(3);
  });

  it('returns an empty array for null/undefined records', () => {
    expect(applyRecordFilters(null, {})).toEqual([]);
    expect(applyRecordFilters(undefined, {})).toEqual([]);
  });

  it('filters by status', () => {
    expect(applyRecordFilters(records, { status: 'MATCHED' }).map((r) => r.id)).toEqual([1]);
  });

  it('filters by camera', () => {
    expect(applyRecordFilters(records, { camera: 'CAM01' }).map((r) => r.id)).toEqual([1, 3]);
  });

  it('filters by student name or register number, case-insensitively, and excludes records with no student', () => {
    expect(applyRecordFilters(records, { studentQuery: 'jane' }).map((r) => r.id)).toEqual([1]);
    expect(applyRecordFilters(records, { studentQuery: 'REG002' }).map((r) => r.id)).toEqual([3]);
  });

  it('filters by department', () => {
    expect(applyRecordFilters(records, { department: 'ECE' }).map((r) => r.id)).toEqual([3]);
  });

  it('filters by date range (inclusive of the whole dateTo day)', () => {
    expect(applyRecordFilters(records, { dateFrom: '2026-01-11', dateTo: '2026-01-14' }).map((r) => r.id)).toEqual([2]);
  });

  it('filters by confidence range, expressed in the same 0-100 scale used by the filter UI', () => {
    expect(applyRecordFilters(records, { minConfidence: 50 }).map((r) => r.id)).toEqual([1, 3]);
    expect(applyRecordFilters(records, { maxConfidence: 50 }).map((r) => r.id)).toEqual([2]);
  });

  it('filters by latency range, excluding records with no duration at all', () => {
    expect(applyRecordFilters(records, { minLatencyMs: 200 }).map((r) => r.id)).toEqual([2, 3]);
    expect(applyRecordFilters(records, { maxLatencyMs: 200 }).map((r) => r.id)).toEqual([1]);
  });

  it('combines multiple filter dimensions with AND semantics', () => {
    const result = applyRecordFilters(records, { camera: 'CAM01', status: 'LOW_CONFIDENCE' });
    expect(result.map((r) => r.id)).toEqual([3]);
  });

  it('treats an empty-string range value as "no constraint" rather than "less than empty string"', () => {
    expect(applyRecordFilters(records, { minConfidence: '', maxLatencyMs: '' })).toHaveLength(3);
  });
});
