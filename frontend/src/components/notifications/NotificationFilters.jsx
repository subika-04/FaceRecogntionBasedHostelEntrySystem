import { NOTIFICATION_SEVERITY, NOTIFICATION_SOURCES } from '../../utils/normalizeNotification';

// values: { source, severity, unreadOnly }, onChange: (patch) => void
export default function NotificationFilters({ values, onChange }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <select
          className="input py-1.5 text-xs"
          aria-label="Filter by source"
          value={values.source}
          onChange={(e) => onChange({ source: e.target.value })}
        >
          <option value="">All sources</option>
          {Object.values(NOTIFICATION_SOURCES).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className="input py-1.5 text-xs"
          aria-label="Filter by severity"
          value={values.severity}
          onChange={(e) => onChange({ severity: e.target.value })}
        >
          <option value="">All severities</option>
          {Object.values(NOTIFICATION_SEVERITY).map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          checked={values.unreadOnly}
          onChange={(e) => onChange({ unreadOnly: e.target.checked })}
        />
        Unread only
      </label>
    </div>
  );
}
