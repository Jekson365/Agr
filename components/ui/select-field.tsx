import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { styles as sheetStyles } from '@/components/farm/shared/styles';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { useState } from 'react';

export type SelectOption<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: SelectOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
};

/** A dropdown select field: shows the current choice, opens a bottom sheet of options on tap. */
export function SelectField<T extends string>({ options, selected, onSelect }: Props<T>) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((opt) => opt.value === selected)?.label ?? '';

  return (
    <>
      <Pressable style={local.field} onPress={() => setOpen(true)} accessibilityRole="button">
        <Text style={local.fieldText}>{selectedLabel}</Text>
        <Ionicons name="chevron-down" size={18} color={Brand.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={sheetStyles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={sheetStyles.sheet} onPress={(e) => e.stopPropagation()}>
            <ScrollView style={local.list}>
              {options.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={sheetStyles.sheetItem}
                  onPress={() => {
                    onSelect(opt.value);
                    setOpen(false);
                  }}>
                  <Text style={[sheetStyles.sheetItemLabel, local.itemLabel]}>{opt.label}</Text>
                  {opt.value === selected && <Ionicons name="checkmark" size={18} color={Brand.green} />}
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={sheetStyles.sheetCancel} onPress={() => setOpen(false)}>
              <Text style={sheetStyles.sheetCancelLabel}>{t('common.cancel')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const local = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  fieldText: {
    fontSize: 15,
    color: Brand.dark,
  },
  list: {
    maxHeight: 320,
  },
  itemLabel: {
    flex: 1,
  },
});
