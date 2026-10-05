import { useLanguage } from '@/contexts/language-context';
import '@/pages/harvest/detail/harvest-tabs.css';
import { WINE_SECTION_ICON, WINE_SECTION_LABEL_KEY, type WineSection } from './wine-sections';

type Props = {
  sections: WineSection[];
  active: WineSection;
  counts: Partial<Record<WineSection, number>>;
  onSelect: (section: WineSection) => void;
};

export function WineSectionTabs({ sections, active, counts, onSelect }: Props) {
  const { t } = useLanguage();

  return (
    <div className="hd-tabs">
      {sections.map((section) => {
        const count = counts[section];
        const name = t(WINE_SECTION_LABEL_KEY[section]);
        return (
          <button
            key={section}
            type="button"
            className="hd-tab"
            aria-pressed={section === active}
            title={name}
            onClick={() => onSelect(section)}
          >
            <img src={WINE_SECTION_ICON[section]} alt="" />
            <span className="hd-tab-label">{name}</span>
            {count != null && count > 0 && <span className="hd-tab-count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
