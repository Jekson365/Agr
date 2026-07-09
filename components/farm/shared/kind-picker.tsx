import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { styles } from '@/components/farm/shared/styles';
import { Brand } from '@/constants/theme';

export type KindOption = { value: string; label: string; icon?: number };

type Props = {
  options: KindOption[];
  selected: string;
  onSelect: (value: string) => void;
  onAddNew: (name: string) => Promise<KindOption | null>;
  addPlaceholder: string;
  loading?: boolean;
};

/** A chip-row picker (like the built-in type chips elsewhere) that also lets the user type a new
 * name and add it to the catalog on the fly — used for stock/fruit kinds, which aren't a fixed
 * set. New kinds behave exactly like the built-in ones once added. */
export function KindPicker({ options, selected, onSelect, onAddNew, addPlaceholder, loading }: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      const created = await onAddNew(trimmed);
      if (created) {
        onSelect(created.value);
      }
      setNewName('');
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <ActivityIndicator color={Brand.dark} style={{ marginBottom: 14 }} />;
  }

  return (
    <View style={styles.kindRow}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          style={[styles.kindChip, selected === opt.value && styles.kindChipActive]}
          onPress={() => onSelect(opt.value)}>
          {opt.icon != null && <Image source={opt.icon} style={styles.kindChipIcon} contentFit="contain" />}
          <Text style={[styles.kindChipLabel, selected === opt.value && styles.kindChipLabelActive]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}

      {adding ? (
        <View style={styles.kindAddRow}>
          <TextInput
            style={styles.kindAddInput}
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
        <Pressable
          style={styles.kindChipAdd}
          onPress={() => setAdding(true)}
          accessibilityRole="button"
          accessibilityLabel={addPlaceholder}>
          <Ionicons name="add" size={16} color={Brand.dark} />
        </Pressable>
      )}
    </View>
  );
}
