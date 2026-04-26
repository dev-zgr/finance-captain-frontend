import {
  isExpenseCheckingCategory,
  isIncomeCheckingCategory,
  MAX_DESCRIPTION_LENGTH,
} from "@/lib/checking-account/constants";
import type {
  ExpenseFormFieldErrors,
  ExpenseFormValues,
  IncomeFormFieldErrors,
  IncomeFormValues,
} from "@/lib/checking-account/types";

function parseAmount(value: string): number | null {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return numeric;
}

function isFutureDate(value: string): boolean {
  if (!value) {
    return false;
  }

  const inputDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(inputDate.getTime())) {
    return true;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate > today;
}

export function toBackendDate(value: string): string {
  return new Date(`${value}T00:00:00`).toISOString();
}

export function validateExpenseForm(values: ExpenseFormValues): ExpenseFormFieldErrors {
  const fieldErrors: ExpenseFormFieldErrors = {};

  if (!values.date) {
    fieldErrors.date = "Date is required.";
  } else if (isFutureDate(values.date)) {
    fieldErrors.date = "Date must be today or earlier.";
  }

  if (!values.amount.trim()) {
    fieldErrors.amount = "Amount is required.";
  } else {
    const amount = parseAmount(values.amount);
    if (amount === null) {
      fieldErrors.amount = "Amount must be a valid number.";
    } else if (amount <= 0) {
      fieldErrors.amount = "Amount must be greater than 0.";
    }
  }

  if (values.description.length > MAX_DESCRIPTION_LENGTH) {
    fieldErrors.description = `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`;
  }

  if (!values.category) {
    fieldErrors.category = "Category is required.";
  } else if (!isExpenseCheckingCategory(values.category)) {
    fieldErrors.category = "Please choose a valid expense category.";
  }

  return fieldErrors;
}

export function validateIncomeForm(values: IncomeFormValues): IncomeFormFieldErrors {
  const fieldErrors: IncomeFormFieldErrors = {};

  if (!values.date) {
    fieldErrors.date = "Date is required.";
  } else if (isFutureDate(values.date)) {
    fieldErrors.date = "Date must be today or earlier.";
  }

  if (!values.amount.trim()) {
    fieldErrors.amount = "Amount is required.";
  } else {
    const amount = parseAmount(values.amount);
    if (amount === null) {
      fieldErrors.amount = "Amount must be a valid number.";
    } else if (amount <= 0) {
      fieldErrors.amount = "Amount must be greater than 0.";
    }
  }

  if (values.description.length > MAX_DESCRIPTION_LENGTH) {
    fieldErrors.description = `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`;
  }

  if (!values.category) {
    fieldErrors.category = "Category is required.";
  } else if (!isIncomeCheckingCategory(values.category)) {
    fieldErrors.category = "Please choose a valid income category.";
  }

  return fieldErrors;
}

export function validateAiSuggestionInput(values: ExpenseFormValues): ExpenseFormFieldErrors {
  const fieldErrors: ExpenseFormFieldErrors = {};

  if (!values.description.trim()) {
    fieldErrors.description = "Description is required for AI categorization.";
  } else if (values.description.length > MAX_DESCRIPTION_LENGTH) {
    fieldErrors.description = `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`;
  }

  if (values.amount.trim()) {
    const amount = parseAmount(values.amount);
    if (amount === null) {
      fieldErrors.amount = "Amount must be a valid number.";
    } else if (amount < 0) {
      fieldErrors.amount = "Amount cannot be negative.";
    }
  }

  if (values.date && isFutureDate(values.date)) {
    fieldErrors.date = "Date must be today or earlier.";
  }

  return fieldErrors;
}

export function mapBackendFieldErrors(
  rawFieldErrors: Record<string, string> | undefined,
): ExpenseFormFieldErrors {
  if (!rawFieldErrors) {
    return {};
  }

  const mapped: ExpenseFormFieldErrors = {};

  const keyMap: Record<string, keyof ExpenseFormValues> = {
    amount: "amount",
    date: "date",
    description: "description",
    category: "category",
    transactiondate: "date",
    transaction_date: "date",
  };

  for (const [key, value] of Object.entries(rawFieldErrors)) {
    const normalizedKey = key.toLowerCase();
    const mappedKey = keyMap[normalizedKey];
    if (mappedKey) {
      mapped[mappedKey] = value;
    }
  }

  return mapped;
}
