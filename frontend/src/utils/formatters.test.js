import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatDateTime, formatPercent, formatConfidence, titleCase, formatRelativeTime } from './formatters';

describe('formatDateTime', () => {
  it('returns an em dash for null/undefined/empty input', () => {
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateTime(undefined)).toBe('—');
    expect(formatDateTime('')).toBe('—');
  });

  it('returns the raw string for an unparseable date', () => {
    expect(formatDateTime('not-a-date')).toBe('not-a-date');
  });

  it('formats a valid ISO string into a locale date/time (non-empty, no longer ISO-shaped)', () => {
    const result = formatDateTime('2026-01-15T10:30:00Z');
    expect(result).not.toBe('2026-01-15T10:30:00Z');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatPercent', () => {
  it('returns an em dash for null, undefined, or NaN', () => {
    expect(formatPercent(null)).toBe('—');
    expect(formatPercent(undefined)).toBe('—');
    expect(formatPercent(NaN)).toBe('—');
  });

  it('formats a number to one decimal place with a % sign', () => {
    expect(formatPercent(42)).toBe('42.0%');
    expect(formatPercent(42.456)).toBe('42.5%');
    expect(formatPercent(0)).toBe('0.0%');
  });
});

describe('formatConfidence', () => {
  it('returns an em dash for null or undefined', () => {
    expect(formatConfidence(null)).toBe('—');
    expect(formatConfidence(undefined)).toBe('—');
  });

  it('converts a 0-1 fraction to a percentage string', () => {
    expect(formatConfidence(0.876)).toBe('87.6%');
    expect(formatConfidence(1)).toBe('100.0%');
    expect(formatConfidence(0)).toBe('0.0%');
  });
});

describe('titleCase', () => {
  it('returns an empty string for falsy input', () => {
    expect(titleCase(null)).toBe('');
    expect(titleCase(undefined)).toBe('');
    expect(titleCase('')).toBe('');
  });

  it('converts SNAKE_CASE enum values to Title Case words', () => {
    expect(titleCase('LOW_CONFIDENCE')).toBe('Low Confidence');
    expect(titleCase('MATCHED')).toBe('Matched');
    expect(titleCase('DAY_SCHOLAR')).toBe('Day Scholar');
  });
});

describe('formatRelativeTime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns an empty string for falsy or unparseable input', () => {
    expect(formatRelativeTime(null)).toBe('');
    expect(formatRelativeTime('')).toBe('');
    expect(formatRelativeTime('not-a-date')).toBe('');
  });

  it('reports "just now" for timestamps under 5 seconds old', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T10:00:03Z'));
    expect(formatRelativeTime('2026-01-15T10:00:00Z')).toBe('just now');
  });

  it('reports seconds, then minutes, then hours, then days as the gap grows', () => {
    vi.useFakeTimers();
    const base = new Date('2026-01-15T10:00:00Z');

    vi.setSystemTime(new Date(base.getTime() + 30 * 1000));
    expect(formatRelativeTime(base.toISOString())).toBe('30s ago');

    vi.setSystemTime(new Date(base.getTime() + 5 * 60 * 1000));
    expect(formatRelativeTime(base.toISOString())).toBe('5m ago');

    vi.setSystemTime(new Date(base.getTime() + 3 * 60 * 60 * 1000));
    expect(formatRelativeTime(base.toISOString())).toBe('3h ago');

    vi.setSystemTime(new Date(base.getTime() + 2 * 24 * 60 * 60 * 1000));
    expect(formatRelativeTime(base.toISOString())).toBe('2d ago');
  });

  it('falls back to a plain date once more than a week old', () => {
    vi.useFakeTimers();
    const base = new Date('2026-01-01T10:00:00Z');
    vi.setSystemTime(new Date(base.getTime() + 10 * 24 * 60 * 60 * 1000));
    const result = formatRelativeTime(base.toISOString());
    expect(result).not.toContain('ago');
    expect(result.length).toBeGreaterThan(0);
  });
});
