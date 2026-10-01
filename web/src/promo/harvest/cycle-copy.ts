import calendarIcon from '@/assets/icons/calendar.png';
import farmIcon from '@/assets/icons/farm.png';
import harvestIcon from '@/assets/icons/harvest.png';
import reportIcon from '@/assets/icons/report.png';
import balanceIcon from '@/assets/properties/balance.png';
import plantsIcon from '@/assets/properties/plants.png';
import seedIcon from '@/assets/seed.png';
import tomatoIcon from '@/assets/goods/tomato.png';
import { LANGUAGE } from '@/promo/locale';

export type CycleCaption = { icon: string; eyebrow: string; title: string; body: string };

type Chemical = { name: string; date: string; cost: number };

type CycleText = {
  captions: Omit<CycleCaption, 'icon'>[];
  tomato: string;
  cucumber: string;
  cabbage: string;
  field: string;
  chemicals: string[];
};

const ICONS = [harvestIcon, calendarIcon, seedIcon, tomatoIcon, reportIcon, balanceIcon, plantsIcon, farmIcon];

const CHEMICAL_DATES: Omit<Chemical, 'name'>[] = [
  { date: '2026-05-20', cost: 120 },
  { date: '2026-06-05', cost: 180 },
  { date: '2026-07-01', cost: 95 },
];

const KA: CycleText = {
  captions: [
    { eyebrow: 'მოსავალი', title: 'მოსავლის სრული ციკლი', body: 'დაგეგმვიდან მარაგში გადატანამდე — ერთ გვერდზე.' },
    { eyebrow: '1 · დაგეგმვა', title: 'დაგეგმე მოსავალი', body: 'კულტურა, მიწა და მოსალოდნელი თარიღი — ერთ ჩანაწერში.' },
    {
      eyebrow: '2 · ზრდა',
      title: 'დარგე და თვალი ადევნე ზრდას',
      body: 'ყოველი ეტაპი თავისი თარიღით, მარცვალი კი მარაგიდან ჩამოიჭრება.',
    },
    { eyebrow: '3 · აღება', title: 'ჩაწერე მოსავალი', body: 'შემოსავალი, ხარჯი და წმინდა მოგება ავტომატურად ითვლება.' },
    { eyebrow: '4 · მიმოხილვა', title: 'მოსავლის ანალიტიკა', body: 'ვარგისი და დანაკარგი, ხარისხის განაწილება — გრაფიკებზე.' },
    { eyebrow: '5 · შეფასება', title: 'შეაფასე ხარისხი', body: 'დაყავი მოსავალი A–D კლასებად და ჩაწერე დანაკარგი.' },
    {
      eyebrow: '6 · ქიმიკატები',
      title: 'აღრიცხე ქიმიკატები',
      body: 'ჩაინიშნე ყოველი ოპერაცია — დაითვალე ხარჯი.',
    },
    { eyebrow: '7 · მარაგი', title: 'მოსავალი მარაგში', body: 'ბოლო ეტაპზე მოსავალი ნაშთებს ემატება.' },
  ],
  tomato: 'პომიდორი — ზემო ველი',
  cucumber: 'კიტრი — სათბურის გვერდით',
  cabbage: 'კომბოსტო — ქვედა ნაკვეთი',
  field: 'ზემო ველი',
  chemicals: ['ფუნგიციდი', 'სასუქი NPK', 'ინსექტიციდი'],
};

const EN: CycleText = {
  captions: [
    { eyebrow: 'Harvest', title: 'The full harvest cycle', body: 'From planning to stock, on one page.' },
    { eyebrow: '1 · Plan', title: 'Plan the harvest', body: 'Crop, land and expected date in a single record.' },
    { eyebrow: '2 · Grow', title: 'Plant it and follow it', body: 'Every stage gets its date, and seed comes off your stock.' },
    { eyebrow: '3 · Harvest', title: 'Record the yield', body: 'Revenue, costs and net profit are worked out for you.' },
    { eyebrow: '4 · Overview', title: 'Harvest analytics', body: 'Usable yield, losses and the grade split, charted.' },
    { eyebrow: '5 · Grading', title: 'Grade the quality', body: 'Split the yield into grades A–D and record what was lost.' },
    { eyebrow: '6 · Chemicals', title: 'Track every spray', body: 'Each application with its date and cost, counted in your expenses.' },
    { eyebrow: '7 · Stock', title: 'Into your stock', body: 'At the last step the yield joins your balances.' },
  ],
  tomato: 'Tomatoes — Upper field',
  cucumber: 'Cucumbers — by the greenhouse',
  cabbage: 'Cabbage — Lower plot',
  field: 'Upper field',
  chemicals: ['Fungicide', 'NPK fertiliser', 'Insecticide'],
};

const TEXT = LANGUAGE === 'en' ? EN : KA;

export const CYCLE_CAPTIONS: CycleCaption[] = TEXT.captions.map((caption, index) => ({
  icon: ICONS[index],
  ...caption,
}));

export const SAMPLE = {
  tomato: TEXT.tomato,
  cucumber: TEXT.cucumber,
  cabbage: TEXT.cabbage,
  field: TEXT.field,
  chemicals: TEXT.chemicals.map((name, index): Chemical => ({ name, ...CHEMICAL_DATES[index] })),
};
