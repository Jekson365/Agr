import coinIcon from '@/assets/coin.png';
import harvestIcon from '@/assets/icons/harvest.png';
import reportIcon from '@/assets/icons/report.png';
import fruitsIcon from '@/assets/properties/fruits.png';
import gradingIcon from '@/assets/properties/balance.png';
import plantsIcon from '@/assets/properties/plants.png';
import seedIcon from '@/assets/seed.png';
import { useLanguage } from '@/contexts/language-context';
import './harvest-nav-rail.css';

export type HarvestSection = 'overview' | 'seeds' | 'trees' | 'result' | 'money' | 'grading' | 'chemicals';

export const HARVEST_SECTION_ICON: Record<HarvestSection, string> = {
  overview: reportIcon,
  seeds: seedIcon,
  trees: fruitsIcon,
  result: harvestIcon,
  money: coinIcon,
  grading: gradingIcon,
  chemicals: plantsIcon,
};

export const HARVEST_SECTION_LABEL_KEY: Record<HarvestSection, string> = {
  overview: 'harvest.navOverview',
  seeds: 'harvest.navSeeds',
  trees: 'harvest.navTrees',
  result: 'harvest.navResult',
  money: 'harvest.navMoney',
  grading: 'harvestGrading.action',
  chemicals: 'harvest.navChemicals',
};

type Props = {
  sections: HarvestSection[];
  active: HarvestSection;
  counts: Partial<Record<HarvestSection, number>>;
  onSelect: (section: HarvestSection) => void;
};

/**
 * The page's navigation: one icon cube per part of the harvest, stacked down the right of the
 * section it switches. The name lives in the cube's tooltip rather than under it, so the column
 * stays narrow and the record beside it keeps the width.
 */
export function HarvestSectionNav({ sections, active, counts, onSelect }: Props) {
  const { t } = useLanguage();

  return (
    <nav className="hd-nav">
      {sections.map((section) => {
        const count = counts[section];
        const name = t(HARVEST_SECTION_LABEL_KEY[section]);
        const label = count != null && count > 0 ? `${name} (${count})` : name;
        return (
          <button
            key={section}
            type="button"
            className="hd-nav-cube"
            aria-pressed={section === active}
            title={label}
            aria-label={label}
            onClick={() => onSelect(section)}
          >
            <img src={HARVEST_SECTION_ICON[section]} alt="" />
          </button>
        );
      })}
    </nav>
  );
}
