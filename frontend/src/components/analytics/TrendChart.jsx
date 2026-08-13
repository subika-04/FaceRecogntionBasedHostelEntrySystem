import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CHART_COLORS, CHART_MARGIN } from '../../utils/chartTheme';
import EmptyState from '../ui/EmptyState';

// data: TrendDataPoint[] = [{ label, count }]
export default function TrendChart({ data }) {
  if (!data || data.length === 0) {
    return <EmptyState title="No trend data yet" description="Recognition trends will appear here once entries are logged." />;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={CHART_MARGIN}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis dataKey="label" fontSize={12} stroke={CHART_COLORS.axis} />
        <YAxis fontSize={12} stroke={CHART_COLORS.axis} allowDecimals={false} />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
