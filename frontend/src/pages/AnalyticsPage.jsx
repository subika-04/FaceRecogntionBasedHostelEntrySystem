import { useEffect, useMemo, useState } from 'react';
import * as analyticsApi from '../api/analyticsApi';
import SummaryCards from '../components/analytics/SummaryCards';
import TrendChart from '../components/analytics/TrendChart';
import PeakHoursChart from '../components/analytics/PeakHoursChart';
import TopCamerasChart from '../components/analytics/TopCamerasChart';
import RecognitionHeatmap from '../components/analytics/RecognitionHeatmap';
import RecognitionLatencyChart from '../components/analytics/RecognitionLatencyChart';
import ConfidenceDistributionChart from '../components/analytics/ConfidenceDistributionChart';
import AnalyticsFilterPanel, { DEFAULT_ANALYTICS_FILTERS } from '../components/analytics/AnalyticsFilterPanel';
import AnalyticsSavedFilters from '../components/analytics/AnalyticsSavedFilters';
import AdvancedStatsCards from '../components/analytics/AdvancedStatsCards';
import HistoryTable from '../components/recognition/HistoryTable';
import { SkeletonCard, SkeletonTable } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorMessage, { extractErrorMessage } from '../components/common/ErrorMessage';
import { applyRecordFilters } from '../utils/recognitionRecordFilters';
import { extractDepartments } from '../utils/analyticsUtils';
import {
  exportRecognitionRecordsCsv,
  exportRecognitionRecordsJson,
  exportSummaryCsv,
  exportSummaryJson,
  exportAsPdf,
} from '../utils/analyticsExport';
import { TREND_RANGES } from '../utils/constants';

// Sample size for every client-derived panel below (heatmap, latency,
// confidence distribution, failure analysis, filters). One fetch, reused by
// all of them -- see the useMemo calls further down instead of each panel
// issuing its own request for the same data.
const ACTIVITY_SAMPLE_SIZE = 50;

