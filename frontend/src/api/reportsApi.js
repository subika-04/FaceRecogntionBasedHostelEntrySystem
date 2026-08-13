import axiosClient from './axiosClient';

// Downloads a CSV report as a blob and triggers a browser save. All three
// endpoints require ROLE_ADMIN and stream a text/csv response with a
// Content-Disposition attachment header set by the backend.
async function downloadCsv(url, params) {
  const res = await axiosClient.get(url, { params, responseType: 'blob' });

  // Try to read the filename the backend suggested; fall back to a default.
  const disposition = res.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : 'report.csv';

  const blobUrl = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}

// GET /reports/recognition-history?studentId=&status=&camera=&startDate=&endDate=
export const downloadRecognitionHistoryReport = (params) =>
  downloadCsv('/reports/recognition-history', params);

// GET /reports/students?status=&query=
export const downloadStudentsReport = (params) =>
  downloadCsv('/reports/students', params);

// GET /reports/activity-logs?userId=&action=&startDate=&endDate=
export const downloadActivityLogsReport = (params) =>
  downloadCsv('/reports/activity-logs', params);
