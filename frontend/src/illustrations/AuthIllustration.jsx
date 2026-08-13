export default function AuthIllustration({ className = 'w-full h-auto' }) {
  return (
    <svg viewBox="0 0 320 360" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="An ID badge being verified">
      {/* Lanyard */}
      <path d="M150 0 L150 40 M170 0 L170 40" stroke="#9B98C4" strokeWidth="6" strokeLinecap="round" />
      <rect x="140" y="34" width="40" height="16" rx="6" fill="#6E6A9E" />

      {/* Badge card */}
      <rect x="40" y="48" width="240" height="300" rx="20" fill="#FFFFFF" stroke="#DEDCF3" strokeWidth="2" />
      <defs>
        <linearGradient id="authHeaderGrad" x1="40" y1="48" x2="280" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="55%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <rect x="40" y="48" width="240" height="64" rx="20" fill="url(#authHeaderGrad)" />
      <rect x="40" y="92" width="240" height="20" fill="url(#authHeaderGrad)" />

      {/* Header text lines (institution name placeholder) */}
      <rect x="64" y="68" width="110" height="10" rx="5" fill="#F6F5FD" opacity="0.9" />
      <rect x="64" y="84" width="70" height="7" rx="3.5" fill="#4F46E5" opacity="0.9" />

      {/* Photo circle */}
      <circle cx="160" cy="185" r="52" fill="#F6F5FD" stroke="#DEDCF3" strokeWidth="2" />
      <circle cx="160" cy="170" r="20" fill="#DEDCF3" />
      <path d="M118 224 a42 30 0 0 1 84 0" fill="#DEDCF3" />

      {/* Field lines (name / register no. placeholders) */}
      <rect x="76" y="252" width="168" height="10" rx="5" fill="#EEEDF9" />
      <rect x="76" y="270" width="120" height="8" rx="4" fill="#EEEDF9" />
      <rect x="76" y="286" width="90" height="8" rx="4" fill="#EEEDF9" />

      {/* Verified check badge */}
      <circle cx="234" cy="272" r="26" fill="#10B981" stroke="#FFFFFF" strokeWidth="4" />
      <path d="M223 272 l8 8 l16 -16" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Scan-line sweep (static in this illustration; the live camera view
          uses the animated version via ScanFrame.jsx) */}
      <rect x="40" y="160" width="240" height="3" rx="1.5" fill="#4F46E5" opacity="0.55" />
    </svg>
  );
}
