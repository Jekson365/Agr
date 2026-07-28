import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { LivestockDetailFormModal } from '@/components/farm/livestock/livestock-detail-form-modal';
import { StockFeedRow } from '@/components/farm/livestock/stock-feed-row';
import { formatAge } from '@/config/age';
import { livestockImage } from '@/config/livestock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { ApiError, resolveAssetUrl } from '@/services/api-client';
import { deleteLivestockDetail, getLivestockDetails } from '@/services/livestock-detail-service';
import { getLivestockItem } from '@/services/livestock-service';
import type { Livestock } from '@/types/livestock';
import type { LivestockDetail } from '@/types/livestock-detail';

export function LivestockDetailPage() {
  const { t } = useLanguage();
  const { id: idParam } = useParams<{ id: string }>();
  const livestockId = Number(idParam);

  const [livestock, setLivestock] = useState<Livestock | null>(null);
  const [details, setDetails] = useState<LivestockDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingDetail, setEditingDetail] = useState<LivestockDetail | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; code: string } | null>(null);

  useEffect(() => {
    if (!livestockId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livestockId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [livestockItem, detailList] = await Promise.all([
        getLivestockItem(livestockId),
        getLivestockDetails(livestockId),
      ]);
      setLivestock(livestockItem);
      setDetails(detailList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingDetail(null);
    setFormOpen(true);
  }

  function openEdit(detail: LivestockDetail) {
    setEditingDetail(detail);
    setFormOpen(true);
  }

  function handleSaved(detail: LivestockDetail, isNew: boolean) {
    setDetails((prev) => (isNew ? [...prev, detail] : prev.map((d) => (d.id === detail.id ? detail : d))));
  }

  async function confirmDeleteDetail() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteLivestockDetail(id);
      setDetails((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      // The server refuses while the animal still has production records.
      setError(
        err instanceof ApiError && err.status === 409
          ? t('farm.deleteHasProduction')
          : err instanceof Error
            ? err.message
            : String(err)
      );
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <div>
      <Link to="/farm/livestock" className="back-link">
        ← {t('farm.livestock')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{livestock?.name ?? t('farm.livestock')}</h1>
        <button type="button" className="add-button" onClick={openAdd} disabled={loading}>
          + {t('livestockDetail.add')}
        </button>
      </div>

      {/* Feed is tracked per group, so it lives on the group's page. */}
      {!loading && !error && (
        <>
          <p className="feed-section-title">{t('feed.title')}</p>
          <StockFeedRow livestockId={livestockId} />
        </>
      )}

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('livestockDetail.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : details.length === 0 ? (
        <p className="empty-state">{t('livestockDetail.empty')}</p>
      ) : (
        <div className="list-card-grid two-col">
          {details.map((detail) => {
            const age = formatAge(detail.bornDate, t);
            const genderLabel = detail.gender ? t(detail.gender === 'Male' ? 'livestockDetail.male' : 'livestockDetail.female') : null;
            return (
              <div key={detail.id} className="list-card">
                <Link to={`/farm/livestock/${livestockId}/animal/${detail.id}`} className="list-card-body">
                  <span className="list-card-icon-wrap">
                    {detail.imagePath ? (
                      <img
                        src={resolveAssetUrl(detail.imagePath)}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }}
                      />
                    ) : livestock ? (
                      <img src={livestockImage(livestock.type)} alt="" />
                    ) : null}
                  </span>
                  <span className="list-card-info">
                    <span className="list-card-title">{detail.code}</span>
                    <br />
                    <span className="list-card-subtitle">
                      {age ? `${t('farm.age')}: ${age}` : ''}
                      {age && genderLabel ? ' · ' : ''}
                      {genderLabel ?? ''}
                    </span>
                  </span>
                </Link>
                <CardMenu onEdit={() => openEdit(detail)} onDelete={() => setConfirmDelete({ id: detail.id, code: detail.code })} />
              </div>
            );
          })}
        </div>
      )}

      <LivestockDetailFormModal
        open={formOpen}
        livestockId={livestockId}
        editingDetail={editingDetail}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.code ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteDetail}
      />
    </div>
  );
}
