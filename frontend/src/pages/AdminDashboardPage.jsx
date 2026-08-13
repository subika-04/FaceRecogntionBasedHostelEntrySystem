import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScanFace, UserPlus, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import * as analyticsApi from '../api/analyticsApi';
import { useAuth } from '../context/AuthContext';
import SummaryCards from '../components/analytics/SummaryCards';
import TrendChart from '../components/analytics/TrendChart';
import PeakHoursChart from '../components/analytics/PeakHoursChart';
import TopCamerasChart from '../components/analytics/TopCamerasChart';
import HistoryTable from '../components/recognition/HistoryTable';
import SystemHealthPanel from '../components/dashboard/SystemHealthPanel';
import { SkeletonCard, SkeletonTable } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorMessage, { extractErrorMessage } from '../components/common/ErrorMessage';
import WelcomeBadge from '../illustrations/WelcomeBadge';
import { TREND_RANGES } from '../utils/constants';

const QUICK_ACTIONS = [
  { to: '/recognition/live', title: 'Live Recognition', desc: 'Verify a student at the gate camera', icon: ScanFace, tint: 'bg-brass-50 text-brass-600' },
  { to: '/students/new', title: 'Register Student', desc: 'Add a new student and start enrollment', icon: UserPlus, tint: 'bg-verified-50 text-verified-600' },
  { to: '/users', title: 'Manage Accounts', desc: 'Add or update staff and admin accounts', icon: ShieldCheck, tint: 'bg-accent-500/10 text-accent-600' },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [topCameras, setTopCameras] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [range, setRange] = useState('DAILY');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAll = async (selectedRange = range) => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, trendsRes, peakRes, camerasRes, activityRes] = await Promise.all([
        analyticsApi.getSummary(),
        analyticsApi.getTrends(selectedRange),
        analyticsApi.getPeakHours(),
        analyticsApi.getTopCameras(5),
        analyticsApi.getRecentActivity(8),
      ]);
      setSummary(summaryRes);
      setTrends(trendsRes);
      setPeakHours(peakRes);
      setTopCameras(camerasRes);
      setRecentActivity(activityRes);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load dashboard analytics.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRangeChange = (r) => {
    setRange(r);
    analyticsApi
      .getTrends(r)
      .then(setTrends)
      .catch((err) => setError(extractErrorMessage(err)));
  };

  return (
    <div className="space-y-6">
      <div className="bg-brand-gradient relative flex items-center gap-4 overflow-hidden rounded-2xl p-5 shadow-glow sm:p-6">
        <Sparkles className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 text-white/10" strokeWidth={1} aria-hidden="true" />
        <WelcomeBadge />
        <div className="relative min-w-0">
          <h1 className="font-display text-xl font-bold text-white sm:text-2xl">
            Welcome back, {user?.fullName?.split(' ')[0]}
          </h1>
          <p className="mt-0.5 text-sm text-indigo-100">Here's the state of the hostel entry system today.</p>
        </div>
      </div>

      <ErrorMessage message={error} onRetry={() => loadAll()} />

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <SummaryCards summary={summary} />
          )}
        </div>
        <SystemHealthPanel />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.to} to={action.to} className="card group flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-glow">
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-ink dark:text-slate-100">Recognition Trends</h2>
            <div className="flex gap-1 text-xs">
              {TREND_RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => handleRangeChange(r)}
                  className={`rounded-md px-2 py-1 font-medium ${
                    range === r ? 'bg-brand-gradient text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          {loading ? <SkeletonCard /> : <TrendChart data={trends} />}
        </div>

        <div className="card p-4">
          <h2 className="mb-2 font-display text-sm font-semibold text-ink dark:text-slate-100">Top Cameras</h2>
          {loading ? <SkeletonCard /> : <TopCamerasChart data={topCameras} />}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-1">
          <h2 className="mb-2 font-display text-sm font-semibold text-ink dark:text-slate-100">Peak Entry Hours</h2>
          {loading ? <SkeletonCard /> : <PeakHoursChart data={peakHours} />}
        </div>

        <div className="card p-4 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-ink dark:text-slate-100">Recent Activity</h2>
            <Link to="/recognition/history" className="text-xs font-medium text-brass-600 hover:underline">
              View all history →
            </Link>
          </div>
          {loading ? (
            <SkeletonTable rows={4} columns={4} />
          ) : recentActivity?.length ? (
            <HistoryTable records={recentActivity} />
          ) : (
            <EmptyState title="No recognition activity yet" description="Entries will appear here as staff verify students at the gate." />
          )}
        </div>
      </div>
    </div>
  );
}
