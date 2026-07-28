import { useState } from 'react';

import './grouped-bar-chart.css';

export type BarSeries = { key: string; label: string; color: string; unit?: string };
export type BarGroup = { label: string; tooltipLabel?: string; values: Record<string, number> };

type Props = {
  groups: BarGroup[];
  series: BarSeries[];
  /** Formats value-axis ticks (plain amount — units differ per series, so they live in the legend/tooltip). */
  formatValue?: (value: number) => string;
  tickCount?: number;
  ariaLabel?: string;
  /** When set, bars become clickable and fire this with the clicked series (and its group). */
  onBarClick?: (seriesKey: string, groupIndex: number) => void;
  /** Highlights this series across all groups (others recede) — the current cell-4 selection. */
  selectedSeriesKey?: string | null;
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
 * Multi-series grouped bar chart (no chart library), drawn horizontally: groups run down the y
 * axis and bars grow rightwards along the value axis, which gives long group labels (harvest
 * titles, orchard names) a full line to sit on instead of a truncated column header.
 *
 * Each group holds one bar per series, coloured by series. Units differ between series, so the
 * value axis stays unitless and each unit is carried by the legend and the hover tooltip. Identity
 * is never colour-alone — the legend labels every series and adjacent bars are separated by a
 * surface gap.
 */
export function GroupedBarChart({
  groups,
  series,
  formatValue = (v) => String(v),
  tickCount = 4,
  ariaLabel,
  onBarClick,
  selectedSeriesKey = null,
}: Props) {
  const [hovered, setHovered] = useState<{ group: number; seriesKey: string } | null>(null);

  const maxValue = Math.max(0, ...groups.flatMap((g) => series.map((s) => g.values[s.key] ?? 0)));
  const axisMax = niceCeil(maxValue);
  // Ascending: the value axis now runs left to right.
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (axisMax * i) / tickCount);

  const hoveredSeries = hovered ? series.find((s) => s.key === hovered.seriesKey) : null;
  const hoveredGroup = hovered ? groups[hovered.group] : null;
  const hoveredValue = hovered && hoveredGroup ? hoveredGroup.values[hovered.seriesKey] ?? 0 : 0;
  // Anchored at the end of the bar, so a long bar would push the tooltip out of the plot — past
  // the midpoint it hangs back off the bar's end instead.
  const tooltipFlipped = hoveredValue / axisMax > 0.55;

  return (
    <figure className="gbar" role="img" aria-label={ariaLabel}>
      <div className="gbar-plot">
        <div className="gbar-ylabels">
          {groups.map((group, gi) => (
            <span
              key={gi}
              className={hovered?.group === gi ? 'gbar-ylabel hovered' : 'gbar-ylabel'}
              title={group.tooltipLabel ?? group.label}
            >
              {/* Inner span so the text can ellipsise — text-overflow doesn't apply to the flex
                  container that centres it. The title attribute carries the full label. */}
              <span className="gbar-ylabel-text">{group.label}</span>
            </span>
          ))}
        </div>

        <div className="gbar-track">
          <div className="gbar-grid" aria-hidden="true">
            {ticks.map((_, i) => (
              // The closing line is pinned to the right edge, which `left: 100%` would put just
              // past it.
              <span
                key={i}
                className="gbar-grid-line"
                style={i === tickCount ? { right: 0 } : { left: `${(i / tickCount) * 100}%` }}
              />
            ))}
          </div>

          <div className="gbar-groups">
            {groups.map((group, gi) => (
              <div key={gi} className="gbar-group">
                {series.map((s) => {
                  const value = group.values[s.key] ?? 0;
                  const isHovered = hovered?.group === gi && hovered.seriesKey === s.key;
                  // While hovering, recede everything but the hovered bar; otherwise recede
                  // everything but the selected series (if one is picked for the cell-4 details).
                  const dim = hovered != null ? !isHovered : selectedSeriesKey != null && s.key !== selectedSeriesKey;
                  return (
                    <div
                      key={s.key}
                      className={onBarClick ? 'gbar-col clickable' : 'gbar-col'}
                      onMouseEnter={() => setHovered({ group: gi, seriesKey: s.key })}
                      onMouseLeave={() => setHovered((cur) => (cur?.group === gi && cur.seriesKey === s.key ? null : cur))}
                      onClick={onBarClick ? () => onBarClick(s.key, gi) : undefined}
                      onKeyDown={
                        onBarClick
                          ? (event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onBarClick(s.key, gi);
                              }
                            }
                          : undefined
                      }
                      role={onBarClick ? 'button' : undefined}
                      tabIndex={onBarClick ? 0 : undefined}
                    >
                      <div
                        className="gbar-bar"
                        style={{ width: `${(value / axisMax) * 100}%`, background: s.color, opacity: dim ? 0.4 : 1 }}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {hovered != null && hoveredGroup && hoveredSeries && (
            <div
              className={tooltipFlipped ? 'gbar-tooltip flipped' : 'gbar-tooltip'}
              style={{ left: `${(hoveredValue / axisMax) * 100}%`, top: `${((hovered.group + 0.5) / groups.length) * 100}%` }}
            >
              <span className="gbar-tooltip-label">{hoveredGroup.tooltipLabel ?? hoveredGroup.label}</span>
              <span className="gbar-tooltip-series">
                <span className="gbar-tooltip-swatch" style={{ background: hoveredSeries.color }} />
                {hoveredSeries.label}
              </span>
              <span className="gbar-tooltip-value">
                {formatValue(hoveredValue)}
                {hoveredSeries.unit ? ` ${hoveredSeries.unit}` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="gbar-xaxis">
        <span className="gbar-gutter-spacer" aria-hidden="true" />
        <div className="gbar-xticks">
          {ticks.map((tick, i) => (
            // The first and last labels sit flush with the axis ends; centring them on their
            // gridline would hang half of each outside the plot, where the panel clips it.
            <span
              key={i}
              className="gbar-xtick"
              style={
                i === 0
                  ? { left: 0 }
                  : i === tickCount
                    ? { right: 0 }
                    : { left: `${(i / tickCount) * 100}%`, transform: 'translateX(-50%)' }
              }
            >
              {formatValue(tick)}
            </span>
          ))}
        </div>
      </div>

      <div className="gbar-legend">
        {series.map((s) => (
          <span key={s.key} className="gbar-legend-item">
            <span className="gbar-legend-swatch" style={{ background: s.color }} />
            {s.label}
            {s.unit ? ` (${s.unit})` : ''}
          </span>
        ))}
      </div>
    </figure>
  );
}
