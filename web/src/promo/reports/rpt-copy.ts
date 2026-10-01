import coinIcon from '@/assets/coin.png';
import harvestIcon from '@/assets/icons/harvest.png';
import reportIcon from '@/assets/icons/report.png';
import balanceIcon from '@/assets/properties/balance.png';
import plantsIcon from '@/assets/properties/plants.png';
import tomatoIcon from '@/assets/goods/tomato.png';
import type { CycleCaption } from '@/promo/harvest/cycle-copy';

export const REPORT_CAPTIONS: CycleCaption[] = [
  {
    icon: harvestIcon,
    eyebrow: 'მოსავალი → ანგარიშები',
    title: 'მოსავლიდან ანგარიშებამდე',
    body: 'აღებული მოსავალი თავისით ჩნდება ნაშთებში, გრაფიკებსა და ანგარიშებში.',
  },
  {
    icon: tomatoIcon,
    eyebrow: '1 · ნაშთებში გადატანა',
    title: 'გადაიტანე მოსავალი ნაშთებში',
    body: 'ბოლო ეტაპი — და 1340 კგ პომიდორი აღრიცხვაში შედის.',
  },
  {
    icon: balanceIcon,
    eyebrow: '2 · ნაშთები',
    title: 'ბალანსის განახლება',
    body: 'პომიდორის ნაშთი 0-დან 1340 კგ-მდე გაიზარდა.',
  },
  {
    icon: reportIcon,
    eyebrow: '3 · ანგარიშები',
    title: 'შემოსავლების გრაფიკი',
    body: 'სტატისტიკის აღრიცხვა.',
  },
  {
    icon: coinIcon,
    eyebrow: '4 · მოსავლის ანგარიში',
    title: 'შემოსავალი და ხარჯი',
    body: 'ახალი ჩანაწერი: ₾5600 შემოსავალი, ₾2700 ხარჯი.',
  },
  {
    icon: plantsIcon,
    eyebrow: '5 · მარაგის ანგარიში',
    title: 'ყოველი მოძრაობა აღრიცხულია',
    body: 'შემოსვლა +1340 კგ — მარაგის ისტორია ავტომატურად ივსება.',
  },
];

export const SAMPLE = {
  tomatoTitle: 'პომიდორი — ზემო ველი',
  field: 'ზემო ველი',
};
