// title: section heading, pageBreakBefore: force this section to start a new printed page
export default function ReportSection({ title, description, pageBreakBefore = false, children }) {
  const headingId = `report-section-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <section className={`py-6 ${pageBreakBefore ? 'break-before-page' : ''}`} aria-labelledby={headingId}>
      <h2 id={headingId} className="font-display text-base font-semibold text-ink dark:text-slate-100">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}
