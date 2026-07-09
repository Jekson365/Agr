import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageSource } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type Tab } from '@/components/farm/livestock/livestock';
import { styles } from '@/components/farm/shared/styles';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';

const SECTIONS: {
  key: Tab | 'fruits' | 'balance' | 'equipment';
  labelKey: string;
  icon: ImageSource;
  href: string;
}[] = [
  { key: 'land', labelKey: 'farm.land', icon: require('@/assets/properties/land.png'), href: '/farm/land' },
  {
    key: 'livestock',
    labelKey: 'farm.livestock',
    icon: require('@/assets/properties/animals.png'),
    href: '/farm/livestock',
  },
  {
    key: 'stock',
    labelKey: 'farm.plantStock',
    icon: require('@/assets/properties/plants.png'),
    href: '/farm/stock',
  },
  {
    key: 'fruits',
    labelKey: 'farm.fruits',
    icon: require('@/assets/properties/fruits.png'),
    href: '/farm/fruits',
  },
  {
    key: 'balance',
    labelKey: 'farm.balance',
    icon: require('@/assets/properties/balance.png'),
    href: '/farm/balance',
  },
  {
    key: 'equipment',
    labelKey: 'equipment.title',
    icon: require('@/assets/properties/equipment.png'),
    href: '/farm/equipment',
  },
];

export default function FarmScreen() {
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerSide}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={Brand.dark} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('farm.title')}</Text>
        <View style={styles.headerSide}>
          <LanguageToggle />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.tabBoxGrid}>
          {SECTIONS.map((section) => (
            <Pressable
              key={section.key}
              style={styles.tabBox}
              onPress={() => router.push(section.href as Parameters<typeof router.push>[0])}>
              <View style={styles.tabBoxIconWrap}>
                <Image source={section.icon} style={styles.tabBoxIconImage} contentFit="contain" />
              </View>
              <Text style={styles.tabBoxLabel} numberOfLines={2}>
                {t(section.labelKey)}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
