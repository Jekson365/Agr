import { CheckSquareIcon, PlusIcon } from '@/components/icons/misc-icons';
import { CheckIcon, CloseIcon, ShapeIcon } from '@/components/icons/tool-icons';
import { useLanguage } from '@/contexts/language-context';
import './treatment-rail.css';

type Props = {
  editing: boolean;
  many: boolean;
  picked: number;
  dirty: boolean;
  saving: boolean;
  onToggleEditing: () => void;
  onToggleMany: () => void;
  onAssign: () => void;
  onClear: () => void;
  onSave: () => void;
};

export function TreatmentPlanRail({
  editing,
  many,
  picked,
  dirty,
  saving,
  onToggleEditing,
  onToggleMany,
  onAssign,
  onClear,
  onSave,
}: Props) {
  const { t } = useLanguage();

  return (
    <div className="trt-rail">
      <button
        type="button"
        className={editing ? 'trt-rail-tool is-on' : 'trt-rail-tool'}
        title={t('treatment.editArea')}
        aria-label={t('treatment.editArea')}
        aria-pressed={editing}
        onClick={onToggleEditing}
      >
        <ShapeIcon width={18} height={18} />
      </button>

      <button
        type="button"
        className={many ? 'trt-rail-tool is-on' : 'trt-rail-tool'}
        disabled={editing}
        title={t('treatment.selectMany')}
        aria-label={t('treatment.selectMany')}
        aria-pressed={many}
        onClick={onToggleMany}
      >
        <CheckSquareIcon width={18} height={18} />
      </button>

      <button
        type="button"
        className="trt-rail-tool is-primary"
        title={t('treatment.assignData')}
        aria-label={t('treatment.assignData')}
        disabled={editing || picked === 0}
        onClick={onAssign}
      >
        <PlusIcon width={18} height={18} />
      </button>

      <button
        type="button"
        className="trt-rail-tool"
        title={t('common.clear')}
        aria-label={t('common.clear')}
        disabled={editing || picked === 0}
        onClick={onClear}
      >
        <CloseIcon width={18} height={18} />
      </button>

      <button
        type="button"
        className="trt-rail-tool is-save"
        title={t('common.save')}
        aria-label={t('common.save')}
        disabled={!dirty || saving}
        onClick={onSave}
      >
        <CheckIcon width={18} height={18} />
      </button>

      {picked > 0 && (
        <span className="trt-rail-count" title={t('treatment.selectedTrees', { count: picked })}>
          {picked}
        </span>
      )}
    </div>
  );
}
