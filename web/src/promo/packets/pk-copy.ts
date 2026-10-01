import coinIcon from '@/assets/coin.png';
import farmIcon from '@/assets/icons/farm.png';
import landIcon from '@/assets/properties/land.png';
import plantsIcon from '@/assets/properties/plants.png';
import { PLAN_PACKETS } from '@/config/landing';
import type { CycleCaption } from '@/promo/harvest/cycle-copy';
import { tr } from '@/promo/locale';

const [free, medium, premium] = PLAN_PACKETS;

const price = (amount: number) => `₾${amount} ${tr('landing.packets.perMonth')}`;

export const PACKET_CAPTIONS: CycleCaption[] = [
  {
    icon: coinIcon,
    eyebrow: tr('landing.packets.eyebrow'),
    title: 'აირჩიე შენი პაკეტი',
    body: 'დაიწყე უფასოდ და გადადი უფრო დიდ პაკეტზე, როცა მეურნეობა გაიზრდება.',
  },
  {
    icon: plantsIcon,
    eyebrow: tr(free.nameKey),
    title: 'დაიწყე უფასოდ',
    body: `${free.limits.land} ნაკვეთი და ${free.limits.stock}-${free.limits.stock} სახეობა — მცირე მეურნეობისთვის საკმარისია.`,
  },
  {
    icon: farmIcon,
    eyebrow: `${tr(medium.nameKey)} · ${price(medium.price)}`,
    title: tr('landing.packets.medium.tagline'),
    body: `${medium.limits.land} ნაკვეთი, ${medium.limits.stock}-${medium.limits.stock} სახეობა, ${medium.limits.storageMb} MB და ინვენტარის აღრიცხვა.`,
  },
  {
    icon: landIcon,
    eyebrow: `${tr(premium.nameKey)} · ${price(premium.price)}`,
    title: tr('landing.packets.premium.tagline'),
    body: 'ულიმიტო მიწა, სახეობები და მეხსიერება — არანაირი ზღვარი.',
  },
];
