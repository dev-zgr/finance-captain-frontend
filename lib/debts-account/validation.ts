import {
  isDebtCategory,
  MAX_DEBT_DESCRIPTION_LENGTH,
} from "@/lib/debts-account/constants"
import type {
  GetDebtFormFieldErrors,
  GetDebtFormValues,
  PayDebtFormFieldErrors,
  PayDebtFormValues,
} from "@/lib/debts-account/types"

function parseAmount(value: string): number | null {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return null
  }

  return numeric
}

function isFutureDate(value: string): boolean {
  if (!value) {
    return false
  }

  const inputDate = new Date(`${value}T00:00:00`)
  if (Number.isNaN(inputDate.getTime())) {
    return true
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return inputDate > today
}

export function toBackendDate(value: string): string {
  return new Date(`${value}T00:00:00`).toISOString()
}

export function validateGetDebtForm(
  values: GetDebtFormValues
): GetDebtFormFieldErrors {
  const fieldErrors: GetDebtFormFieldErrors = {}

  if (!values.date) {
    fieldErrors.date = "Date is required."
  } else if (isFutureDate(values.date)) {
    fieldErrors.date = "Date must be today or earlier."
  }

  if (!values.amount.trim()) {
    fieldErrors.amount = "Amount is required."
  } else {
    const amount = parseAmount(values.amount)
    if (amount === null) {
      fieldErrors.amount = "Amount must be a valid number."
    } else if (amount <= 0) {
      fieldErrors.amount = "Amount must be greater than 0."
    }
  }

  if (!values.category) {
    fieldErrors.category = "Category is required."
  } else if (!isDebtCategory(values.category)) {
    fieldErrors.category = "Please choose a valid debt category."
  }

  if (values.description.length > MAX_DEBT_DESCRIPTION_LENGTH) {
    fieldErrors.description = `Description must be ${MAX_DEBT_DESCRIPTION_LENGTH} characters or fewer.`
  }

  return fieldErrors
}

export function mapBackendDebtsFieldErrors(
  rawFieldErrors: Record<string, string> | undefined
): GetDebtFormFieldErrors {
  if (!rawFieldErrors) {
    return {}
  }

  const mapped: GetDebtFormFieldErrors = {}
  const keyMap: Record<string, keyof GetDebtFormValues> = {
    amount: "amount",
    date: "date",
    description: "description",
    category: "category",
    debtcategory: "category",
    debt_category: "category",
    transactiondate: "date",
    transaction_date: "date",
  }

  for (const [key, value] of Object.entries(rawFieldErrors)) {
    const mappedKey = keyMap[key.toLowerCase()]
    if (mappedKey) {
      mapped[mappedKey] = value
    }
  }

  return mapped
}

export function validatePayDebtForm(
  values: PayDebtFormValues
): PayDebtFormFieldErrors {
  const fieldErrors: PayDebtFormFieldErrors = {}

  if (!values.date) {
    fieldErrors.date = "Date is required."
  } else if (isFutureDate(values.date)) {
    fieldErrors.date = "Date must be today or earlier."
  }

  if (!values.amount.trim()) {
    fieldErrors.amount = "Amount is required."
  } else {
    const amount = parseAmount(values.amount)
    if (amount === null) {
      fieldErrors.amount = "Amount must be a valid number."
    } else if (amount <= 0) {
      fieldErrors.amount = "Amount must be greater than 0."
    }
  }

  if (!values.description.trim()) {
    fieldErrors.description = "Description is required."
  } else if (values.description.length > MAX_DEBT_DESCRIPTION_LENGTH) {
    fieldErrors.description = `Description must be ${MAX_DEBT_DESCRIPTION_LENGTH} characters or fewer.`
  }

  return fieldErrors
}

export function mapBackendPayDebtFieldErrors(
  rawFieldErrors: Record<string, string> | undefined
): PayDebtFormFieldErrors & { balance?: string } {
  if (!rawFieldErrors) {
    return {}
  }

  const mapped: PayDebtFormFieldErrors & { balance?: string } = {}
  const keyMap: Record<string, keyof PayDebtFormValues | "balance"> = {
    amount: "amount",
    date: "date",
    description: "description",
    transactiondate: "date",
    transaction_date: "date",
    balance: "balance",
  }

  for (const [key, value] of Object.entries(rawFieldErrors)) {
    const mappedKey = keyMap[key.toLowerCase()]
    if (mappedKey) {
      mapped[mappedKey] = value
    }
  }

  return mapped
}
