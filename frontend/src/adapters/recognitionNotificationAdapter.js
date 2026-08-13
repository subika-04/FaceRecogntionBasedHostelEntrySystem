import * as recognitionApi from '../api/recognitionApi';
import { normalizeNotification, NOTIFICATION_SEVERITY, NOTIFICATION_SOURCES } from '../utils/normalizeNotification';

/**
 * Reuses GET /recognition/history (the same endpoint RecognitionHistoryPage/
 * RecognitionPage/Analytics already call) -- no new backend endpoint. Works
 * for both STAFF and ADMIN: the backend already scopes STAFF callers to
 * their own triggered records.
 *
 * `id` is derived from the record's own database id (stable across polls),
 * required for NotificationContext's deduplication and persisted
 * read/dismissed state to work at all.
 */
export async function recognitionNotificationAdapter() {
  const page = await recognitionApi.getRecognitionHistory({
    page: 0,
    size: 15,
    sortBy: 'recognizedAt',
    sortDir: 'desc',
  });

  return (page.content || [])
    .filter((r) => r.status !== 'MATCHED')
    .map((r) =>
      normalizeNotification({
        id: `recognition-${r.id}`,
        type: 'recognitionFailure',
        severity: r.status === 'UNKNOWN' ? NOTIFICATION_SEVERITY.WARNING : NOTIFICATION_SEVERITY.INFO,
        title: r.status === 'UNKNOWN' ? 'Unrecognized face detected' : 'Low-confidence match',
        description: r.student
          ? `${r.student.fullName} matched at ${Math.round((r.confidence || 0) * 100)}% confidence on ${r.recognizedByCamera}.`
          : r.capturedImageUrl
          ? `An unrecognized face was captured on ${r.recognizedByCamera}. A photo was saved for review.`
          : `An unrecognized face was captured on ${r.recognizedByCamera}.`,
        timestamp: r.recognizedAt,
        source: NOTIFICATION_SOURCES.RECOGNITION,
        actionUrl: '/recognition/history',
        metadata: { recognitionId: r.id, camera: r.recognizedByCamera, status: r.status, capturedImageUrl: r.capturedImageUrl },
      })
    );
}
