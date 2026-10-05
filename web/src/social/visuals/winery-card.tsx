import { Fragment } from 'react';

import grapeIcon from '@/assets/goods/grape.png';
import smallBottleIcon from '@/assets/icons/bottle-small.svg';
import qvevriIcon from '@/assets/icons/qvevri.svg';
import { BOTTLE_TYPE_INFO, BOTTLE_TYPES, type BottleType } from '@/config/wine-bottles';
import { formatCount } from '@/promo/figures';
import { copy, LANGUAGE } from '@/promo/locale';
import { EN_WINERY } from '@/social/copy/en';
import { KA_WINERY } from '@/social/copy/ka';
import { ArrowIcon } from '@/social/post-frame';
import '@/social/visuals/cards.css';
import '@/social/visuals/winery-card.css';

const LABELS = LANGUAGE === 'en' ? EN_WINERY : KA_WINERY;

const SHELF: Record<BottleType, number> = { small: 5, medium: 3, large: 2 };

const BOTTLES = BOTTLE_TYPES.reduce((sum, type) => sum + SHELF[type], 0);

const STEPS = [
  { icon: grapeIcon, title: LABELS.harvest, figure: `${formatCount(120)} ${copy.farm.unitKg}` },
  { icon: qvevriIcon, title: LABELS.making, figure: `${formatCount(78)} ${copy.wine.unitLiter}` },
  { icon: smallBottleIcon, title: LABELS.bottling, figure: `${BOTTLES} ${LABELS.bottles}` },
];

export function WineryCard() {
  return (
    <div className="social-card winery-card">
      <div className="winery-flow">
        {STEPS.map((step, index) => (
          <Fragment key={step.title}>
            {index > 0 && (
              <span className="winery-arrow">
                <ArrowIcon />
              </span>
            )}
            <div className={`winery-step is-step-${index + 1}`}>
              <span className="winery-tile">
                <img src={step.icon} alt="" />
                <b>{index + 1}</b>
              </span>
              <strong className="winery-step-title">{step.title}</strong>
              <span className="social-chip">{step.figure}</span>
            </div>
          </Fragment>
        ))}
      </div>

      <div className="winery-shelf">
        {BOTTLE_TYPES.map((type) => (
          <span key={type} className={`winery-bottles is-${type}`}>
            {Array.from({ length: SHELF[type] }, (_, index) => (
              <img key={index} src={BOTTLE_TYPE_INFO[type].icon} alt="" />
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
