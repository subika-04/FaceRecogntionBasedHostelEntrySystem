export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirming,
  confirmLabel = 'Delete',
  confirmingLabel = 'Deleting…',
  variant = 'danger',
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-ink-light">
        <h3 className="text-base font-semibold text-ink dark:text-slate-100">{title}</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={confirming} className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}>
            {confirming ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
