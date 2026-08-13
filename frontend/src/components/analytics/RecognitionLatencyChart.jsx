import Histogram from './Histogram';
import { computeHistogram, LATENCY_BUCKETS_MS } from '../../utils/histogram';

/**
 * recognitionDurationMs is already present on every RecognitionHistoryResponse
 * record (and the backend's Micrometer `frhes.recognition.ai.latency` timer
 * from an earlier batch tracks the same thing server-side for /actuator/metrics)
 * -- so this buckets client-side from records already being fetched rather
 * than adding a new backend aggregation endpoint.
 */
export default function RecognitionLatencyChart({ records = [] }) {
  const data = computeHistogram(
    records.map((r) => r.recognitionDurationMs),
    LATENCY_BUCKETS_MS
  );
  return (
    <Histogram
      data={data}
      emptyTitle="No latency data yet"
      emptyDescription="Recognition response times will appear here once attempts are logged."
    />
  );
}
