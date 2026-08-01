import { useLanguage } from '@/contexts/language-context';

type Props<T extends string> = {
  options: { value: string; labelKey: string }[];
  selected: T;
  onSelect: (value: T) => void;
};

/** A row of unit chips. The stock's own unit and its seed's are picked the same way from two
 * different lists, so the row is written once and given whichever list applies. */
export function UnitChips<T extends string>({ options, selected, onSelect }: Props<T>) {
  const { t } = useLanguage();

  return (
    <div className="kind-row">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={selected === option.value ? 'kind-chip active' : 'kind-chip'}
          onClick={() => onSelect(option.value as T)}
        >
          <span>{t(option.labelKey)}</span>
        </button>
      ))}
    </div>
  );
}
