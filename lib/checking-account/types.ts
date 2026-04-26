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
