import grapeIcon from '@/assets/goods/grape.png';
import bottleIcon from '@/assets/icons/bottle-small.svg';
import reportIcon from '@/assets/icons/report.png';
import sellsIcon from '@/assets/icons/sells.png';
import { copy } from '@/promo/locale';
import { WINE } from '@/promo/winery/wn-timeline';

export const WN_POST = {
  icon: grapeIcon,
  eyebrow: copy.wine.title,
  title: 'მეღვინეობის მოდული',
  accent: 'მოდული',
};

export const WN_STEPS = [
  { icon: grapeIcon, title: copy.wine.harvest },
  { icon: bottleIcon, title: copy.wine.tabBottling },
  { icon: sellsIcon, title: copy.sales.title },
  { icon: reportIcon, title: 'ანგარიში' },
];

export const WN_FIGURES = [
  { value: WINE.grapeKg, unit: copy.farm.unitKg, label: 'მოკრეფილი ყურძენი' },
  { value: WINE.bottles, unit: copy.wine.unitBottle, label: `${WINE.liters} ${copy.wine.unitLiter} ღვინო ჩამოისხა` },
  { value: WINE.revenue, unit: '', label: `${WINE.sold} ${copy.wine.unitBottle} გაიყიდა` },
];

export const WN_REPORT = [
  { key: 'cost', label: copy.wine.costs, value: WINE.costs },
  { key: 'revenue', label: copy.wine.revenue, value: WINE.revenue },
  { key: 'profit', label: copy.wine.profit, value: WINE.revenue - WINE.costs },
];
