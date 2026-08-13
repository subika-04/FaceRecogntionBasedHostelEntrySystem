import { useEffect, useRef, useState } from 'react';

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * "Session" here is a purely client-side, per-page-visit concept -- there is
 * no backend session entity. It exists so a warden can see how long they've
 * been actively scanning and pause without losing that context (e.g.
 * stepping away from the desk), not to track anything server-side.
 *
 * recognitionCount: bumped by the parent every time a new result comes in
 * (RecognitionPage passes this in rather than this component tracking it,
 * since the parent is what actually knows when a capture completes).
 */
export default function RecognitionSessionPanel({ recognitionCount, active, onPause, onResume, onStop }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  const handleStop = () => {
    setElapsedSeconds(0);
    onStop();
  };

  return (
    <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="flex items-center gap-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Session Time</p>
          <p className="font-id text-lg font-semibold text-ink dark:text-slate-100">{formatElapsed(elapsedSeconds)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Recognitions</p>
          <p className="font-id text-lg font-semibold text-ink dark:text-slate-100">{recognitionCount}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <span className={`h-2 w-2 rounded-full ${active ? 'bg-verified-500' : 'bg-caution-500'}`} aria-hidden="true" />
          <span className={active ? 'text-verified-700' : 'text-caution-700'}>{active ? 'Active' : 'Paused'}</span>
        </div>
      </div>
      <div className="flex gap-2">
        {active ? (
          <button type="button" className="btn-secondary text-xs" onClick={onPause}>
            Pause
          </button>
        ) : (
          <button type="button" className="btn-primary text-xs" onClick={onResume}>
            Resume
          </button>
        )}
        <button type="button" className="btn-danger text-xs" onClick={handleStop}>
          End Session
        </button>
      </div>
    </div>
  );
}
