import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { styles as sheetStyles } from '@/components/farm/shared/styles';
import type { KindOption } from '@/components/farm/shared/kind-picker';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';

type Props = {
  options: KindOption[];
  selected: string;
  onSelect: (value: string) => void;
  onAddNew: (name: string) => Promise<KindOption | null>;
  addPlaceholder: string;
  loading?: boolean;
};

/** Dropdown version of KindPicker: same pick-or-add-a-new-kind behavior, shown as a select field
 * that opens a bottom sheet instead of an inline chip row. */
export function KindSelectField({ options, selected, onSelect, onAddNew, addPlaceholder, loading }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedOption = options.find((opt) => opt.value === selected);

  function close() {
    setOpen(false);
    setAdding(false);
    setNewName('');
  }

  async function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      const created = await onAddNew(trimmed);
      if (created) {
        onSelect(created.value);
      }
      close();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <ActivityIndicator color={Brand.dark} style={local.loading} />;
  }

  return (
    <>
      <Pressable style={local.field} onPress={() => setOpen(true)} accessibilityRole="button">
        <View style={local.fieldValue}>
          {selectedOption?.icon != null && (
            <Image source={selectedOption.icon} style={local.fieldIcon} contentFit="contain" />
          )}
          <Text style={local.fieldText}>{selectedOption?.label ?? ''}</Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={Brand.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={sheetStyles.overlay} onPress={close}>
          <Pressable style={sheetStyles.sheet} onPress={(e) => e.stopPropagation()}>
            <ScrollView style={local.list}>
              {options.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={sheetStyles.sheetItem}
                  onPress={() => {
                    onSelect(opt.value);
                    close();
                  }}>
                  {opt.icon != null && <Image source={opt.icon} style={local.fieldIcon} contentFit="contain" />}
                  <Text style={[sheetStyles.sheetItemLabel, local.itemLabel]}>{opt.label}</Text>
                  {opt.value === selected && <Ionicons name="checkmark" size={18} color={Brand.green} />}
                </Pressable>
              ))}
            </ScrollView>

            {adding ? (
              <View style={local.addRow}>
                <TextInput
                  style={local.addInput}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder={addPlaceholder}
                  placeholderTextColor={Brand.muted}
                  autoFocus
                  onSubmitEditing={handleAdd}
                />
                <Pressable hitSlop={8} onPress={handleAdd} disabled={saving} accessibilityRole="button">
                  {saving ? (
                    <ActivityIndicator color={Brand.green} />
                  ) : (
                    <Ionicons name="checkmark-circle" size={26} color={Brand.green} />
                  )}
                </Pressable>
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    setAdding(false);
                    setNewName('');
                  }}
                  accessibilityRole="button">
                  <Ionicons name="close-circle" size={26} color={Brand.muted} />
                </Pressable>
              </View>
            ) : (
              <Pressable style={sheetStyles.sheetItem} onPress={() => setAdding(true)} accessibilityRole="button">
                <Ionicons name="add-circle-outline" size={20} color={Brand.dark} />
                <Text style={sheetStyles.sheetItemLabel}>{addPlaceholder}</Text>
              </Pressable>
            )}

            <Pressable style={sheetStyles.sheetCancel} onPress={close}>
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
  fieldValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldIcon: {
    width: 18,
    height: 18,
  },
  fieldText: {
    fontSize: 15,
    color: Brand.dark,
  },
  loading: {
    marginBottom: 14,
  },
  list: {
    maxHeight: 320,
  },
  itemLabel: {
    flex: 1,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Brand.dark,
  },
});
