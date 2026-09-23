import { formatLocalizedIsoDay } from '@/components/ui/date-utils';
import { treeTreatmentColour, treeTreatmentLabel } from '@/config/tree-treatment';
import { useLanguage } from '@/contexts/language-context';
import type { SpotGroup } from './treatment-spot-groups';
import './treatment-spot.css';

type Props = {
  groups: SpotGroup[];
  activeKey: string | null;
  onPick: (group: SpotGroup) => void;
  onDelete: (group: SpotGroup) => void;
};

export function TreatmentSpotList({ groups, activeKey, onPick, onDelete }: Props) {
  const { t, language } = useLanguage();

  return (
    <div className="trt-spot-panel">
      <span className="trt-spot-panel-title">{t('treatment.spotRecords')}</span>

      {groups.length === 0 ? (
        <p className="trt-pos-hint">{t('treatment.spotEmpty')}</p>
      ) : (
        <ul className="trt-spot-list">
          {groups.map((group) => (
            <li key={group.key} className={group.key === activeKey ? 'trt-spot-row is-active' : 'trt-spot-row'}>
              <button type="button" className="trt-spot-body" onClick={() => onPick(group)}>
                <span
                  className="trt-spot-dot"
                  style={{ background: treeTreatmentColour(group.type) }}
                  aria-hidden="true"
                />
                <span className="trt-spot-main">
                  <span className="trt-spot-head">
                    <b>{treeTreatmentLabel(group.type, t)}</b>
                    <span className="trt-spot-meta">
                      {formatLocalizedIsoDay(group.date, language)} ·{' '}
                      {t('treatment.spotTrees', { count: group.trees.length })}
                    </span>
                  </span>
                  {group.note && <span className="trt-spot-note">{group.note}</span>}
                </span>
              </button>
              <button
                type="button"
                className="trt-spot-remove"
                title={t('common.delete')}
                onClick={() => onDelete(group)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
