import { Modal } from '@/components/ui/modal';
import { useLanguage } from '@/contexts/language-context';

type Props = {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  /** Uses the red delete-style button instead of the normal green submit style. */
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Generic yes/no confirmation dialog — for delete confirmations specifically, use ConfirmDeleteModal. */
export function ConfirmModal({ open, title, body, confirmLabel, destructive, onCancel, onConfirm }: Props) {
  const { t } = useLanguage();

  return (
    <Modal open={open} onClose={onCancel}>
      <h2 className="modal-title">{title}</h2>
      {body && <p className="modal-body-text">{body}</p>}
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          {t('common.cancel')}
        </button>
        <button type="button" className={destructive ? 'btn btn-danger' : 'btn'} onClick={onConfirm}>
          {confirmLabel ?? t('common.confirm')}
        </button>
      </div>
    </Modal>
  );
}
