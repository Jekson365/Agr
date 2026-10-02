import type { ReactNode } from 'react';

import { formatCount } from './visit-labels';
import './visitors-breakdown.css';

export type BreakdownRow = {
  key: string;
  label: ReactNode;
  title: string;
  value: number;
};

type Props = {
  title: string;
  rows: BreakdownRow[];
  emptyText: string;
};

export function VisitorsBreakdown({ title, rows, emptyText }: Props) {
  const highest = Math.max(1, ...rows.map((row) => row.value));

  return (
    <section className="visitors-panel">
      <h2 className="visitors-panel-title">{title}</h2>
      {rows.length === 0 ? (
        <p className="visitors-empty">{emptyText}</p>
      ) : (
        <ul className="visitors-list">
          {rows.map((row) => (
            <li key={row.key} className="visitors-list-row" title={row.title}>
              <span className="visitors-list-bar" style={{ width: `${(row.value / highest) * 100}%` }} />
              <span className="visitors-list-label">{row.label}</span>
              <span className="visitors-list-value">{formatCount(row.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
