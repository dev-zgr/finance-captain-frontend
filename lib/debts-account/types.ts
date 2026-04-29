import type { ApiErrorResponse, ApiSuccessResponse } from "@/lib/checking-account/types";

export type DebtsAccountSummary = {
  accountOpeningDate: string | null;
  totalDebtsTakenThisMonth: number;
  totalPaymentsMadeThisMonth: number;
  currentDebtsAccountBalance: number;
};

export type DebtsApiSuccessResponse<T> = ApiSuccessResponse<T> & {
  data?: T;
};

export type DebtsApiErrorResponse = ApiErrorResponse;
