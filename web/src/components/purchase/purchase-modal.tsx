import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { todayIsoDate } from '@/components/ui/date-utils';
import { useAuth } from '@/contexts/auth-context';
import { useConfiguration } from '@/contexts/configuration-context';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import { createPurchase, updatePurchase } from '@/services/purchase-service';
import { CROP_FARMING_CONFIG, FRUIT_STOCK_CONFIG, LIVESTOCK_CONFIG } from '@/types/configuration';
import type { PurchaseDocument, PurchaseItemKind } from '@/types/purchase';
import { PurchaseDocumentFields } from './purchase-document-fields';
import { PurchaseItemRow } from './purchase-item-row';
import { linesFromDocument, newLine, toItems, type PurchaseLine } from './purchase-lines';
import { EMPTY_TARGETS, loadPurchaseTargets, PURCHASE_KIND_ORDER, type PurchaseTargets } from './purchase-targets';
import './purchase-modal.css';

type Props = {
  open: boolean;
  /** The document being rewritten, or null to enter a new one. */
  editing?: PurchaseDocument | null;
  onClose: () => void;
  onSaved?: (document: PurchaseDocument, isNew: boolean) => void;
};

export function PurchaseModal({ open, editing, onClose, onSaved }: Props) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isOn } = useConfiguration();
  const { formatPrice } = useCurrency();

  const [targets, setTargets] = useState<PurchaseTargets>(EMPTY_TARGETS);
  const [kinds, setKinds] = useState<PurchaseItemKind[]>([]);
  const [seller, setSeller] = useState('');
  const [date, setDate] = useState<string | null>(todayIsoDate());
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<PurchaseLine[]>([]);
  const [nextId, setNextId] = useState(1);
  /** Lines of the document being edited whose target has since been removed. */
  const [dropped, setDropped] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    setSeller(editing?.seller ?? '');
    setDate(editing?.date ?? todayIsoDate());
    setNote(editing?.note ?? '');
    setLines([]);
    setNextId(1);
    setDropped(0);
    setError(null);
    setLoading(true);

    loadPurchaseTargets(t, {
      livestock: isOn(LIVESTOCK_CONFIG),
      fruits: isOn(FRUIT_STOCK_CONFIG),
      crops: isOn(CROP_FARMING_CONFIG),
      equipment: user?.plan !== 'Free',
    })
      .then((loaded) => {
        if (cancelled) return;
        const available = PURCHASE_KIND_ORDER.filter((kind) => loaded[kind].length > 0);
        setTargets(loaded);
        setKinds(available);

        if (editing) {
          const prefilled = linesFromDocument(editing.items, loaded);
          setLines(prefilled.lines);
          setDropped(prefilled.dropped);
          setNextId(prefilled.lines.length + 1);
          return;
        }

        const first = available[0];
        setLines(first ? [newLine(1, first, loaded)] : []);
        setNextId(2);
      })
      .catch(() => {
        if (!cancelled) setError(t('purchase.loadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing?.id]);

  function addLine() {
    const first = kinds[0];
    if (!first) return;
    setLines((prev) => [...prev, newLine(nextId, first, targets)]);
    setNextId((prev) => prev + 1);
  }

  const items = toItems(lines, targets);
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const canSave = seller.trim() !== '' && items.length === lines.length && lines.length > 0 && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const input = { seller: seller.trim(), date, note: note.trim() || null, items };
      const saved = editing ? await updatePurchase(editing.id, input) : await createPurchase(input);
      onSaved?.(saved, editing == null);
      onClose();
    } catch {
      setError(t('purchase.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} className="purchase-modal">
      <h2 className="form-title">{t(editing ? 'purchase.editTitle' : 'purchase.title')}</h2>

      {loading ? (
        <div className="state-box">…</div>
      ) : kinds.length === 0 ? (
        <p className="modal-body-text">{t('purchase.nothingToBuy')}</p>
      ) : (
        <>
          <PurchaseDocumentFields
            seller={seller}
            onSeller={setSeller}
            date={date}
            onDate={setDate}
            note={note}
            onNote={setNote}
          />

          <div className="purchase-lines">
            {lines.map((line) => (
              <PurchaseItemRow
                key={line.id}
                line={line}
                kinds={kinds}
                targets={targets}
                removable={lines.length > 1}
                onChange={(next) => setLines((prev) => prev.map((row) => (row.id === line.id ? next : row)))}
                onRemove={() => setLines((prev) => prev.filter((row) => row.id !== line.id))}
              />
            ))}
          </div>

          {dropped > 0 && <div className="error-banner">{t('purchase.droppedLines', { count: dropped })}</div>}

          <div className="purchase-footer">
            <button type="button" className="btn btn-secondary" onClick={addLine}>
              + {t('purchase.addItem')}
            </button>
            <span className="purchase-total">
              {t('purchase.total')}: {formatPrice(total)}
            </span>
          </div>
        </>
      )}

      {error && <div className="error-banner">{error}</div>}

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn" onClick={handleSave} disabled={!canSave}>
          {t(editing ? 'common.save' : 'purchase.confirm')}
        </button>
      </div>
    </Modal>
  );
}
