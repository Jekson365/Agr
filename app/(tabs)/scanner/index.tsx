import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useLanguage } from '@/contexts/language-context';

export default function ScannerScreen() {
  const { t } = useLanguage();
  return <PlaceholderScreen title={t('placeholders.scanner')} icon="camera-outline" />;
}
