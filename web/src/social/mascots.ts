import tomaAnimals from '@/assets/mascot/animals.png';
import maia from '@/assets/mascot/maia.png';
import tomaCalm from '@/assets/mascot/mascot-guide.png';
import toma from '@/assets/mascot/toma.png';
import tomaField from '@/assets/mascot-intro.png';

export const MASCOTS = {
  maia: { src: maia, className: 'is-maia' },
  toma: { src: toma, className: 'is-toma' },
  tomaCalm: { src: tomaCalm, className: 'is-toma-calm' },
  tomaAnimals: { src: tomaAnimals, className: 'is-toma-animals' },
  tomaField: { src: tomaField, className: 'is-toma-field' },
};

export type MascotId = keyof typeof MASCOTS;
