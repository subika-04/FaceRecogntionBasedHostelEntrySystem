/**
 * Recharts (and raw SVG, for the Heatmap) take literal color values, not
 * Tailwind classes -- so chart color is one place the "Access Ledger"
 * design system's token migration can silently miss, since a repo-wide
 * search for `bg-brand-*`/`text-brand-*` class names won't catch a raw hex
 * string passed to a `stroke`/`fill` prop. This file is the single place
 * those literal values live, so no chart hardcodes its own copy.
 */
export const CHART_COLORS = {
  primary: '#4F46E5', // brass-500 (indigo)
  primaryDark: '#3730A3', // brass-700
  accent: '#EC4899', // accent-500 (pink, gradient end)
  verified: '#10B981', // verified-500
  caution: '#F59E0B', // caution-500
  denied: '#EF4444', // denied-500
  ink: '#1E1B4B',
  axis: '#9B98C4', // slate-400
  grid: '#EEEDF9', // slate-100
};

export const CHART_MARGIN = { top: 8, right: 16, left: -16, bottom: 0 };
