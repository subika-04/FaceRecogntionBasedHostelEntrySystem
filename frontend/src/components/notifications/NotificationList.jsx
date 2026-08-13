import NotificationCard from './NotificationCard';
import NotificationEmptyState from './NotificationEmptyState';
import { SkeletonCard } from '../ui/Skeleton';
import ErrorMessage from '../common/ErrorMessage';

/**
 * Pure rendering component: it knows nothing about severity/source filter
 * shapes -- the caller (NotificationDrawer, or the Topbar preview) filters
 * `notifications` before handing it here. Exactly one component is
 * responsible for "how does a notification look" and for its loading/empty/
 * error states, rather than every surface reimplementing them.
 */
export default function NotificationList({
  notifications,
  loading,
  error,
  onRetry,
  compact = false,
  onMarkRead,
  onMarkUnread,
  onDismiss,
  onNavigate,
  emptyTitle,
  emptyDescription,
}) {
  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-live="polite">
        <SkeletonCard />
        <SkeletonCard />
        {!compact && <SkeletonCard />}
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={onRetry} />;
  }

  if (!notifications || notifications.length === 0) {
    return <NotificationEmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className={compact ? 'divide-y divide-slate-100 dark:divide-slate-700' : 'space-y-2'} role="feed" aria-busy="false">
      {notifications.map((n) => (
        <NotificationCard
          key={n.id}
          notification={n}
          compact={compact}
          onMarkRead={onMarkRead}
          onMarkUnread={onMarkUnread}
          onDismiss={onDismiss}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}
