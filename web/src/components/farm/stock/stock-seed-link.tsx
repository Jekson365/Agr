import { Link } from 'react-router-dom';

import seedIcon from '@/assets/seed.png';
import { useLanguage } from '@/contexts/language-context';
import './stock-seed-link.css';

type Props = {
  seedId: number;
};

export function StockSeedLink({ seedId }: Props) {
  const { t } = useLanguage();
  const label = t('seed.title');

  return (
    <Link to={`/farm/seeds/${seedId}`} className="stock-seed-link" aria-label={label} title={label}>
      <img src={seedIcon} alt="" />
    </Link>
  );
}
