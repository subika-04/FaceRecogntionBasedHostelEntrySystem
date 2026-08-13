import * as systemHealthApi from '../api/systemHealthApi';
import { normalizeNotification, NOTIFICATION_SEVERITY, NOTIFICATION_SOURCES } from '../utils/normalizeNotification';

const COMPONENT_LABELS = {
  db: 'Database',
  aiService: 'AI Recognition Service',
  diskSpace: 'Disk Space',
};

/**
 * Reuses GET /actuator/health -- the same endpoint SystemHealthPanel already
 * polls. Publicly reachable at the Spring Security level, so this works for
 * any authenticated role.
 *
 * `id` is derived from the component name only (not a timestamp), so a
 * component that's still DOWN on the next poll produces the *same*
 * notification id rather than a new one each time.
 */
export async function systemHealthNotificationAdapter() {
  const health = await systemHealthApi.getSystemHealth();
  const components = health?.components || {};

  return Object.entries(components)
    .filter(([, detail]) => detail?.status && detail.status !== 'UP')
    .map(([key, detail]) => {
      const isDown = detail.status === 'DOWN' || detail.status === 'OUT_OF_SERVICE';
      return normalizeNotification({
        id: `health-${key}`,
        type: 'systemHealth',
        severity: isDown ? NOTIFICATION_SEVERITY.ERROR : NOTIFICATION_SEVERITY.WARNING,
        title: `${COMPONENT_LABELS[key] || key} ${isDown ? 'is down' : 'is degraded'}`,
        description: isDown
          ? `${COMPONENT_LABELS[key] || key} is currently unreachable. Some features may not work correctly.`
          : `${COMPONENT_LABELS[key] || key} is reporting a degraded status.`,
        // No historical health-check timestamp is stored anywhere -- this
        // reflects "last checked," not "when it actually went down."
        timestamp: new Date().toISOString(),
        source: NOTIFICATION_SOURCES.SYSTEM_HEALTH,
        metadata: { component: key, status: detail.status },
      });
    });
}
