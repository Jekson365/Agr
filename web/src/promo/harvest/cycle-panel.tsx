import coinIcon from '@/assets/coin.png';
import harvestIcon from '@/assets/icons/harvest.png';
import reportIcon from '@/assets/icons/report.png';
import balanceIcon from '@/assets/properties/balance.png';
import plantsIcon from '@/assets/properties/plants.png';
import seedIcon from '@/assets/seed.png';
import { copy, tr } from '@/promo/locale';
import { easeOut, enter, fadeUp } from '@/promo/motion';
import { ChemicalsPanel, GradingPanel, OverviewPanel } from '@/promo/harvest/cycle-insights';
import { resultTab, type ResultTab } from '@/promo/harvest/cycle-timeline';

type Tab = { icon: string; label: string; count?: number };

type Props = {
  time: number;
  harvested: boolean;
  harvestedSince: number;
  good: { name: string; icon: string };
  seedKg: number;
  seedAt: number;
  yieldKg: number;
};

function Tabs({ tabs, active = 0 }: { tabs: Tab[]; active?: number }) {
  return (
    <div className="hd-tabs">
      {tabs.map((tab, index) => (
        <button key={tab.label} type="button" className="hd-tab" aria-pressed={index === active}>
          <img src={tab.icon} alt="" />
          <span className="hd-tab-label">{tr(tab.label)}</span>
          {tab.count != null && <span className="hd-tab-count">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

function Row({ icon, name, amount }: { icon: string; name: string; amount: string }) {
  return (
    <div className="hd-rows scroll">
      <div className="hd-row">
        <img src={icon} alt="" />
        <span className="hd-row-text">
          <span className="hd-row-title">{name}</span>
          <span className="hd-row-amount">{amount}</span>
        </span>
      </div>
    </div>
  );
}

const HARVESTED_TABS: Tab[] = [
  { icon: harvestIcon, label: 'harvest.navResult', count: 1 },
  { icon: seedIcon, label: 'harvest.navSeeds', count: 1 },
  { icon: reportIcon, label: 'harvest.navOverview' },
  { icon: balanceIcon, label: 'harvestGrading.title' },
  { icon: plantsIcon, label: 'harvest.navChemicals' },
  { icon: coinIcon, label: 'harvest.navMoney' },
];

const TAB_INDEX: Record<ResultTab, number> = { result: 0, overview: 2, grading: 3, chemicals: 4 };

export function CyclePanel({ time, harvested, harvestedSince, good, seedKg, seedAt, yieldKg }: Props) {
  const seeded = time >= seedAt;
  const unit = copy.farm.unitKg;

  if (harvested) {
    const count = enter(time, harvestedSince + 0.15, 0.9, easeOut);
    const { tab, since } = resultTab(time);
    return (
      <div style={fadeUp(time, harvestedSince, 14, 0.35)}>
        <Tabs tabs={HARVESTED_TABS} active={TAB_INDEX[tab]} />
        {tab === 'overview' ? (
          <OverviewPanel time={time} since={since} crop={good.name} />
        ) : tab === 'grading' ? (
          <GradingPanel time={time} since={since} crop={good.name} />
        ) : tab === 'chemicals' ? (
          <ChemicalsPanel time={time} since={since} />
        ) : (
          <section className="hd-panel">
            <h2 className="hd-panel-title">{tr('harvestResult.title')}</h2>
            <Row icon={good.icon} name={good.name} amount={`${Math.round(yieldKg * count)} ${unit}`} />
            <p className="hd-note">{tr('harvestResult.onlyOne')}</p>
          </section>
        )}
      </div>
    );
  }

  return (
    <>
      <Tabs
        tabs={[
          { icon: seedIcon, label: 'harvest.navSeeds', count: seeded ? 1 : undefined },
          { icon: plantsIcon, label: 'harvest.navChemicals' },
        ]}
      />
      <section className="hd-panel">
        <h2 className="hd-panel-title">{tr('harvestSeed.title')}</h2>
        {seeded ? (
          <div style={fadeUp(time, seedAt, 18, 0.4)}>
            <Row icon={good.icon} name={good.name} amount={`${seedKg} ${unit}`} />
          </div>
        ) : (
          <>
            <p className="hd-empty">{tr('harvestSeed.empty')}</p>
            <button type="button" className="hd-button primary cycle-seed-add">
              + {tr('harvestSeed.add')}
            </button>
          </>
        )}
      </section>
    </>
  );
}
