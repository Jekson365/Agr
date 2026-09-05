import './donut-chart.css';

export type DonutSlice = {
  label: string;
  value: number;
  color: string;
};

type Props = {
  slices: DonutSlice[];
  /** What the slices are a share of, when they need not add up to the whole — the ring is then
   *  drawn partial and the bare track is the remainder. Defaults to the slices' own sum. */
  total?: number;
  centerValue: string;
  centerLabel: string;
  formatValue?: (value: number) => string;
  ariaLabel?: string;
};

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart({
  slices,
  total: given,
  centerValue,
  centerLabel,
  formatValue = (value) => String(value),
  ariaLabel,
}: Props) {
  const summed = slices.reduce((sum, slice) => sum + slice.value, 0);
  const total = given != null && given > 0 ? given : summed;

  let running = 0;
  const segments = slices.map((slice) => {
    const share = total > 0 ? slice.value / total : 0;
    const length = share * CIRCUMFERENCE;
    const segment = { ...slice, length, offset: running, percent: Math.round(share * 100) };
    running += length;
    return segment;
  });

  return (
    <div className="donut-chart">
      <div className="donut-chart-figure">
        <svg viewBox="0 0 100 100" className="donut-chart-svg" role="img" aria-label={ariaLabel}>
          <circle cx="50" cy="50" r={RADIUS} className="donut-chart-track" />
          <g transform="rotate(-90 50 50)">
            {segments.map((segment) => (
              <circle
                key={segment.label}
                cx="50"
                cy="50"
                r={RADIUS}
                className="donut-chart-slice"
                style={{ stroke: segment.color }}
                strokeDasharray={`${segment.length} ${CIRCUMFERENCE - segment.length}`}
                strokeDashoffset={-segment.offset}
              />
            ))}
          </g>
        </svg>

        <div className="donut-chart-center">
          <span className="donut-chart-total">{centerValue}</span>
          <span className="donut-chart-caption">{centerLabel}</span>
        </div>
      </div>

      <ul className="donut-chart-legend">
        {segments.map((segment) => (
          <li key={segment.label}>
            <span className="donut-chart-dot" style={{ background: segment.color }} />
            <span className="donut-chart-legend-label">{segment.label}</span>
            <span className="donut-chart-legend-value">
              {formatValue(segment.value)} ({segment.percent}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
