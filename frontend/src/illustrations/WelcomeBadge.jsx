/**
 * Small accent illustration for dashboard welcome banners: an ID badge with
 * a verified checkmark. Reuses the same badge/lanyard motif as
 * AuthIllustration so the visual language stays consistent from login
 * through to the dashboard, instead of introducing a new unrelated icon.
 */
export default function WelcomeBadge({ className = 'h-14 w-14 shrink-0' }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-hidden="true">
      <rect x="10" y="6" width="44" height="52" rx="8" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
      <circle cx="32" cy="24" r="9" fill="rgba(255,255,255,0.85)" />
      <path d="M20 46c1.5-7 6-10.5 12-10.5S42.5 39 44 46" stroke="rgba(255,255,255,0.85)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <circle cx="47" cy="47" r="12" fill="#10B981" stroke="white" strokeWidth="3" />
      <path d="M41.5 47.3l3.4 3.4 7-7" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
