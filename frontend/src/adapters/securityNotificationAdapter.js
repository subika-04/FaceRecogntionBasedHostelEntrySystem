import * as userApi from '../api/userApi';
import { normalizeNotification, NOTIFICATION_SEVERITY, NOTIFICATION_SOURCES } from '../utils/normalizeNotification';

/**
 * Reuses GET /users (the same endpoint UserManagementPage already calls,
 * which already computes a `locked` boolean per user). ADMIN-only:
 * `/users/**` is hasRole('ADMIN') in SecurityConfig, so NotificationContext
 * must not call this adapter for a STAFF user (it would just 403).
 *
 * `id` is derived from the user's id, not the poll time, so a still-locked
 * account doesn't generate a fresh notification on every poll.
 */
export async function securityNotificationAdapter() {
  const page = await userApi.searchUsers({ page: 0, size: 50, sortBy: 'username', sortDir: 'asc' });

  return (page.content || [])
    .filter((u) => u.locked)
    .map((u) =>
      normalizeNotification({
        id: `security-lockout-${u.id}`,
        type: 'accountLocked',
        severity: NOTIFICATION_SEVERITY.WARNING,
        title: 'Account temporarily locked',
        description: `${u.username} is locked out after repeated failed login attempts.`,
        timestamp: new Date().toISOString(),
        source: NOTIFICATION_SOURCES.SECURITY,
        actionUrl: '/users',
        metadata: { userId: u.id, username: u.username },
      })
    );
}
