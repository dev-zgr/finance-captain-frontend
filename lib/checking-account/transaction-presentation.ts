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

  if (isIncomeCheckingCategory(normalized)) {
    return "INCOME";
  }

  if (isExpenseCheckingCategory(normalized)) {
    return "EXPENSE";
  }

  return "EXPENSE";
}

export function resolveTransactionType(
  transactionType: TransactionType | undefined,
  category: string
): TransactionType {
  if (transactionType === "INCOME" || transactionType === "EXPENSE") {
    return transactionType;
  }

  return getTransactionTypeFromCategory(category);
}

export function getSignedAmountFromTransaction(
  amount: number,
  transactionType: TransactionType | undefined,
  category: string
): number {
  const type = resolveTransactionType(transactionType, category);
  return type === "EXPENSE" ? -Math.abs(amount) : Math.abs(amount);
}

export function getSignedAmountFromCategory(amount: number, category: string): number {
  return getSignedAmountFromTransaction(amount, undefined, category);
}
