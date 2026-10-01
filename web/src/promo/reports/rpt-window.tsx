import harvestIcon from '@/assets/icons/harvest.png';
import reportIcon from '@/assets/icons/report.png';
import logo from '@/assets/logo.png';
import balanceIcon from '@/assets/properties/balance.png';
import plantsIcon from '@/assets/properties/plants.png';
import { copy, tr } from '@/promo/locale';
import { easeIn, easeOut, enter, mix } from '@/promo/motion';
import { CYCLE_WINDOW } from '@/promo/harvest/cycle-timeline';
import { RptBalancePage } from '@/promo/reports/rpt-balance-page';
import { RptHarvestPage } from '@/promo/reports/rpt-harvest-page';
import { RptHarvestReport } from '@/promo/reports/rpt-harvest-report';
import { LockIcon } from '@/promo/reports/rpt-icons';
import { RptRevenuePage } from '@/promo/reports/rpt-revenue-page';
import { RptStockReport } from '@/promo/reports/rpt-stock-report';
import { ADDRESS, currentPage, HARVEST_ZOOM, REPORT_ZOOM, REPORTS_OUTRO, SIDEBAR_WIDTH, WINDOW_IN, type PageId } from '@/promo/reports/rpt-timeline';
import { windowFloat } from '@/promo/timeline';
import { useClock } from '@/promo/use-clock';
import '@/promo/reports/rpt-styles';

const NAV: { page: PageId; icon: string; label: string; child?: boolean }[] = [
  { page: 'harvest', icon: harvestIcon, label: 'dashboard.harvest' },
  { page: 'balance', icon: balanceIcon, label: 'farm.balance' },
  { page: 'report', icon: reportIcon, label: 'dashboard.report' },
  { page: 'harvestReport', icon: harvestIcon, label: 'report.harvestTab', child: true },
  { page: 'stockReport', icon: plantsIcon, label: 'report.stockTab', child: true },
];

function Page({ page, time, since }: { page: PageId; time: number; since: number }) {
  switch (page) {
    case 'harvest':
      return <RptHarvestPage time={time} />;
    case 'balance':
      return <RptBalancePage time={time} since={since} />;
    case 'report':
      return <RptRevenuePage time={time} since={since} />;
    case 'harvestReport':
      return <RptHarvestReport time={time} since={since} />;
    case 'stockReport':
      return <RptStockReport time={time} since={since} />;
  }
}

export function RptWindow() {
  const time = useClock();
  const { page, since } = currentPage(time);
  const rise = enter(time, WINDOW_IN, 0.85, easeOut);
  const leave = enter(time, REPORTS_OUTRO + 0.1, 0.4, easeIn);

  return (
    <div
      className="promo-window cycle-window"
      style={{
        left: CYCLE_WINDOW.x,
        top: CYCLE_WINDOW.y,
        width: CYCLE_WINDOW.width,
        height: CYCLE_WINDOW.height,
        visibility: time >= WINDOW_IN && leave < 1 ? 'visible' : 'hidden',
        opacity: Math.min(enter(time, WINDOW_IN, 0.35), 1 - leave),
        transform: `perspective(2400px) translateY(${mix(180, 0, rise) + windowFloat(time)}px) rotateX(${mix(16, 0, rise)}deg) scale(${mix(0.93, 1, rise)})`,
      }}
    >
      <div className="promo-window-chrome">
        <span className="promo-window-dot" />
        <span className="promo-window-dot" />
        <span className="promo-window-dot" />
        <span className="promo-window-address">
          <LockIcon />
          {ADDRESS[page]}
        </span>
      </div>

      <div className="rpt-body">
        <nav className="rpt-side" style={{ width: SIDEBAR_WIDTH }}>
          <div className="rpt-side-brand">
            <img src={logo} alt="" />
            <span>{copy.auth.appName}</span>
          </div>
          {NAV.map((item) => (
            <span
              key={item.page}
              data-nav={item.page}
              className={[
                'rpt-side-link',
                item.child ? 'is-child' : '',
                item.page === page ? 'is-active' : '',
              ].join(' ')}
            >
              <img src={item.icon} alt="" />
              <span>{tr(item.label)}</span>
            </span>
          ))}
        </nav>
        <div className="cycle-window-body">
          <div className="cycle-page" style={{ zoom: page === 'harvest' ? HARVEST_ZOOM : REPORT_ZOOM }}>
            <Page page={page} time={time} since={since} />
          </div>
        </div>
      </div>
    </div>
  );
}
