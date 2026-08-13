export const NOTIFICATION_SEVERITY = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

export const NOTIFICATION_SOURCES = {
  RECOGNITION: 'Recognition',
  SYSTEM_HEALTH: 'System Health',
  SECURITY: 'Security',
  ENROLLMENT: 'Enrollment',
};

/**
 * The one shape every adapter must produce and every UI component
 * (NotificationCard/List/Drawer/Topbar) consumes -- no component reaches
 * into a raw backend DTO directly.
 *
 * `id` MUST be stable and deterministic from the source data (not
 * `Date.now()` or similar), since NotificationContext deduplicates by id
 * across repeated polls -- two polls returning the same underlying event
 * must produce the same id, or "read"/"dismissed" state and deduplication
 * both silently break.
 */
export function normalizeNotification({
  id,
  type,
  severity = NOTIFICATION_SEVERITY.INFO,
  title,
  description,
  timestamp,
  source,
  actionUrl = null,
  metadata = null,
}) {
  return {
    id: String(id),
    type,
    severity,
    title,
    description,
    timestamp: timestamp instanceof Date ? timestamp.toISOString() : timestamp,
    read: false, // read state is applied by NotificationContext from persisted storage, not set by adapters
    source,
    actionUrl,
    metadata,
  };
}
