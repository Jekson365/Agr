import type { AnimalType } from '@/types/livestock';

export type Tab = 'land' | 'livestock' | 'stock';

export const LIVESTOCK_KIND_IMAGE: Record<AnimalType, number> = {
  Cow: require('@/assets/animals/cow.png'),
  Sheep: require('@/assets/animals/sheep.png'),
  Chicken: require('@/assets/animals/chicken.png'),
  Turkey: require('@/assets/animals/turkey.png'),
  Pig: require('@/assets/animals/pig.png'),
  Cat: require('@/assets/animals/cat.png'),
  Dog: require('@/assets/animals/dog.png'),
  Duck: require('@/assets/animals/duck.png'),
  Goat: require('@/assets/animals/goat.png'),
  Rabbit: require('@/assets/animals/rabbit.png'),
  Rooster: require('@/assets/animals/rooster.png'),
};

export const LIVESTOCK_KIND_OPTIONS: { value: AnimalType; labelKey: string }[] = [
  { value: 'Cow', labelKey: 'farm.cow' },
  { value: 'Sheep', labelKey: 'farm.sheep' },
  { value: 'Chicken', labelKey: 'farm.chicken' },
  { value: 'Turkey', labelKey: 'farm.turkey' },
  { value: 'Pig', labelKey: 'farm.pig' },
  { value: 'Cat', labelKey: 'farm.cat' },
  { value: 'Dog', labelKey: 'farm.dog' },
  { value: 'Duck', labelKey: 'farm.duck' },
  { value: 'Goat', labelKey: 'farm.goat' },
  { value: 'Rabbit', labelKey: 'farm.rabbit' },
  { value: 'Rooster', labelKey: 'farm.rooster' },
];
