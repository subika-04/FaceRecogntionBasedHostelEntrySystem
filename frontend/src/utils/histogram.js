/**
 * Buckets a numeric array into labeled ranges and counts how many values
 * fall in each. Used by both RecognitionLatencyChart and
 * ConfidenceDistributionChart -- structurally the same problem (histogram a
 * numeric field), so it's solved once here instead of twice.
 *
 * `buckets`: [{ label, min, max }] where each range is [min, max) except the
 * final bucket, which is inclusive of `max` (or open-ended if `max` is
 * omitted/Infinity).
 */
export function computeHistogram(values, buckets) {
  const counts = buckets.map(() => 0);
  (values || []).forEach((value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return;
    for (let i = 0; i < buckets.length; i++) {
      const { min, max } = buckets[i];
      const isLast = i === buckets.length - 1;
      if (value >= min && (isLast ? value <= (max ?? Infinity) : value < max)) {
        counts[i]++;
        break;
      }
    }
  });
  return buckets.map((b, i) => ({ label: b.label, count: counts[i] }));
}

export const CONFIDENCE_BUCKETS = [
  { label: '0–20%', min: 0, max: 0.2 },
  { label: '20–40%', min: 0.2, max: 0.4 },
  { label: '40–60%', min: 0.4, max: 0.6 },
  { label: '60–80%', min: 0.6, max: 0.8 },
  { label: '80–100%', min: 0.8, max: 1.01 },
];

export const LATENCY_BUCKETS_MS = [
  { label: '<100ms', min: 0, max: 100 },
  { label: '100–200ms', min: 100, max: 200 },
  { label: '200–400ms', min: 200, max: 400 },
  { label: '400–800ms', min: 400, max: 800 },
  { label: '800ms+', min: 800, max: Infinity },
];
