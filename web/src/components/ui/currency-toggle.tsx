import { useCurrency } from '@/contexts/currency-context';
import './currency-toggle.css';

export function CurrencyToggle() {
  const { currency, toggleCurrency } = useCurrency();

  return (
    <button type="button" className="currency-toggle" onClick={toggleCurrency} aria-label="Change currency">
      {currency}
    </button>
  );
}
