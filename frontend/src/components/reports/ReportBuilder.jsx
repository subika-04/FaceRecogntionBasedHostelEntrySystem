import ReportCover from './ReportCover';
import ReportHeader from './ReportHeader';
import ReportFooter from './ReportFooter';
import ReportSection from './ReportSection';
import ReportMetricGrid from './ReportMetricGrid';
import ReportSignature from './ReportSignature';
import RecognitionHeatmap from '../analytics/RecognitionHeatmap';
import RecognitionLatencyChart from '../analytics/RecognitionLatencyChart';
import ConfidenceDistributionChart from '../analytics/ConfidenceDistributionChart';
import TopCamerasChart from '../analytics/TopCamerasChart';
import PeakHoursChart from '../analytics/PeakHoursChart';
import HistoryTable from '../recognition/HistoryTable';
import EmptyState from '../ui/EmptyState';
import { getTemplateById } from '../../utils/reportTemplates';
import { computeLatencyPercentiles, computeConfidenceExtremes, computeBusiestHour, computeBusiestWeekday } from '../../utils/analyticsUtils';
import { formatMetricValue, formatReportDuration, formatReportConfidence, formatReportPercentage } from '../../utils/reportFormatter';

/** Converts the DashboardSummaryResponse object (same data SummaryCards
 *  renders on-screen) into plain {label, value} pairs for the print-
 *  friendly ReportMetricGrid -- reuses the same field names, just a
 *  different (print-appropriate) presentation, not a re-derivation. */
function summaryToMetrics(summary) {
  if (!summary) return [];
  return [
    { label: 'Registered Students', value: formatMetricValue(summary.totalRegisteredStudents) },
    { label: 'Enrolled (Active)', value: formatMetricValue(summary.activeStudents) },
    { label: 'Pending / Failed', value: formatMetricValue(summary.inactiveStudents) },
    { label: 'Total Attempts', value: formatMetricValue(summary.totalAttempts) },
    { label: 'Successful Matches', value: formatMetricValue(summary.successfulMatches) },
    { label: 'Unknown Faces', value: formatMetricValue(summary.unknownFaces) },
    { label: 'Low Confidence', value: formatMetricValue(summary.lowConfidence) },
    { label: 'Success Rate', value: formatReportPercentage(summary.successRate) },
  ];
}

function advancedStatsToMetrics(records) {
  const { p50, p95, p99 } = computeLatencyPercentiles(records);
  const { highest, lowest } = computeConfidenceExtremes(records);
  const busiestHour = computeBusiestHour(records);
  const busiestWeekday = computeBusiestWeekday(records);
  return [
    { label: 'Latency P50', value: formatReportDuration(p50) },
    { label: 'Latency P95', value: formatReportDuration(p95) },
    { label: 'Latency P99', value: formatReportDuration(p99) },
    { label: 'Highest Confidence', value: highest != null ? formatReportConfidence(highest) : '—' },
    { label: 'Lowest Confidence', value: lowest != null ? formatReportConfidence(lowest) : '—' },
    { label: 'Busiest Hour', value: busiestHour ? busiestHour.hour : '—' },
    { label: 'Busiest Weekday', value: busiestWeekday ? busiestWeekday.day : '—' },
  ];
}

// Every renderer below reuses an existing Analytics/Recognition component --
// none of these charts/tables are reimplemented for print.
const SECTION_RENDERERS = {
  summary: {
    title: 'Summary',
    render: ({ summary }) => <ReportMetricGrid metrics={summaryToMetrics(summary)} />,
  },
  advancedStats: {
    title: 'Recognition Statistics',
    render: ({ records }) => <ReportMetricGrid metrics={advancedStatsToMetrics(records)} />,
  },
  heatmap: {
    title: 'Activity Heatmap',
    description: 'Recognition attempts by day of week and time of day.',
    render: ({ records }) => <RecognitionHeatmap records={records} />,
  },
  latency: {
    title: 'Recognition Latency',
    description: 'Distribution of recognition response times.',
    render: ({ records }) => <RecognitionLatencyChart records={records} />,
  },
  confidence: {
    title: 'Confidence Distribution',
    description: 'Distribution of match confidence scores.',
    render: ({ records }) => <ConfidenceDistributionChart records={records} />,
  },
  topCameras: {
    title: 'Top Cameras',
    render: ({ topCameras }) => <TopCamerasChart data={topCameras} />,
  },
  peakHours: {
    title: 'Peak Entry Hours',
    render: ({ peakHours }) => <PeakHoursChart data={peakHours} />,
  },
  timeline: {
    title: 'Recognition Timeline',
    description: 'Chronological list of recognition attempts included in this report.',
    render: ({ records }) =>
      records && records.length > 0 ? (
        <HistoryTable records={records} />
      ) : (
        <EmptyState title="No recognition events" description="No records match the current filters." />
      ),
  },
};

// templateId: one of REPORT_TEMPLATES' ids; data: { summary, records, peakHours, topCameras };
// generatedBy: string, generatedAt: Date, filters: the active AnalyticsFilterPanel
// values from ReportsPage (only dateFrom/dateTo are used here, for the cover page).
export default function ReportBuilder({ templateId, data, generatedBy, generatedAt, filters }) {
  const template = getTemplateById(templateId);

  return (
    <article id="printable-report" aria-labelledby="report-cover-title" className="mx-auto max-w-4xl bg-white px-2 dark:bg-ink-light print:bg-white print:text-black">
      <ReportHeader title={template.label} />

      <ReportCover
        title="Recognition & Access Report"
        templateLabel={template.label}
        generatedAt={generatedAt}
        generatedBy={generatedBy}
        dateFrom={filters?.dateFrom}
        dateTo={filters?.dateTo}
      />

      {template.sections.map((key, index) => {
        const section = SECTION_RENDERERS[key];
        if (!section) return null;
        return (
          <ReportSection key={key} title={section.title} description={section.description} pageBreakBefore={index > 0}>
            {section.render(data)}
          </ReportSection>
        );
      })}

      <ReportSignature preparedBy={generatedBy} />
      <ReportFooter generatedAt={generatedAt} />
    </article>
  );
}
