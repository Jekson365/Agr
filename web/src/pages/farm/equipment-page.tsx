import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import equipmentPlaceholder from '@/assets/properties/equipment.png';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import { EquipmentFormModal } from '@/components/farm/equipment/equipment-form-modal';
import '@/components/farm/farm-crud.css';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { deleteEquipment, getEquipment } from '@/services/equipment-service';
import type { Equipment } from '@/types/equipment';

export function EquipmentPage() {
  const { t } = useLanguage();

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setEquipment(await getEquipment());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEdit(item: Equipment) {
    setEditingItem(item);
    setFormOpen(true);
  }

  function handleDelete(item: Equipment) {
    setFormOpen(false);
    setConfirmDelete({ id: item.id, name: item.name });
  }

  async function confirmDeleteItem() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteEquipment(id);
      setEquipment((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  function handleSaved(item: Equipment, isNew: boolean) {
    setEquipment((prev) => (isNew ? [...prev, item] : prev.map((i) => (i.id === item.id ? item : i))));
  }

  return (
    <div>
      <Link to="/farm" className="back-link">
        ← {t('farm.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('equipment.title')}</h1>
        <button type="button" className="add-button" onClick={openAdd}>
          + {t('equipment.add')}
        </button>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('equipment.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : equipment.length === 0 ? (
        <div className="empty-state">{t('equipment.empty')}</div>
      ) : (
        <div className="product-grid">
          {equipment.map((item) => (
            <button key={item.id} type="button" className="product-card" onClick={() => openEdit(item)}>
              <img
                src={item.imagePath ? resolveAssetUrl(item.imagePath) : equipmentPlaceholder}
                alt=""
                className="product-image"
              />
              <div className="product-info">
                <div className="list-card-title">{item.name}</div>
                <div className="list-card-subtitle">
                  {t('equipment.quantity')}: {item.quantity}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <EquipmentFormModal
        open={formOpen}
        editingItem={editingItem}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        onDelete={handleDelete}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.name ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteItem}
      />
    </div>
  );
}
