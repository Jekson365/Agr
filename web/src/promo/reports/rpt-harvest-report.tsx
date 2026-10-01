import type { CSSProperties } from 'react';

import { monthNames } from '@/components/ui/date-utils';
import { tr } from '@/promo/locale';
import { easeOut, enter, fadeUp, mix } from '@/promo/motion';
import { ChevronDown } from '@/promo/reports/rpt-icons';
import { NEWEST_FIRST } from '@/promo/reports/rpt-sample';

const MONTHS = monthNames('ka');
const COLUMNS = ['colDay', 'colMonth', 'colYear', 'colSeason', 'colRevenue', 'colCost', 'colHarvested'];
const ROW_HEIGHT = 47;

const ROWS = NEWEST_FIRST.map((harvest) => {
  const [, month, day] = harvest.date.split('-').map(Number);
  return { key: harvest.date, day, month: month - 1, revenue: harvest.revenue, cost: harvest.cost, fresh: harvest.fresh === true };
});

function Row({ row, style }: { row: (typeof ROWS)[number]; style: CSSProperties }) {
  return (
    <tr className={row.fresh ? 'report-table-row rpt-fresh-row' : 'report-table-row'} style={style}>
      <td>{row.day}</td>
      <td>{MONTHS[row.month]}</td>
      <td>2026</td>
      <td>{tr(row.month < 2 ? 'report.seasonWinter' : 'report.seasonSpring')}</td>
      <td>₾{row.revenue}</td>
      <td>₾{row.cost}</td>
      <td>
        <span className="report-table-amount-cell">
          <span className="report-table-chevron">
            <ChevronDown />
          </span>
          {tr('report.itemTypesCount').replace('{count}', '1')}
        </span>
      </td>
    </tr>
  );
}

export function RptHarvestReport({ time, since }: { time: number; since: number }) {
  const slide = enter(time, since + 0.5, 0.6, easeOut);

  return (
    <div className="rpt-page" style={fadeUp(time, since, 18, 0.35)}>
      <span className="back-link">← {tr('report.title')}</span>
      <div className="page-header">
        <h1 className="page-title">{tr('report.harvestPageTitle')}</h1>
      </div>
      <div className="report-table-wrap">
        <table className="report-table">
          <thead>
            <tr>
              {COLUMNS.map((column) => (
                <th key={column}>{tr(`report.${column}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <Row
                key={row.key}
                row={row}
                style={
                  row.fresh
                    ? { opacity: slide, transform: `translateX(${mix(-40, 0, slide)}px)` }
                    : { transform: `translateY(${mix(-ROW_HEIGHT, 0, slide)}px)` }
                }
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
