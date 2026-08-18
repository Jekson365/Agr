import catIcon from '@/assets/animals/cat.png';
import chickenIcon from '@/assets/animals/chicken.png';
import cowIcon from '@/assets/animals/cow.png';
import dogIcon from '@/assets/animals/dog.png';
import duckIcon from '@/assets/animals/duck.png';
import goatIcon from '@/assets/animals/goat.png';
import pigIcon from '@/assets/animals/pig.png';
import rabbitIcon from '@/assets/animals/rabbit.png';
import roosterIcon from '@/assets/animals/rooster.png';
import sheepIcon from '@/assets/animals/sheep.png';
import turkeyIcon from '@/assets/animals/turkey.png';
// The stand-in that sits alongside the kind artwork, rather than the Livestock area's own icon —
// a custom kind is one of these animals in a row of them, not a link to the section.
import defaultLivestockIcon from '@/assets/animals/default.png';
import { customKindIcon } from '@/config/kind-icons';

// LivestockKinds are an open catalog (built-in defaults plus custom kinds a user added), so
// these maps are keyed by the string name the server returns and fall back for unknown names.
export const LIVESTOCK_KIND_IMAGE: Record<string, string> = {
  Cow: cowIcon,
  Sheep: sheepIcon,
  Chicken: chickenIcon,
  Turkey: turkeyIcon,
  Pig: pigIcon,
  Cat: catIcon,
  Dog: dogIcon,
  Duck: duckIcon,
  Goat: goatIcon,
  Rabbit: rabbitIcon,
  Rooster: roosterIcon,
};

/** The kind's artwork: the bundled image if it's a known built-in, otherwise the picture the user
 *  gave the kind when they added it, and the generic animals icon for a kind with neither. */
export function livestockImage(type: string): string {
  // Built-in first, then the kind's own uploaded artwork, then the generic stand-in.
  // A user-added kind is drawn like a built-in — see config/kind-icons.ts.
  return LIVESTOCK_KIND_IMAGE[type] ?? customKindIcon('livestock', type) ?? defaultLivestockIcon;
}

export const LIVESTOCK_KIND_LABEL_KEY: Record<string, string> = {
  Cow: 'farm.cow',
  Sheep: 'farm.sheep',
  Chicken: 'farm.chicken',
  Turkey: 'farm.turkey',
  Pig: 'farm.pig',
  Cat: 'farm.cat',
  Dog: 'farm.dog',
  Duck: 'farm.duck',
  Goat: 'farm.goat',
  Rabbit: 'farm.rabbit',
  Rooster: 'farm.rooster',
};

/** A kind's translation if it's a known built-in, otherwise its raw (user-entered) name. */
export function livestockTypeLabel(type: string, t: (key: string) => string): string {
  const key = LIVESTOCK_KIND_LABEL_KEY[type];
  return key ? t(key) : type;
}

/** Whether this is one of the kinds every tenant is seeded with, as opposed to one a user added.
 * See isBuiltInStockKind — no kind is removable from the app either way. */
export function isBuiltInLivestockKind(type: string): boolean {
  return type in LIVESTOCK_KIND_LABEL_KEY;
}
