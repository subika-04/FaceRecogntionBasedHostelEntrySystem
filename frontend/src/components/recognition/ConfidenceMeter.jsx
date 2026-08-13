const TONE = {
  MATCHED: 'bg-verified-500',
  LOW_CONFIDENCE: 'bg-caution-500',
  UNKNOWN: 'bg-denied-500',
};

// confidence: number 0..1, status: recognition status string (for color)
export default function ConfidenceMeter({ confidence = 0, status }) {
  const pct = Math.max(0, Math.min(1, confidence || 0)) * 100;
  const barColor = TONE[status] || 'bg-slate-400';

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Confidence</span>
        <span className="font-id font-medium text-ink dark:text-slate-100">{pct.toFixed(1)}%</span>
      </div>
      <div
        className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"
        role="meter"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Recognition confidence"
      >
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
