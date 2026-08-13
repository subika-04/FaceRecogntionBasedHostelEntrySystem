/**
 * A single reusable empty-state illustration: an open ledger/register with
 * nothing entered yet. Deliberately calm rather than "sad" (no droopy faces,
 * no crying icons) -- an empty screen is an invitation to act, not a mood.
 */
export default function EmptyStateIllustration({ className = 'w-40 h-40 mx-auto' }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-hidden="true">
      <rect x="30" y="40" width="140" height="130" rx="10" fill="#FFFFFF" stroke="#DEDCF3" strokeWidth="2" />
      <line x1="100" y1="40" x2="100" y2="170" stroke="#DEDCF3" strokeWidth="2" />

      {/* Left page ruled lines */}
      <line x1="46" y1="66" x2="90" y2="66" stroke="#EEEDF9" strokeWidth="4" strokeLinecap="round" />
      <line x1="46" y1="82" x2="84" y2="82" stroke="#EEEDF9" strokeWidth="4" strokeLinecap="round" />
      <line x1="46" y1="98" x2="90" y2="98" stroke="#EEEDF9" strokeWidth="4" strokeLinecap="round" />

      {/* Right page ruled lines */}
      <line x1="110" y1="66" x2="154" y2="66" stroke="#EEEDF9" strokeWidth="4" strokeLinecap="round" />
      <line x1="110" y1="82" x2="148" y2="82" stroke="#EEEDF9" strokeWidth="4" strokeLinecap="round" />
      <line x1="110" y1="98" x2="154" y2="98" stroke="#EEEDF9" strokeWidth="4" strokeLinecap="round" />

      {/* A single brass "+" marker inviting the next entry */}
      <circle cx="100" cy="140" r="18" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2" />
      <path d="M100 132 v16 M92 140 h16" stroke="#4F46E5" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
