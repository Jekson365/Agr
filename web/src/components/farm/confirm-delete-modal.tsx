import { Modal } from '@/components/ui/modal';
import { useLanguage } from '@/contexts/language-context';

type Props = {
  open: boolean;
  name: string;
  /** Overrides the default "cannot be undone" body — e.g. to explain a side effect. */
  body?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteModal({ open, name, body, onCancel, onConfirm }: Props) {
  const { t } = useLanguage();

  return (
    <Modal open={open} onClose={onCancel}>
      <h2 className="modal-title">{t('farm.deleteConfirmTitle', { name })}</h2>
      <p className="modal-body-text">{body ?? t('farm.deleteConfirmBody')}</p>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm}>
          {t('common.delete')}
        </button>
      </div>
    </Modal>
  );
}
