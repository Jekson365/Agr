import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { cropImage, cropLabel } from '@/components/farm/land/crop';
import { styles } from '@/components/farm/shared/styles';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { createLandPlot, updateLandPlot } from '@/services/land-plot-service';
import { getStock } from '@/services/stock-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { LandPlot } from '@/types/land-plot';

type Props = {
  visible: boolean;
  farmId: number;
  editingPlot: LandPlot | null;
  onClose: () => void;
  onSaved: (plot: LandPlot, isNew: boolean) => void;
};

// One selectable row in the crop picker. Ordinarily one per stock or tree stock item (so items
// that share a type but have different custom names show up separately) — see loadCrops for the
// one case where a row doesn't back onto a real item.
type CropOption = {
  key: string;
  type: string;
  name: string;
};

export function LandPlotFormModal({ visible, farmId, editingPlot, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [options, setOptions] = useState<CropOption[]>([]);
  const [cropsLoading, setCropsLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [areaInput, setAreaInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingPlot != null;

  // Initialize the fields, and load which stock/tree stock items currently exist, whenever opened.
  useEffect(() => {
    if (!visible) return;
    setAreaInput(editingPlot ? String(editingPlot.area) : '');
    setFormError(null);
    setPickerOpen(false);
    loadCrops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editingPlot]);

  async function loadCrops() {
    setCropsLoading(true);
    try {
      const [stocks, treeStocks] = await Promise.all([getStock(), getTreeStock()]);
      const opts: CropOption[] = [
        ...stocks.map((s) => ({ key: `stock:${s.id}`, type: s.type, name: s.name })),
        ...treeStocks.map((s) => ({ key: `tree:${s.id}`, type: s.type, name: s.name })),
      ];

      // Always keep the plot's own crop type selectable — labeled generically — even if every
      // stock/tree stock item of that type was since removed from its tab.
      const editingCrop = editingPlot?.crop;
      if (editingCrop && !opts.some((o) => o.type === editingCrop)) {
        opts.push({ key: `type:${editingCrop}`, type: editingCrop, name: '' });
      }

      setOptions(opts);
      const matching = editingCrop ? opts.find((o) => o.type === editingCrop) : undefined;
      setSelectedKey(matching ? matching.key : (opts[0]?.key ?? null));
    } catch {
      setOptions([]);
      setSelectedKey(null);
    } finally {
      setCropsLoading(false);
    }
  }

  const selectedOption = options.find((o) => o.key === selectedKey) ?? null;
  const area = Math.max(0, parseFloat(areaInput) || 0);
  const canSubmit = area > 0 && selectedOption != null && !saving;

  async function handleSubmit() {
    if (!canSubmit || selectedOption == null) return;

    setSaving(true);
    setFormError(null);
    try {
      if (isEditing) {
        const updated: LandPlot = { ...editingPlot, area, crop: selectedOption.type };
        await updateLandPlot(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createLandPlot({ farmId, area, crop: selectedOption.type });
        onSaved(created, true);
      }
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.formOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{isEditing ? t('landPlot.edit') : t('landPlot.add')}</Text>

          <Text style={styles.fieldLabel}>{t('farm.crop')}</Text>
          {cropsLoading ? (
            <ActivityIndicator color={Brand.dark} style={{ marginBottom: 14 }} />
          ) : options.length === 0 ? (
            <Text style={styles.emptyHint}>{t('landPlot.noCrops')}</Text>
          ) : (
            <>
              <Pressable
                style={styles.selectField}
                onPress={() => setPickerOpen((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={t('farm.crop')}>
                {selectedOption ? (
                  <>
                    <Image
                      source={cropImage(selectedOption.type)}
                      style={styles.selectFieldIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.selectFieldText}>
                      {selectedOption.name.trim() || cropLabel(selectedOption.type, t)}
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.selectFieldText, styles.selectFieldPlaceholder]}>
                    {t('farm.cropPlaceholder')}
                  </Text>
                )}
                <Ionicons name={pickerOpen ? 'chevron-up' : 'chevron-down'} size={18} color={Brand.muted} />
              </Pressable>

              {pickerOpen && (
                <View style={styles.selectOptionsList}>
                  {options.map((option) => (
                    <Pressable
                      key={option.key}
                      style={[styles.selectOption, selectedKey === option.key && styles.selectOptionActive]}
                      onPress={() => {
                        setSelectedKey(option.key);
                        setPickerOpen(false);
                      }}>
                      <Image
                        source={cropImage(option.type)}
                        style={styles.selectFieldIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.selectOptionLabel}>
                        {option.name.trim() || cropLabel(option.type, t)}
                      </Text>
                      {selectedKey === option.key && <Ionicons name="checkmark" size={18} color={Brand.green} />}
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}

          <Text style={styles.fieldLabel}>{t('farm.area')}</Text>
          <TextInput
            style={styles.input}
            value={areaInput}
            onChangeText={setAreaInput}
            placeholder={t('farm.areaPlaceholder')}
            placeholderTextColor={Brand.muted}
            keyboardType="decimal-pad"
          />

          {formError && <Text style={styles.errorText}>{formError}</Text>}

          <View style={styles.formActions}>
            <Pressable style={styles.formCancelButton} onPress={onClose}>
              <Text style={styles.formCancelLabel}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={[styles.formSubmitButton, !canSubmit && styles.formSubmitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.formSubmitLabel}>{isEditing ? t('common.save') : t('common.add')}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
