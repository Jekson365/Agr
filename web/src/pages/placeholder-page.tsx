import { useLanguage } from '@/contexts/language-context';

export function PlaceholderPage({ titleKey }: { titleKey: string }) {
  const { t } = useLanguage();

  return (
    <div>
      <h1>{t(titleKey)}</h1>
      <p>{t('common.comingSoon')}</p>
    </div>
  );
}
