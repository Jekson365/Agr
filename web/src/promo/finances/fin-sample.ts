import { livestockImage } from '@/config/livestock-kinds';
import { stockKindImage } from '@/config/stock-kinds';

export type PurchaseRow = { key: string; seller: string; icons: string[]; total: number };

export const PURCHASE_ROWS: PurchaseRow[] = [
  { key: 'seeds', seller: 'აგრო მარკეტი', icons: [stockKindImage('Potato'), stockKindImage('Carrot')], total: 1050 },
  { key: 'cows', seller: 'ლევანი', icons: [livestockImage('Cow')], total: 3200 },
  { key: 'market', seller: 'აგრო მარკეტი', icons: [stockKindImage('Tomato'), stockKindImage('Cucumber')], total: 210 },
];

export const NEW_PURCHASE: PurchaseRow = {
  key: 'new',
  seller: 'ნიკა',
  icons: [livestockImage('Sheep')],
  total: 1440,
};

export const SALE_MONTHS = [
  { label: '05.26', total: 180 },
  { label: '06.26', total: 400 },
  { label: '07.26', total: 240 },
  { label: '08.26', total: 400 },
  { label: '09.26', total: 270 },
  { label: '10.26', total: 750 },
];

export const NEW_SALE = { item: 'პომიდორი', icon: stockKindImage('Tomato'), quantity: '300 კგ', buyer: 'ნინო', amount: 750 };

export const STOCK_CHANGES = [
  { icon: livestockImage('Sheep'), name: 'ცხვრები', amount: '+4 სული', income: true },
  { icon: stockKindImage('Tomato'), name: 'პომიდორი', amount: '−300 კგ', income: false },
];
