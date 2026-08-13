import { useEffect, useState } from 'react';
import * as systemHealthApi from '../../api/systemHealthApi';

const STATUS_STYLE = {
  UP: { dot: 'bg-verified-500', text: 'text-verified-700', label: 'Operational' },
  DEGRADED: { dot: 'bg-caution-500', text: 'text-caution-700', label: 'Degraded' },
  DOWN: { dot: 'bg-denied-500', text: 'text-denied-700', label: 'Down' },
  OUT_OF_SERVICE: { dot: 'bg-denied-500', text: 'text-denied-700', label: 'Out of service' },
  UNKNOWN: { dot: 'bg-slate-300', text: 'text-slate-500', label: 'Unknown' },
};

const COMPONENTS = [
  { key: 'db', label: 'Database' },
  { key: 'aiService', label: 'AI Recognition Service' },
  { key: 'diskSpace', label: 'Disk Space' },
];

function StatusRow({ label, status }) {
  const style = STATUS_STYLE[status] || STATUS_STYLE.UNKNOWN;
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`flex items-center gap-1.5 text-xs font-medium ${style.text}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
        {style.label}
      </span>
    </div>
  );
}

/**
 * Reads /actuator/health -- specifically surfaces AiServiceHealthIndicator's
 * "aiService" component, which is the whole reason that indicator was built:
 * without it, the dashboard would have no way to show that recognition is
 * broken while the API itself is perfectly reachable.
 */
export default function SystemHealthPanel() {
  const [health, setHealth] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    systemHealthApi
      .getSystemHealth()
      .then((data) => mounted && setHealth(data))
      .catch(() => mounted && setFailed(true));
    // Poll periodically so a status change (e.g. AI service coming back up)
    // is reflected without a manual page reload.
    const interval = setInterval(() => {
      systemHealthApi.getSystemHealth().then((data) => mounted && setHealth(data)).catch(() => mounted && setFailed(true));
    }, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (failed) {
    return (
      <div className="card p-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">System status is temporarily unavailable.</p>
      </div>
    );
  }

  const overallStyle = STATUS_STYLE[health?.status] || STATUS_STYLE.UNKNOWN;

  return (
    <div className="card p-4">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-ink dark:text-slate-100">System Status</h2>
        <span className={`flex items-center gap-1.5 text-xs font-semibold ${overallStyle.text}`}>
          <span className={`h-2 w-2 rounded-full ${overallStyle.dot}`} aria-hidden="true" />
          {overallStyle.label}
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {COMPONENTS.map((c) => (
          <StatusRow key={c.key} label={c.label} status={health?.components?.[c.key]?.status} />
        ))}
      </div>
    </div>
  );
}
