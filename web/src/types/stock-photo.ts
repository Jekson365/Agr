export type StockPhoto = {
  id: number;
  stockId: number;
  imagePath: string;
  /** Date the photo was actually taken (`YYYY-MM-DD`), not the upload time. */
  takenAt: string;
  createdAt: string;
};

export type StockPhotoInput = {
  stockId: number;
  imagePath: string;
  takenAt: string;
};
