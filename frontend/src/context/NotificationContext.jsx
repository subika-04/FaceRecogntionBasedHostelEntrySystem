import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { ROLES } from '../utils/constants';
import { recognitionNotificationAdapter } from '../adapters/recognitionNotificationAdapter';
import { systemHealthNotificationAdapter } from '../adapters/systemHealthNotificationAdapter';
import { securityNotificationAdapter } from '../adapters/securityNotificationAdapter';
import { enrollmentNotificationAdapter } from '../adapters/enrollmentNotificationAdapter';

const NotificationContext = createContext(null);

const POLL_INTERVAL_MS = 30000; // matches SystemHealthPanel's existing cadence
const READ_STORAGE_KEY = 'frhes-notifications-read';
const DISMISSED_STORAGE_KEY = 'frhes-notifications-dismissed';

function loadIdSet(key) {
  try {
    const raw = localStorage.getItem(key);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveIdSet(key, set) {
  localStorage.setItem(key, JSON.stringify(Array.from(set)));
}

export function NotificationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [rawNotifications, setRawNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => loadIdSet(READ_STORAGE_KEY));
  const [dismissedIds, setDismissedIds] = useState(() => loadIdSet(DISMISSED_STORAGE_KEY));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchingRef = useRef(false);
  const intervalRef = useRef(null);

  const poll = useCallback(async () => {
    if (fetchingRef.current || document.hidden) return;
    fetchingRef.current = true;
    try {
      const adapters = [recognitionNotificationAdapter, systemHealthNotificationAdapter, enrollmentNotificationAdapter];
      if (user?.role === ROLES.ADMIN) adapters.push(securityNotificationAdapter);

      const results = await Promise.allSettled(adapters.map((fn) => fn()));
      const merged = results.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value);

      const byId = new Map(merged.map((n) => [n.id, n]));
      setRawNotifications(Array.from(byId.values()));
      setError(null);
    } catch {
      setError('Failed to load notifications.');
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      setRawNotifications([]);
      setLoading(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return undefined;
    }

    setLoading(true);
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (!document.hidden) poll();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, poll]);

  const notifications = useMemo(() => {
    return rawNotifications
      .filter((n) => !dismissedIds.has(n.id))
      .map((n) => ({ ...n, read: readIds.has(n.id) }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [rawNotifications, readIds, dismissedIds]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const markAsRead = useCallback((id) => {
    setReadIds((prev) => {
      const next = new Set(prev).add(id);
      saveIdSet(READ_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const markAsUnread = useCallback((id) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      saveIdSet(READ_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIds(() => {
      const next = new Set(notifications.map((n) => n.id));
      saveIdSet(READ_STORAGE_KEY, next);
      return next;
    });
  }, [notifications]);

  const dismiss = useCallback((id) => {
    setDismissedIds((prev) => {
      const next = new Set(prev).add(id);
      saveIdSet(DISMISSED_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const clearRead = useCallback(() => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => {
        if (n.read) next.add(n.id);
      });
      saveIdSet(DISMISSED_STORAGE_KEY, next);
      return next;
    });
  }, [notifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    dismiss,
    clearRead,
    refresh: poll,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
}
