import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useLanguage } from '@/contexts/language-context';

export default function WorkersScreen() {
  const { t } = useLanguage();
  return <PlaceholderScreen title={t('placeholders.workers')} icon="people-outline" />;
}
