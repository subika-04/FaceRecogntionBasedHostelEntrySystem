export default function ReportSignature({ preparedBy }) {
  return (
    <div className="mt-10 grid grid-cols-2 gap-8 border-t border-slate-200 pt-6 text-sm dark:border-slate-700">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">Prepared By</p>
        <p className="mt-6 border-t border-slate-300 pt-1 text-slate-600 dark:text-slate-300">{preparedBy || '—'}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">Verified By</p>
        <p className="mt-6 border-t border-slate-300 pt-1 text-slate-400">&nbsp;</p>
      </div>
    </div>
  );
}
