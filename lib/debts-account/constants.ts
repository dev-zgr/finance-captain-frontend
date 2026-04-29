export const DEBT_CATEGORIES = [
  "LOAN",
  "CREDIT_CARD_ADVANCE",
  "MORTGAGE",
  "PERSONAL_BORROWING",
  "OTHER",
] as const

export type DebtCategory = (typeof DEBT_CATEGORIES)[number]

export const DEBT_CATEGORY_DISPLAY_MAP: Record<DebtCategory, string> = {
  LOAN: "Loan",
  CREDIT_CARD_ADVANCE: "Credit card advance",
  MORTGAGE: "Mortgage",
  PERSONAL_BORROWING: "Personal borrowing",
  OTHER: "Other",
}

export const DEBT_CATEGORIES_WITH_LABELS = DEBT_CATEGORIES.map((value) => ({
  value,
  label: DEBT_CATEGORY_DISPLAY_MAP[value],
}))

export const MAX_DEBT_DESCRIPTION_LENGTH = 256

export function isDebtCategory(value: string): value is DebtCategory {
  return DEBT_CATEGORIES.includes(value as DebtCategory)
}
