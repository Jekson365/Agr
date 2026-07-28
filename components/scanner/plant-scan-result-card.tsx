import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import type { PlantScanResult, PlantScanSeverity } from '@/types/plant-scan';

export const SEVERITY_COLOR: Record<PlantScanSeverity, string> = {
  None: Brand.green,
  Low: '#C79A1E',
  Medium: '#D97706',
  High: '#C0392B',
};

type Props = {
  result: PlantScanResult;
};

/** Renders an AI plant-scan diagnosis — shared by the live scanner screen and the scan history detail view. */
export function PlantScanResultCard({ result }: Props) {
  const { t } = useLanguage();

  if (!result.plantDetected) {
    return (
      <View style={styles.resultCard}>
        <Text style={styles.summary}>{t('scanner.noPlantDetected')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.resultCard}>
      <View style={styles.resultHeaderRow}>
        <Text style={styles.plantName}>{result.plantName || t('scanner.unknownPlant')}</Text>
        <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLOR[result.severity] ?? Brand.muted }]}>
          <Text style={styles.severityBadgeText}>
            {result.isHealthy ? t('scanner.healthy') : t(`scanner.severity${result.severity}`)}
          </Text>
        </View>
      </View>

      {!result.isHealthy && result.diseaseName ? <Text style={styles.diseaseName}>{result.diseaseName}</Text> : null}

      <Text style={styles.summary}>{result.summary}</Text>

      {result.symptoms.length > 0 && (
        <ResultSection title={t('scanner.symptoms')} items={result.symptoms} icon="alert-circle-outline" />
      )}
      {result.treatments.length > 0 && (
        <ResultSection title={t('scanner.treatments')} items={result.treatments} icon="medkit-outline" />
      )}
      {result.preventionTips.length > 0 && (
        <ResultSection
          title={t('scanner.preventionTips')}
          items={result.preventionTips}
          icon="shield-checkmark-outline"
        />
      )}
    </View>
  );
}

function ResultSection({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={16} color={Brand.green} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {items.map((item, index) => (
        <View key={index} style={styles.bulletRow}>
          <View style={styles.bullet} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  resultCard: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  plantName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Brand.dark,
    marginRight: 8,
  },
  severityBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  severityBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  diseaseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C0392B',
    marginBottom: 8,
  },
  summary: {
    fontSize: 13,
    color: Brand.dark,
    lineHeight: 19,
    marginBottom: 12,
  },
  section: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.dark,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
    paddingLeft: 4,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Brand.green,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: Brand.dark,
    lineHeight: 18,
  },
});
