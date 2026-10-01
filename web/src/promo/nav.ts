import rabbitIcon from '@/assets/animals/rabbit.png';
import farmIcon from '@/assets/icons/farm.png';
import harvestIcon from '@/assets/icons/harvest.png';
import reportIcon from '@/assets/icons/report.png';
import animalsIcon from '@/assets/properties/animals.png';
import balanceIcon from '@/assets/properties/balance.png';
import { copy } from '@/promo/locale';
import { clickTime, SCREEN_COUNT } from '@/promo/timeline';

export const NAV_ITEMS = [
  { icon: farmIcon, label: copy.dashboard.myFarm },
  { icon: harvestIcon, label: copy.dashboard.harvest },
  { icon: balanceIcon, label: copy.harvestGrading.title },
  { icon: animalsIcon, label: copy.farm.livestock },
  { icon: rabbitIcon, label: copy.breedingEvent.title },
  { icon: reportIcon, label: copy.dashboard.report },
];

export function activeIndex(time: number): number {
  let active = 0;
  for (let index = 1; index < SCREEN_COUNT; index += 1) {
    if (time >= clickTime(index)) active = index;
  }
  return active;
}
