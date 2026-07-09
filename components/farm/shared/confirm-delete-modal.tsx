import { Modal, Pressable, Text, View } from 'react-native';

import { styles } from '@/components/farm/shared/styles';
import { useLanguage } from '@/contexts/language-context';

type Props = {
  visible: boolean;
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteModal({ visible, name, onCancel, onConfirm }: Props) {
  const { t } = useLanguage();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>{t('farm.deleteConfirmTitle', { name })}</Text>
          <Text style={styles.confirmBody}>{t('farm.deleteConfirmBody')}</Text>
          <View style={styles.formActions}>
            <Pressable style={styles.formCancelButton} onPress={onCancel}>
              <Text style={styles.formCancelLabel}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable style={styles.confirmDeleteButton} onPress={onConfirm}>
              <Text style={styles.formSubmitLabel}>{t('common.delete')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
