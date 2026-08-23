import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import {
  buildYieldRows,
  isApplyingTransition,
  isDestructiveTransition,
  stockMovingRows,
} from '@/config/harvest-analysis';
import { HARVEST_STATUS_LABEL_KEY } from '@/config/harvest-status';
import { useLanguage } from '@/contexts/language-context';
import type { HarvestStatus } from '@/types/harvest';
import { ChemicalSection } from './detail/chemical-section';
import { HarvestDetailHeader } from './detail/harvest-detail-header';
import { HarvestSectionNav, type HarvestSection } from './detail/harvest-section-nav';
import { HarvestStageBar } from './detail/harvest-stage-bar';
import { MoneySection } from './detail/money-section';
import { ResultSection } from './detail/result-section';
import { SeedSection } from './detail/seed-section';
import { TreeSection } from './detail/tree-section';
import { useHarvestDetail } from './detail/use-harvest-detail';
import './detail/harvest-detail.css';

/** Where the page opens: the part of the record that stage of the harvest is actually about. */
const SECTION_FOR_STATUS: Record<HarvestStatus, HarvestSection> = {
  Planning: 'seeds',
  Planting: 'seeds',
  Harvested: 'result',
};

export function HarvestDetailPage() {
  const { t } = useLanguage();
  const { id: idParam } = useParams<{ id: string }>();
  const harvestId = Number(idParam);

  const detail = useHarvestDetail(harvestId);
  const { harvest, items, results, catalogs, harvestSeeds, harvestTrees } = detail;

  const [section, setSection] = useState<HarvestSection | null>(null);
  const [pendingStatus, setPendingStatus] = useState<HarvestStatus | null>(null);

  const isFruit = harvest?.kind === 'Fruit';
  const inputSection: HarvestSection = isFruit ? 'trees' : 'seeds';

  // Until the harvest is in, what is on the page is what goes into the ground and what is
  // sprayed on it — the yield and the money it made have nothing to say yet, so those tabs are
  // not offered rather than offered empty.
  const sections: HarvestSection[] =
    harvest?.status === 'Harvested'
      ? [inputSection, 'result', 'money', 'chemicals']
      : [inputSection, 'chemicals'];

  // Opens on the stage's own section, and only until the reader picks another one themselves.
  useEffect(() => {
    if (!harvest || section != null) return;
    const preferred = SECTION_FOR_STATUS[harvest.status];
    setSection(preferred === 'seeds' ? inputSection : preferred);
  }, [harvest, section, inputSection]);

  // Moving the harvest back a stage takes its later tabs away; whoever was reading one lands on
  // the first tab still offered rather than on a blank page.
  const active = section != null && sections.includes(section) ? section : sections[0];

  // A status change that writes or reverses stock says so with real numbers, rather than the
  // generic "this will update the status" — reversing is the one move that silently rewrites
  // data outside this harvest. One entry per good the change is about to write into, or take
  // back out of, stock: a harvest that only planned moves nothing, and the count says so.
  const movingCount = useMemo(() => stockMovingRows(buildYieldRows(items, results)).length, [items, results]);

  const statusChangeBody = (() => {
    if (!harvest || pendingStatus == null) return t('harvest.statusConfirmBody');
    if (isApplyingTransition(harvest.status, pendingStatus)) {
      return movingCount === 0
        ? t('harvest.statusConfirmBodyToHarvestedEmpty')
        : t('harvest.statusConfirmBodyToHarvestedCount', { count: movingCount });
    }
    if (isDestructiveTransition(harvest.status, pendingStatus)) {
      return movingCount === 0
        ? t('harvest.statusConfirmBodyFromHarvested')
        : t('harvest.statusConfirmBodyFromHarvestedCount', { count: movingCount });
    }
    return t('harvest.statusConfirmBody');
  })();

  async function confirmStatusChange() {
    if (pendingStatus == null) return;
    const next = pendingStatus;
    setPendingStatus(null);
    await detail.changeStatus(next);
  }

  if (detail.loading) return <div className="state-box">…</div>;

  if (detail.error || !harvest) {
    return (
      <div className="state-box">
        <span>{t('harvestItem.loadError')}</span>
        <button type="button" className="retry-button" onClick={detail.load}>
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <HarvestDetailHeader harvest={harvest} farm={detail.farm} plot={detail.plot} />

      <HarvestStageBar
        status={harvest.status}
        saving={detail.statusSaving}
        error={detail.statusError}
        onSelect={(status) => {
          if (status !== harvest.status && !detail.statusSaving) setPendingStatus(status);
        }}
      />

      <HarvestSectionNav
        sections={sections}
        active={active}
        counts={{
          seeds: harvestSeeds.length,
          trees: harvestTrees.length,
          result: results.length,
        }}
        onSelect={setSection}
      />

      {active === 'seeds' && (
        <SeedSection
          harvestId={harvestId}
          harvestSeeds={harvestSeeds}
          catalogs={catalogs}
          // What to sow is settled while the harvest is still being planned, so seed is only
          // recorded in Planning. Existing rows stay readable in every status.
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
          onChanged={detail.setHarvestTrees}
        />
      )}

      {active === 'result' && (
        <ResultSection
          harvestId={harvestId}
          results={results}
          items={items}
          catalogs={catalogs}
          canEdit={harvest.status === 'Harvested'}
          onChanged={detail.setResults}
        />
      )}

      {active === 'money' && (
        <MoneySection
          harvest={harvest}
          items={items}
          results={results}
          catalogs={catalogs}
          plotArea={detail.plot?.area ?? null}
          chemicalTotal={detail.chemicalTotal}
          onHarvestSaved={detail.setHarvest}
        />
      )}

      {active === 'chemicals' && (
        <ChemicalSection harvestId={harvestId} onTotalChange={detail.setChemicalTotal} />
      )}

      <ConfirmModal
        open={pendingStatus != null}
        title={t('harvest.statusConfirmTitle', { status: pendingStatus ? t(HARVEST_STATUS_LABEL_KEY[pendingStatus]) : '' })}
        body={statusChangeBody}
        destructive={pendingStatus != null && isDestructiveTransition(harvest.status, pendingStatus)}
        onCancel={() => setPendingStatus(null)}
        onConfirm={confirmStatusChange}
      />
    </div>
  );
}
