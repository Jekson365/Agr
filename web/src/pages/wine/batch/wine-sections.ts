import grapeIcon from '@/assets/goods/grape.png';
import readingsIcon from '@/assets/icons/report.png';
import bottlingIcon from '@/assets/icons/wine-bottle.svg';
import moneyIcon from '@/assets/icons/finances.png';
import workIcon from '@/assets/icons/cellar-work.svg';
import historyIcon from '@/assets/properties/balance.png';

export type WineSection = 'grapes' | 'readings' | 'work' | 'bottling' | 'money' | 'history';

export const WINE_SECTIONS: WineSection[] = ['grapes', 'readings', 'work', 'bottling', 'money', 'history'];

export const WINE_SECTION_ICON: Record<WineSection, string> = {
  grapes: grapeIcon,
  readings: readingsIcon,
  bottling: bottlingIcon,
  work: workIcon,
  money: moneyIcon,
  history: historyIcon,
};

export const WINE_SECTION_LABEL_KEY: Record<WineSection, string> = {
  grapes: 'wine.tabGrapes',
  readings: 'wine.tabReadings',
  bottling: 'wine.tabBottling',
  work: 'wine.tabWork',
  money: 'wine.tabMoney',
  history: 'wine.tabHistory',
};
