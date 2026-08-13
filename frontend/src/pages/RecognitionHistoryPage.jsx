import { useEffect, useState } from 'react';
import * as recognitionApi from '../api/recognitionApi';
import { useAuth } from '../context/AuthContext';
import { ROLES, RECOGNITION_STATUS, DEFAULT_CAMERA_SOURCES } from '../utils/constants';
import { titleCase, formatConfidence, formatDateTime } from '../utils/formatters';
import RecognitionTimeline from '../components/recognition/RecognitionTimeline';
import Pagination from '../components/common/Pagination';
import ErrorMessage, { extractErrorMessage } from '../components/common/ErrorMessage';
import { downloadCsv } from '../utils/csvExport';

const CSV_COLUMNS = [
  { label: 'Recognized At', value: (r) => formatDateTime(r.recognizedAt) },
  { label: 'Student', value: (r) => r.student?.fullName || 'Unrecognized' },
  { label: 'Register No.', value: (r) => r.student?.registerNumber || '—' },
  { label: 'Status', value: 'status' },
  { label: 'Confidence', value: (r) => formatConfidence(r.confidence) },
  { label: 'Camera', value: 'recognizedByCamera' },
];

/**
 * Full, server-paginated recognition log -- distinct from RecognitionPage's
 * "recent sample" timeline, and intentionally kept that way: this page's
 * status/camera/studentId filters are true server-side query params (see
 * RecognitionController), so results are correct across the *entire*
 * filtered dataset, not just whatever page happens to be loaded client-side.
 * Swapping this for RecognitionFilters' client-side studentQuery would have
 * been a functional regression, not a simplification -- so only the
 * *rendering* (RecognitionTimeline, reusing RecognitionEventCard) was
 * adopted from the newer Recognition Module here, not its filter component.
 */
export default function RecognitionHistoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  const [filters, setFilters] = useState({ status: '', camera: '', studentId: '' });
  const [page, setPage] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async (currentPage = pageIndex, currentFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await recognitionApi.getRecognitionHistory({
        page: currentPage,
        size: 10,
        sortBy: 'recognizedAt',
        sortDir: 'desc',
        status: currentFilters.status || undefined,
        camera: currentFilters.camera || undefined,
        studentId: currentFilters.studentId || undefined,
      });
      setPage(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load recognition history.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = (e) => {
    e.preventDefault();
    setPageIndex(0);
    load(0, filters);
  };

  const handlePageChange = (p) => {
    setPageIndex(p);
    load(p, filters);
  };

  const handleExport = () => {
    downloadCsv(`recognition-history-page-${pageIndex + 1}.csv`, page?.content || [], CSV_COLUMNS);
  };

  return (
    <div className="space-y-4">
      {!isAdmin && (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-300">
          You're viewing recognition records you personally triggered. Full history across all staff is
          visible to Administrators.
        </p>
      )}

      <form onSubmit={applyFilters} className="card flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="label">Status</label>
          <select
            className="input"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">All</option>
            {RECOGNITION_STATUS.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Camera</label>
          <select
            className="input"
            value={filters.camera}
            onChange={(e) => setFilters((f) => ({ ...f, camera: e.target.value }))}
          >
            <option value="">All</option>
            {DEFAULT_CAMERA_SOURCES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label} ({c.id})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Student ID</label>
          <input
            className="input"
            placeholder="e.g. 12"
            value={filters.studentId}
            onChange={(e) => setFilters((f) => ({ ...f, studentId: e.target.value }))}
          />
        </div>
        <button type="submit" className="btn-secondary">
          Apply Filters
        </button>
        <button type="button" className="btn-secondary ml-auto" onClick={handleExport} disabled={!page?.content?.length}>
          Export Page CSV
        </button>
      </form>

      <ErrorMessage message={error} onRetry={() => load(pageIndex, filters)} />

      <RecognitionTimeline
        records={page?.content}
        loading={loading}
        emptyMessage="No recognition events match these filters."
      />
      {!loading && page?.content?.length > 0 && <Pagination page={page} onPageChange={handlePageChange} />}
    </div>
  );
}
