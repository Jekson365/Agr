import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { registerSeller } from '@/services/seller-service';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called once the account is a seller, so the caller can carry on with what it was doing. */
  onRegistered?: () => void;
};

/**
 * Registering to sell. The same account either way — this adds the ability to list and takes
 * nothing away, so a seller goes on ordering from other sellers exactly as before.
 *
 * Also serves an existing seller editing what they trade under: the endpoint is idempotent and
 * keeps the date they first registered.
 */
export function SellerRegistrationModal({ open, onClose, onRegistered }: Props) {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();

  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSellerName(user?.sellerName || user?.farmName || user?.name || '');
    setSellerPhone(user?.sellerPhone || user?.phoneNumber || '');
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const canSave = sellerName.trim().length >= 2 && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await registerSeller({ sellerName: sellerName.trim(), sellerPhone: sellerPhone.trim() });
      // The stored session still says "not a seller" until it is read back.
      await refreshUser();
      onRegistered?.();
      onClose();
    } catch {
      setError(t('seller.saveError'));
    } finally {
      setSaving(false);
    }
  }

  const alreadySeller = user?.isSeller === true;

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{t(alreadySeller ? 'seller.editTitle' : 'seller.registerTitle')}</h2>
      <p className="modal-body-text">{t(alreadySeller ? 'seller.editBody' : 'seller.registerBody')}</p>

      <div className="form-fields">
        <div className="field">
          <label>{t('seller.name')}</label>
          <input value={sellerName} onChange={(e) => setSellerName(e.target.value)} placeholder={t('seller.namePlaceholder')} />
        </div>

        <div className="field">
          <label>{t('seller.phone')}</label>
          <input
            value={sellerPhone}
            onChange={(e) => setSellerPhone(e.target.value)}
            placeholder={t('seller.phonePlaceholder')}
            inputMode="tel"
          />
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn" onClick={handleSave} disabled={!canSave}>
          {t(alreadySeller ? 'common.save' : 'seller.register')}
        </button>
      </div>
    </Modal>
  );
}
