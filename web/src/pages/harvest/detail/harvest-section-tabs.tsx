import { useLanguage } from '@/contexts/language-context';
import { HARVEST_SECTION_ICON, HARVEST_SECTION_LABEL_KEY, type HarvestSection } from './harvest-section-nav';
import './harvest-tabs.css';

type Props = {
  sections: HarvestSection[];
  active: HarvestSection;
  counts: Partial<Record<HarvestSection, number>>;
  onSelect: (section: HarvestSection) => void;
};

export function HarvestSectionTabs({ sections, active, counts, onSelect }: Props) {
  const { t } = useLanguage();

  return (
    <div className="hd-tabs">
      {sections.map((section) => {
        const count = counts[section];
        const name = t(HARVEST_SECTION_LABEL_KEY[section]);

        return (
          <button
            key={section}
            type="button"
            className="hd-tab"
            aria-pressed={section === active}
            title={name}
            onClick={() => onSelect(section)}
          >
            <img src={HARVEST_SECTION_ICON[section]} alt="" />
            <span className="hd-tab-label">{name}</span>
            {count != null && count > 0 && <span className="hd-tab-count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
