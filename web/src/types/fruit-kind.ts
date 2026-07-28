export type FruitKind = {
  id: number;
  name: string;
};

export type FruitKindInput = Omit<FruitKind, 'id'>;
