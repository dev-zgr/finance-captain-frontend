export const EXPENSE_CHECKING_CATEGORIES = [
  "FOOD",
  "TRANSPORT",
  "UTILITIES",
  "RENT",
  "HEALTHCARE",
  "ENTERTAINMENT",
  "SHOPPING",
  "TRANSFERS",
  "OTHER",
] as const;

export const INCOME_CHECKING_CATEGORIES = [
  "SALARY",
  "INVESTMENT",
  "RENTAL",
  "TRANSFERS",
  "OTHER",
] as const;

export type ExpenseCheckingCategory = (typeof EXPENSE_CHECKING_CATEGORIES)[number];
export type IncomeCheckingCategory = (typeof INCOME_CHECKING_CATEGORIES)[number];

const EXPENSE_CATEGORY_SET: ReadonlySet<string> = new Set(EXPENSE_CHECKING_CATEGORIES);

export function isExpenseCheckingCategory(value: string): value is ExpenseCheckingCategory {
  return EXPENSE_CATEGORY_SET.has(value);
}

// Category display mappings
export const CATEGORY_DISPLAY_MAP: Record<string, string> = {
  FOOD: "Food",
  TRANSPORT: "Transport",
  UTILITIES: "Utilities",
  RENT: "Rent",
  HEALTHCARE: "Healthcare",
  ENTERTAINMENT: "Entertainment",
  SHOPPING: "Shopping",
  TRANSFERS: "Transfers",
  OTHER: "Other",
};

export const EXPENSE_CATEGORIES_WITH_LABELS = EXPENSE_CHECKING_CATEGORIES.map((cat) => ({
  label: CATEGORY_DISPLAY_MAP[cat],
  value: cat,
}));

export const SUCCESS_FEEDBACK_MS = 1400;
export const MAX_DESCRIPTION_LENGTH = 256;