export default function AnalyticsPage() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [topCameras, setTopCameras] = useState([]);
  const [recentSuccessful, setRecentSuccessful] = useState([]);
  const [recentActivity, setRecentActivity] = useState(null); // null = not loaded yet (distinct from [])
  const [range, setRange] = useState('DAILY');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_ANALYTICS_FILTERS);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, trendsRes, peakRes, camerasRes, successfulRes, activityRes] = await Promise.all([
        analyticsApi.getSummary(),
        analyticsApi.getTrends(range),
        analyticsApi.getPeakHours(),
        analyticsApi.getTopCameras(8),
        analyticsApi.getRecentSuccessful(8),
        analyticsApi.getRecentActivity(ACTIVITY_SAMPLE_SIZE),
      ]);
      setSummary(summaryRes);
      setTrends(trendsRes);
      setPeakHours(peakRes);
      setTopCameras(camerasRes);
      setRecentSuccessful(successfulRes);
      setRecentActivity(activityRes);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load analytics.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  // Derived once per (recentActivity, filters) change, not recomputed on
  // every render -- every panel below (timeline table, heatmap, latency
  // chart, confidence chart, failure list) reads from this single memoized
  // result instead of each re-filtering recentActivity independently.
  const filteredRecords = useMemo(
    () => applyRecordFilters(recentActivity || [], filters),
    [recentActivity, filters]
  );

  const departments = useMemo(() => extractDepartments(recentActivity), [recentActivity]);

  const recentFailures = useMemo(
    () => filteredRecords.filter((r) => r.status !== 'MATCHED'),
    [filteredRecords]
  );

  const handleFilterChange = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const handleResetFilters = () => setFilters(DEFAULT_ANALYTICS_FILTERS);
  const handleApplyPreset = (presetFilters) => setFilters({ ...DEFAULT_ANALYTICS_FILTERS, ...presetFilters });

  return (
    <div className="space-y-6">
      <ErrorMessage message={error} onRetry={loadAll} />

      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <h1 className="font-display text-xl font-bold text-ink dark:text-slate-100">Analytics</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => exportSummaryCsv(summary)}
            disabled={!summary}
          >
            Export Summary CSV
          </button>
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => exportSummaryJson(summary)}
            disabled={!summary}
          >
            Export Summary JSON
          </button>
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => exportRecognitionRecordsCsv(filteredRecords, 'analytics-filtered-records.csv')}
            disabled={!filteredRecords.length}
          >
            Export Filtered CSV
          </button>
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => exportRecognitionRecordsJson(filteredRecords, 'analytics-filtered-records.json')}
            disabled={!filteredRecords.length}
          >
            Export Filtered JSON
          </button>
          <button type="button" className="btn-secondary text-xs" onClick={exportAsPdf}>
            Print / Export PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4" aria-label="Loading summary statistics">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <SummaryCards summary={summary} />
      )}

      <section aria-label="Recognition trend over time" className="card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-ink dark:text-slate-100">Recognition Trends</h2>
          <div className="flex gap-1 text-xs">
            {TREND_RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                aria-pressed={range === r}
                className={`rounded-md px-2 py-1 font-medium ${
                  range === r ? 'bg-brand-gradient text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {r.charAt(0) + r.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        {loading ? <SkeletonCard /> : <TrendChart data={trends} />}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-label="Peak entry hours" className="card p-4">
          <h2 className="mb-2 font-display text-sm font-semibold text-ink dark:text-slate-100">Peak Entry Hours</h2>
          {loading ? <SkeletonCard /> : <PeakHoursChart data={peakHours} />}
        </section>
        <section aria-label="Top cameras by usage" className="card p-4">
          <h2 className="mb-2 font-display text-sm font-semibold text-ink dark:text-slate-100">Top Cameras</h2>
          {loading ? <SkeletonCard /> : <TopCamerasChart data={topCameras} />}
        </section>
      </div>

      <AnalyticsFilterPanel values={filters} onChange={handleFilterChange} onReset={handleResetFilters} departments={departments} />
      <AnalyticsSavedFilters currentFilters={filters} onApply={handleApplyPreset} />

      <section aria-label="Advanced recognition statistics">
        {recentActivity === null ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <AdvancedStatsCards records={filteredRecords} />
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-label="Recognition activity heatmap" className="card p-4 lg:col-span-1">
          <h2 className="mb-2 font-display text-sm font-semibold text-ink dark:text-slate-100">Activity Heatmap</h2>
          {recentActivity === null ? <SkeletonCard /> : <RecognitionHeatmap records={filteredRecords} />}
        </section>
        <section aria-label="Recognition latency distribution" className="card p-4 lg:col-span-1">
          <h2 className="mb-2 font-display text-sm font-semibold text-ink dark:text-slate-100">Recognition Latency</h2>
          {recentActivity === null ? <SkeletonCard /> : <RecognitionLatencyChart records={filteredRecords} />}
        </section>
        <section aria-label="Confidence score distribution" className="card p-4 lg:col-span-1">
          <h2 className="mb-2 font-display text-sm font-semibold text-ink dark:text-slate-100">Confidence Distribution</h2>
          {recentActivity === null ? <SkeletonCard /> : <ConfidenceDistributionChart records={filteredRecords} />}
        </section>
      </div>

      <section aria-label="Recent successful matches" className="card p-4">
        <h2 className="mb-2 font-display text-sm font-semibold text-ink dark:text-slate-100">Recent Successful Matches</h2>
        {loading ? <SkeletonTable rows={4} columns={4} /> : <HistoryTable records={recentSuccessful} />}
      </section>

      <section aria-label="Failure analysis" className="card p-4">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="font-display text-sm font-semibold text-ink dark:text-slate-100">Failure Analysis</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Unknown faces and low-confidence matches from the filtered sample below.
            </p>
          </div>
        </div>
        {recentActivity === null ? (
          <SkeletonTable rows={3} columns={4} />
        ) : recentFailures.length ? (
          <HistoryTable records={recentFailures} />
        ) : (
          <EmptyState
            title="No recognition failures in this filter"
            description="Every attempt matching the current filters resulted in a confident match."
          />
        )}
      </section>
    </div>
  );
}
