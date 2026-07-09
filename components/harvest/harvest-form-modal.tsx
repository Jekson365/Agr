import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { cropLabel } from '@/components/farm/land/crop';
import { styles } from '@/components/farm/shared/styles';
import { HARVEST_STATUS_LABEL_KEY, HARVEST_STATUSES } from '@/components/harvest/status';
import { DateField } from '@/components/ui/date-field';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { getFarms } from '@/services/farm-service';
import { createHarvest, updateHarvest } from '@/services/harvest-service';
import { getLandPlot, getLandPlots } from '@/services/land-plot-service';
import type { Farm } from '@/types/farm';
import type { Harvest, HarvestStatus } from '@/types/harvest';
import type { LandPlot } from '@/types/land-plot';

type Props = {
  visible: boolean;
  editingHarvest: Harvest | null;
  onClose: () => void;
  onSaved: (harvest: Harvest, isNew: boolean) => void;
};

function plotLabel(plot: LandPlot, t: (key: string) => string): string {
  return `${cropLabel(plot.crop, t)} · ${plot.area} ${t('farm.areaUnit')}`;
}

export function HarvestFormModal({ visible, editingHarvest, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [titleInput, setTitleInput] = useState('');
  const [date, setDate] = useState<string | null>(null);
  const [status, setStatus] = useState<HarvestStatus>('Planning');

  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(true);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [farmPickerOpen, setFarmPickerOpen] = useState(false);

  const [plots, setPlots] = useState<LandPlot[]>([]);
  const [plotsLoading, setPlotsLoading] = useState(false);
  const [selectedPlotId, setSelectedPlotId] = useState<number | null>(null);
  const [plotPickerOpen, setPlotPickerOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingHarvest != null;

  // Initialize the fields, and load which farms/plots exist to pick from, whenever opened.
  useEffect(() => {
    if (!visible) return;
    setTitleInput(editingHarvest?.title ?? '');
    setDate(editingHarvest?.date ?? null);
    setStatus(editingHarvest?.status ?? 'Planning');
    setFormError(null);
    setFarmPickerOpen(false);
    setPlotPickerOpen(false);
    initializeLand();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editingHarvest]);

  async function initializeLand() {
    setFarmsLoading(true);
    try {
      const farmList = await getFarms();
      setFarms(farmList);

      let farmId = farmList[0]?.id ?? null;
      let presetPlotId: number | null = null;

      if (editingHarvest?.landPlotId != null) {
        try {
          const plot = await getLandPlot(editingHarvest.landPlotId);
          farmId = plot.farmId;
          presetPlotId = plot.id;
        } catch {
          // The plot no longer exists — fall back to the first farm below.
        }
      }

      setSelectedFarmId(farmId);
      await loadPlots(farmId, presetPlotId);
    } catch {
      setFarms([]);
      setSelectedFarmId(null);
      setPlots([]);
      setSelectedPlotId(null);
    } finally {
      setFarmsLoading(false);
    }
  }

  async function loadPlots(farmId: number | null, presetPlotId?: number | null) {
    if (farmId == null) {
      setPlots([]);
      setSelectedPlotId(null);
      return;
    }

    setPlotsLoading(true);
    try {
      const plotList = await getLandPlots(farmId);
      setPlots(plotList);
      const preset =
        presetPlotId != null && plotList.some((p) => p.id === presetPlotId) ? presetPlotId : (plotList[0]?.id ?? null);
      setSelectedPlotId(preset);
    } catch {
      setPlots([]);
      setSelectedPlotId(null);
    } finally {
      setPlotsLoading(false);
    }
  }

  function handleSelectFarm(farmId: number) {
    setSelectedFarmId(farmId);
    setFarmPickerOpen(false);
    loadPlots(farmId);
  }

  const selectedFarm = farms.find((f) => f.id === selectedFarmId) ?? null;
  const selectedPlot = plots.find((p) => p.id === selectedPlotId) ?? null;

  const trimmedTitle = titleInput.trim();
  const canSubmit = !!trimmedTitle && !!date && selectedPlotId != null && !saving;

  async function handleSubmit() {
    if (!canSubmit || !date || selectedPlotId == null) return;

    setSaving(true);
    setFormError(null);
    try {
      if (isEditing) {
        const updated: Harvest = { ...editingHarvest, title: trimmedTitle, date, status, landPlotId: selectedPlotId };
        await updateHarvest(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createHarvest({ title: trimmedTitle, date, status, landPlotId: selectedPlotId });
        onSaved(created, true);
      }
      onClose();
    } catch {
      setFormError(t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.formOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{isEditing ? t('harvest.edit') : t('harvest.add')}</Text>

          <Text style={styles.fieldLabel}>{t('harvest.titleLabel')}</Text>
          <TextInput
            style={styles.input}
            value={titleInput}
            onChangeText={setTitleInput}
            placeholder={t('harvest.titlePlaceholder')}
            placeholderTextColor={Brand.muted}
          />

          <Text style={styles.fieldLabel}>{t('harvest.date')}</Text>
          <DateField value={date} onChange={setDate} placeholder={t('harvest.datePlaceholder')} />

          <Text style={styles.fieldLabel}>{t('harvest.statusLabel')}</Text>
          <View style={styles.kindRow}>
            {HARVEST_STATUSES.map((option) => (
              <Pressable
                key={option}
                style={[styles.kindChip, status === option && styles.kindChipActive]}
                onPress={() => setStatus(option)}>
                <Text style={[styles.kindChipLabel, status === option && styles.kindChipLabelActive]}>
                  {t(HARVEST_STATUS_LABEL_KEY[option])}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>{t('harvest.landLabel')}</Text>
          {farmsLoading ? (
            <ActivityIndicator color={Brand.dark} style={{ marginBottom: 14 }} />
          ) : farms.length === 0 ? (
            <Text style={styles.emptyHint}>{t('harvest.noFarms')}</Text>
          ) : (
            <>
              <Pressable
                style={styles.selectField}
                onPress={() => setFarmPickerOpen((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={t('harvest.landLabel')}>
                <Text style={styles.selectFieldText}>{selectedFarm?.name ?? t('harvest.landPlaceholder')}</Text>
                <Ionicons name={farmPickerOpen ? 'chevron-up' : 'chevron-down'} size={18} color={Brand.muted} />
              </Pressable>

              {farmPickerOpen && (
                <View style={styles.selectOptionsList}>
                  {farms.map((farm) => (
                    <Pressable
                      key={farm.id}
                      style={[styles.selectOption, selectedFarmId === farm.id && styles.selectOptionActive]}
                      onPress={() => handleSelectFarm(farm.id)}>
                      <Text style={styles.selectOptionLabel}>{farm.name}</Text>
                      {selectedFarmId === farm.id && <Ionicons name="checkmark" size={18} color={Brand.green} />}
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}

          <Text style={styles.fieldLabel}>{t('harvest.plotLabel')}</Text>
          {plotsLoading ? (
            <ActivityIndicator color={Brand.dark} style={{ marginBottom: 14 }} />
          ) : !farmsLoading && farms.length > 0 && plots.length === 0 ? (
            <Text style={styles.emptyHint}>{t('harvest.noPlots')}</Text>
          ) : farms.length > 0 ? (
            <>
              <Pressable
                style={styles.selectField}
                onPress={() => setPlotPickerOpen((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={t('harvest.plotLabel')}>
                <Text style={styles.selectFieldText}>
                  {selectedPlot ? plotLabel(selectedPlot, t) : t('harvest.plotPlaceholder')}
                </Text>
                <Ionicons name={plotPickerOpen ? 'chevron-up' : 'chevron-down'} size={18} color={Brand.muted} />
              </Pressable>

              {plotPickerOpen && (
                <View style={styles.selectOptionsList}>
                  {plots.map((plot) => (
                    <Pressable
                      key={plot.id}
                      style={[styles.selectOption, selectedPlotId === plot.id && styles.selectOptionActive]}
                      onPress={() => {
                        setSelectedPlotId(plot.id);
                        setPlotPickerOpen(false);
                      }}>
                      <Text style={styles.selectOptionLabel}>{plotLabel(plot, t)}</Text>
                      {selectedPlotId === plot.id && <Ionicons name="checkmark" size={18} color={Brand.green} />}
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          ) : null}

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
