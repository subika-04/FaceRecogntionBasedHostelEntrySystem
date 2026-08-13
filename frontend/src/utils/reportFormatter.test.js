import { describe, it, expect } from 'vitest';
import {
  formatReportTitle,
  formatGeneratedBy,
  formatMetricValue,
  formatReportDateRange,
  formatReportDuration,
  formatReportPercentage,
  formatReportConfidence,
} from './reportFormatter';
import { REPORT_TEMPLATES } from './reportTemplates';

describe('formatReportTitle', () => {
  it('appends "Report" to a known template label', () => {
    expect(formatReportTitle('executive')).toBe('Executive Summary Report');
  });

  it('falls back to the first template for an unknown id, rather than throwing', () => {
    expect(formatReportTitle('not-a-real-template')).toBe(`${REPORT_TEMPLATES[0].label} Report`);
  });
});

describe('formatGeneratedBy', () => {
  it('returns "Unknown user" when no user is given', () => {
    expect(formatGeneratedBy(null)).toBe('Unknown user');
    expect(formatGeneratedBy(undefined)).toBe('Unknown user');
  });

  it('prefers fullName, then falls back to username', () => {
    expect(formatGeneratedBy({ fullName: 'Jane Doe', username: 'jdoe' })).toBe('Jane Doe');
    expect(formatGeneratedBy({ username: 'jdoe' })).toBe('jdoe');
  });

  it('falls back to "Unknown user" when neither field is present', () => {
    expect(formatGeneratedBy({})).toBe('Unknown user');
  });
});

describe('formatMetricValue', () => {
  it('returns an em dash for null/undefined', () => {
    expect(formatMetricValue(null)).toBe('—');
    expect(formatMetricValue(undefined)).toBe('—');
  });

  it('formats numbers with locale grouping', () => {
    expect(formatMetricValue(1234)).toBe((1234).toLocaleString());
  });

  it('stringifies non-number values as-is', () => {
    expect(formatMetricValue('MATCHED')).toBe('MATCHED');
  });

  it('passes through 0 as a real value, not as missing', () => {
    expect(formatMetricValue(0)).toBe((0).toLocaleString());
  });
});

describe('formatReportDateRange', () => {
  it('returns "All time" when neither bound is set', () => {
    expect(formatReportDateRange(null, null)).toBe('All time');
    expect(formatReportDateRange(undefined, undefined)).toBe('All time');
  });

  it('formats a full range when both bounds are set', () => {
    const result = formatReportDateRange('2026-01-01', '2026-01-31');
    expect(result).toContain('–');
    expect(result).not.toBe('All time');
  });

  it('uses "the beginning" / "now" for a one-sided range', () => {
    expect(formatReportDateRange(null, '2026-01-31')).toContain('the beginning');
    expect(formatReportDateRange('2026-01-01', null)).toContain('now');
  });
});

describe('formatReportDuration', () => {
  it('returns an em dash for null, undefined, or NaN', () => {
    expect(formatReportDuration(null)).toBe('—');
    expect(formatReportDuration(undefined)).toBe('—');
    expect(formatReportDuration(NaN)).toBe('—');
  });

  it('rounds to the nearest millisecond and appends "ms"', () => {
    expect(formatReportDuration(123.6)).toBe('124 ms');
    expect(formatReportDuration(0)).toBe('0 ms');
  });
});

describe('formatReportPercentage / formatReportConfidence', () => {
  it('delegate to the shared formatters without altering their output', () => {
    expect(formatReportPercentage(42)).toBe('42.0%');
    expect(formatReportConfidence(0.5)).toBe('50.0%');
  });
});
