import type { ApiErrorResponse, ApiSuccessResponse } from "@/lib/checking-account/types";

export type DashboardAccountType = "CHECKING" | "DEBTS" | "INVESTMENT";

export type DashboardTransactionCategory =
  | "INCOME"
  | "EXPENSE"
  | "DEBT"
  | "PAYMENT"
  | "DEPOSIT"
  | "WITHDRAW"
  | "BUY"
  | "SELL";

export interface UnifiedTransaction {
  transactionId: number;
  accountType: DashboardAccountType;
  transactionCategory: DashboardTransactionCategory;
  amount: number;
  date: string;
  description: string | null;
}

export interface UnifiedTransactionsContent {
  transactions: UnifiedTransaction[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface GetDashboardTransactionsParams {
  page?: number;
  size?: number;
}

export type GetDashboardTransactionsResponse =
  | ApiSuccessResponse<UnifiedTransactionsContent>
  | ApiErrorResponse;
