import { Link } from 'react-router-dom';

import animalsIcon from '@/assets/properties/animals.png';
import equipmentIcon from '@/assets/properties/equipment.png';
import fruitsIcon from '@/assets/properties/fruits.png';
import landIcon from '@/assets/properties/land.png';
import plantsIcon from '@/assets/properties/plants.png';
import { useAuth } from '@/contexts/auth-context';
import { useConfiguration } from '@/contexts/configuration-context';
import { useLanguage } from '@/contexts/language-context';
import { CROP_FARMING_CONFIG, FRUIT_STOCK_CONFIG, LIVESTOCK_CONFIG } from '@/types/configuration';
import './farm-page.css';

type SectionKey = 'land' | 'livestock' | 'stock' | 'fruits' | 'balance' | 'equipment';

const SECTIONS: {
  key: SectionKey;
  labelKey: string;
  icon: string;
  to: string;
  /** Shown only while the named configuration is switched on, matching the sidebar's gating. */
  requiresConfig?: string;
}[] = [
  { key: 'land', labelKey: 'farm.land', icon: landIcon, to: '/farm/land' },
  {
    key: 'livestock',
    labelKey: 'farm.livestock',
    icon: animalsIcon,
    to: '/farm/livestock',
    requiresConfig: LIVESTOCK_CONFIG,
  },
  {
    key: 'stock',
    labelKey: 'farm.plantStock',
    icon: plantsIcon,
    to: '/farm/stock',
    requiresConfig: CROP_FARMING_CONFIG,
  },
  { key: 'fruits', labelKey: 'farm.fruits', icon: fruitsIcon, to: '/farm/fruits', requiresConfig: FRUIT_STOCK_CONFIG },
  // No balance tile: each holding now carries its own, reached from that holding's area.
  { key: 'equipment', labelKey: 'equipment.title', icon: equipmentIcon, to: '/farm/equipment' },
];

export function FarmPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isOn } = useConfiguration();

  const sections = SECTIONS.filter(
    (section) =>
      !(section.key === 'equipment' && user?.plan === 'Free') &&
      (!section.requiresConfig || isOn(section.requiresConfig))
  );

  return (
    <div>
      <h1 className="farm-page-title">{t('farm.title')}</h1>
      <div className="farm-section-grid">
        {sections.map((section) => (
          <Link key={section.key} to={section.to} className="farm-section-item">
            <span className="farm-section-icon">
              <img src={section.icon} alt="" />
            </span>
            <span className="farm-section-label">{t(section.labelKey)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
