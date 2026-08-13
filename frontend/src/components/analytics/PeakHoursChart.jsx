import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CHART_COLORS, CHART_MARGIN } from '../../utils/chartTheme';
import EmptyState from '../ui/EmptyState';

// data: PeakHourResponse[] = [{ hour: 0-23, count }]
export default function PeakHoursChart({ data }) {
  if (!data || data.length === 0) {
    return <EmptyState title="No activity recorded yet" description="Peak entry hours will appear here once recognition attempts are logged." />;
  }
  const formatted = data.map((d) => ({ ...d, hourLabel: `${String(d.hour).padStart(2, '0')}:00` }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={formatted} margin={CHART_MARGIN}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis dataKey="hourLabel" fontSize={12} stroke={CHART_COLORS.axis} />
        <YAxis fontSize={12} stroke={CHART_COLORS.axis} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
