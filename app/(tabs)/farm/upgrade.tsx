import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles as sharedStyles } from '@/components/farm/shared/styles';
import { formatBytes } from '@/components/ui/format-bytes';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { PLAN_BENEFITS } from '@/constants/plan-benefits';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import type { StoragePlan } from '@/types/auth';

const PLAN_LABEL_KEY: Record<StoragePlan, string> = {
  Free: 'profile.planFree',
  Medium: 'profile.planMedium',
  Premium: 'profile.planPremium',
};

export default function UpgradeScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  // `over` marks the past-the-cap case (a downgrade), where even editing is closed until the
  // count comes back down — a different message from simply being full.
  const params = useLocalSearchParams<{ resource?: string; over?: string }>();

  function countLabel(value: number | null): string {
    return value == null ? t('profile.limitUnlimited') : String(value);
  }

  return (
    <SafeAreaView style={sharedStyles.safeArea} edges={['top']}>
      <View style={sharedStyles.header}>
        <Pressable
          style={sharedStyles.headerSide}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={Brand.dark} />
        </Pressable>
        <Text style={sharedStyles.headerTitle}>{t('plans.title')}</Text>
        <View style={sharedStyles.headerSide}>
          <LanguageToggle />
        </View>
      </View>

      <ScrollView contentContainerStyle={sharedStyles.scrollContent}>
        {params.resource ? (
          <Text style={local.message}>
            {t(params.over ? 'plans.overLimit' : 'plans.limitReached', { resource: params.resource })}
          </Text>
        ) : null}

        {PLAN_BENEFITS.map((plan) => {
          const isCurrent = user?.plan === plan.plan;
          return (
            <View key={plan.plan} style={[local.planCard, isCurrent && local.planCardActive]}>
              <View style={local.planHeaderRow}>
                <Text style={local.planName}>{t(PLAN_LABEL_KEY[plan.plan])}</Text>
                {isCurrent && (
                  <View style={local.currentBadge}>
                    <Text style={local.currentBadgeText}>{t('plans.current')}</Text>
                  </View>
                )}
              </View>

              <View style={local.benefitRow}>
                <Text style={local.benefitLabel}>{t('plans.storage')}</Text>
                <Text style={local.benefitValue}>
                  {plan.storageBytes == null ? t('profile.limitUnlimited') : formatBytes(plan.storageBytes)}
                </Text>
              </View>
              <View style={local.benefitRow}>
                <Text style={local.benefitLabel}>{t('profile.limitLand')}</Text>
                <Text style={local.benefitValue}>{countLabel(plan.land)}</Text>
              </View>
              <View style={local.benefitRow}>
                <Text style={local.benefitLabel}>{t('profile.limitLivestock')}</Text>
                <Text style={local.benefitValue}>{countLabel(plan.livestock)}</Text>
              </View>
              <View style={local.benefitRow}>
                <Text style={local.benefitLabel}>{t('profile.limitStock')}</Text>
                <Text style={local.benefitValue}>{countLabel(plan.stock)}</Text>
              </View>
              <View style={local.benefitRow}>
                <Text style={local.benefitLabel}>{t('profile.limitFruit')}</Text>
                <Text style={local.benefitValue}>{countLabel(plan.fruit)}</Text>
              </View>
              <View style={local.benefitRow}>
                <Text style={local.benefitLabel}>{t('profile.limitBalance')}</Text>
                <Ionicons
                  name={plan.balance ? 'checkmark-circle' : 'close-circle-outline'}
                  size={16}
                  color={plan.balance ? Brand.green : Brand.muted}
                />
              </View>
              <View style={[local.benefitRow, local.benefitRowLast]}>
                <Text style={local.benefitLabel}>{t('profile.limitEquipment')}</Text>
                <Ionicons
                  name={plan.equipment ? 'checkmark-circle' : 'close-circle-outline'}
                  size={16}
                  color={plan.equipment ? Brand.green : Brand.muted}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const local = StyleSheet.create({
  message: {
    fontSize: 13,
    color: Brand.muted,
    marginBottom: 16,
  },
  planCard: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  planCardActive: {
    borderColor: Brand.green,
    backgroundColor: Brand.greenMuted,
  },
  planHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planName: {
    fontSize: 15,
    fontWeight: '700',
    color: Brand.dark,
  },
  currentBadge: {
    backgroundColor: Brand.green,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
  },
  benefitRowLast: {
    borderBottomWidth: 0,
  },
  benefitLabel: {
    fontSize: 13,
    color: Brand.dark,
  },
  benefitValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.green,
  },
});
