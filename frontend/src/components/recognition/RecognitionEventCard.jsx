import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import StudentAvatar from '../students/StudentAvatar';
import StatusBadge from '../common/StatusBadge';
import ConfidenceMeter from './ConfidenceMeter';
import { formatDateTime, formatConfidence } from '../../utils/formatters';

// record: RecognitionHistoryResponse
// compact: renders a smaller row (used by RecognitionLiveFeed's scrolling list)
//          instead of the full expandable card (used by RecognitionTimeline).
export default function RecognitionEventCard({ record, compact = false }) {
  const [expanded, setExpanded] = useState(false);

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/40">
        <StudentAvatar profileImageUrl={record.student?.profileImageUrl} name={record.student?.fullName} size={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink dark:text-slate-100">
            {record.student?.fullName || 'Unrecognized'}
          </p>
          <p className="font-id text-xs text-slate-400">{formatDateTime(record.recognizedAt)} · {record.recognizedByCamera}</p>
        </div>
        <StatusBadge value={record.status} />
      </div>
    );
  }

  return (
    <div className="card p-4">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 text-left"
        aria-expanded={expanded}
      >
        <StudentAvatar profileImageUrl={record.student?.profileImageUrl} name={record.student?.fullName} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink dark:text-slate-100">
            {record.student?.fullName || 'Unrecognized face'}
          </p>
          <p className="font-id text-xs text-slate-400">{formatDateTime(record.recognizedAt)}</p>
        </div>
        <StatusBadge value={record.status} />
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-300 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-slate-100 pt-3 dark:border-slate-700">
          <ConfidenceMeter confidence={record.confidence} status={record.status} />
          <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-slate-400">Register No.</dt>
              <dd className="font-id text-slate-600 dark:text-slate-300">{record.student?.registerNumber || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Camera</dt>
              <dd className="font-id text-slate-600 dark:text-slate-300">{record.recognizedByCamera}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Duration</dt>
              <dd className="font-id text-slate-600 dark:text-slate-300">{record.recognitionDurationMs ?? '—'} ms</dd>
            </div>
            <div>
              <dt className="text-slate-400">Confidence</dt>
              <dd className="font-id text-slate-600 dark:text-slate-300">{formatConfidence(record.confidence)}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
