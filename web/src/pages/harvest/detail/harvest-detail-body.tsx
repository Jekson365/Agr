import { Suspense, useEffect, useState } from 'react';

import { countsInBalance, isPicked } from '@/config/harvest-analysis';
import type { Harvest } from '@/types/harvest';
import { HarvestSectionNav, type HarvestSection } from './harvest-section-nav';
import { HarvestSectionTabs } from './harvest-section-tabs';
import {
  ChemicalSection,
  GradingSection,
  MoneySection,
  OverviewSection,
  ResultSection,
  SeedSection,
  SECTION_FOR_STATUS,
  TreeSection,
} from './harvest-sections';
import { HarvestStageControl } from './harvest-stage-control';
import type { HarvestDetail } from './use-harvest-detail';

type Props = {
  harvestId: number;
  harvest: Harvest;
  detail: HarvestDetail;
  nav: 'rail' | 'tabs';
};

export function HarvestDetailBody({ harvestId, harvest, detail, nav }: Props) {
  const { items, results, catalogs, harvestSeeds, harvestTrees } = detail;

  const [section, setSection] = useState<HarvestSection | null>(null);

  // An orchard records its yield on the trees it picked, so it has no separate result section:
  // a HarvestResult against a tree stock would move the orchard's tree count, not its produce.
  const isFruit = harvest.kind === 'Fruit';
  const inputSection: HarvestSection = isFruit ? 'trees' : 'seeds';
  const sections: HarvestSection[] = isPicked(harvest.status)
    ? isFruit
      ? ['overview', 'trees', 'money', 'grading', 'chemicals']
      : ['result', 'seeds', 'overview', 'grading', 'chemicals', 'money']
    : [inputSection, 'chemicals'];

  useEffect(() => {
    if (section != null) return;
    const preferred = SECTION_FOR_STATUS[harvest.status];
    setSection(preferred === 'seeds' ? inputSection : preferred);
  }, [harvest.status, section, inputSection]);

  const active = section != null && sections.includes(section) ? section : sections[0];

  const counts: Partial<Record<HarvestSection, number>> = {
    seeds: harvestSeeds.length,
    trees: harvestTrees.length,
    result: results.length,
  };

  const content = (
    <Suspense fallback={<div className="state-box">…</div>}>
      {active === 'overview' && (
        <OverviewSection
          harvestId={harvestId}
          harvest={harvest}
          detail={detail}
          onOpenGrading={() => setSection('grading')}
        />
      )}

      {active === 'grading' && <GradingSection harvestId={harvestId} />}

      {active === 'seeds' && (
        <SeedSection
          harvestId={harvestId}
          harvestSeeds={harvestSeeds}
          catalogs={catalogs}
          canEdit={harvest.status === 'Planning'}
          onChanged={detail.setHarvestSeeds}
          onSeedsChanged={detail.reloadSeeds}
        />
      )}

      {active === 'trees' && (
        <TreeSection
          harvestId={harvestId}
          harvestTrees={harvestTrees}
          catalogs={catalogs}
          canEdit={!countsInBalance(harvest.status)}
          canRecordHarvested={isPicked(harvest.status)}
          onChanged={detail.setHarvestTrees}
        />
      )}

      {active === 'result' && (
        <ResultSection
          harvestId={harvestId}
          results={results}
          items={items}
          harvestSeeds={harvestSeeds}
          catalogs={catalogs}
          canEdit={isPicked(harvest.status) && !countsInBalance(harvest.status)}
          onChanged={detail.setResults}
        />
      )}

      {active === 'money' && (
        <MoneySection
          harvest={harvest}
          yieldRows={detail.yieldRows}
          catalogs={catalogs}
          plotArea={detail.plot?.area ?? null}
          chemicalTotal={detail.chemicalTotal}
          onHarvestSaved={detail.setHarvest}
        />
      )}

      {active === 'chemicals' && <ChemicalSection harvestId={harvestId} onTotalChange={detail.setChemicalTotal} />}
    </Suspense>
  );

  return (
    <>
      <HarvestStageControl harvest={harvest} detail={detail} />

      {nav === 'tabs' ? (
        <>
          <HarvestSectionTabs
            sections={sections}
            active={active}
            counts={counts}
            onSelect={setSection}
          />
          {content}
        </>
      ) : (
        <div className="hd-layout">
          <div className="hd-layout-main">{content}</div>
          <HarvestSectionNav
            sections={sections}
            active={active}
            counts={counts}
            onSelect={setSection}
          />
        </div>
      )}
    </>
  );
}
