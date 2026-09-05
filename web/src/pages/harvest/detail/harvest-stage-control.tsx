import { useMemo, useState } from 'react';

import { ConfirmModal } from '@/components/ui/confirm-modal';
import { isApplyingTransition, isDestructiveTransition, stockMovingRows } from '@/config/harvest-analysis';
import { stageDates } from '@/config/harvest-stage-dates';
import { HARVEST_STATUS_LABEL_KEY } from '@/config/harvest-status';
import { HARVEST_STATUS_BLOCK_KEY, harvestStatusBlock, type HarvestProgress } from '@/config/harvest-status-gate';
import { useLanguage } from '@/contexts/language-context';
import type { Harvest, HarvestStatus } from '@/types/harvest';
import { HarvestStageBar } from './harvest-stage-bar';
import { HarvestStageDatesModal } from './harvest-stage-dates-modal';
import type { HarvestDetail } from './use-harvest-detail';

type Props = {
  harvest: Harvest;
  detail: HarvestDetail;
};

export function HarvestStageControl({ harvest, detail }: Props) {
  const { t } = useLanguage();
  const { results, harvestSeeds, harvestTrees, statusChanges } = detail;

  const [pendingStatus, setPendingStatus] = useState<HarvestStatus | null>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [datesOpen, setDatesOpen] = useState(false);

  const progress: HarvestProgress = {
    kind: harvest.kind,
    seedCount: harvestSeeds.length,
    resultCount:
      harvest.kind === 'Fruit'
        ? harvestTrees.filter((tree) => tree.harvestedAmount > 0).length
        : results.length,
  };

  const dates = useMemo(() => stageDates(statusChanges), [statusChanges]);

  const movingCount = useMemo(() => stockMovingRows(detail.yieldRows).length, [detail.yieldRows]);

  const statusChangeBody = (() => {
    if (pendingStatus == null) return t('harvest.statusConfirmBody');
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

  function selectStatus(status: HarvestStatus) {
    if (status === harvest.status || detail.statusSaving) return;
    const block = harvestStatusBlock(harvest.status, status, progress);
    if (block) {
      setBlockedMessage(t(HARVEST_STATUS_BLOCK_KEY[block]));
      return;
    }
    setBlockedMessage(null);
    setPendingStatus(status);
  }

  async function confirmStatusChange() {
    if (pendingStatus == null) return;
    const next = pendingStatus;
    setPendingStatus(null);
    await detail.changeStatus(next);
  }

  return (
    <>
      <HarvestStageBar
        kind={harvest.kind}
        status={harvest.status}
        saving={detail.statusSaving}
        error={detail.statusError ?? blockedMessage}
        dates={dates}
        isBlocked={(status) => harvestStatusBlock(harvest.status, status, progress) != null}
        onSelect={selectStatus}
        onEditDates={() => setDatesOpen(true)}
      />

      <HarvestStageDatesModal
        open={datesOpen}
        changes={statusChanges}
        onClose={() => setDatesOpen(false)}
        onSaved={detail.setStatusChanges}
      />

      <ConfirmModal
        open={pendingStatus != null}
        title={t('harvest.statusConfirmTitle', {
          status: pendingStatus ? t(HARVEST_STATUS_LABEL_KEY[pendingStatus]) : '',
        })}
        body={statusChangeBody}
        destructive={pendingStatus != null && isDestructiveTransition(harvest.status, pendingStatus)}
        onCancel={() => setPendingStatus(null)}
        onConfirm={confirmStatusChange}
      />
    </>
  );
}
