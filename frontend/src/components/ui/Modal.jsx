import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Minimal modal shell: overlay + centered card + Escape-to-close + focus
 * trap is intentionally NOT implemented here (would need a dedicated focus-
 * trap utility to do properly) -- for now, Escape-to-close and a labelled
 * dialog role cover the most common accessibility need. Revisit if this
 * pattern spreads to more than the two forms currently using it.
 */
export default function Modal({ open, title, onClose, children, widthClassName = 'max-w-md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full rounded-2xl bg-white p-6 shadow-xl dark:bg-ink-light ${widthClassName}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-ink dark:text-slate-100">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
