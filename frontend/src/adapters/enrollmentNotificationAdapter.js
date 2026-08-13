import * as studentApi from '../api/studentApi';
import { normalizeNotification, NOTIFICATION_SEVERITY, NOTIFICATION_SOURCES } from '../utils/normalizeNotification';

/**
 * Reuses GET /students (the same endpoint StudentsListPage already calls).
 * Filters client-side for `enrollmentStatus === 'FAILED'` within a recent
 * sample -- consistent with the rest of the app's client-derived panels,
 * this only reflects whichever page of recent students was fetched.
 */
export async function enrollmentNotificationAdapter() {
  const page = await studentApi.searchStudents({
    page: 0,
    size: 20,
    sortBy: 'updatedAt',
    sortDir: 'desc',
  });

  return (page.content || [])
    .filter((s) => s.enrollmentStatus === 'FAILED')
    .map((s) =>
      normalizeNotification({
        id: `enrollment-${s.id}`,
        type: 'enrollmentFailed',
        severity: NOTIFICATION_SEVERITY.ERROR,
        title: 'Face enrollment failed',
        description: `${s.fullName} (${s.registerNumber}) needs enrollment retried.`,
        timestamp: s.updatedAt || new Date().toISOString(),
        source: NOTIFICATION_SOURCES.ENROLLMENT,
        actionUrl: `/students/${s.id}`,
        metadata: { studentId: s.id, registerNumber: s.registerNumber },
      })
    );
}
