import { formatLocalizedIsoDate, formatLocalizedIsoDay } from '@/components/ui/date-utils';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import type { AnimalProduction } from '@/types/animal-production';
import type { ProductionType } from '@/types/production-type';
import type { Unit } from '@/types/unit';
import { productionTypeLabel, productionUnitLabel } from './production-labels';
import type { ProductionRow } from './production-rows';

/** What a confirm dialog needs to name the thing it is about to undo. */
export type RowTarget = { id: number; label: string };

type Props = {
  rows: ProductionRow[];
  isGroup: boolean;
  typeById: Map<number, ProductionType>;
  unitById: Map<number, Unit>;
  animalCodeById: Map<number, string>;
  onEdit: (record: AnimalProduction) => void;
  onDelete: (target: RowTarget) => void;
  onRollbackSale: (target: RowTarget) => void;
};

/** Collection batches and the marketplace sales drawn against them, newest first. The group view
 * carries one extra column — how many animals a batch covered. */
export function ProductionTable({
  rows,
  isGroup,
  typeById,
  unitById,
  animalCodeById,
  onEdit,
  onDelete,
  onRollbackSale,
}: Props) {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  /** A unit's short form where it has one ("kg"), else its full translated name. */
  const shortUnit = (unit: Unit | undefined) => unit?.shortName ?? productionUnitLabel(unit, t);

  return (
    <div className="production-table-wrap">
      <div className={isGroup ? 'production-table group' : 'production-table'}>
        <div className="production-row production-row-head">
          <span>{t('production.type')}</span>
          <span>{t('production.collectionDate')}</span>
          <span className="num">{t('production.quantity')}</span>
          {isGroup && <span className="num">{t('production.animalCount')}</span>}
          <span>{t('production.quality')}</span>
          <span className="num">{t('production.pricePerUnit')}</span>
          <span className="num">{t('production.totalPrice')}</span>
          <span>{t('production.details')}</span>
          <span />
        </div>

        {rows.map((row) => {
          if (row.kind === 'sale') {
            const { movement } = row;
            const unit = unitById.get(movement.unitId);
            const typeName = productionTypeLabel(typeById.get(movement.productionTypeId), t);

            return (
              <div key={row.key} className="production-row sale">
                <span className="production-row-cell">
                  {typeName}
                  <span className="production-row-animal"> · {t('market.sold')}</span>
                </span>
                <span className="production-row-cell muted">{formatLocalizedIsoDate(movement.createdAt, language)}</span>
                <span className="production-row-cell num strong sale-delta">
                  {movement.delta} <span className="production-row-unit">{shortUnit(unit)}</span>
                </span>
                {isGroup && <span className="production-row-cell num muted">—</span>}
                <span className="production-row-cell muted">—</span>
                <span className="production-row-cell num muted">—</span>
                <span className="production-row-cell num muted">—</span>
                <span className="production-row-cell muted">{t('market.title')}</span>
                <span className="production-row-actions">
                  <button
                    type="button"
                    className="production-row-delete"
                    onClick={() =>
                      onRollbackSale({
                        id: movement.id,
                        label: `${typeName} · ${Math.abs(movement.delta)} ${shortUnit(unit)}`,
                      })
                    }
                    aria-label={t('production.rollbackSale')}
                    title={t('production.rollbackSale')}
                  >
                    ↺
                  </button>
                </span>
              </div>
            );
          }

          const { record } = row;
          const unit = unitById.get(record.unitId);
          const typeName = productionTypeLabel(typeById.get(record.productionTypeId), t);
          const dateLabel = formatLocalizedIsoDay(record.collectionDate, language);
          const isSingle = isGroup && record.animalId != null;
          const animalCode = isSingle && record.animalId != null ? animalCodeById.get(record.animalId) : undefined;

          // Collector, batch and notes are low-frequency and long; they share one cell that
          // ellipsises, with the full text on hover, so the numeric columns stay aligned.
          const details = [
            record.collectedBy,
            record.batchNumber ? `${t('production.batchNumber')}: ${record.batchNumber}` : null,
            record.notes,
          ]
            .filter(Boolean)
            .join(' · ');

          return (
            <div
              key={row.key}
              className={
                record.isRealization ? 'production-row realization' : isSingle ? 'production-row single' : 'production-row'
              }
            >
              <button type="button" className="production-row-cell type" onClick={() => onEdit(record)} title={t('common.edit')}>
                {typeName}
                {animalCode && <span className="production-row-animal"> · {animalCode}</span>}
                {/* Its animals left the herd, which is why the group's count no longer adds up
                    against the rest of this history. */}
                {record.isRealization && (
                  <span className="production-realization-badge">{t('production.realizationBadge')}</span>
                )}
              </button>
              <span className="production-row-cell muted">{dateLabel}</span>
              <span className="production-row-cell num strong income-delta">
                +{record.quantity} <span className="production-row-unit">{shortUnit(unit)}</span>
              </span>
              {isGroup && (
                <span className={record.isRealization ? 'production-row-cell num animals-out' : 'production-row-cell num'}>
                  {record.isRealization ? `−${record.animalCount}` : record.animalCount}
                </span>
              )}
              <span className="production-row-cell">{record.quality || '—'}</span>
              <span className="production-row-cell num">
                {record.pricePerUnit != null ? formatPrice(record.pricePerUnit) : '—'}
              </span>
              <span className="production-row-cell num value">
                {record.totalPrice != null ? formatPrice(record.totalPrice) : '—'}
              </span>
              <span className="production-row-cell muted" title={details || undefined}>
                {details || '—'}
              </span>
              <span className="production-row-actions">
                <button
                  type="button"
                  className="production-row-edit"
                  onClick={() => onEdit(record)}
                  aria-label={t('production.editRecord')}
                  title={t('production.editRecord')}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="production-row-delete"
                  onClick={() => onDelete({ id: record.id, label: `${dateLabel} · ${typeName}` })}
                  aria-label={t('common.delete')}
                  title={t('common.delete')}
                >
                  ✕
                </button>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
