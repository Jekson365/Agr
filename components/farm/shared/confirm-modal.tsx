import { Modal, Pressable, Text, View } from 'react-native';

import { styles } from '@/components/farm/shared/styles';
import { useLanguage } from '@/contexts/language-context';

type Props = {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  /** Uses the red delete-style button instead of the normal green submit style. */
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Generic yes/no confirmation dialog — for delete confirmations specifically, use ConfirmDeleteModal. */
export function ConfirmModal({ visible, title, body, confirmLabel, destructive, onCancel, onConfirm }: Props) {
  const { t } = useLanguage();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>{title}</Text>
          {body ? <Text style={styles.confirmBody}>{body}</Text> : null}
          <View style={styles.formActions}>
            <Pressable style={styles.formCancelButton} onPress={onCancel}>
              <Text style={styles.formCancelLabel}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={destructive ? styles.confirmDeleteButton : styles.formSubmitButton}
              onPress={onConfirm}>
              <Text style={styles.formSubmitLabel}>{confirmLabel ?? t('common.confirm')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
