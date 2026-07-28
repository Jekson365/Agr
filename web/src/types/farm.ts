export type Farm = {
  id: number;
  name: string;
  imagePath: string;
  area: number;
  location: string;
};

export type FarmInput = Omit<Farm, 'id'>;
