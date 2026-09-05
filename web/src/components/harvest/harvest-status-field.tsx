import { useEffect, useState } from 'react';

import '@/components/farm/kind-picker.css';
import { HARVEST_STATUS_LABEL_KEY, harvestStatusesFor } from '@/config/harvest-status';
import { HARVEST_STATUS_BLOCK_KEY, harvestStatusBlock, type HarvestProgress } from '@/config/harvest-status-gate';
import { useLanguage } from '@/contexts/language-context';
import { getHarvestResults } from '@/services/harvest-result-service';
import { getHarvestSeeds } from '@/services/harvest-seed-service';
import { getHarvestTrees } from '@/services/harvest-tree-service';
import type { Harvest, HarvestStatus } from '@/types/harvest';

type Props = {
  harvest: Harvest;
  value: HarvestStatus;
  onChange: (status: HarvestStatus) => void;
};

export function HarvestStatusField({ harvest, value, onChange }: Props) {
  const { t } = useLanguage();

  const [progress, setProgress] = useState<HarvestProgress | null>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setProgress(null);
    setBlockedMessage(null);
    Promise.all([getHarvestSeeds(harvest.id), getHarvestResults(harvest.id), getHarvestTrees(harvest.id)])
      .then(([seeds, results, trees]) => {
        if (!active) return;
        setProgress({
          kind: harvest.kind,
          seedCount: seeds.length,
          // A fruit harvest's yield is recorded on the trees it picked, not as a result row.
          resultCount:
            harvest.kind === 'Fruit' ? trees.filter((tree) => tree.harvestedAmount > 0).length : results.length,
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [harvest.id, harvest.kind]);

  const statuses = harvestStatusesFor(harvest.kind, harvest.status);

  function blockFor(status: HarvestStatus) {
    return progress ? harvestStatusBlock(harvest.status, status, progress) : null;
  }

  function select(status: HarvestStatus) {
    const block = blockFor(status);
    if (block) {
      setBlockedMessage(t(HARVEST_STATUS_BLOCK_KEY[block]));
      return;
    }
    setBlockedMessage(null);
    onChange(status);
  }

  return (
    <div className="field">
      <label>{t('harvest.statusLabel')}</label>
      <div className="kind-row">
        {statuses.map((option) => {
          const blocked = blockFor(option) != null;
          return (
            <button
              key={option}
              type="button"
              aria-disabled={blocked || undefined}
              className={
                value === option ? 'kind-chip active' : blocked ? 'kind-chip blocked' : 'kind-chip'
              }
              onClick={() => select(option)}
            >
              <span>{t(HARVEST_STATUS_LABEL_KEY[option])}</span>
            </button>
          );
        })}
      </div>
      {blockedMessage && <span className="limit-hint">{blockedMessage}</span>}
    </div>
  );
}
