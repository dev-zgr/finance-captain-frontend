import { format } from "date-fns"
import {
  CATEGORY_DISPLAY_MAP,
  INCOME_CATEGORY_DISPLAY_MAP,
  isExpenseCheckingCategory,
  isIncomeCheckingCategory,
} from "@/lib/checking-account/constants"
import type {
  CheckingExpenseDraftPayload,
  CheckingIncomeDraftPayload,
} from "@/lib/co-captain/types"

export type DraftVariant = "expense" | "income"

export type DraftFormValues = {
  date: string
  amount: string
  category: string
  description: string
}

export type DraftFieldErrors = Partial<Record<keyof DraftFormValues, string>>

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

function extractDatePart(value: string): string {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/)
  return match?.[1] ?? ""
}

export function toDateInputValue(value: string): string {
  const datePart = extractDatePart(value)
  if (datePart) {
    return datePart
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return format(date, "yyyy-MM-dd")
}

export function formatCardDate(value: string): string {
  const datePart = extractDatePart(value)
  const source = datePart || value
  const date = new Date(`${source}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return "—"
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatAmount(value: number): string {
  return CURRENCY_FORMATTER.format(value)
}

export function categoryLabelFor(variant: DraftVariant, category: string): string {
  if (variant === "income") {
    return INCOME_CATEGORY_DISPLAY_MAP[category] ?? "Other"
  }
  return CATEGORY_DISPLAY_MAP[category] ?? "Other"
}

export function parseExpenseDraftPayload(payload: unknown): CheckingExpenseDraftPayload {
  const raw = (payload ?? {}) as Partial<CheckingExpenseDraftPayload>

  return {
    amount: typeof raw.amount === "number" && Number.isFinite(raw.amount) ? raw.amount : 0,
    category:
      typeof raw.category === "string" && isExpenseCheckingCategory(raw.category)
        ? raw.category
        : "OTHER",
    transactionDate: typeof raw.transactionDate === "string" ? raw.transactionDate : "",
    description: typeof raw.description === "string" ? raw.description : "",
  }
}

export function parseIncomeDraftPayload(payload: unknown): CheckingIncomeDraftPayload {
  const raw = (payload ?? {}) as Partial<CheckingIncomeDraftPayload>

  return {
    amount: typeof raw.amount === "number" && Number.isFinite(raw.amount) ? raw.amount : 0,
    category:
      typeof raw.category === "string" && isIncomeCheckingCategory(raw.category)
        ? raw.category
        : "OTHER",
    transactionDate: typeof raw.transactionDate === "string" ? raw.transactionDate : "",
    description: typeof raw.description === "string" ? raw.description : "",
  }
}

export function toFormValues(
  payload: CheckingExpenseDraftPayload | CheckingIncomeDraftPayload,
): DraftFormValues {
  return {
    date: toDateInputValue(payload.transactionDate),
    amount: Number.isFinite(payload.amount) ? String(payload.amount) : "",
    category: payload.category,
    description: payload.description,
  }
}

export function trimDescription(value: string): string {
  const next = value.trim()
  if (!next) {
    return "—"
  }
  return next.length > 60 ? `${next.slice(0, 57)}...` : next
}

export function resolveCommittedResourceId(
  artifactCommittedId: number | undefined,
  responseData: unknown,
): number | undefined {
  if (typeof artifactCommittedId === "number") {
    return artifactCommittedId
  }

  if (!responseData || typeof responseData !== "object") {
    return undefined
  }

  const data = responseData as {
    committedResourceId?: unknown
    content?: { committedResourceId?: unknown }
  }

  if (typeof data.content?.committedResourceId === "number") {
    return data.content.committedResourceId
  }

  if (typeof data.committedResourceId === "number") {
    return data.committedResourceId
  }

  return undefined
}
