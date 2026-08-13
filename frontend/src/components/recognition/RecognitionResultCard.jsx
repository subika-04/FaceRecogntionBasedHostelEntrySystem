import StudentAvatar from '../students/StudentAvatar';
import ConfidenceMeter from './ConfidenceMeter';
import { formatConfidence } from '../../utils/formatters';

// Full-width color band by status -- like a badge reader turning green or
// red, meant to be legible from a few feet away while someone walks through
// a door. This is the one place status color carries the entire message,
// so it intentionally does not rely on the smaller StatusBadge dot alone.
const BAND_STYLE = {
  MATCHED: { band: 'bg-verified-500', text: 'text-white', label: 'Access verified' },
  LOW_CONFIDENCE: { band: 'bg-caution-500', text: 'text-white', label: 'Low confidence match' },
  UNKNOWN: { band: 'bg-denied-500', text: 'text-white', label: 'Not recognized' },
};

// result: RecognitionResponse | null
export default function RecognitionResultCard({ result }) {
  if (!result) {
    return (
      <div className="card flex h-full min-h-[220px] flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">Capture a frame to see the verification result here.</p>
      </div>
    );
  }

  const style = BAND_STYLE[result.status] || BAND_STYLE.UNKNOWN;

  return (
    <div className="card overflow-hidden">
      <div className={`flex items-center justify-between px-6 py-3 ${style.band} ${style.text}`}>
        <span className="font-display text-sm font-semibold uppercase tracking-wide">{style.label}</span>
        <span className="font-id text-xs opacity-90">{formatConfidence(result.confidence)}</span>
      </div>

      <div className="p-6">
        {result.student ? (
          <div className="flex items-center gap-4">
            <div className={`rounded-2xl p-1 ${result.status === 'MATCHED' ? 'bg-verified-100' : 'bg-caution-100'}`}>
              <StudentAvatar profileImageUrl={result.student.profileImageUrl} name={result.student.fullName} size={84} />
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-bold text-ink dark:text-slate-100">{result.student.fullName}</p>
              <p className="font-id mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {result.student.registerNumber} · {result.student.department}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">No matching student was identified for this frame.</p>
        )}

        <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-700">
          <ConfidenceMeter confidence={result.confidence} status={result.status} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Confidence</p>
            <p className="font-id font-medium text-slate-700 dark:text-slate-300">{formatConfidence(result.confidence)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Duration</p>
            <p className="font-id font-medium text-slate-700 dark:text-slate-300">{result.recognitionDurationMs ?? '—'} ms</p>
          </div>
        </div>
      </div>
    </div>
  );
}
