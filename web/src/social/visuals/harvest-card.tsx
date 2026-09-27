import cabbageIcon from '@/assets/goods/cabbage.png';
import cucumberIcon from '@/assets/goods/cucumber.png';
import tomatoIcon from '@/assets/goods/tomato.png';
import ka from '@/locales/ka.json';
import { formatCount } from '@/promo/figures';
import '@/social/visuals/cards.css';
import '@/social/visuals/field-cards.css';

const STEPS = [
  { label: ka.harvest.statusPlanning, color: 'var(--color-blue)' },
  { label: ka.harvest.statusPlanting, color: 'var(--color-stage-emergence)' },
  { label: ka.harvest.statusFlowering, color: 'var(--color-stage-flowering)' },
  { label: ka.harvest.statusRipening, color: 'var(--color-stage-ripening)' },
  { label: ka.harvest.statusHarvested, color: 'var(--color-green)' },
];

const ROWS = [
  { label: ka.landing.harvest.sampleTomato, icon: tomatoIcon, planned: 1200, actual: 1340 },
  { label: ka.landing.harvest.sampleCucumber, icon: cucumberIcon, planned: 800, actual: 742 },
  { label: ka.landing.harvest.sampleCabbage, icon: cabbageIcon, planned: 400, actual: 455 },
];

const MAX = Math.max(...ROWS.flatMap((row) => [row.planned, row.actual]));

export function HarvestCard() {
  return (
    <div className="social-card harvest-card">
      <div className="harvest-steps">
        <span className="harvest-steps-track" />
        {STEPS.map((step) => (
          <span key={step.label} className="harvest-step">
            <i style={{ background: step.color, boxShadow: `0 0 0 3px ${step.color}` }} />
            {step.label}
          </span>
        ))}
      </div>

      <div className="social-card-head harvest-head">
        <span className="social-card-title">{ka.harvest.comparisonTitle}</span>
      </div>

      {ROWS.map((row) => {
        const variance = Math.round(((row.actual - row.planned) / row.planned) * 100);
        return (
          <div key={row.label} className="harvest-row">
            <span className="social-icon-tile">
              <img src={row.icon} alt="" />
            </span>
            <div className="harvest-row-body">
              <div className="harvest-row-head">
                <strong>{row.label}</strong>
                <span className={variance < 0 ? 'social-chip is-amber' : 'social-chip'}>
                  {variance > 0 ? '+' : ''}
                  {variance}%
                </span>
              </div>
              <span className="harvest-row-figures">
                {formatCount(row.actual)} / {formatCount(row.planned)} {ka.farm.unitKg}
              </span>
              <span className="harvest-bars">
                <span className="is-planned" style={{ width: `${(row.planned / MAX) * 100}%` }} />
                <span style={{ width: `${(row.actual / MAX) * 100}%` }} />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
