import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_COLORS, CHART_MARGIN } from '../../utils/chartTheme';
import EmptyState from '../ui/EmptyState';

// data: [{ label, count }] -- already-bucketed histogram data (see utils/histogram.js)
export default function Histogram({ data, emptyTitle = 'No data yet', emptyDescription, barColor = CHART_COLORS.primary }) {
  const total = (data || []).reduce((sum, d) => sum + d.count, 0);
  if (!data || total === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={CHART_MARGIN}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis dataKey="label" fontSize={11} stroke={CHART_COLORS.axis} />
        <YAxis fontSize={12} stroke={CHART_COLORS.axis} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" fill={barColor} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
