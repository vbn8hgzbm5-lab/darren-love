export const CATEGORIES = [
  'Food',
  'Groceries',
  'Travel',
  'Fuel',
  'Office',
  'Shopping',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Receipt {
  id: string;
  /** Cropped page images, stored in the app's document directory. */
  pages: string[];
  merchant: string;
  /** Amount as typed by the user, e.g. "12.50". Empty when unknown. */
  amount: string;
  category: Category;
  note: string;
  /** ISO timestamp of when the receipt was scanned. */
  createdAt: string;
}
