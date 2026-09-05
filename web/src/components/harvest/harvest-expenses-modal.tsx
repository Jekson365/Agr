import { Modal } from '@/components/ui/modal';
import { useLanguage } from '@/contexts/language-context';
import type { Harvest } from '@/types/harvest';
import { HarvestMoneyForm } from './harvest-money-form';

type Props = {
  open: boolean;
  harvest: Harvest;
  onClose: () => void;
  onSaved: (harvest: Harvest) => void;
};

export function HarvestExpensesModal({ open, harvest, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{t('harvest.expensesTitle')}</h2>
      <HarvestMoneyForm harvest={harvest} onSaved={onSaved} onCancel={onClose} />
    </Modal>
  );
}
