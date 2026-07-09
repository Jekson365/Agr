export type AppNotification = {
  id: string;
  title: string;
  body: string;
  /** ISO datetime string. */
  createdAt: string;
  read: boolean;
};
