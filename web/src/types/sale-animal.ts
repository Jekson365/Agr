import type { Gender } from '@/types/livestock-detail';

export type SaleAnimal = {
  id: number;
  code: string;
  livestockId: number;
  livestockName: string;
  livestockType: string;
  gender: Gender | null;
  bornDate: string | null;
  imagePath: string;
};
