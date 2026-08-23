import coinIcon from '@/assets/coin.png';
import harvestIcon from '@/assets/icons/harvest.png';
import fruitsIcon from '@/assets/properties/fruits.png';
import plantsIcon from '@/assets/properties/plants.png';
import seedIcon from '@/assets/seed.png';
import { useLanguage } from '@/contexts/language-context';
import './harvest-detail.css';

export type HarvestSection = 'seeds' | 'trees' | 'result' | 'money' | 'chemicals';

const HARVEST_SECTION_ICON: Record<HarvestSection, string> = {
  seeds: seedIcon,
  trees: fruitsIcon,
  result: harvestIcon,
  money: coinIcon,
  chemicals: plantsIcon,
};

const HARVEST_SECTION_LABEL_KEY: Record<HarvestSection, string> = {
  seeds: 'harvest.navSeeds',
  trees: 'harvest.navTrees',
  result: 'harvest.navResult',
  money: 'harvest.navMoney',
  chemicals: 'harvest.navChemicals',
};

type Props = {
  sections: HarvestSection[];
  active: HarvestSection;
  counts: Partial<Record<HarvestSection, number>>;
  onSelect: (section: HarvestSection) => void;
};

/**
 * The page's navigation: one large picture button per part of the harvest, with only the chosen
 * part rendered underneath. The whole record used to be one long scroll, which meant reading past
 * three sections to reach the fourth — here every part is one press away and always in the same
 * place. The count on a button says what is already recorded there without opening it.
 */
export function HarvestSectionNav({ sections, active, counts, onSelect }: Props) {
  const { t } = useLanguage();

  return (
    <div className="hd-nav">
      {sections.map((section) => {
        const count = counts[section];
        return (
          <button
            key={section}
            type="button"
            className="hd-nav-item"
            aria-pressed={section === active}
            onClick={() => onSelect(section)}
          >
            <img src={HARVEST_SECTION_ICON[section]} alt="" />
            <span>{t(HARVEST_SECTION_LABEL_KEY[section])}</span>
            {count != null && <span className="hd-nav-count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
