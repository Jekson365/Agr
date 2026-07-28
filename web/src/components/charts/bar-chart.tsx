import { useState } from 'react';

import './bar-chart.css';

export type BarDatum = {
  /** Short label shown under the bar on the x-axis (e.g. "05.03"). */
  label: string;
  value: number;
  /** Fuller label shown in the hover tooltip; falls back to `label`. */
  tooltipLabel?: string;
};

type BarChartProps = {
  data: BarDatum[];
  /** Formats y-axis ticks and the tooltip value (e.g. a currency formatter). */
  formatValue?: (value: number) => string;
  /** Number of y-axis divisions (gridlines = tickCount + 1). */
  tickCount?: number;
  ariaLabel?: string;
  /** When set, bars become clickable and fire this with the bar's index. */
  onBarClick?: (index: number) => void;
  /** Index of the currently selected bar, highlighted and holding focus dimming. */
  selectedIndex?: number | null;
};

/** Rounds a value up to a "nice" axis maximum (1/2/2.5/5 × 10ⁿ). */
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const n = value / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return nice * pow;
}

/**
 * A dependency-free vertical bar chart built from DOM/flexbox (no chart library),
 * so it stays crisp and responsive inside any container and adapts to the theme
 * tokens. Single-series: the panel title names the measure, so there's no legend.
 */
export function BarChart({
  data,
  formatValue = (v) => String(v),
  tickCount = 4,
  ariaLabel,
  onBarClick,
  selectedIndex = null,
}: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const maxValue = Math.max(0, ...data.map((d) => d.value));
  const axisMax = niceCeil(maxValue);
  // Ticks from the top (axisMax) down to 0.
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (axisMax * (tickCount - i)) / tickCount);

  const trackClass = [
    'bar-chart-track',
    hovered != null ? 'has-hover' : '',
    selectedIndex != null ? 'has-selection' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <figure className="bar-chart" role="img" aria-label={ariaLabel}>
      <div className="bar-chart-plot">
        <div className="bar-chart-grid" aria-hidden="true">
          {ticks.map((tick, i) => (
            <div key={i} className="bar-chart-grid-row">
              <span className="bar-chart-grid-label">{formatValue(tick)}</span>
              <span className="bar-chart-grid-line" />
            </div>
          ))}
        </div>

        <div className="bar-chart-gutter-spacer" aria-hidden="true" />

        <div className={trackClass}>
          <div className="bar-chart-bars">
            {data.map((d, i) => {
              const colClass = [
                'bar-chart-col',
                i === hovered ? 'hovered' : '',
                i === selectedIndex ? 'selected' : '',
                onBarClick ? 'clickable' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <div
                  key={i}
                  className={colClass}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered((cur) => (cur === i ? null : cur))}
                  onClick={onBarClick ? () => onBarClick(i) : undefined}
                  onKeyDown={
                    onBarClick
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onBarClick(i);
                          }
                        }
                      : undefined
                  }
                  role={onBarClick ? 'button' : undefined}
                  tabIndex={onBarClick ? 0 : undefined}
                  aria-pressed={onBarClick ? i === selectedIndex : undefined}
                >
                  <div className="bar-chart-bar" style={{ height: `${(d.value / axisMax) * 100}%` }} />
                </div>
              );
            })}
          </div>

          {hovered != null && data[hovered] && (
            <div
              className="bar-chart-tooltip"
              style={{
                left: `${((hovered + 0.5) / data.length) * 100}%`,
                bottom: `${(data[hovered].value / axisMax) * 100}%`,
              }}
            >
              <span className="bar-chart-tooltip-label">{data[hovered].tooltipLabel ?? data[hovered].label}</span>
              <span className="bar-chart-tooltip-value">{formatValue(data[hovered].value)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bar-chart-xaxis">
        <span className="bar-chart-gutter-spacer" aria-hidden="true" />
        <div className="bar-chart-xlabels">
          {data.map((d, i) => (
            <span
              key={i}
              className={
                i === hovered || i === selectedIndex ? 'bar-chart-xlabel hovered' : 'bar-chart-xlabel'
              }
            >
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}
