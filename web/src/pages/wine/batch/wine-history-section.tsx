import { useState } from 'react';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import { formatIsoDayNumeric } from '@/components/ui/date-utils';
import { round2, WINE_SOURCE_LABEL_KEY } from '@/config/wine';
import { useLanguage } from '@/contexts/language-context';
import { deleteWineMovement } from '@/services/wine-movement-service';
import type { WineMovement } from '@/types/wine';
import type { WineBatchDetail } from './use-wine-batch';
import { WineAdjustModal } from './wine-adjust-modal';

type Props = {
  detail: WineBatchDetail;
};

const signed = (value: number) => `${value > 0 ? '+' : ''}${round2(value)}`;

export function WineHistorySection({ detail }: Props) {
  const { t } = useLanguage();
  const { batch, movements } = detail;

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<WineMovement | null>(null);

  if (!batch) return null;

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await deleteWineMovement(confirmDelete.id);
      await detail.refresh();
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <section className="hd-panel">
      <div className="wine-section-head">
        <h2 className="hd-panel-title">{t('wine.tabHistory')}</h2>
        {!batch.isDeleted && batch.stage === 'Stocked' && (
          <button type="button" className="hd-button" onClick={() => setAdjustOpen(true)}>
            {t('wine.adjust')}
          </button>
        )}
      </div>

      {movements.length === 0 ? (
        <p className="hd-empty">{t('wine.historyEmpty')}</p>
      ) : (
        <ul className="wine-ledger">
          {movements.map((movement) => (
            <li key={movement.id} className="wine-ledger-row">
              <span className="wine-ledger-date">{formatIsoDayNumeric(movement.date)}</span>
              <span className="wine-ledger-source">
                {t(WINE_SOURCE_LABEL_KEY[movement.source])}
                {movement.note && <small>{movement.note}</small>}
              </span>
              <span className={movement.delta < 0 ? 'wine-ledger-amount is-out' : 'wine-ledger-amount'}>
                {movement.delta !== 0 && `${signed(movement.delta)} ${t('wine.unitLiter')}`}
              </span>
              <span className={movement.bottleDelta < 0 ? 'wine-ledger-amount is-out' : 'wine-ledger-amount'}>
                {movement.bottleDelta !== 0 && `${signed(movement.bottleDelta)} ${t('wine.unitBottle')}`}
              </span>
              {movement.source === 'Manual' && !batch.isDeleted ? (
                <button type="button" className="wine-ledger-remove" onClick={() => setConfirmDelete(movement)}>
                  ✕
                </button>
              ) : (
                <span />
              )}
            </li>
          ))}
        </ul>
      )}

      <WineAdjustModal
        open={adjustOpen}
        batchId={batch.id}
        onClose={() => setAdjustOpen(false)}
        onSaved={detail.refresh}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete ? t(WINE_SOURCE_LABEL_KEY[confirmDelete.source]) : ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
}
