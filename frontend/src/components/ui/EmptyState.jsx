import EmptyStateIllustration from '../../illustrations/EmptyStateIllustration';

/**
 * "An empty screen is an invitation to act, not a mood" -- every empty state
 * in the app should say plainly what's missing and offer the one action
 * that would fix it (via `action`), not just report absence.
 */
export default function EmptyState({ title, description, action, illustration: Illustration = EmptyStateIllustration }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center sm:px-6 sm:py-16">
      <Illustration />
      <h3 className="mt-6 font-display text-lg font-semibold text-ink dark:text-slate-100">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
