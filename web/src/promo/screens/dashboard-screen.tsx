import { PREVIEW_BARS, PREVIEW_ICONS } from '@/config/landing';
import ka from '@/locales/ka.json';
import { countFigure, splitFigure } from '@/promo/figures';
import { enter, fadeUp, popIn } from '@/promo/motion';
import { useClock } from '@/promo/use-clock';

const STATS = [
  { label: ka.landing.preview.statYield, figure: splitFigure(ka.landing.preview.statYieldValue), accent: false },
  { label: ka.landing.preview.statHarvests, figure: splitFigure(ka.landing.preview.statHarvestsValue), accent: false },
  { label: ka.landing.preview.statNet, figure: splitFigure(ka.landing.preview.statNetValue), accent: true },
];

const TILES = [
  { icon: PREVIEW_ICONS.land, label: ka.farm.land },
  { icon: PREVIEW_ICONS.plants, label: ka.farm.plantStock },
  { icon: PREVIEW_ICONS.fruits, label: ka.farm.fruits },
  { icon: PREVIEW_ICONS.livestock, label: ka.farm.livestock },
  { icon: PREVIEW_ICONS.harvest, label: ka.dashboard.harvest },
  { icon: PREVIEW_ICONS.balance, label: ka.farm.balance },
];

const PEAK = PREVIEW_BARS.length - 2;

export function DashboardScreen({ start }: { start: number }) {
  const time = useClock();
  const base = start + 0.3;

  return (
    <>
      <h3 className="promo-screen-title" style={fadeUp(time, base, 16)}>
        {ka.landing.preview.greeting}
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
        {ka.dashboard.quickAccess}
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
          <span className="promo-card-title">{ka.report.harvestRevenueTitle}</span>
          <span className="promo-card-sub">{ka.landing.preview.chartSubtitle}</span>
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
