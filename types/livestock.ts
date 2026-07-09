export type AnimalType =
  | 'Cow'
  | 'Sheep'
  | 'Chicken'
  | 'Turkey'
  | 'Pig'
  | 'Cat'
  | 'Dog'
  | 'Duck'
  | 'Goat'
  | 'Rabbit';

export type Livestock = {
  id: number;
  type: AnimalType;
  count: number;
  name: string;
  farmId: number;
};

export type LivestockInput = Omit<Livestock, 'id'>;
