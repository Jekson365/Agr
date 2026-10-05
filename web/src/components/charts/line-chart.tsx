import { useState } from 'react';

import './line-chart.css';

export type LinePoint = {
  key: string;
  label: string;
  value: number;
};

type Props = {
  points: LinePoint[];
  unit: string;
  ariaLabel: string;
};

function niceStep(rough: number): number {
  if (rough <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const n = rough / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return nice * pow;
}

function domain(values: number[]) {
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const step = niceStep((max - min) / 3);
  const low = Math.floor(min / step) * step;
  const high = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let tick = low; tick <= high + step / 2; tick += step) {
    ticks.push(Math.round(tick * 100) / 100);
  }
  return { low, high, ticks };
}

function labelIndexes(count: number, wanted: number): number[] {
  if (count <= wanted) return Array.from({ length: count }, (_, index) => index);
  const step = (count - 1) / (wanted - 1);
  return Array.from({ length: wanted }, (_, index) => Math.round(index * step));
}

const format = (value: number) => String(Math.round(value * 10) / 10);

export function LineChart({ points, unit, ariaLabel }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const { low, high, ticks } = domain(points.map((point) => point.value));

  const x = (index: number) => (points.length === 1 ? 50 : (index / (points.length - 1)) * 100);
  const y = (value: number) => 100 - ((value - low) / (high - low)) * 100;
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index)} ${y(point.value)}`).join(' ');
  const last = points.length - 1;

  return (
    <div className="line-chart" role="img" aria-label={ariaLabel}>
      <div className="line-chart-body">
        <div className="line-chart-yaxis" aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick} style={{ top: `${y(tick)}%` }}>
              {format(tick)}
            </span>
          ))}
        </div>

        <div className="line-chart-plot">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {ticks.map((tick) => (
              <line key={tick} x1={0} x2={100} y1={y(tick)} y2={y(tick)} className="line-chart-grid" />
            ))}
            <path d={path} className="line-chart-line" />
          </svg>

          {points.map((point, index) => (
            <button
              key={point.key}
              type="button"
              className={index === active ? 'line-chart-dot is-active' : 'line-chart-dot'}
              style={{ left: `${x(index)}%`, top: `${y(point.value)}%` }}
              aria-label={`${point.label}: ${format(point.value)} ${unit}`}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
            />
          ))}

          {active == null && (
            <span className="line-chart-end" style={{ left: `${x(last)}%`, top: `${y(points[last].value)}%` }}>
              {format(points[last].value)} {unit}
            </span>
          )}

          {active != null && (
            <div className="line-chart-tooltip" style={{ left: `${x(active)}%`, top: `${y(points[active].value)}%` }}>
              <span className="line-chart-tooltip-label">{points[active].label}</span>
              <span className="line-chart-tooltip-value">
                {format(points[active].value)} {unit}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="line-chart-xaxis" aria-hidden="true">
        {labelIndexes(points.length, 4).map((index) => (
          <span
            key={points[index].key}
            className={index === 0 ? 'is-first' : index === last ? 'is-last' : undefined}
            style={{ left: `${x(index)}%` }}
          >
            {points[index].label}
          </span>
        ))}
      </div>
    </div>
  );
}
