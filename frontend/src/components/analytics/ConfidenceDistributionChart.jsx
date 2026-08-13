import Histogram from './Histogram';
import { computeHistogram, CONFIDENCE_BUCKETS } from '../../utils/histogram';
import { CHART_COLORS } from '../../utils/chartTheme';

// records: RecognitionHistoryResponse[] -- bucketed client-side, no new backend endpoint.
export default function ConfidenceDistributionChart({ records = [] }) {
  const data = computeHistogram(
    records.map((r) => r.confidence),
    CONFIDENCE_BUCKETS
  );
  return (
    <Histogram
      data={data}
      barColor={CHART_COLORS.verified}
      emptyTitle="No confidence data yet"
      emptyDescription="Confidence scores will appear here once recognition attempts are logged."
    />
  );
}
