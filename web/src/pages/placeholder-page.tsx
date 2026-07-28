import { Link } from 'react-router-dom';

import { useLanguage } from '@/contexts/language-context';

export function PlaceholderPage({ titleKey, backTo }: { titleKey: string; backTo?: string }) {
  const { t } = useLanguage();

  return (
    <div>
      {backTo && (
        <Link to={backTo} style={{ display: 'inline-block', marginBottom: 12, fontSize: '0.8125rem', color: 'var(--color-green)' }}>
          ← {t('farm.title')}
        </Link>
      )}
      <h1>{t(titleKey)}</h1>
      <p>{t('common.comingSoon')}</p>
    </div>
  );
}
