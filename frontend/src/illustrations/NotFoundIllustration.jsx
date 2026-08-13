/**
 * 404 illustration: a badge reader displaying a blank/unrecognized card slot
 * with a wayfinding signpost -- ties to the "gate register / checkpoint
 * signage" visual language in DESIGN_SYSTEM.md rather than a generic
 * "lost astronaut" cliché.
 */
export default function NotFoundIllustration({ className = 'w-40 h-40 mx-auto' }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-hidden="true">
      <rect x="45" y="40" width="90" height="120" rx="14" fill="#FFFFFF" stroke="#DEDCF3" strokeWidth="2" />
      {/* Empty card slot */}
      <rect x="63" y="62" width="54" height="34" rx="4" fill="#F6F5FD" stroke="#DEDCF3" strokeWidth="2" strokeDasharray="4 4" />
      <path d="M78 79h24" stroke="#9B98C4" strokeWidth="2.5" strokeLinecap="round" />

      <rect x="63" y="110" width="54" height="6" rx="3" fill="#EEEDF9" />
      <rect x="63" y="122" width="36" height="6" rx="3" fill="#EEEDF9" />

      {/* Signpost pointing away, "?" where the destination should be */}
      <path d="M150 150V96" stroke="#9B98C4" strokeWidth="4" strokeLinecap="round" />
      <path d="M150 100 h32 l-8 12 8 12 h-32 z" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2" strokeLinejoin="round" />
      <text x="163" y="116" textAnchor="middle" fontSize="14" fontWeight="700" fill="#4F46E5" fontFamily="'Sora', sans-serif">?</text>
      <circle cx="150" cy="160" r="5" fill="#DEDCF3" />
    </svg>
  );
}
