import type { GradedGood } from './use-harvest-grading';
import './harvest-grading.css';

type Props = {
  goods: GradedGood[];
  activeKey: string;
  onSelect: (key: string) => void;
};

/** The harvest's goods across the top: one tab each, and the sheet below belongs to the chosen one. */
export function HarvestGradingTabs({ goods, activeKey, onSelect }: Props) {
  return (
    <div className="hg-tabs" role="tablist">
      {goods.map((good) => (
        <button
          key={good.key}
          type="button"
          role="tab"
          className="hg-tab"
          aria-selected={good.key === activeKey}
          onClick={() => onSelect(good.key)}
        >
          {good.icon && <img src={good.icon} alt="" />}
          <span className="hg-tab-text">
            <span className="hg-tab-name">{good.label}</span>
            <span className="hg-tab-amount">
              {good.harvested} {good.unitLabel}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
