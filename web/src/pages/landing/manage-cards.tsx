import type { CSSProperties } from 'react';

import { MANAGE_CARDS } from '@/config/landing';
import { useLanguage } from '@/contexts/language-context';
import { CheckIcon } from './landing-icons';
import './manage-cards.css';

export function ManageCards() {
  const { t } = useLanguage();

  return (
    <div className="landing-manage-grid">
      {MANAGE_CARDS.map((card, index) => (
        <article
          key={card.id}
          className="landing-card landing-manage-card"
          data-reveal
          style={{ '--reveal-delay': `${index * 80}ms` } as CSSProperties}
        >
          <span className="landing-card-icon">
            <img src={card.icon} alt="" loading="lazy" decoding="async" />
          </span>
          <h3 className="landing-card-title">{t(`landing.manage.${card.id}.title`)}</h3>
          <p className="landing-card-body">{t(`landing.manage.${card.id}.body`)}</p>
          <ul className="landing-points">
            {Array.from({ length: card.points }, (_, i) => (
              <li key={i}>
                <CheckIcon width={16} height={16} />
                {t(`landing.manage.${card.id}.point${i + 1}`)}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
