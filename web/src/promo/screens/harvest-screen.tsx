import cabbageIcon from '@/assets/goods/cabbage.png';
import cucumberIcon from '@/assets/goods/cucumber.png';
import tomatoIcon from '@/assets/goods/tomato.png';
import { formatCount } from '@/promo/figures';
import { copy } from '@/promo/locale';
import { backOut, easeInOut, enter, fadeUp, mix } from '@/promo/motion';
import { useClock } from '@/promo/use-clock';
import '@/promo/screens/harvest.css';

const STAGES = [
  { label: copy.harvest.statusPlanning, color: 'var(--color-blue)' },
  { label: copy.harvest.statusPlanting, color: 'var(--color-stage-emergence)' },
  { label: copy.harvest.statusFlowering, color: 'var(--color-stage-flowering)' },
  { label: copy.harvest.statusRipening, color: 'var(--color-stage-ripening)' },
  { label: copy.harvest.statusHarvested, color: 'var(--color-green)' },
];

const ROWS = [
  { label: copy.landing.harvest.sampleTomato, icon: tomatoIcon, planned: 1200, actual: 1340 },
  { label: copy.landing.harvest.sampleCucumber, icon: cucumberIcon, planned: 800, actual: 742 },
  { label: copy.landing.harvest.sampleCabbage, icon: cabbageIcon, planned: 400, actual: 455 },
];

const MAX = Math.max(...ROWS.flatMap((row) => [row.planned, row.actual]));
const FLOW_TIME = 0.7;

export function HarvestScreen({ start }: { start: number }) {
  const time = useClock();
  const base = start + 0.12;
  const flowStart = base + 0.08;
  const flow = enter(time, flowStart, FLOW_TIME, easeInOut);
  const lastStage = STAGES.length - 1;

  return (
    <>
      <h3 className="promo-screen-title" style={fadeUp(time, base, 16)}>
        {copy.dashboard.harvest}
      </h3>

      <div className="promo-card promo-steps" style={fadeUp(time, base + 0.04, 22)}>
        <span className="promo-steps-track">
          <span className="promo-steps-fill" style={{ clipPath: `inset(0 ${100 - flow * 100}% 0 0 round 999px)` }} />
        </span>
        {STAGES.map((stage, index) => {
          const reached = enter(time, flowStart + FLOW_TIME * (index / lastStage) - 0.06, 0.4, backOut);
          return (
            <div key={stage.label} className="promo-step">
              <span className="promo-step-dot">
                <span style={{ background: stage.color, boxShadow: `0 0 0 2px ${stage.color}`, transform: `scale(${reached})` }} />
              </span>
              <span className="promo-step-label" style={{ color: reached > 0.5 ? 'var(--color-dark)' : undefined }}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="promo-card promo-compare" style={fadeUp(time, base + 0.12, 26)}>
        <div className="promo-card-head">
          <span className="promo-card-title">{copy.harvest.comparisonTitle}</span>
          <span className="promo-legend">
            <span className="promo-legend-item">
              <span className="promo-legend-dot is-planned" />
              {copy.harvest.comparisonPlanned}
            </span>
            <span className="promo-legend-item">
              <span className="promo-legend-dot" />
              {copy.harvest.comparisonActual}
            </span>
          </span>
        </div>

        {ROWS.map((row, index) => {
          const at = base + 0.16 + index * 0.07;
          const grow = enter(time, at, 0.55);
          const chip = enter(time, at + 0.38, 0.35, backOut);
          const variance = Math.round(((row.actual - row.planned) / row.planned) * 100);
          return (
            <div key={row.label} className="promo-compare-row" style={fadeUp(time, at, 16, 0.4)}>
              <span className="promo-row-icon">
                <img src={row.icon} alt="" />
              </span>
              <div className="promo-compare-body">
                <div className="promo-compare-head">
                  <strong>{row.label}</strong>
                  <span className="promo-compare-figures">
                    {formatCount(row.actual * grow)} / {formatCount(row.planned)} {copy.farm.unitKg}
                    <span
                      className={variance < 0 ? 'promo-chip is-warn' : 'promo-chip'}
                      style={{ opacity: Math.min(1, chip * 1.6), transform: `scale(${mix(0.4, 1, chip)})` }}
                    >
                      {variance > 0 ? '+' : ''}
                      {variance}%
                    </span>
                  </span>
                </div>
                <span className="promo-compare-track">
                  <span className="promo-compare-planned" style={{ width: `${(row.planned / MAX) * 100 * grow}%` }} />
                  <span className="promo-compare-actual" style={{ width: `${(row.actual / MAX) * 100 * grow}%` }} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
