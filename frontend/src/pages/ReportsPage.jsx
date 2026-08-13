import { useEffect, useMemo, useState } from 'react';
import * as reportsApi from '../api/reportsApi';
import * as analyticsApi from '../api/analyticsApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { RECOGNITION_STATUS, ENROLLMENT_STATUS } from '../utils/constants';
import { titleCase } from '../utils/formatters';
import ErrorMessage, { extractErrorMessage } from '../components/common/ErrorMessage';
import ReportBuilder from '../components/reports/ReportBuilder';
import ReportExportMenu from '../components/reports/ReportExportMenu';
import ReportLoadingSkeleton from '../components/reports/ReportLoadingSkeleton';
import ReportEmptyState from '../components/reports/ReportEmptyState';
import ReportErrorState from '../components/reports/ReportErrorState';
import AnalyticsFilterPanel, { DEFAULT_ANALYTICS_FILTERS } from '../components/analytics/AnalyticsFilterPanel';
import { applyRecordFilters } from '../utils/recognitionRecordFilters';
import { extractDepartments } from '../utils/analyticsUtils';
import { exportRecognitionRecordsCsv, exportRecognitionRecordsJson, exportSummaryCsv, exportSummaryJson, exportAsPdf } from '../utils/analyticsExport';
import { REPORT_TEMPLATES } from '../utils/reportTemplates';
import { formatReportTitle, formatGeneratedBy } from '../utils/reportFormatter';
import '../styles/reports-print.css';

const ACTIVITY_SAMPLE_SIZE = 100;

function ReportCard({ title, description, children, onDownload, downloading, error }) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{children}</div>
      <ErrorMessage message={error} />
      <div className="mt-4">
        <ReportExportMenu
          label={downloading ? 'Preparing CSV…' : 'Export ▾'}
          disabled={downloading}
          onExportCsv={onDownload}
        />
      </div>
    </div>
  );
}

/**
 * ReportsPage owns: data loading, template/filter selection, and export
 * actions. All rendering of the report *content* itself is delegated to
 * ReportBuilder (composition only, no business logic there) -- see that
 * file's own docs for how it maps a template to sections.
 *
 * The three existing "Data Export" cards below (server-generated CSVs across
 * the *entire* filtered dataset via reportsApi) are kept as-is and are
 * deliberately NOT replaced by the new client-side analyticsExport helpers:
 * those endpoints support real backend filtering across the full dataset,
 * while the new Printable Report section is necessarily bounded to whatever
 * sample was fetched for on-screen/print rendering (same honest limitation
 * as Analytics). Swapping one for the other would be a functional
 * regression, not a simplification -- the two serve different needs.
 */
