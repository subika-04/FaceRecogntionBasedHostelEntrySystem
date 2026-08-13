import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { formatRelativeTime, formatDateTime } from '../../utils/formatters';

const SEVERITY_STYLE = {
  info: { dot: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-300' },
  success: { dot: 'bg-verified-500', text: 'text-verified-700' },
  warning: { dot: 'bg-caution-500', text: 'text-caution-700' },
  error: { dot: 'bg-denied-500', text: 'text-denied-700' },
};

const SEVERITY_ICON = {
  info: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 9v4.5M10 6.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 10l2.3 2.3L14 7.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M10 3.5l7.5 13H2.5l7.5-13z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 8.5v3M10 14h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.5 7.5l5 5M12.5 7.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

export default function NotificationCard({ notification, compact = false, onMarkRead, onMarkUnread, onDismiss, onNavigate }) {
  const [expanded, setExpanded] = useState(false);
  const style = SEVERITY_STYLE[notification.severity] || SEVERITY_STYLE.info;

  const content = (
    <div className="flex items-start gap-2">
      <span className={style.text} aria-hidden="true">{SEVERITY_ICON[notification.severity] || SEVERITY_ICON.info}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {!notification.read && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />}
          <p className={`truncate text-sm ${notification.read ? 'text-slate-500 dark:text-slate-400' : 'font-medium text-ink dark:text-slate-100'}`}>
            {notification.title}
          </p>
        </div>
        <p className="truncate text-xs text-slate-400">{notification.source} · {formatRelativeTime(notification.timestamp)}</p>
      </div>
    </div>
  );

  if (compact) {
    return (
      <div className="rounded-md px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/40">
        {notification.actionUrl ? (
          <Link to={notification.actionUrl} onClick={() => { onMarkRead?.(notification.id); onNavigate?.(); }}>
            {content}
          </Link>
        ) : (
          <button type="button" className="w-full text-left" onClick={() => onMarkRead?.(notification.id)}>
            {content}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`card p-3 ${notification.read ? 'opacity-70' : ''}`}>
      <button
        type="button"
        className="flex w-full items-start justify-between gap-2 text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {content}
        <span className="shrink-0 text-slate-300" aria-hidden="true">
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 border-t border-slate-100 pt-2 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-300">{notification.description}</p>
          <p className="font-id text-xs text-slate-400">{formatDateTime(notification.timestamp)}</p>
          <div className="flex flex-wrap gap-3 text-xs">
            {notification.actionUrl && (
              <Link to={notification.actionUrl} className="font-medium text-brass-600 hover:underline" onClick={onNavigate}>
                View details
              </Link>
            )}
            {!notification.read && onMarkRead && (
              <button type="button" className="text-slate-500 hover:underline" onClick={() => onMarkRead(notification.id)}>
                Mark as read
              </button>
            )}
            {notification.read && onMarkUnread && (
              <button type="button" className="text-slate-500 hover:underline" onClick={() => onMarkUnread(notification.id)}>
                Mark as unread
              </button>
            )}
            {onDismiss && (
              <button type="button" className="text-denied-600 hover:underline" onClick={() => onDismiss(notification.id)}>
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
