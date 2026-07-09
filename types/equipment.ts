export type Equipment = {
  id: number;
  name: string;
  quantity: number;
  imagePath: string;
};

export type EquipmentInput = Omit<Equipment, 'id'>;
