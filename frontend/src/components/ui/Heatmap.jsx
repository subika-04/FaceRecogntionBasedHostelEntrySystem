import { CHART_COLORS } from '../../utils/chartTheme';

/**
 * Generic row x column intensity grid. Recharts has no heatmap chart type,
 * so this is a small hand-built SVG-free grid (plain divs are simpler and
 * just as accessible here as SVG would be for a grid of cells). Reusable
 * for any 2D count matrix, not just recognition data -- keeps the
 * day/hour-specific logic out of this component (see RecognitionHeatmap.jsx).
 *
 * matrix: number[rows][cols], rowLabels: string[], colLabels: string[]
 */
export default function Heatmap({ matrix, rowLabels, colLabels, colorScale = CHART_COLORS.primary }) {
  const max = Math.max(1, ...matrix.flat());

  const cellColor = (value) => {
    if (value === 0) return 'transparent';
    const intensity = Math.min(1, value / max);
    // Blend from a light tint up to the full theme color as intensity increases.
    const alpha = 0.15 + intensity * 0.85;
    return colorScale + Math.round(alpha * 255).toString(16).padStart(2, '0');
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate" style={{ borderSpacing: 2 }} role="table" aria-label="Recognition activity heatmap">
        <thead>
          <tr>
            <th className="w-16" />
            {colLabels.map((label) => (
              <th key={label} scope="col" className="pb-1 text-center text-[10px] font-normal text-slate-400">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowLabels.map((rowLabel, r) => (
            <tr key={rowLabel}>
              <th scope="row" className="pr-2 text-right text-xs font-normal text-slate-400 whitespace-nowrap">
                {rowLabel}
              </th>
              {matrix[r].map((value, c) => (
                <td key={c} className="p-0">
                  <div
                    className="h-5 w-full min-w-[18px] rounded-sm border border-slate-100 dark:border-slate-700"
                    style={{ backgroundColor: cellColor(value) }}
                    role="cell"
                    aria-label={`${rowLabel}, ${colLabels[c]}: ${value} recognition${value === 1 ? '' : 's'}`}
                    title={`${rowLabel} ${colLabels[c]}: ${value}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
