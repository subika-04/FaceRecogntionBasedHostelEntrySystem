import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationList from '../notifications/NotificationList';
import NotificationBadge from '../notifications/NotificationBadge';
import NotificationDrawer from '../notifications/NotificationDrawer';

export default function Topbar({ title, onMenuClick = () => {} }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, loading, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const bellButtonRef = useRef(null);

  // Escape closes whichever dropdown is open -- neither of these two simple
  // anchored dropdowns previously had keyboard support beyond click-outside;
  // added here for both while integrating notifications, since it's the
  // same gap in both.
  useEffect(() => {
    if (!menuOpen && !notifOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen, notifOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const previewNotifications = notifications.slice(0, 5);

  return (
    <header className="relative z-30 flex h-16 items-center justify-between gap-2 border-b border-slate-100 bg-white/90 px-4 backdrop-blur-sm sm:px-6 dark:border-slate-700 dark:bg-ink-light print:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700 md:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <h1 className="truncate font-display text-lg sm:text-xl font-bold text-ink dark:text-slate-100">{title}</h1>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
        </button>

        {/* Notification bell */}
        <div className="relative">
          <button
            ref={bellButtonRef}
            onClick={() => setNotifOpen((v) => !v)}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            aria-haspopup="menu"
            aria-expanded={notifOpen}
            aria-controls="notification-preview"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            <NotificationBadge count={unreadCount} />
          </button>

          {/* aria-live region: announces new unread notifications to screen
              readers without needing the dropdown to be open. */}
          <span className="sr-only" role="status" aria-live="polite">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : ''}
          </span>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div
                id="notification-preview"
                role="menu"
                aria-label="Notification preview"
                className="fixed left-2 right-2 top-16 z-20 w-auto rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-ink-light sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80"
              >
                <NotificationList
                  notifications={previewNotifications}
                  loading={loading}
                  compact
                  onMarkRead={markAsRead}
                  onNavigate={() => setNotifOpen(false)}
                  emptyDescription="You're all caught up."
                />
                <button
                  type="button"
                  className="mt-1 block w-full rounded-md px-2 py-1.5 text-center text-xs font-medium text-brass-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                  onClick={() => {
                    setNotifOpen(false);
                    setDrawerOpen(true);
                  }}
                >
                  View all notifications
                </button>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls="user-menu"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <div className="bg-brand-gradient flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm">
              {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-200 sm:inline">{user?.fullName}</span>
            <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div role="menu" id="user-menu" className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-ink-light">
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  My Profile
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/change-password');
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Change Password
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/help');
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Help
                </button>
                <hr className="my-1 border-slate-100 dark:border-slate-700" />
                <button
                  role="menuitem"
                  onClick={handleLogout}
                  className="block w-full px-4 py-2 text-left text-sm text-denied-600 hover:bg-denied-50 dark:hover:bg-slate-700"
                >
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <NotificationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </header>
  );
}
