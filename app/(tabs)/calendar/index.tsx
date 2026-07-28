import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles as sharedStyles } from '@/components/farm/shared/styles';
import { isOverdue } from '@/components/harvest/harvest-analysis';
import { HARVEST_STATUS_BADGE_STYLE, HARVEST_STATUS_BADGE_TEXT_STYLE, HARVEST_STATUS_LABEL_KEY } from '@/components/harvest/status';
import { formatLocalizedDate, formatTime, toIsoDate } from '@/components/ui/date-utils';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { TimeField } from '@/components/ui/time-field';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { createCalendarEvent, deleteCalendarEvent, getCalendarEvents } from '@/services/calendar-service';
import { getHarvests } from '@/services/harvest-service';
import type { CalendarEvent } from '@/types/calendar';
import type { Harvest } from '@/types/harvest';

// Distinct from Brand.green (used for manual events) so a harvest-marked day is visually
// distinguishable at a glance.
const HARVEST_DOT_COLOR = '#D97706';
const HARVEST_TINT_COLOR = '#FBEBD5';
// An overdue harvest takes the danger colour in place of the normal harvest amber.
const OVERDUE_COLOR = '#DC2626';

const MONTH_NAMES: Record<'en' | 'ka', string[]> = {
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  ka: [
    'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
    'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი',
  ],
};

// Week starts on Monday.
const WEEKDAY_NAMES: Record<'en' | 'ka', string[]> = {
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  ka: ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვ'],
};

const STRINGS: Record<
  'en' | 'ka',
  { addPlaceholder: string; timePlaceholder: string; empty: string; loadError: string; saveError: string }
> = {
  en: {
    addPlaceholder: 'Add an event',
    timePlaceholder: 'Select time',
    empty: 'No events for this day.',
    loadError: "Couldn't load events.",
    saveError: "Couldn't save. Please try again.",
  },
  ka: {
    addPlaceholder: 'დაამატეთ ღონისძიება',
    timePlaceholder: 'აირჩიეთ დრო',
    empty: 'ამ დღისთვის ღონისძიება არ არის.',
    loadError: 'ვერ ჩაიტვირთა ღონისძიებები.',
    saveError: 'ვერ შეინახა. სცადეთ ხელახლა.',
  },
};

