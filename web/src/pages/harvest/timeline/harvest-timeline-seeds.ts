import { SEED_UNIT_LABEL_KEY, seedTitle } from '@/config/seed-kinds';
import { stockKindImage } from '@/config/stock-kinds';
import type { GreenhouseHarvestSeed } from '@/types/greenhouse-harvest-seed';
import type { GreenhouseSeed } from '@/types/greenhouse-stock';
import type { HarvestSeed } from '@/types/harvest-seed';
import type { Seed } from '@/types/seed';
import type { TimelineHarvest } from './harvest-timeline-spans';

export const MAX_SEED_ICONS = 3;

export type SeedInput = {
  harvests: TimelineHarvest[];
  harvestSeeds: HarvestSeed[];
  greenhouseHarvestSeeds: GreenhouseHarvestSeed[];
  seeds: Seed[];
  greenhouseSeeds: GreenhouseSeed[];
};

export function emptySeedInput(): Omit<SeedInput, 'harvests'> {
  return { harvestSeeds: [], greenhouseHarvestSeeds: [], seeds: [], greenhouseSeeds: [] };
}

export function buildSeedIcons(input: SeedInput): Map<string, string[]> {
  const fieldKeys = new Map<number, string>();
  const greenhouseKeys = new Map<number, string>();
  for (const harvest of input.harvests) {
    const id = Number(harvest.key.split('-')[1]);
    if (harvest.source === 'greenhouse') {
      greenhouseKeys.set(id, harvest.key);
    } else {
      fieldKeys.set(id, harvest.key);
    }
  }

  const seedTypes = new Map(input.seeds.map((seed) => [seed.id, seed.type]));
  const greenhouseSeedTypes = new Map(input.greenhouseSeeds.map((seed) => [seed.id, seed.type]));

  const byHarvest = new Map<string, Map<string, string>>();

  function add(key: string | undefined, type: string | undefined) {
    if (!key || !type) return;
    const types = byHarvest.get(key) ?? new Map<string, string>();
    types.set(type, stockKindImage(type));
    byHarvest.set(key, types);
  }

  for (const row of input.harvestSeeds) {
    add(fieldKeys.get(row.harvestId), seedTypes.get(row.seedId));
  }

  for (const row of input.greenhouseHarvestSeeds) {
    add(greenhouseKeys.get(row.greenhouseHarvestId), greenhouseSeedTypes.get(row.greenhouseSeedId));
  }

  const icons = new Map<string, string[]>();
  for (const [key, types] of byHarvest) {
    icons.set(key, [...types.values()].slice(0, MAX_SEED_ICONS));
  }
  return icons;
}

export type SeedRow = { key: string; icon: string; label: string; amount: string };

export function buildSeedRows(input: SeedInput, t: (key: string) => string): Map<string, SeedRow[]> {
  const fieldKeys = new Map<number, string>();
  const greenhouseKeys = new Map<number, string>();
  for (const harvest of input.harvests) {
    const id = Number(harvest.key.split('-')[1]);
    if (harvest.source === 'greenhouse') {
      greenhouseKeys.set(id, harvest.key);
    } else {
      fieldKeys.set(id, harvest.key);
    }
  }

  const seeds = new Map(input.seeds.map((seed) => [seed.id, seed]));
  const greenhouseSeeds = new Map(input.greenhouseSeeds.map((seed) => [seed.id, seed]));
  const rows = new Map<string, SeedRow[]>();

  function add(key: string | undefined, row: SeedRow) {
    if (!key) return;
    rows.set(key, [...(rows.get(key) ?? []), row]);
  }

  for (const used of input.harvestSeeds) {
    const seed = seeds.get(used.seedId);
    if (!seed) continue;
    add(fieldKeys.get(used.harvestId), {
      key: `seed-${used.id}`,
      icon: stockKindImage(seed.type),
      label: seedTitle(seed, t),
      amount: `${used.amount} ${t(SEED_UNIT_LABEL_KEY[seed.unit] ?? '')}`,
    });
  }

  for (const used of input.greenhouseHarvestSeeds) {
    const seed = greenhouseSeeds.get(used.greenhouseSeedId);
    if (!seed) continue;
    add(greenhouseKeys.get(used.greenhouseHarvestId), {
      key: `gh-seed-${used.id}`,
      icon: stockKindImage(seed.type),
      label: seedTitle(seed, t),
      amount: `${used.amount} ${t(SEED_UNIT_LABEL_KEY[seed.unit] ?? '')}`,
    });
  }

  return rows;
}
