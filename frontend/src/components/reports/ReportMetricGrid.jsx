// metrics: [{ label, value }]
export default function ReportMetricGrid({ metrics }) {
  if (!metrics || metrics.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {metrics.map((m) => (
        <div key={m.label} className="border border-slate-200 p-3 dark:border-slate-700">
          <dt className="text-xs uppercase tracking-wide text-slate-500">{m.label}</dt>
          <dd className="mt-1 font-display text-lg font-semibold text-ink dark:text-slate-100">{m.value}</dd>
        </div>
      ))}
    </dl>
  );
}
