import grapeIcon from '@/assets/goods/grape.png';
import '@/components/farm/kind-picker.css';
import { useLanguage } from '@/contexts/language-context';
import type { GrapeOption } from '@/pages/wine/wine-grape-options';

type Props = {
  choices: GrapeOption[];
  selected: GrapeOption | null;
  onSelect: (treeProductId: number) => void;
  amount: string;
  onAmount: (value: string) => void;
  over: boolean;
};

export function WineGrapePicker({ choices, selected, onSelect, amount, onAmount, over }: Props) {
  const { t } = useLanguage();

  return (
    <>
      <div className="field">
        <label>{t('wine.grapesTitle')}</label>
        <span className="limit-hint">{t('wine.grapesHint')}</span>
        {choices.length === 0 ? (
          <p className="limit-hint">{t('wine.grapesNone')}</p>
        ) : (
          <div className="kind-row">
            {choices.map((option) => (
              <button
                key={option.treeProductId}
                type="button"
                className={selected?.treeProductId === option.treeProductId ? 'kind-chip active' : 'kind-chip'}
                onClick={() => onSelect(option.treeProductId)}
              >
                <img src={grapeIcon} className="kind-chip-icon" alt="" />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="field">
          <label>{t('farm.amount')}</label>
          <input value={amount} inputMode="decimal" placeholder="0" onChange={(e) => onAmount(e.target.value)} />
          <span className={over ? 'limit-hint listing-quantity-over' : 'limit-hint'}>
            {t('wine.grapesAvailable', { amount: selected.available })}
          </span>
        </div>
      )}
    </>
  );
}
