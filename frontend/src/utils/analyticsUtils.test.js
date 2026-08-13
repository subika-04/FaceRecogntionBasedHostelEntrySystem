import { describe, it, expect } from 'vitest';
import {
  computePercentile,
  computeLatencyPercentiles,
  computeConfidenceExtremes,
  computeBusiestHour,
  computeBusiestWeekday,
  extractDepartments,
} from './analyticsUtils';

describe('computePercentile', () => {
  it('returns null for an empty or all-non-numeric array', () => {
    expect(computePercentile([], 50)).toBeNull();
    expect(computePercentile([null, undefined, NaN], 50)).toBeNull();
  });

  it('computes the median (p50) correctly', () => {
    expect(computePercentile([1, 2, 3, 4, 5], 50)).toBe(3);
  });

  it('computes p95 using nearest-rank', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1); // 1..100
    expect(computePercentile(values, 95)).toBe(95);
  });

  it('ignores non-numeric entries mixed into the array', () => {
    expect(computePercentile([1, 2, null, 3, undefined, NaN], 50)).toBe(2);
  });
});

describe('computeLatencyPercentiles', () => {
  it('returns p50/p95/p99 derived from recognitionDurationMs', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({ recognitionDurationMs: i + 1 }));
    const result = computeLatencyPercentiles(records);
    expect(result.p50).toBe(50);
    expect(result.p95).toBe(95);
    expect(result.p99).toBe(99);
  });

  it('returns all-null percentiles for an empty record set', () => {
    expect(computeLatencyPercentiles([])).toEqual({ p50: null, p95: null, p99: null });
  });
});

describe('computeConfidenceExtremes', () => {
  it('returns null highest/lowest for an empty record set', () => {
    expect(computeConfidenceExtremes([])).toEqual({ highest: null, lowest: null });
  });

  it('finds the highest and lowest confidence values', () => {
    const records = [{ confidence: 0.5 }, { confidence: 0.9 }, { confidence: 0.1 }];
    expect(computeConfidenceExtremes(records)).toEqual({ highest: 0.9, lowest: 0.1 });
  });

  it('ignores records with a missing confidence field', () => {
    const records = [{ confidence: 0.5 }, {}, { confidence: 0.3 }];
    expect(computeConfidenceExtremes(records)).toEqual({ highest: 0.5, lowest: 0.3 });
  });
});

describe('computeBusiestHour', () => {
  it('returns null for an empty record set', () => {
    expect(computeBusiestHour([])).toBeNull();
    expect(computeBusiestHour(null)).toBeNull();
  });

  it('identifies the hour with the most recognitions', () => {
    const records = [
      { recognizedAt: '2026-01-15T09:00:00' },
      { recognizedAt: '2026-01-15T09:15:00' },
      { recognizedAt: '2026-01-15T09:45:00' },
      { recognizedAt: '2026-01-15T14:00:00' },
    ];
    const result = computeBusiestHour(records);
    expect(result.hour).toBe('09:00');
    expect(result.count).toBe(3);
  });
});

describe('computeBusiestWeekday', () => {
  it('returns null for an empty record set', () => {
    expect(computeBusiestWeekday([])).toBeNull();
  });

  it('identifies the weekday with the most recognitions', () => {
    // 2026-01-15 is a Thursday, 2026-01-14 is a Wednesday
    const records = [
      { recognizedAt: '2026-01-15T09:00:00' },
      { recognizedAt: '2026-01-15T10:00:00' },
      { recognizedAt: '2026-01-14T09:00:00' },
    ];
    const result = computeBusiestWeekday(records);
    expect(result.day).toBe('Thursday');
    expect(result.count).toBe(2);
  });
});

describe('extractDepartments', () => {
  it('returns an empty array when no records have a department', () => {
    expect(extractDepartments([])).toEqual([]);
    expect(extractDepartments([{ student: {} }])).toEqual([]);
  });

  it('returns distinct, alphabetically sorted department names', () => {
    const records = [
      { student: { department: 'CSE' } },
      { student: { department: 'ECE' } },
      { student: { department: 'CSE' } },
    ];
    expect(extractDepartments(records)).toEqual(['CSE', 'ECE']);
  });
});
