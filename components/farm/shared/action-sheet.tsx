import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, Text, View } from 'react-native';

import { styles } from '@/components/farm/shared/styles';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';

type Props = {
  visible: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
};

export function ActionSheet({ visible, onEdit, onDelete, onClose }: Props) {
  const { t } = useLanguage();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet}>
          <Pressable style={styles.sheetItem} onPress={onEdit}>
            <Ionicons name="create-outline" size={20} color={Brand.dark} />
            <Text style={styles.sheetItemLabel}>{t('common.edit')}</Text>
          </Pressable>
          <Pressable style={styles.sheetItem} onPress={onDelete}>
            <Ionicons name="trash-outline" size={20} color="#C0392B" />
            <Text style={[styles.sheetItemLabel, styles.sheetItemDanger]}>{t('common.delete')}</Text>
          </Pressable>
          <Pressable style={styles.sheetCancel} onPress={onClose}>
            <Text style={styles.sheetCancelLabel}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
