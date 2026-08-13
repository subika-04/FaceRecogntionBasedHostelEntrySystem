# FRHES Design System — "Access Ledger"

## Why this direction
FRHES is not a consumer SaaS product — it's operational security infrastructure
used by hostel wardens and admin staff to verify identity at an entry point and
keep access records. The audience glances at this screen while someone is
physically walking through a door; the design needs calm authority and
instant legibility, not startup cheerfulness.

Rejected on purpose: warm cream + terracotta serif (too editorial/soft for a
security tool, and the terracotta near #D97757 reads as an AI-generated
default), near-black + acid-green (surveillance-dystopia cliché), broadsheet
newspaper layout (wrong metaphor for this domain).

Chosen instead: an identity built from artifacts this domain actually uses —
ID badges, gate registers, checkpoint displays, campus signage.

## Palette
| Token | Hex | Use |
|---|---|---|
| `ink` | `#14213D` | Primary structural color — sidebar, headings, body text |
| `paper` | `#F5F3EE` | Page background |
| `brass-500` | `#B8862E` | Primary action color, the one signature accent (ID-badge gold) |
| `verified-500` | `#1E6B4E` | MATCHED / success — functional status color, not decoration |
| `caution-500` | `#B5560C` | LOW_CONFIDENCE |
| `denied-500` | `#A32C1F` | UNKNOWN / destructive actions |
| `slate-500` | `#647482` | Secondary text |

## Type
- **Display** (`font-display`): Space Grotesk — geometric, technical, gives
  headings control-room precision without being cold.
- **Body** (`font-sans`): Inter — high legibility for data-dense tables.
- **Utility** (`font-mono` / `.font-id`): IBM Plex Mono — used specifically
  for register numbers, timestamps, and camera/device IDs, where fixed-width
  digits genuinely help scanning and comparing values. Not decorative.

## Layout
Standard enterprise shell (sidebar + topbar) for data screens — deliberately
*not* a place to take a risk, since staff need to navigate many pages of
tabular data quickly and a sidebar is what they already expect.

## The signature element: the scan-line sweep
The one place this design spends its "boldness budget" (`ScanFrame.jsx`): a
slow, thin brass line sweeping down the camera viewport during face capture
and verification. This is a literal reference to what the system is actually
doing (scanning a face embedding) — not decoration borrowed from a sci-fi
aesthetic. It appears only during active recognition/enrollment capture, and
respects `prefers-reduced-motion` (falls back to a static line).

Recognition **results** use a full-width color band (verified/caution/denied)
with the student's photo and name in large type — like a badge reader
turning green or red, legible from a few feet away.

## Quality floor (non-negotiable, not a place to cut corners)
- Responsive down to mobile.
- Visible keyboard focus on every interactive element (`:focus-visible` in
  `index.css`, using the brass accent).
- `prefers-reduced-motion` respected globally.

## Migration status
See `AUDIT_AND_PROGRESS.md` for which pages have been migrated to this system
vs. still using the prior generic blue palette (kept as a `brand-*` alias
onto the same brass values, so nothing breaks visually mid-migration).
