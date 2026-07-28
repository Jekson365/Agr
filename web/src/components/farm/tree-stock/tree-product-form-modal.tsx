import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { TREE_PRODUCT_UNIT_OPTIONS } from '@/config/fruit-kinds';
import { useLanguage } from '@/contexts/language-context';
import { createTreeProduct, updateTreeProduct } from '@/services/tree-product-service';
import type { TreeProduct, TreeProductUnit } from '@/types/tree-product';

type Props = {
  open: boolean;
  editingProduct: TreeProduct | null;
  onClose: () => void;
  onSaved: (product: TreeProduct, isNew: boolean) => void;
};

/** Add or edit a catalog product a tree can yield — name plus how it's measured. */
export function TreeProductFormModal({ open, editingProduct, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [nameInput, setNameInput] = useState('');
  const [unit, setUnit] = useState<TreeProductUnit>('Kilogram');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingProduct != null;

  useEffect(() => {
    if (!open) return;
    setNameInput(editingProduct?.name ?? '');
    setUnit(editingProduct?.unit ?? 'Kilogram');
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
        const updated: TreeProduct = { ...editingProduct, name, unit };
        await updateTreeProduct(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createTreeProduct({ name, unit });
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

        <div className="field">
          <label>{t('farm.unit')}</label>
          <div className="kind-row">
            {TREE_PRODUCT_UNIT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={unit === opt.value ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setUnit(opt.value as TreeProductUnit)}
              >
                <span>{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>
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
