import grapeIcon from '@/assets/goods/grape.png';
import fruitsIcon from '@/assets/properties/fruits.png';
import plantsIcon from '@/assets/properties/plants.png';
import { Modal } from '@/components/ui/modal';
import { useLanguage } from '@/contexts/language-context';
import type { HarvestKind } from '@/types/harvest';
import './harvest-timeline-kind-modal.css';

const CHOICES: { kind: HarvestKind; icon: string; labelKey: string }[] = [
  { kind: 'Crop', icon: plantsIcon, labelKey: 'harvestTimeline.kindCrop' },
  { kind: 'Fruit', icon: fruitsIcon, labelKey: 'harvestTimeline.kindFruit' },
  { kind: 'Wine', icon: grapeIcon, labelKey: 'harvestTimeline.kindWine' },
];

type Props = {
  open: boolean;
  wineOn: boolean;
  onPick: (kind: HarvestKind) => void;
  onClose: () => void;
};

export function HarvestTimelineKindModal({ open, wineOn, onPick, onClose }: Props) {
  const { t } = useLanguage();
  const choices = wineOn ? CHOICES : CHOICES.filter((choice) => choice.kind !== 'Wine');

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{t('harvestTimeline.kindHeading')}</h2>

      <div className="hcal-kind-choices">
        {choices.map((choice) => (
          <button
            key={choice.kind}
            type="button"
            className="hcal-kind-choice"
            onClick={() => onPick(choice.kind)}
          >
            <img src={choice.icon} alt="" />
            <span>{t(choice.labelKey)}</span>
          </button>
        ))}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
      </div>
    </Modal>
  );
}
