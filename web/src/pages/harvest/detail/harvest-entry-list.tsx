import { useLanguage } from '@/contexts/language-context';
import './harvest-detail-panels.css';

export type EntryRow = {
  id: number;
  icon: string;
  title: string;
  amount: string;
  removed: boolean;
};

type Props = {
  title: string;
  note?: string;
  rows: EntryRow[];
  emptyText: string;
  addLabel?: string;
  canEdit: boolean;
  /** Caps the list's height so a long one scrolls inside the panel, keeping the add button and
   *  the tabs above it in reach instead of pushing them off the screen. */
  scrollable?: boolean;
  onAdd?: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
};

/**
 * One section's rows, drawn as large cards. Edit and delete are written out as buttons instead of
 * hiding behind the card menu used elsewhere: a menu costs a press to discover and another to aim
 * at, and the two words are what a row can actually have done to it.
 */
export function HarvestEntryList({
  title,
  note,
  rows,
  emptyText,
  addLabel,
  canEdit,
  scrollable,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const { t } = useLanguage();

  return (
    <section className="hd-panel">
      <h2 className="hd-panel-title">{title}</h2>
      {note && <p className="hd-note">{note}</p>}

      {rows.length === 0 ? (
        <p className="hd-empty">{emptyText}</p>
      ) : (
        <div className={scrollable ? 'hd-rows scroll' : 'hd-rows'}>
          {rows.map((row) => (
            <div key={row.id} className="hd-row">
              <img src={row.icon} alt="" />
              <span className="hd-row-text">
                <span className="hd-row-title">{row.title}</span>
                <span className="hd-row-amount">
                  {row.amount}
                  {row.removed && <span className="hd-removed">{t('balance.removed')}</span>}
                </span>
              </span>
              {canEdit && (
                <span className="hd-row-actions">
                  <button type="button" className="hd-button" onClick={() => onEdit(row.id)}>
                    {t('common.edit')}
                  </button>
                  <button type="button" className="hd-button danger" onClick={() => onDelete(row.id)}>
                    {t('common.delete')}
                  </button>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && onAdd && addLabel && (
        <button type="button" className="hd-button primary" onClick={onAdd}>
          + {addLabel}
        </button>
      )}
    </section>
  );
}
