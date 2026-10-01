import { PREVIEW_BARS, PREVIEW_ICONS } from '@/config/landing';
import { countFigure, splitFigure } from '@/promo/figures';
import { copy } from '@/promo/locale';
import { enter, fadeUp, popIn } from '@/promo/motion';
import { useClock } from '@/promo/use-clock';

const STATS = [
  { label: copy.landing.preview.statYield, figure: splitFigure(copy.landing.preview.statYieldValue), accent: false },
  { label: copy.landing.preview.statHarvests, figure: splitFigure(copy.landing.preview.statHarvestsValue), accent: false },
  { label: copy.landing.preview.statNet, figure: splitFigure(copy.landing.preview.statNetValue), accent: true },
];

const TILES = [
  { icon: PREVIEW_ICONS.land, label: copy.farm.land },
  { icon: PREVIEW_ICONS.plants, label: copy.farm.plantStock },
  { icon: PREVIEW_ICONS.fruits, label: copy.farm.fruits },
  { icon: PREVIEW_ICONS.livestock, label: copy.farm.livestock },
  { icon: PREVIEW_ICONS.harvest, label: copy.dashboard.harvest },
  { icon: PREVIEW_ICONS.balance, label: copy.farm.balance },
];

const PEAK = PREVIEW_BARS.length - 2;

export function DashboardScreen({ start }: { start: number }) {
  const time = useClock();
  const base = start + 0.3;

  return (
    <>
      <h3 className="promo-screen-title" style={fadeUp(time, base, 16)}>
        {copy.landing.preview.greeting}
      </h3>

      <div className="promo-dash-stats">
        {STATS.map((stat, index) => {
          const at = base + 0.1 + index * 0.08;
          return (
            <div key={stat.label} className="promo-card promo-dash-stat" style={fadeUp(time, at, 24)}>
              <span className="promo-dash-stat-label">{stat.label}</span>
              <strong className={stat.accent ? 'promo-dash-stat-value is-accent' : 'promo-dash-stat-value'}>
                {countFigure(stat.figure, enter(time, at + 0.1, 1))}
              </strong>
            </div>
          );
        })}
      </div>

      <p className="promo-dash-label" style={fadeUp(time, base + 0.3, 10)}>
        {copy.dashboard.quickAccess}
      </p>
      <div className="promo-dash-tiles">
        {TILES.map((tile, index) => (
          <div key={tile.label} className="promo-dash-tile" style={popIn(time, base + 0.36 + index * 0.06, 0.5, 0.5)}>
            <img src={tile.icon} alt="" />
            <span>{tile.label}</span>
          </div>
        ))}
      </div>

      <div className="promo-card promo-dash-chart" style={fadeUp(time, base + 0.5, 26)}>
        <div className="promo-card-head">
          <span className="promo-card-title">{copy.report.harvestRevenueTitle}</span>
          <span className="promo-card-sub">{copy.landing.preview.chartSubtitle}</span>
        </div>
        <div className="promo-dash-bars">
          {PREVIEW_BARS.map((height, index) => (
            <span
              key={index}
              className={index === PEAK ? 'promo-dash-bar is-peak' : 'promo-dash-bar'}
              style={{ height: `${height * enter(time, base + 0.6 + index * 0.06, 0.6)}%` }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
