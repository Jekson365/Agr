import { livestockTypeLabel } from '@/config/livestock-kinds';
import type { SaleAnimal } from '@/types/sale-animal';

type Translate = (key: string) => string;

export type SaleAnimalGroup = {
  id: number;
  name: string;
  type: string;
  animals: SaleAnimal[];
};

const TITLE_LIMIT = 120;

export function saleGroupName(animal: SaleAnimal, t: Translate): string {
  return animal.livestockName.trim() || livestockTypeLabel(animal.livestockType, t);
}

export function groupSaleAnimals(animals: SaleAnimal[], query: string, t: Translate): SaleAnimalGroup[] {
  const needle = query.trim().toLowerCase();
  const groups = new Map<number, SaleAnimalGroup>();

  for (const animal of animals) {
    const name = saleGroupName(animal, t);
    if (needle && !animal.code.toLowerCase().includes(needle) && !name.toLowerCase().includes(needle)) continue;

    const group = groups.get(animal.livestockId) ?? {
      id: animal.livestockId,
      name,
      type: animal.livestockType,
      animals: [],
    };
    group.animals.push(animal);
    groups.set(animal.livestockId, group);
  }

  return [...groups.values()];
}

export function animalSaleTitle(animals: SaleAnimal[], t: Translate): string {
  if (animals.length === 0) return '';
  const kinds = [...new Set(animals.map((animal) => livestockTypeLabel(animal.livestockType, t)))].join(', ');
  const title = `${kinds} · ${animals.map((animal) => animal.code).join(', ')}`;
  return title.length <= TITLE_LIMIT ? title : `${title.slice(0, TITLE_LIMIT - 1)}…`;
}

export function animalSaleItemType(animals: SaleAnimal[]): string {
  const types = new Set(animals.map((animal) => animal.livestockType));
  return types.size === 1 ? [...types][0] : '';
}
