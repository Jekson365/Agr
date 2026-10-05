import tomaAnimals from '@/assets/mascot/animals.png';
import maia from '@/assets/mascot/maia.png';
import tomaCalm from '@/assets/mascot/mascot-guide.png';
import toma from '@/assets/mascot/toma.png';
import tomaWine from '@/assets/mascot/toma-wine.png';
import tomaField from '@/assets/mascot-intro.png';

export const MASCOTS = {
  maia: { src: maia, className: 'is-maia' },
  toma: { src: toma, className: 'is-toma' },
  tomaCalm: { src: tomaCalm, className: 'is-toma-calm' },
  tomaAnimals: { src: tomaAnimals, className: 'is-toma-animals' },
  tomaField: { src: tomaField, className: 'is-toma-field' },
  tomaWine: { src: tomaWine, className: 'is-toma-wine' },
};

export type MascotId = keyof typeof MASCOTS;
