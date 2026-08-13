/**
 * Access-restricted illustration: a badge reader showing a denied swipe
 * (red band, locked card) -- reuses the same "badge reader turning red"
 * metaphor the app already uses for UNKNOWN/denied recognition results in
 * RecognitionResultBand, so a permissions error reads as a natural extension
 * of the same visual system rather than a new generic "padlock" cliché.
 */
export default function RestrictedIllustration({ className = 'w-40 h-40 mx-auto' }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-hidden="true">
      <rect x="45" y="40" width="110" height="120" rx="14" fill="#FFFFFF" stroke="#DEDCF3" strokeWidth="2" />
      {/* Denied result band, like the in-app recognition result band */}
      <rect x="45" y="40" width="110" height="34" rx="14" fill="#FEF2F2" />
      <rect x="45" y="60" width="110" height="14" fill="#FEF2F2" />
      <text x="100" y="62" textAnchor="middle" fontSize="11" fontWeight="700" fill="#EF4444" fontFamily="'Sora', sans-serif" letterSpacing="1">
        ACCESS DENIED
      </text>

      {/* Locked ID card */}
      <rect x="72" y="90" width="56" height="40" rx="6" fill="#F6F5FD" stroke="#DEDCF3" strokeWidth="2" />
      <circle cx="100" cy="103" r="8" fill="#EF4444" />
      <rect x="97" y="103" width="6" height="10" rx="2" fill="#EF4444" />
      <path d="M94 103v-5a6 6 0 0112 0v5" stroke="#EF4444" strokeWidth="2.5" fill="none" />

      <rect x="72" y="140" width="56" height="6" rx="3" fill="#EEEDF9" />
    </svg>
  );
}
