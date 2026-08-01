import { CardMenu } from '@/components/farm/card-menu';

/** One card: a good, how much of it, and whether this row can still be changed. */
export type HarvestCard = {
  id: number;
  label: string;
  icon?: string;
  /** The amount with its unit, already assembled — the three lists word it slightly differently. */
  detail: string;
  /** Rows fixed by the harvest's status show no menu. */
  editable: boolean;
};

type Props = {
  title: string;
  cards: HarvestCard[];
  emptyLabel: string;
  onEdit: (id: number) => void;
  onDelete: (card: HarvestCard) => void;
  /** The add button below the list, when adding is allowed in this status. */
  add?: { label: string; onClick: () => void };
};

/**
 * A titled list of goods — the shape the seeds sown, the items planned and the results recorded
 * all take on this page. They differ only in what they are called and which of them can still be
 * changed, so the list is written once and given each in turn.
 */
export function HarvestCardList({ title, cards, emptyLabel, onEdit, onDelete, add }: Props) {
  return (
    <>
      <div className="field harvest-section-label">
        <label>{title}</label>
      </div>

      {cards.length === 0 ? (
        <p className="empty-state">{emptyLabel}</p>
      ) : (
        <div className="list-card-grid harvest-compact-icons">
          {cards.map((card) => (
            <div key={card.id} className="list-card">
              <div className="list-card-body">
                <span className="list-card-icon-wrap">{card.icon && <img src={card.icon} alt="" />}</span>
                <span className="list-card-info">
                  <span className="list-card-title">{card.label}</span>
                  <br />
                  <span className="list-card-subtitle">{card.detail}</span>
                </span>
              </div>
              {card.editable && <CardMenu onEdit={() => onEdit(card.id)} onDelete={() => onDelete(card)} />}
            </div>
          ))}
        </div>
      )}

      {add && (
        <button type="button" className="add-button" onClick={add.onClick}>
          + {add.label}
        </button>
      )}
    </>
  );
}
