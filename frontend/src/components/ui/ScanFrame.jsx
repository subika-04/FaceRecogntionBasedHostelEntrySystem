/**
 * Wraps a camera viewport (or any content) with a thin brass scan-line that
 * sweeps top-to-bottom while `active` is true -- a literal reference to the
 * face-embedding scan actually happening, not a decorative effect borrowed
 * from a sci-fi aesthetic. See DESIGN_SYSTEM.md.
 *
 * Respects prefers-reduced-motion globally (see index.css) by freezing the
 * animation to a single frame rather than disabling the indicator entirely
 * -- staff still get a visual cue that capture is in progress.
 */
export default function ScanFrame({ active = false, children, className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 ${active ? 'border-brass-500' : 'border-slate-200'} ${className}`}>
      {children}
      {active && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-0 right-0 h-[3px] animate-scan-sweep bg-gradient-to-r from-transparent via-brass-500 to-transparent shadow-[0_0_12px_2px_rgba(79,70,229,0.7)]" />
        </div>
      )}
    </div>
  );
}
