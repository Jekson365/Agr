import { useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { useLanguage } from '@/contexts/language-context';
import type { AdminUser } from '@/types/admin';
import './manager-delete.css';

type Props = {
  user: AdminUser | null;
  onClose: () => void;
  onConfirm: (user: AdminUser) => Promise<void>;
};

function confirmationTextFor(user: AdminUser): string {
  return user.email || user.phoneNumber || String(user.id);
}

export function DeleteUserModal({ user, onClose, onConfirm }: Props) {
  const { t } = useLanguage();

  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expected = user ? confirmationTextFor(user) : '';
  const matches = expected.length > 0 && typed.trim().toLowerCase() === expected.toLowerCase();
  const name = user ? `${user.name} ${user.surname}`.trim() || expected : '';

  function reset() {
    setTyped('');
    setError(null);
  }

  function close() {
    if (busy) return;
    reset();
    onClose();
  }

  async function confirm() {
    if (!user || !matches) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(user);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={user !== null} onClose={close}>
      <h2 className="modal-title">{t('manager.deleteUserTitle')}</h2>
      <p className="modal-body-text">{t('manager.deleteUserBody', { name })}</p>

      <label className="manager-delete-label">
        {t('manager.deleteUserTypeToConfirm', { value: expected })}
        <input
          className="manager-delete-input"
          value={typed}
          autoComplete="off"
          spellCheck={false}
          disabled={busy}
          onChange={(event) => setTyped(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void confirm();
          }}
        />
      </label>

      {error && <div className="error-banner">{error}</div>}

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" disabled={busy} onClick={close}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn btn-danger" disabled={!matches || busy} onClick={() => void confirm()}>
          {busy ? '…' : t('manager.deleteUserConfirm')}
        </button>
      </div>
    </Modal>
  );
}
