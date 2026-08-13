/**
 * A single reusable error-state illustration: a badge reader with a paused/
 * disconnected signal, not a generic "broken robot" -- ties to the actual
 * failure modes this app has (camera unavailable, recognition service down).
 */
export default function ErrorIllustration({ className = 'w-40 h-40 mx-auto' }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-hidden="true">
      <rect x="55" y="35" width="90" height="120" rx="14" fill="#FFFFFF" stroke="#DEDCF3" strokeWidth="2" />
      <circle cx="100" cy="80" r="24" fill="#F6F5FD" stroke="#DEDCF3" strokeWidth="2" />
      <circle cx="100" cy="73" r="9" fill="#DEDCF3" />
      <path d="M84 96 a16 12 0 0 1 32 0" fill="#DEDCF3" />

      <rect x="70" y="118" width="60" height="7" rx="3.5" fill="#EEEDF9" />
      <rect x="80" y="132" width="40" height="6" rx="3" fill="#EEEDF9" />

      {/* Disconnected signal marker */}
      <circle cx="146" cy="56" r="20" fill="#FEF2F2" stroke="#EF4444" strokeWidth="2" />
      <path d="M138 48 l16 16 M154 48 l-16 16" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
