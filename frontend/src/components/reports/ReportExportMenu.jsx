import { useEffect, useState } from 'react';

// onExportCsv/onExportJson/onExportPdf: () => void; any can be omitted to hide that option.
// label: button text -- lets the same menu be reused for different export
// contexts (e.g. "Export Records ▾" vs "Export Summary ▾") without a second
// menu component; this is the one export-UI implementation in the Reports
// module, reused everywhere an export action is offered.
export default function ReportExportMenu({ onExportCsv, onExportJson, onExportPdf, disabled, label = 'Export ▾' }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const items = [
    onExportCsv && { label: 'Export CSV', action: onExportCsv },
    onExportJson && { label: 'Export JSON', action: onExportJson },
    onExportPdf && { label: 'Print / Export PDF', action: onExportPdf },
  ].filter(Boolean);

  return (
    <div className="relative print:hidden">
      <button
        type="button"
        className="btn-primary text-xs"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-ink-light"
          >
            {items.map((item) => (
              <button
                key={item.label}
                role="menuitem"
                type="button"
                className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={() => {
                  setOpen(false);
                  item.action();
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
