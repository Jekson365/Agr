import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useLanguage } from '@/contexts/language-context';

export default function ChatScreen() {
  const { t } = useLanguage();
  return <PlaceholderScreen title={t('placeholders.chat')} icon="chatbubble-outline" />;
}