export default function ReportsPage() {
  const { user } = useAuth();
  const toast = useToast();

  // ---- Existing server-generated CSV report state (unchanged) ----
  const [rh, setRh] = useState({ studentId: '', status: '', camera: '', startDate: '', endDate: '' });
  const [rhDownloading, setRhDownloading] = useState(false);
  const [rhError, setRhError] = useState(null);

  const [st, setSt] = useState({ status: '', query: '' });
  const [stDownloading, setStDownloading] = useState(false);
  const [stError, setStError] = useState(null);

  const [al, setAl] = useState({ userId: '', action: '', startDate: '', endDate: '' });
  const [alDownloading, setAlDownloading] = useState(false);
  const [alError, setAlError] = useState(null);

  // ---- New Printable Report state ----
  const [templateId, setTemplateId] = useState(REPORT_TEMPLATES[0].id);
  const [filters, setFilters] = useState(DEFAULT_ANALYTICS_FILTERS);
  const [reportData, setReportData] = useState(null); // { summary, records, peakHours, topCameras }
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);

  const loadReportData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [summary, records, peakHours, topCameras] = await Promise.all([
        analyticsApi.getSummary(),
        analyticsApi.getRecentActivity(ACTIVITY_SAMPLE_SIZE),
        analyticsApi.getPeakHours(),
        analyticsApi.getTopCameras(8),
      ]);
      setReportData({ summary, records, peakHours, topCameras });
      setGeneratedAt(new Date());
    } catch (err) {
      setLoadError(extractErrorMessage(err, 'Failed to load report data.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const departments = useMemo(
    () => extractDepartments(reportData?.records || []),
    [reportData]
  );

  const filteredRecords = useMemo(
    () => applyRecordFilters(reportData?.records || [], filters),
    [reportData, filters]
  );

  const builderData = useMemo(
    () => (reportData ? { ...reportData, records: filteredRecords } : null),
    [reportData, filteredRecords]
  );

  const generatedBy = formatGeneratedBy(user);
  const reportFilename = formatReportTitle(templateId).toLowerCase().replace(/\s+/g, '-');

  // ---- Existing server-generated CSV download handlers (unchanged) ----
  const downloadRh = async () => {
    setRhDownloading(true);
    setRhError(null);
    try {
      await reportsApi.downloadRecognitionHistoryReport({
        studentId: rh.studentId || undefined,
        status: rh.status || undefined,
        camera: rh.camera || undefined,
        startDate: rh.startDate ? `${rh.startDate}T00:00:00` : undefined,
        endDate: rh.endDate ? `${rh.endDate}T23:59:59` : undefined,
      });
    } catch (err) {
      setRhError(extractErrorMessage(err, 'Failed to generate report.'));
    } finally {
      setRhDownloading(false);
    }
  };

  const downloadSt = async () => {
    setStDownloading(true);
    setStError(null);
    try {
      await reportsApi.downloadStudentsReport({
        status: st.status || undefined,
        query: st.query || undefined,
      });
    } catch (err) {
      setStError(extractErrorMessage(err, 'Failed to generate report.'));
    } finally {
      setStDownloading(false);
    }
  };

  const downloadAl = async () => {
    setAlDownloading(true);
    setAlError(null);
    try {
      await reportsApi.downloadActivityLogsReport({
        userId: al.userId || undefined,
        action: al.action || undefined,
        startDate: al.startDate ? `${al.startDate}T00:00:00` : undefined,
        endDate: al.endDate ? `${al.endDate}T23:59:59` : undefined,
      });
    } catch (err) {
      setAlError(extractErrorMessage(err, 'Failed to generate report.'));
    } finally {
      setAlDownloading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ============ Printable Reports ============ */}
      <section aria-labelledby="printable-reports-heading" className="space-y-4">
        <div className="report-controls flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <h1 id="printable-reports-heading" className="font-display text-xl font-bold text-ink dark:text-slate-100">
              Printable Reports
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Choose a template, adjust filters, then export or print.
            </p>
          </div>
          <div className="flex gap-2">
            <ReportExportMenu
              label="Export Summary ▾"
              disabled={!reportData?.summary}
              onExportCsv={() => {
                exportSummaryCsv(reportData?.summary);
                toast.success('Summary CSV downloaded.');
              }}
              onExportJson={() => {
                exportSummaryJson(reportData?.summary);
                toast.success('Summary JSON downloaded.');
              }}
            />
            <ReportExportMenu
              label="Export Records ▾"
              disabled={!builderData}
              onExportCsv={() => {
                exportRecognitionRecordsCsv(filteredRecords, `${reportFilename}-records.csv`);
                toast.success('CSV export downloaded.');
              }}
              onExportJson={() => {
                exportRecognitionRecordsJson(filteredRecords, `${reportFilename}-records.json`);
                toast.success('JSON export downloaded.');
              }}
              onExportPdf={() => {
                toast.info('Opening print dialog — choose "Save as PDF" as the destination for a PDF file.');
                exportAsPdf();
              }}
            />
          </div>
        </div>

        <div className="report-controls flex flex-wrap gap-2 print:hidden" role="tablist" aria-label="Report template">
          {REPORT_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={templateId === t.id}
              onClick={() => setTemplateId(t.id)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                templateId === t.id
                  ? 'border-brass-500 bg-brass-50 text-brass-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
              title={t.description}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="report-controls analytics-filter-panel print:hidden">
          <AnalyticsFilterPanel
            values={filters}
            onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
            onReset={() => setFilters(DEFAULT_ANALYTICS_FILTERS)}
            departments={departments}
          />
        </div>

        {loading ? (
          <ReportLoadingSkeleton />
        ) : loadError ? (
          <ReportErrorState message={loadError} onRetry={loadReportData} />
        ) : !builderData || filteredRecords.length === 0 ? (
          <ReportEmptyState
            title="No recognition records match this report"
            description="Widen your filters, or check back once more recognition attempts have been logged."
          />
        ) : (
          <div className="card overflow-hidden p-6 print:border-0 print:p-0 print:shadow-none">
            <ReportBuilder
              templateId={templateId}
              data={builderData}
              generatedBy={generatedBy}
              generatedAt={generatedAt}
              filters={filters}
            />
          </div>
        )}
      </section>

      {/* ============ Data Exports (existing, unchanged) ============ */}
      <section aria-labelledby="data-exports-heading" className="max-w-3xl space-y-6 print:hidden">
        <h2 id="data-exports-heading" className="font-display text-xl font-bold text-ink dark:text-slate-100">
          Data Exports
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Server-generated CSV exports covering the entire filtered dataset (not just a loaded sample).
        </p>

        <ReportCard
          title="Recognition History Report"
          description="Export recognition attempts as CSV, optionally filtered."
          onDownload={downloadRh}
          downloading={rhDownloading}
          error={rhError}
        >
          <input
            className="input"
            placeholder="Student ID"
            value={rh.studentId}
            onChange={(e) => setRh((f) => ({ ...f, studentId: e.target.value }))}
          />
          <select
            className="input"
            value={rh.status}
            onChange={(e) => setRh((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">All statuses</option>
            {RECOGNITION_STATUS.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Camera (e.g. CAM01)"
            value={rh.camera}
            onChange={(e) => setRh((f) => ({ ...f, camera: e.target.value }))}
          />
          <div className="flex gap-2">
            <input
              type="date"
              className="input"
              value={rh.startDate}
              onChange={(e) => setRh((f) => ({ ...f, startDate: e.target.value }))}
            />
            <input
              type="date"
              className="input"
              value={rh.endDate}
              onChange={(e) => setRh((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
        </ReportCard>

        <ReportCard
          title="Student Directory Report"
          description="Export the student roster as CSV, optionally filtered."
          onDownload={downloadSt}
          downloading={stDownloading}
          error={stError}
        >
          <select
            className="input"
            value={st.status}
            onChange={(e) => setSt((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">All enrollment statuses</option>
            {ENROLLMENT_STATUS.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Search name or register no."
            value={st.query}
            onChange={(e) => setSt((f) => ({ ...f, query: e.target.value }))}
          />
        </ReportCard>

        <ReportCard
          title="Activity Logs Report"
          description="Export the audit trail (logins, edits, deletions) as CSV."
          onDownload={downloadAl}
          downloading={alDownloading}
          error={alError}
        >
          <input
            className="input"
            placeholder="User ID"
            value={al.userId}
            onChange={(e) => setAl((f) => ({ ...f, userId: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Action (e.g. LOGIN_SUCCESS)"
            value={al.action}
            onChange={(e) => setAl((f) => ({ ...f, action: e.target.value }))}
          />
          <div className="col-span-2 flex gap-2">
            <input
              type="date"
              className="input"
              value={al.startDate}
              onChange={(e) => setAl((f) => ({ ...f, startDate: e.target.value }))}
            />
            <input
              type="date"
              className="input"
              value={al.endDate}
              onChange={(e) => setAl((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
        </ReportCard>
      </section>
    </div>
  );
}
