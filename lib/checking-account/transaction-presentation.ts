import {
  isExpenseCheckingCategory,
  isIncomeCheckingCategory,
} from "@/lib/checking-account/constants";
import type { TransactionType } from "@/lib/checking-account/types";

function normalizeCategory(category: string): string {
  return category.trim().toUpperCase();
}

export function getTransactionTypeFromCategory(category: string): TransactionType {
  const normalized = normalizeCategory(category);

  if (isExpenseCheckingCategory(normalized)) {
    return "EXPENSE";
  }

  if (isIncomeCheckingCategory(normalized)) {
    return "INCOME";
  }

  return "EXPENSE";
}

export function getSignedAmountFromCategory(amount: number, category: string): number {
  const transactionType = getTransactionTypeFromCategory(category);
  return transactionType === "EXPENSE" ? -Math.abs(amount) : Math.abs(amount);
}
