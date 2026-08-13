import { Users, UserCheck, UserX, ScanLine, CheckCircle2, HelpCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { formatPercent } from '../../utils/formatters';

const ICONS = {
  students: Users,
  enrolled: UserCheck,
  pending: UserX,
  attempts: ScanLine,
  matched: CheckCircle2,
  unknown: HelpCircle,
  low: AlertTriangle,
  rate: TrendingUp,
};

const TONE_STYLE = {
  default: { chip: 'bg-brass-50 text-brass-600', value: 'text-ink' },
  verified: { chip: 'bg-verified-50 text-verified-600', value: 'text-verified-700' },
  caution: { chip: 'bg-caution-50 text-caution-600', value: 'text-caution-700' },
  brass: { chip: 'bg-white/20 text-white', value: 'text-white' },
};

function Card({ label, value, tone = 'default', icon, featured = false }) {
  const Icon = ICONS[icon];
  const style = TONE_STYLE[tone];

  if (featured) {
    return (
      <div className="bg-brand-gradient card border-0 p-4 shadow-glow">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/75">{label}</p>
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${style.chip}`} aria-hidden="true">
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </span>
        </div>
        <p className={`mt-1.5 font-display text-3xl font-extrabold ${style.value}`}>{value}</p>
      </div>
    );
  }

  return (
    <div className="card p-4 transition-shadow hover:shadow-glow">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${style.chip}`} aria-hidden="true">
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </span>
      </div>
      <p className={`mt-1.5 font-display text-2xl font-bold ${style.value} dark:text-slate-100`}>{value}</p>
    </div>
  );
}

// summary: DashboardSummaryResponse
export default function SummaryCards({ summary }) {
  if (!summary) return null;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card label="Registered Students" value={summary.totalRegisteredStudents} icon="students" />
      <Card label="Enrolled (Active)" value={summary.activeStudents} tone="verified" icon="enrolled" />
      <Card label="Pending / Failed" value={summary.inactiveStudents} tone="caution" icon="pending" />
      <Card label="Total Attempts" value={summary.totalAttempts} icon="attempts" />
      <Card label="Successful Matches" value={summary.successfulMatches} tone="verified" icon="matched" />
      <Card label="Unknown Faces" value={summary.unknownFaces} icon="unknown" />
      <Card label="Low Confidence" value={summary.lowConfidence} tone="caution" icon="low" />
      <Card label="Success Rate" value={formatPercent(summary.successRate)} tone="brass" icon="rate" featured />
    </div>
  );
}
