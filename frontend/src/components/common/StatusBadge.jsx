import { titleCase } from '../../utils/formatters';

// Status colors are functional content in this app (a warden glances at
// this to decide whether to let someone through), so they're defined once
// here against the design system's semantic tokens (verified/caution/denied)
// rather than picked ad-hoc per screen.
const STYLES = {
  // Recognition statuses
  MATCHED: 'bg-verified-50 text-verified-700',
  UNKNOWN: 'bg-slate-200 text-slate-700',
  LOW_CONFIDENCE: 'bg-caution-50 text-caution-700',
  // Enrollment statuses
  ENROLLED: 'bg-verified-50 text-verified-700',
  PENDING: 'bg-caution-50 text-caution-700',
  FAILED: 'bg-denied-50 text-denied-700',
  // User statuses
  ACTIVE: 'bg-verified-50 text-verified-700',
  INACTIVE: 'bg-slate-200 text-slate-700',
};

const DOT_STYLES = {
  MATCHED: 'bg-verified-500',
  UNKNOWN: 'bg-slate-400',
  LOW_CONFIDENCE: 'bg-caution-500',
  ENROLLED: 'bg-verified-500',
  PENDING: 'bg-caution-500',
  FAILED: 'bg-denied-500',
  ACTIVE: 'bg-verified-500',
  INACTIVE: 'bg-slate-400',
};

export default function StatusBadge({ value }) {
  if (!value) return <span className="badge bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">—</span>;
  const style = STYLES[value] || 'bg-slate-100 text-slate-600';
  const dot = DOT_STYLES[value] || 'bg-slate-400';
  return (
    <span className={`badge ${style}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {titleCase(value)}
    </span>
  );
}
