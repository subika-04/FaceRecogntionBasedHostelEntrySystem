import { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import * as recognitionApi from '../api/recognitionApi';
import CameraCapture from '../components/recognition/CameraCapture';
import RecognitionResultCard from '../components/recognition/RecognitionResultCard';
import RecognitionSessionPanel from '../components/recognition/RecognitionSessionPanel';
import RecognitionLiveFeed from '../components/recognition/RecognitionLiveFeed';
import RecognitionSummary from '../components/recognition/RecognitionSummary';
import RecognitionTimeline from '../components/recognition/RecognitionTimeline';
import RecognitionFilters, { DEFAULT_FILTERS, applyClientFilters } from '../components/recognition/RecognitionFilters';
import ErrorMessage, { extractErrorMessage } from '../components/common/ErrorMessage';
import { downloadCsv } from '../utils/csvExport';
import { formatConfidence, formatDateTime } from '../utils/formatters';
import { DEFAULT_CAMERA_SOURCES } from '../utils/constants';

const CSV_COLUMNS = [
  { label: 'Recognized At', value: (r) => formatDateTime(r.recognizedAt) },
  { label: 'Student', value: (r) => r.student?.fullName || 'Unrecognized' },
  { label: 'Register No.', value: (r) => r.student?.registerNumber || '—' },
  { label: 'Status', value: 'status' },
  { label: 'Confidence', value: (r) => formatConfidence(r.confidence) },
  { label: 'Camera', value: 'recognizedByCamera' },
  { label: 'Duration (ms)', value: 'recognitionDurationMs' },
];

/**
 * The full live recognition workspace: capture + result on top, session
 * tracking, a live-polling activity feed, and a filterable historical
 * timeline below. Supersedes the old RecognitionLivePage.jsx (deleted --
 * its only responsibility, camera capture + result display, is now one
 * section of this page rather than a separate route).
 */
export default function RecognitionPage() {
  const [camera, setCamera] = useState(DEFAULT_CAMERA_SOURCES[0]?.id || 'CAM01');
  const [result, setResult] = useState(null);
  const [sessionActive, setSessionActive] = useState(true);
  const [sessionCount, setSessionCount] = useState(0);

  const [timelineRecords, setTimelineRecords] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const loadTimeline = async (statusOverride = filters.status, cameraOverride = filters.camera) => {
    setError(null);
    try {
      const data = await recognitionApi.getRecognitionHistory({
        status: statusOverride || undefined,
        camera: cameraOverride || undefined,
        page: 0,
        size: 20,
        sortBy: 'recognizedAt',
        sortDir: 'desc',
      });
      setTimelineRecords(data.content || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load recognition history.'));
    }
  };

  useEffect(() => {
    loadTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (patch) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    // Only status/camera are backed by real server query params (see
    // RecognitionController) -- changing either re-fetches. Every other
    // field in `patch` (studentQuery/date range/confidence range) is
    // applied client-side below via applyClientFilters, so no refetch is
    // needed for those.
    if ('status' in patch || 'camera' in patch) {
      loadTimeline(next.status, next.camera);
    }
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    loadTimeline('', '');
  };

  const handleResult = (recognitionResult) => {
    setResult(recognitionResult);
    setSessionCount((c) => c + 1);
    loadTimeline(); // refresh the timeline/feed context with the just-recorded attempt
  };

  const filteredRecords = timelineRecords ? applyClientFilters(timelineRecords, filters) : null;

  const handleExport = () => {
    downloadCsv('recognition-timeline.csv', filteredRecords || [], CSV_COLUMNS);
  };

  return (
    <div className="space-y-6">
      <RecognitionSummary records={timelineRecords || []} />

      <RecognitionSessionPanel
        recognitionCount={sessionCount}
        active={sessionActive}
        onPause={() => setSessionActive(false)}
        onResume={() => setSessionActive(true)}
        onStop={() => {
          setSessionActive(false);
          setSessionCount(0);
        }}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-2">
          <label className="label flex items-center gap-1.5 text-xs" htmlFor="camera-select">
            <Camera className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> Camera
          </label>
          <select
            id="camera-select"
            className="input max-w-xs"
            value={camera}
            onChange={(e) => setCamera(e.target.value)}
            disabled={!sessionActive}
          >
            {DEFAULT_CAMERA_SOURCES.map((c) => (
              <option key={c.id} value={c.id}>{c.label} ({c.id})</option>
            ))}
          </select>
          {sessionActive ? (
            <CameraCapture camera={camera} onResult={handleResult} />
          ) : (
            <div className="card flex h-full min-h-[220px] items-center justify-center p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Session paused. Resume above to continue capturing.
            </div>
          )}
        </div>
        <RecognitionResultCard result={result} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <RecognitionLiveFeed limit={10} />
        </div>

        <div className="space-y-4 lg:col-span-2">
          <RecognitionFilters values={filters} onChange={handleFilterChange} onReset={handleResetFilters} />

          <ErrorMessage message={error} onRetry={() => loadTimeline()} />

          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-ink dark:text-slate-100">Recognition Timeline</h2>
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={handleExport}
              disabled={!filteredRecords?.length}
            >
              Export CSV
            </button>
          </div>
          <RecognitionTimeline
            records={filteredRecords}
            loading={timelineRecords === null}
            emptyMessage="No recognition events match the current filters."
          />
        </div>
      </div>
    </div>
  );
}
