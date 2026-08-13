export default function LoadingSpinner({ label = 'Loading…', full = false }) {
  return (
    <div
      className={
        full
          ? 'flex h-full min-h-[40vh] w-full flex-col items-center justify-center gap-3'
          : 'flex items-center justify-center gap-2 py-8'
      }
    >
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brass-500 border-t-transparent" />
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}
