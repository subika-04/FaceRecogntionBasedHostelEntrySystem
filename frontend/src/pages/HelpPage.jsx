import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';
import { FAQ_CATEGORIES, filterFaqByRole, searchFaq } from '../utils/faqContent';
import FaqSection from '../components/help/FaqSection';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';

export default function HelpPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  const visibleCategories = useMemo(() => {
    const byRole = filterFaqByRole(FAQ_CATEGORIES, user?.role);
    return searchFaq(byRole, query);
  }, [user?.role, query]);

  const totalQuestions = visibleCategories.reduce((sum, c) => sum + c.questions.length, 0);

  return (
    <div className="max-w-4xl space-y-4">
      <div className="card p-5">
        <h2 className="font-display text-xl font-bold text-ink dark:text-slate-100">
          How can we help?
        </h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Search common questions about students, live recognition, notifications, and more.
        </p>
        <div className="mt-3">
          <label htmlFor="faq-search" className="sr-only">
            Search help articles
          </label>
          <input
            id="faq-search"
            type="search"
            className="input w-full max-w-md"
            placeholder={'Search help topics\u2026'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {query.trim() && (
        <p className="px-1 text-xs text-slate-400">
          {totalQuestions} result{totalQuestions === 1 ? '' : 's'} for {'\u201c'}
          {query}
          {'\u201d'}
        </p>
      )}

      {visibleCategories.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No results"
            description="Try a different search term, or browse all topics below."
            action={
              <Button variant="secondary" onClick={() => setQuery('')}>
                Clear search
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {visibleCategories.map((category) => (
            <FaqSection key={category.id} category={category} />
          ))}
        </div>
      )}

      <div className="card p-5">
        <h3 className="font-display text-sm font-semibold text-ink dark:text-slate-100">
          Still need help?
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {user?.role === ROLES.ADMIN
            ? 'For issues not covered here, check the project README for setup and configuration details, or review System Settings for the values currently in effect.'
            : 'For anything not covered here, contact your system administrator \u2014 they can check account, camera, or threshold settings on your behalf.'}
        </p>
        <p className="mt-3">
          <Link to="/about" className="text-sm font-medium text-brass-600 hover:underline">
            About this system {'\u2192'}
          </Link>
        </p>
      </div>
    </div>
  );
}
