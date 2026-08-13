import { useMemo, useState } from 'react';
import Drawer from '../ui/Drawer';
import NotificationList from './NotificationList';
import NotificationFilters from './NotificationFilters';
import { useNotifications } from '../../context/NotificationContext';

const DEFAULT_FILTERS = { source: '', severity: '', unreadOnly: false };

// open, onClose: standard Drawer contract; onNavigate: called when a
// notification's action link is clicked (so the caller can close the drawer).
export default function NotificationDrawer({ open, onClose, onNavigate }) {
  const { notifications, loading, error, markAsRead, markAsUnread, markAllAsRead, dismiss, clearRead, refresh } = useNotifications();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filters.source && n.source !== filters.source) return false;
      if (filters.severity && n.severity !== filters.severity) return false;
      if (filters.unreadOnly && n.read) return false;
      return true;
    });
  }, [notifications, filters]);

  const hasRead = notifications.some((n) => n.read);
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <Drawer open={open} title="Notifications" onClose={onClose} widthClassName="max-w-lg">
      {/* Sticky toolbar: filters + bulk actions stay visible while scrolling
          through a long notification list below. */}
      <div className="sticky top-0 z-10 -mx-5 -mt-4 mb-4 space-y-3 border-b border-slate-100 bg-white px-5 py-3 dark:border-slate-700 dark:bg-ink-light">
        <NotificationFilters values={filters} onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))} />

        <div className="flex items-center justify-end gap-3 text-xs">
          <button type="button" className="font-medium text-brass-600 hover:underline disabled:text-slate-300 disabled:no-underline" onClick={markAllAsRead} disabled={!hasUnread}>
            Mark all read
          </button>
          <button type="button" className="font-medium text-denied-600 hover:underline disabled:text-slate-300 disabled:no-underline" onClick={clearRead} disabled={!hasRead}>
            Clear read
          </button>
        </div>
      </div>

      <NotificationList
        notifications={filtered}
        loading={loading}
        error={error}
        onRetry={refresh}
        onMarkRead={markAsRead}
        onMarkUnread={markAsUnread}
        onDismiss={dismiss}
        onNavigate={() => {
          onNavigate?.();
          onClose();
        }}
        emptyTitle={notifications.length === 0 ? 'No notifications' : 'No notifications match these filters'}
        emptyDescription={notifications.length === 0 ? "You're all caught up." : 'Try clearing a filter above.'}
      />
    </Drawer>
  );
}
