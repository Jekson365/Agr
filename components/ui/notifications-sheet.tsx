import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { styles as sheetStyles } from '@/components/farm/shared/styles';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import type { AppNotification } from '@/types/notification';

const STRINGS: Record<'en' | 'ka', { title: string; empty: string }> = {
  en: { title: 'Notifications', empty: "You're all caught up." },
  ka: { title: 'შეტყობინებები', empty: 'ყველაფერი წაკითხულია.' },
};

type Props = {
  visible: boolean;
  notifications: AppNotification[];
  onClose: () => void;
};

export function NotificationsSheet({ visible, notifications, onClose }: Props) {
  const { language } = useLanguage();
  const strings = STRINGS[language];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={sheetStyles.overlay} onPress={onClose}>
        <Pressable style={sheetStyles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{strings.title}</Text>

          {notifications.length === 0 ? (
            <Text style={styles.empty}>{strings.empty}</Text>
          ) : (
            <ScrollView style={styles.list}>
              {notifications.map((item) => (
                <View key={item.id} style={styles.item}>
                  <View style={[styles.dot, item.read && styles.dotRead]} />
                  <View style={styles.itemBody}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemText}>{item.body}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          <Pressable style={sheetStyles.sheetCancel} onPress={onClose}>
            <Ionicons name="close" size={16} color={Brand.muted} />
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Brand.dark,
    marginBottom: 12,
  },
  empty: {
    fontSize: 13,
    color: Brand.muted,
    paddingVertical: 20,
    textAlign: 'center',
  },
  list: {
    maxHeight: 320,
  },
  item: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.green,
    marginTop: 5,
  },
  dotRead: {
    backgroundColor: Brand.border,
  },
  itemBody: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.dark,
    marginBottom: 2,
  },
  itemText: {
    fontSize: 13,
    color: Brand.muted,
  },
});
