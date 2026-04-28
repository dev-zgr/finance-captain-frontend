import type { ExpenseCheckingCategory, IncomeCheckingCategory } from "@/lib/checking-account/constants";

export type TransactionType = "INCOME" | "EXPENSE";
export type TransactionMethodType = "MANUAL" | "VLM";

export type ExpenseFormValues = {
  date: string;
  amount: string;
  description: string;
  category: string;
};

export type IncomeFormValues = {
  date: string;
  amount: string;
  description: string;
  category: string;
};

export type ExpenseFormField = keyof ExpenseFormValues;
export type IncomeFormField = keyof IncomeFormValues;
export type ExpenseFormFieldErrors = Partial<Record<ExpenseFormField, string>>;
export type IncomeFormFieldErrors = Partial<Record<IncomeFormField, string>>;

export type CategorySuggestionRequest = {
  description: string;
  amount?: number;
  date?: string;
  transactionType?: TransactionType;
};

export type CategorySuggestionContent = {
  suggestedCategory?: string;
};

export type CreateCheckingTransactionRequest = {
  transactionType: "EXPENSE";
  transactionMethodType: TransactionMethodType;
  amount: number;
  date: string;
  expenseCategory: ExpenseCheckingCategory;
  description?: string;
} | {
  transactionType: "INCOME";
  transactionMethodType: TransactionMethodType;
  amount: number;
  date: string;
  incomeCategory: IncomeCheckingCategory;
  description?: string;
};

export type ApiSuccessResponse<T> = {
  message?: string;
  content?: T;
};

export type ApiErrorResponse = {
  message?: string;
  timestamp?: string;
  errorDetails?: string;
  fieldErrors?: Record<string, string>;
};

export type SortBy = "date" | "amount";

export interface GetTransactionsParams {
  page?: number;
  sortBy?: SortBy;
  sortDirection?: "ASC" | "DESC";
  startDate?: string;
  endDate?: string;
  category?: string[];
  transactionType?: TransactionType;
}

export interface TransactionRow {
  transactionId: number;
  date: string;
  amount: number;
  category: string;
  description: string;
}

export interface GetTransactionsResponse {
  transactions: TransactionRow[];
  totalPages: number;
  totalElements: number;
}

// Backwards-compatible aliases for existing checking-account consumers.
export type GetCheckingTransactionsParams = GetTransactionsParams;
export type TransactionDTO = TransactionRow;
export type GetCheckingTransactionsResponseDTO = GetTransactionsResponse;

export type ExtractedTransaction = {
  date: string;
  amount: number;
  expenseCategory?: ExpenseCheckingCategory;
  incomeCategory?: IncomeCheckingCategory;
  description: string;
};

export type AccountSummary = {
  accountBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  accountOpeningDate: string | null;
};

export type TimeSeriesPeriod = "DAY" | "WEEK" | "MONTH";

export type TimeSeriesDataPoint = {
  intervalLabel: string;
  totalIncome: number;
  totalExpense: number;
};

export type TimeSeriesContent = {
  aggregationPeriod: TimeSeriesPeriod;
  dataPoints: TimeSeriesDataPoint[];
};

export type TimeSeriesResponse = ApiSuccessResponse<TimeSeriesContent> | ApiErrorResponse;

export type VlmExtractionResponse = {
  date?: string;
  amount?: number;
  category?: string;
  expenseCategory?: ExpenseCheckingCategory;
  incomeCategory?: IncomeCheckingCategory;
  description?: string;
};