function currentHhMm(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Builds a 6-week grid of dates covering the given month (Monday-first weeks). */
function buildMonthGrid(year: number, month: number): Date[][] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;

  const weeks: Date[][] = [];
  const cursor = new Date(year, month, 1 - startOffset);
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export default function CalendarScreen() {
  const { t, language } = useLanguage();
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [eventInput, setEventInput] = useState('');
  const [eventTime, setEventTime] = useState(currentHhMm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const weeks = useMemo(() => buildMonthGrid(viewDate.getFullYear(), viewDate.getMonth()), [viewDate]);
  const monthNames = MONTH_NAMES[language];
  const weekdayNames = WEEKDAY_NAMES[language];
  const strings = STRINGS[language];

  const selectedKey = toIsoDate(selected);
  const selectedEvents = events.filter((e) => e.date === selectedKey);

  // A harvest lands on the calendar twice when the two differ: on its record date, and on the
  // date it's expected to be picked. `expected` distinguishes which occurrence a row is.
  const occurrences = useMemo<{ harvest: Harvest; date: string; expected: boolean }[]>(
    () =>
      harvests.flatMap((harvest) => {
        const rows = [{ harvest, date: harvest.date, expected: false }];
        if (harvest.expectedHarvestDate && harvest.expectedHarvestDate !== harvest.date) {
          rows.push({ harvest, date: harvest.expectedHarvestDate, expected: true });
        }
        return rows;
      }),
    [harvests]
  );

  const selectedHarvests = occurrences.filter((o) => o.date === selectedKey);
  const eventDates = useMemo(() => new Set(events.map((e) => e.date)), [events]);
  const harvestDates = useMemo(() => new Set(occurrences.map((o) => o.date)), [occurrences]);
  // Days carrying an overdue harvest get the danger marker instead of the normal harvest one.
  const overdueDates = useMemo(
    () => new Set(occurrences.filter((o) => isOverdue(o.harvest)).map((o) => o.date)),
    [occurrences]
  );

  useEffect(() => {
    load();
  }, []);

  async function load(opts?: { silent?: boolean }) {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const [eventList, harvestList] = await Promise.all([getCalendarEvents(), getHarvests()]);
      setEvents(eventList);
      setHarvests(harvestList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (!opts?.silent) setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    load({ silent: true });
  }

  function goPrevMonth() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goNextMonth() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function selectDate(date: Date) {
    setSelected(date);
    setEventInput('');
    setEventTime(currentHhMm());
    setSaveError(null);
  }

  async function addEvent() {
    const title = eventInput.trim();
    if (!title || saving) return;

    setSaving(true);
    setSaveError(null);
    try {
      const created = await createCalendarEvent({ title, date: selectedKey, time: eventTime });
      setEvents((prev) => [...prev, created]);
      setEventInput('');
      setEventTime(currentHhMm());
    } catch {
      setSaveError(strings.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function removeEvent(id: number) {
    const previous = events;
    setEvents((prev) => prev.filter((e) => e.id !== id));
    try {
      await deleteCalendarEvent(id);
    } catch {
      setEvents(previous);
      setSaveError(strings.saveError);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('dashboard.calendar')}</Text>
        <LanguageToggle />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.dark} />}>
          <View style={styles.monthNav}>
            <Pressable hitSlop={8} onPress={goPrevMonth} accessibilityRole="button" accessibilityLabel="Previous month">
              <Ionicons name="chevron-back" size={22} color={Brand.dark} />
            </Pressable>
            <Text style={styles.monthLabel}>
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
            </Text>
            <Pressable hitSlop={8} onPress={goNextMonth} accessibilityRole="button" accessibilityLabel="Next month">
              <Ionicons name="chevron-forward" size={22} color={Brand.dark} />
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {weekdayNames.map((label) => (
              <Text key={label} style={styles.weekdayLabel}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {weeks.map((week, i) => (
              <View key={i} style={styles.weekRow}>
                {week.map((date) => {
                  const inMonth = date.getMonth() === viewDate.getMonth();
                  const isToday = isSameDay(date, today);
                  const isSelected = isSameDay(date, selected);
                  const hasEvent = eventDates.has(toIsoDate(date));
                  const hasHarvest = harvestDates.has(toIsoDate(date));
                  const hasOverdue = overdueDates.has(toIsoDate(date));
                  const isMarked = hasEvent || hasHarvest;
                  return (
                    <Pressable key={date.toISOString()} style={styles.dayCell} onPress={() => selectDate(date)}>
                      <View
                        style={[
                          styles.dayCircle,
                          isMarked && !isSelected && (hasEvent ? styles.dayCircleMarkedEvent : styles.dayCircleMarkedHarvest),
                          isToday && !isSelected && styles.dayCircleToday,
                          isSelected && styles.dayCircleSelected,
                        ]}>
                        <Text
                          style={[
                            styles.dayLabel,
                            !inMonth && styles.dayLabelMuted,
                            isSelected && styles.dayLabelSelected,
                          ]}>
                          {date.getDate()}
                        </Text>
                      </View>
                      {(hasEvent || hasHarvest) && (
                        <View style={styles.dotsRow}>
                          {hasEvent && <View style={[styles.eventDot, isSelected && styles.eventDotSelected]} />}
                          {hasHarvest && (
                            <View
                              style={[
                                styles.harvestDot,
                                hasOverdue && styles.overdueDot,
                                isSelected && styles.harvestDotSelected,
                                isSelected && hasOverdue && styles.overdueDotSelected,
                              ]}
                            />
                          )}
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.eventsSection}>
            <Text style={styles.eventsSectionTitle}>
              {formatLocalizedDate(selected, language, { weekday: true, year: false })}
            </Text>

            {loading ? (
              <View style={styles.eventsStateBox}>
                <ActivityIndicator color={Brand.dark} />
              </View>
            ) : error ? (
              <View style={styles.eventsStateBox}>
                <Text style={styles.eventsErrorText}>{strings.loadError}</Text>
                <Pressable style={styles.eventsRetryButton} onPress={() => load()}>
                  <Text style={styles.eventsRetryButtonLabel}>{t('common.retry')}</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {selectedHarvests.length > 0 && (
                  <View style={styles.harvestsList}>
                    {selectedHarvests.map(({ harvest: item, expected }) => (
                      <Pressable
                        key={`${item.id}-${expected ? 'expected' : 'record'}`}
                        style={styles.harvestRow}
                        onPress={() => router.push({ pathname: '/harvest/detail/[id]', params: { id: item.id } })}>
                        <View style={styles.harvestRowLeft}>
                          <Ionicons name="leaf-outline" size={16} color={HARVEST_DOT_COLOR} />
                          <Text style={styles.harvestRowText} numberOfLines={1}>
                            {item.title}
                          </Text>
                          {expected ? (
                            <View style={[styles.harvestTag, isOverdue(item) && styles.harvestTagOverdue]}>
                              <Text style={[styles.harvestTagText, isOverdue(item) && styles.harvestTagTextOverdue]}>
                                {isOverdue(item) ? t('harvest.overdue') : t('harvest.expectedTag')}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <View style={[sharedStyles.statusBadge, HARVEST_STATUS_BADGE_STYLE[item.status]]}>
                          <Text style={[sharedStyles.statusBadgeText, HARVEST_STATUS_BADGE_TEXT_STYLE[item.status]]}>
                            {t(HARVEST_STATUS_LABEL_KEY[item.status])}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}

                <TextInput
                  style={styles.eventInput}
                  value={eventInput}
                  onChangeText={setEventInput}
                  placeholder={strings.addPlaceholder}
                  placeholderTextColor={Brand.muted}
                  onSubmitEditing={addEvent}
                  returnKeyType="done"
                  editable={!saving}
                />

                <View style={styles.eventInputRow}>
                  <View style={styles.eventTimeField}>
                    <TimeField value={eventTime} onChange={setEventTime} placeholder={strings.timePlaceholder} />
                  </View>
                  <Pressable
                    style={[styles.eventAddButton, (!eventInput.trim() || saving) && styles.eventAddButtonDisabled]}
                    onPress={addEvent}
                    disabled={!eventInput.trim() || saving}
                    accessibilityRole="button"
                    accessibilityLabel="Add event">
                    {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="add" size={20} color="#FFFFFF" />}
                  </Pressable>
                </View>

                {saveError && <Text style={styles.eventsErrorText}>{saveError}</Text>}

                {selectedEvents.length === 0 ? (
                  <Text style={styles.eventsEmpty}>{strings.empty}</Text>
                ) : (
                  selectedEvents.map((item) => (
                    <View key={item.id} style={styles.eventRow}>
                      <View style={styles.eventRowLeft}>
                        <Text style={styles.eventRowTime}>{formatTime(item.time)}</Text>
                        <Text style={styles.eventRowText}>{item.title}</Text>
                      </View>
                      <Pressable
                        hitSlop={8}
                        onPress={() => removeEvent(item.id)}
                        accessibilityRole="button"
                        accessibilityLabel="Remove event">
                        <Ionicons name="close" size={16} color={Brand.muted} />
                      </Pressable>
                    </View>
                  ))
                )}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Brand.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Brand.dark,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Brand.dark,
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Brand.muted,
  },
  grid: {
    paddingHorizontal: 12,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    borderWidth: 1,
    borderColor: Brand.green,
  },
  dayCircleSelected: {
    backgroundColor: Brand.green,
  },
  dayCircleMarkedEvent: {
    backgroundColor: Brand.greenMuted,
  },
  dayCircleMarkedHarvest: {
    backgroundColor: HARVEST_TINT_COLOR,
  },
  dayLabel: {
    fontSize: 14,
    color: Brand.dark,
  },
  dayLabelMuted: {
    color: Brand.muted,
  },
  dayLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 2,
    flexDirection: 'row',
    gap: 4,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: Brand.green,
    shadowColor: Brand.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 3,
    elevation: 3,
  },
  eventDotSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: Brand.green,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
  },
  overdueDot: {
    backgroundColor: OVERDUE_COLOR,
    shadowColor: OVERDUE_COLOR,
  },
  overdueDotSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: OVERDUE_COLOR,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
  },
  harvestTag: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 9,
    backgroundColor: Brand.greenMuted,
  },
  harvestTagOverdue: {
    backgroundColor: '#FEF2F2',
  },
  harvestTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Brand.green,
  },
  harvestTagTextOverdue: {
    color: OVERDUE_COLOR,
  },
  harvestDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: HARVEST_DOT_COLOR,
    shadowColor: HARVEST_DOT_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 3,
    elevation: 3,
  },
  harvestDotSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: HARVEST_DOT_COLOR,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
  },
  harvestsList: {
    marginBottom: 14,
  },
  harvestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  harvestRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 10,
  },
  harvestRowText: {
    flex: 1,
    fontSize: 14,
    color: Brand.dark,
  },
  eventsSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  eventsSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Brand.dark,
    marginBottom: 12,
  },
  eventsStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  eventsErrorText: {
    fontSize: 13,
    color: '#C0392B',
    marginBottom: 10,
  },
  eventsRetryButton: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  eventsRetryButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.dark,
  },
  eventInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  eventInput: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Brand.dark,
    marginBottom: 10,
  },
  eventTimeField: {
    flex: 1,
  },
  eventAddButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Brand.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventAddButtonDisabled: {
    opacity: 0.5,
  },
  eventsEmpty: {
    fontSize: 13,
    color: Brand.muted,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  eventRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 10,
  },
  eventRowTime: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.green,
  },
  eventRowText: {
    flex: 1,
    fontSize: 14,
    color: Brand.dark,
  },
});
