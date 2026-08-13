import { useState } from 'react';

// One question/answer disclosure. Mirrors the expand/collapse button pattern
// already used by RecognitionEventCard (aria-expanded + chevron), rather
// than introducing a second convention for the same interaction.
export default function FaqItem({ id, question, answer, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `faq-panel-${id}`;

  return (
    <div className="border-b border-slate-100 py-2 last:border-b-0 dark:border-slate-700">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm font-medium text-ink hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700/40"
      >
        <span>{question}</span>
        <span className="shrink-0 text-slate-300" aria-hidden="true">{open ? '\u25B2' : '\u25BC'}</span>
      </button>
      {open && (
        <div id={panelId} className="px-2 pb-2 pt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {answer}
        </div>
      )}
    </div>
  );
}
