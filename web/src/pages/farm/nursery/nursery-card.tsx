import { CardMenu } from '@/components/farm/card-menu';
import { formatIsoDayNumeric } from '@/components/ui/date-utils';
import { fruitKindImage, fruitTypeLabel, treeStockLabel } from '@/config/fruit-kinds';
import {
  isPlantedOut,
  nextStage,
  NURSERY_STAGES,
  NURSERY_STAGE_COLOR,
  NURSERY_STAGE_LABEL_KEY,
  stageDate,
} from '@/config/nursery-stage';
import { useLanguage } from '@/contexts/language-context';
import type { TreeSeedling } from '@/types/tree-seedling';
import type { TreeStock } from '@/types/tree-stock';

type Props = {
  seedling: TreeSeedling;
  orchards: TreeStock[];
  busy: boolean;
  onAdvance: (seedling: TreeSeedling) => void;
  onPlantOut: (seedling: TreeSeedling) => void;
  onEdit: (seedling: TreeSeedling) => void;
  onDelete: (seedling: TreeSeedling) => void;
};

export function NurseryCard({ seedling, orchards, busy, onAdvance, onPlantOut, onEdit, onDelete }: Props) {
  const { t } = useLanguage();

  const settled = isPlantedOut(seedling.stage);
  const currentIndex = NURSERY_STAGES.indexOf(seedling.stage);
  const next = nextStage(seedling.stage);
  const orchard = orchards.find((row) => row.id === seedling.treeStockId);

  return (
    <article className={settled ? 'nursery-card is-planted' : 'nursery-card'}>
      <div className="nursery-card-head">
        <span className="nursery-card-icon">
          <img src={fruitKindImage(seedling.type)} alt="" />
        </span>

        <span className="nursery-card-text">
          <span className="nursery-card-title">{seedling.name.trim() || fruitTypeLabel(seedling.type, t)}</span>
          <span className="nursery-card-sub">
            {fruitTypeLabel(seedling.type, t)} · {t('nursery.seedlingCount', { count: seedling.quantity })}
          </span>
        </span>

        {!settled && (
          <CardMenu onEdit={() => onEdit(seedling)} onDelete={() => onDelete(seedling)} />
        )}
      </div>

      <ol className="nursery-steps">
        {NURSERY_STAGES.map((stage, index) => {
          const done = index <= currentIndex;
          const date = stageDate(seedling, stage);
          return (
            <li key={stage} className={done ? 'nursery-step done' : 'nursery-step'}>
              <span
                className="nursery-step-dot"
                style={done ? { background: NURSERY_STAGE_COLOR[stage], borderColor: NURSERY_STAGE_COLOR[stage] } : undefined}
              />
              <span className="nursery-step-name">{t(NURSERY_STAGE_LABEL_KEY[stage])}</span>
              <span className="nursery-step-date">{done && date ? formatIsoDayNumeric(date) : '—'}</span>
            </li>
          );
        })}
      </ol>

      {seedling.location && (
        <p className="nursery-card-line">
          {t('nursery.location')}: <strong>{seedling.location}</strong>
        </p>
      )}

      {settled && (
        <p className="nursery-card-line">
          {t('nursery.plantedInto', {
            count: seedling.plantedOutQuantity,
            orchard: orchard ? treeStockLabel(orchard, t) : t('nursery.orchardGone'),
          })}
        </p>
      )}

      {seedling.notes && <p className="nursery-card-note">{seedling.notes}</p>}

      {!settled && (
        <div className="nursery-card-actions">
          {next && (
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => onAdvance(seedling)}>
              {t('nursery.advanceTo', { stage: t(NURSERY_STAGE_LABEL_KEY[next]) })}
            </button>
          )}
          {seedling.stage === 'Ready' && (
            <button type="button" className="btn" disabled={busy} onClick={() => onPlantOut(seedling)}>
              {t('nursery.plantOutAction')}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
