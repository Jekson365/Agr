import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { TREE_PRODUCT_DEFAULT_UNIT } from '@/config/fruit-kinds';
import { useLanguage } from '@/contexts/language-context';
import { createTreeProduct, updateTreeProduct } from '@/services/tree-product-service';
import type { TreeProduct } from '@/types/tree-product';

type Props = {
  open: boolean;
  editingProduct: TreeProduct | null;
  onClose: () => void;
  onSaved: (product: TreeProduct, isNew: boolean) => void;
};

/** Add or edit a catalog product a tree can yield. Only the name is asked for: produce is weighed,
 *  so the unit isn't a choice — an older product keeps whatever it was created under. */
export function TreeProductFormModal({ open, editingProduct, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingProduct != null;

  useEffect(() => {
    if (!open) return;
    setNameInput(editingProduct?.name ?? '');
    setFormError(null);
  }, [open, editingProduct]);

  const canSubmit = nameInput.trim() !== '' && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;

    setSaving(true);
    setFormError(null);
    try {
      const name = nameInput.trim();
      if (isEditing) {
        // Only the name is editable, so the product keeps the unit it already carries — its
        // recorded amounts were entered in it.
        const updated: TreeProduct = { ...editingProduct, name };
        await updateTreeProduct(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createTreeProduct({ name, unit: TREE_PRODUCT_DEFAULT_UNIT });
        onSaved(created, true);
      }
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{isEditing ? t('treeProduct.edit') : t('treeProduct.add')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('treeProduct.name')}</label>
          <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder={t('treeProduct.producesPlaceholder')} />
        </div>

        {formError && <div className="error-banner">{formError}</div>}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn" onClick={handleSubmit} disabled={!canSubmit}>
          {isEditing ? t('common.save') : t('common.add')}
        </button>
      </div>
    </Modal>
  );
}
