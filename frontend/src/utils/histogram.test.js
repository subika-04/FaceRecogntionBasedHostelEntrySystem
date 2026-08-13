import { describe, it, expect } from 'vitest';
import { computeHistogram, CONFIDENCE_BUCKETS, LATENCY_BUCKETS_MS } from './histogram';

describe('computeHistogram', () => {
  const buckets = [
    { label: 'low', min: 0, max: 10 },
    { label: 'mid', min: 10, max: 20 },
    { label: 'high', min: 20, max: Infinity },
  ];

  it('returns a zero count for every bucket when given no values', () => {
    expect(computeHistogram([], buckets)).toEqual([
      { label: 'low', count: 0 },
      { label: 'mid', count: 0 },
      { label: 'high', count: 0 },
    ]);
  });

  it('buckets values into [min, max) ranges, with the final bucket inclusive of max', () => {
    const result = computeHistogram([5, 9.9, 10, 15, 20, 25], buckets);
    expect(result).toEqual([
      { label: 'low', count: 2 }, // 5, 9.9
      { label: 'mid', count: 2 }, // 10, 15
      { label: 'high', count: 2 }, // 20, 25
    ]);
  });

  it('ignores null, undefined, and NaN values rather than mis-bucketing them', () => {
    const result = computeHistogram([5, null, undefined, NaN, 15], buckets);
    expect(result.reduce((sum, b) => sum + b.count, 0)).toBe(2);
  });

  it('handles an open-ended final bucket (no max specified)', () => {
    const openBuckets = [{ label: 'any', min: 0 }];
    expect(computeHistogram([1, 1000000], openBuckets)).toEqual([{ label: 'any', count: 2 }]);
  });
});

describe('CONFIDENCE_BUCKETS', () => {
  it('covers the full 0-100% range with 5 buckets', () => {
    expect(CONFIDENCE_BUCKETS).toHaveLength(5);
    const result = computeHistogram([0, 0.15, 0.35, 0.55, 0.75, 0.95, 1], CONFIDENCE_BUCKETS);
    expect(result.reduce((sum, b) => sum + b.count, 0)).toBe(7);
  });
});

describe('LATENCY_BUCKETS_MS', () => {
  it('covers everything from 0ms to open-ended with 5 buckets', () => {
    expect(LATENCY_BUCKETS_MS).toHaveLength(5);
    const result = computeHistogram([50, 150, 300, 600, 900], LATENCY_BUCKETS_MS);
    expect(result.map((b) => b.count)).toEqual([1, 1, 1, 1, 1]);
  });
});
