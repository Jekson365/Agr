import { MARKET_SAMPLES } from '@/config/landing';
import { useCurrency } from '@/contexts/currency-context';
import ka from '@/locales/ka.json';
import { tr } from '@/promo/figures';
import '@/social/visuals/cards.css';
import '@/social/visuals/business-cards.css';

export function MarketCard() {
  const { formatPrice } = useCurrency();

  return (
    <div className="social-card market-card">
      <div className="social-card-head">
        <span className="social-card-title">{ka.landing.preview.marketTitle}</span>
      </div>
      {MARKET_SAMPLES.map((sample) => {
        const rent = sample.id === 'tractor';
        return (
          <div key={sample.id} className="market-listing">
            <span className="market-listing-image">
              <img src={sample.icon} alt="" />
            </span>
            <span className="market-listing-body">
              <strong>{tr(`landing.market.${sample.id}.title`)}</strong>
              <span className="market-listing-price">
                {formatPrice(sample.price)} / {tr(`landing.market.${sample.id}.unit`)}
              </span>
              <span className="market-listing-meta">{tr(`landing.market.${sample.id}.location`)}</span>
            </span>
            <span className={rent ? 'social-chip is-amber' : 'social-chip'}>
              {rent ? ka.market.typeRent : ka.market.typeSale}
            </span>
          </div>
        );
      })}
    </div>
  );
}
