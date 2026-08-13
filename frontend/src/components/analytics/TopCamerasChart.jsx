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

// data: CameraCountResponse[] = [{ camera, count }]
export default function TopCamerasChart({ data }) {
  if (!data || data.length === 0) {
    return <EmptyState title="No camera activity yet" description="Camera usage will appear here once recognition attempts are logged." />;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart layout="vertical" data={data} margin={{ ...CHART_MARGIN, left: 8, right: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis type="number" fontSize={12} stroke={CHART_COLORS.axis} allowDecimals={false} />
        <YAxis type="category" dataKey="camera" fontSize={12} stroke={CHART_COLORS.axis} width={90} />
        <Tooltip />
        <Bar dataKey="count" fill={CHART_COLORS.primaryDark} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
