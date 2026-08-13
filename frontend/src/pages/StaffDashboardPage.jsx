import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScanFace, UserPlus, Search, ArrowRight, Sparkles } from 'lucide-react';
import * as recognitionApi from '../api/recognitionApi';
import { useAuth } from '../context/AuthContext';
import HistoryTable from '../components/recognition/HistoryTable';
import { SkeletonTable } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorMessage, { extractErrorMessage } from '../components/common/ErrorMessage';
import WelcomeBadge from '../illustrations/WelcomeBadge';

const QUICK_ACTIONS = [
  { to: '/recognition/live', title: 'Live Recognition', desc: 'Identify a student at the gate camera', icon: ScanFace, tint: 'bg-brass-50 text-brass-600' },
  { to: '/students/new', title: 'Register Student', desc: 'Add a new student and start enrollment', icon: UserPlus, tint: 'bg-verified-50 text-verified-600' },
  { to: '/students', title: 'Search Students', desc: 'Find a student by name or register number', icon: Search, tint: 'bg-accent-500/10 text-accent-600' },
];

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Backend forces this to the requesting staff user's own records
      // regardless of triggeredById, so we don't need to pass it explicitly.
      const data = await recognitionApi.getRecognitionHistory({
        page: 0,
        size: 8,
        sortBy: 'recognizedAt',
        sortDir: 'desc',
      });
      setHistory(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load your recent activity.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-brand-gradient relative flex items-center gap-4 overflow-hidden rounded-2xl p-5 shadow-glow sm:p-6">
        <Sparkles className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 text-white/10" strokeWidth={1} aria-hidden="true" />
        <WelcomeBadge />
        <div className="relative min-w-0">
          <h1 className="font-display text-xl font-bold text-white sm:text-2xl">
            Welcome back, {user?.fullName?.split(' ')[0]}
          </h1>
          <p className="mt-0.5 text-sm text-indigo-100">
            Here's what's happening at the front desk today.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.to}
              to={action.to}
              className="card group flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-glow"
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${action.tint}`} aria-hidden="true">
                <Icon className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-semibold text-ink dark:text-slate-100">{action.title}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{action.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brass-500" aria-hidden="true" />
            </Link>
          );
        })}
      </div>

      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-ink dark:text-slate-100">Your Recent Recognition Activity</h2>
          <Link to="/recognition/history" className="text-xs font-medium text-brass-600 hover:underline">
            View all →
          </Link>
        </div>
        <ErrorMessage message={error} onRetry={load} />
        {loading ? (
          <SkeletonTable rows={5} columns={4} />
        ) : history?.content?.length ? (
          <HistoryTable records={history.content} />
        ) : (
          <EmptyState
            title="No recognition activity yet"
            description="Once you verify a student at the gate camera, their entry will show up here."
            action={
              <Link to="/recognition/live" className="btn-primary">
                Go to Live Recognition
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
