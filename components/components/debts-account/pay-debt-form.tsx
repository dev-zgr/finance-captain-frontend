"use client"

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react"
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Landmark,
  Loader2,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { getAccountSummary } from "@/lib/checking-account/api"
import type { AccountSummary } from "@/lib/checking-account/types"
import {
  createDebtsTransaction,
  getDebtsAccountSummary,
} from "@/lib/debts-account/api"
import { MAX_DEBT_DESCRIPTION_LENGTH } from "@/lib/debts-account/constants"
import type {
  DebtsAccountSummary,
  DebtsApiErrorResponse,
  PayDebtFormFieldErrors,
  PayDebtFormValues,
} from "@/lib/debts-account/types"
import {
  mapBackendPayDebtFieldErrors,
  toBackendDate,
  validatePayDebtForm,
} from "@/lib/debts-account/validation"
import { cn } from "@/lib/utils"

type PageStatus = "idle" | "submitting" | "success"

type PayDebtFormProps = {
  open: boolean
  token: string
  onOpenChange: Dispatch<SetStateAction<boolean>>
  onSuccess?: () => void
}

const initialValues: PayDebtFormValues = {
  date: "",
  amount: "",
  description: "",
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value
  )

function getErrorResponse(data: unknown): DebtsApiErrorResponse {
  return data && typeof data === "object" ? (data as DebtsApiErrorResponse) : {}
}

function getWrappedData<T>(data: unknown): T | null {
  if (!data || typeof data !== "object") {
    return null
  }

  const wrapped = data as { content?: T; data?: T }
  return wrapped.data ?? wrapped.content ?? null
}

export function PayDebtForm({
  open,
  token,
  onOpenChange,
  onSuccess,
}: PayDebtFormProps) {
  const [status, setStatus] = useState<PageStatus>("idle")
  const [showFadeOut, setShowFadeOut] = useState(false)
  const [successMessage, setSuccessMessage] = useState("Payment Added!")
  const [values, setValues] = useState<PayDebtFormValues>(initialValues)
  const [fieldErrors, setFieldErrors] = useState<PayDebtFormFieldErrors>({})
  const [touched, setTouched] = useState<Set<keyof PayDebtFormValues>>(
    new Set()
  )
  const [globalError, setGlobalError] = useState("")
  const [checkingSummary, setCheckingSummary] = useState<AccountSummary | null>(
    null
  )
  const [debtsSummary, setDebtsSummary] = useState<DebtsAccountSummary | null>(
    null
  )
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState("")
  const [serverBalanceError, setServerBalanceError] = useState("")

  const resetState = useCallback(() => {
    setStatus("idle")
    setShowFadeOut(false)
    setSuccessMessage("Payment Added!")
    setValues(initialValues)
    setFieldErrors({})
    setTouched(new Set())
    setGlobalError("")
    setCheckingSummary(null)
    setDebtsSummary(null)
    setSummaryLoading(false)
    setSummaryError("")
    setServerBalanceError("")
  }, [])

  useEffect(() => {
    if (!open) {
      resetState()
      return
    }

    let ignore = false

    async function fetchAccountSummaries() {
      setSummaryLoading(true)
      setSummaryError("")

      try {
        const [checkingResponse, debtsResponse] = await Promise.all([
          getAccountSummary(token),
          getDebtsAccountSummary(token),
        ])

        if (ignore) return

        const parsedCheckingSummary =
          checkingResponse.status === 200
            ? getWrappedData<AccountSummary>(checkingResponse.data)
            : null
        const parsedDebtsSummary =
          debtsResponse.status === 200
            ? getWrappedData<DebtsAccountSummary>(debtsResponse.data)
            : null

        setCheckingSummary(parsedCheckingSummary)
        setDebtsSummary(parsedDebtsSummary)

        if (!parsedCheckingSummary && !parsedDebtsSummary) {
          setSummaryError("Could not load account summaries. Please try again.")
        }
      } catch {
        if (!ignore) {
          setSummaryError("Could not load account summaries. Please try again.")
        }
      } finally {
        if (!ignore) {
          setSummaryLoading(false)
        }
      }
    }

    fetchAccountSummaries()

    return () => {
      ignore = true
    }
  }, [open, token, resetState])

  const enteredAmount = Number(values.amount || 0)
  const checkingBalance = checkingSummary?.accountBalance ?? null
  const isInsufficientBalance =
    checkingBalance !== null &&
    enteredAmount > 0 &&
    enteredAmount > checkingBalance

  const markFieldTouched = (field: keyof PayDebtFormValues) => {
    setTouched((prev) => new Set([...prev, field]))
  }

  const getFieldError = (
    field: keyof PayDebtFormValues
  ): string | undefined => {
    if (fieldErrors[field]) {
      return fieldErrors[field]
    }

    if (touched.has(field)) {
      if (
        (field === "date" || field === "amount") &&
        !values[field]
      ) {
        return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
      }
      if (field === "description" && !values.description.trim()) {
        return "Description is required"
      }
    }

    return undefined
  }

  const handleFieldChange = useCallback(
    (key: keyof PayDebtFormValues, value: string) => {
      let sanitizedValue = value
      if (key === "amount") {
        sanitizedValue = value.replace(/[^\d.]/g, "")
        const parts = sanitizedValue.split(".")
        if (parts.length > 2) {
          sanitizedValue = parts[0] + "." + parts.slice(1).join("")
        }
      }

      setValues((prev) => ({ ...prev, [key]: sanitizedValue }))
      if (fieldErrors[key]) {
        setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
      }
      if (key === "amount" && serverBalanceError) {
        setServerBalanceError("")
      }
    },
    [fieldErrors, serverBalanceError]
  )

  const isFormValid =
    !!(values.date && values.amount && values.description.trim()) &&
    !isInsufficientBalance

  const handleSubmit = useCallback(async () => {
    if (isInsufficientBalance) return

    setStatus("submitting")
    setGlobalError("")
    setFieldErrors({})
    setServerBalanceError("")

    const validationErrors = validatePayDebtForm(values)
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      setStatus("idle")
      return
    }

    try {
      const response = await createDebtsTransaction(token, {
        transactionType: "PAYMENT",
        amount: Number(values.amount),
        date: toBackendDate(values.date),
        description: values.description.trim(),
      })

      if (response.status === 200) {
        const data = response.data as { message?: string }
        const msg = data?.message ?? ""
        const isCapped =
          msg.length > 0 &&
          msg !== "Debts transaction created successfully." &&
          msg.toLowerCase().includes("capped")
        setSuccessMessage(isCapped ? msg : "Payment Added!")
        setStatus("success")
        setTimeout(() => {
          setShowFadeOut(true)
          setTimeout(() => {
            resetState()
            onOpenChange(false)
            onSuccess?.()
          }, 300)
        }, 2500)
      } else if (response.status === 400) {
        const data = getErrorResponse(response.data)
        const { balance: balanceMsg, ...formErrors } =
          mapBackendPayDebtFieldErrors(data.fieldErrors)
        setFieldErrors(formErrors)
        if (balanceMsg) {
          setServerBalanceError(balanceMsg)
          // Refresh summaries to show updated balance
          setSummaryLoading(true)
          setSummaryError("")
          try {
            const [checkingResponse, debtsResponse] = await Promise.all([
              getAccountSummary(token),
              getDebtsAccountSummary(token),
            ])
            const parsedChecking =
              checkingResponse.status === 200
                ? getWrappedData<AccountSummary>(checkingResponse.data)
                : null
            const parsedDebts =
              debtsResponse.status === 200
                ? getWrappedData<DebtsAccountSummary>(debtsResponse.data)
                : null
            setCheckingSummary(parsedChecking)
            setDebtsSummary(parsedDebts)
          } catch {
            // silently ignore refresh failure
          } finally {
            setSummaryLoading(false)
          }
        } else {
          setGlobalError(data.message || "")
        }
        setStatus("idle")
      } else if (response.status === 401) {
        setGlobalError("Your session has expired. Please log in again.")
        setStatus("idle")
      } else if (response.status === 500) {
        const data = getErrorResponse(response.data)
        setGlobalError(
          data.message || "Internal server error. Please try again."
        )
        setStatus("idle")
      } else {
        setGlobalError("Unexpected error occurred. Please try again.")
        setStatus("idle")
      }
    } catch {
      setGlobalError("Network error. Failed to create transaction.")
      setStatus("idle")
    }
  }, [isInsufficientBalance, onOpenChange, onSuccess, resetState, token, values])

  return (
    <div className="relative flex max-h-[calc(100vh-200px)] flex-col gap-4 overflow-y-auto px-2 pt-0 pb-1">
      {(status === "submitting" || status === "success") && (
        <div
          className={cn(
            "absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-white transition-opacity duration-300",
            showFadeOut ? "opacity-0" : "opacity-100"
          )}
        >
          {status === "submitting" && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="size-12 animate-spin text-gray-700" />
              <p className="text-sm font-medium text-gray-700">Processing...</p>
            </div>
          )}
          {status === "success" && (
            <div className="flex animate-in flex-col items-center gap-3 duration-300 fade-in">
              <div className="rounded-full bg-gray-200/50 p-4">
                <CheckCircle2
                  className="size-12 text-gray-800"
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-sm font-medium text-gray-700">
                {successMessage}
              </p>
            </div>
          )}
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-4 transition-opacity duration-300",
          (status === "submitting" || status === "success") && !showFadeOut
            ? "opacity-0"
            : "opacity-100"
        )}
      >
        {globalError && (
          <div className="rounded-md border border-red-300 bg-red-100 px-4 py-2 text-sm text-red-800">
            {globalError}
          </div>
        )}

        {/* Account preview */}
        {summaryLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : summaryError ? (
          <div className="rounded-md border border-red-300 bg-red-100 px-4 py-2 text-sm text-red-800">
            {summaryError}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Item
              variant="outline"
              className={cn(
                isInsufficientBalance || serverBalanceError
                  ? "border-red-500/50 bg-red-500/5"
                  : ""
              )}
            >
              <ItemMedia variant="icon" className="text-primary">
                <Wallet className="size-5" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Checking Account</ItemTitle>
                <ItemDescription>
                  {checkingSummary ? (
                    <span
                      className={cn(
                        "tabular-nums",
                        isInsufficientBalance || serverBalanceError
                          ? "text-red-600"
                          : ""
                      )}
                    >
                      Balance: {formatCurrency(checkingSummary.accountBalance)}
                    </span>
                  ) : (
                    "Balance unavailable."
                  )}
                </ItemDescription>
                <ItemDescription className="text-xs text-muted-foreground">
                  Amount will be deducted from this account.
                </ItemDescription>
              </ItemContent>
              <ItemActions className="text-red-700">
                <ArrowUpFromLine className="size-5" />
              </ItemActions>
            </Item>

            {(isInsufficientBalance || serverBalanceError) && (
              <p className="text-xs text-red-600">
                {serverBalanceError || "Insufficient balance for this payment."}
              </p>
            )}

            <Item variant="outline">
              <ItemMedia variant="icon" className="text-primary">
                <Landmark className="size-5" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Debts Account</ItemTitle>
                <ItemDescription className="tabular-nums">
                  {debtsSummary
                    ? `Outstanding: ${formatCurrency(debtsSummary.currentDebtsAccountBalance)}`
                    : "Balance unavailable."}
                </ItemDescription>
                <ItemDescription className="text-xs text-muted-foreground">
                  Payment will reduce your liabilities.
                </ItemDescription>
              </ItemContent>
              <ItemActions className="text-green-700">
                <ArrowDownToLine className="size-5" />
              </ItemActions>
            </Item>
          </div>
        )}

        {/* Form fields */}
        <FieldGroup className="gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field data-invalid={!!getFieldError("date")}>
              <FieldLabel htmlFor="pay-debt-date">Date</FieldLabel>
              <FieldContent>
                <DatePicker
                  value={values.date}
                  onChange={(date) => handleFieldChange("date", date)}
                  onBlur={() => markFieldTouched("date")}
                  disabled={status !== "idle"}
                  placeholder="Pick a date"
                />
                {getFieldError("date") && (
                  <FieldError>{getFieldError("date")}</FieldError>
                )}
              </FieldContent>
            </Field>

            <Field data-invalid={!!getFieldError("amount")}>
              <FieldLabel htmlFor="pay-debt-amount">Amount</FieldLabel>
              <FieldContent>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>$</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="pay-debt-amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={values.amount}
                    onChange={(event) =>
                      handleFieldChange("amount", event.target.value)
                    }
                    onBlur={() => markFieldTouched("amount")}
                    onKeyPress={(event) => {
                      if (!/[0-9.]/.test(event.key)) {
                        event.preventDefault()
                      }
                    }}
                    disabled={status !== "idle"}
                    aria-invalid={!!getFieldError("amount")}
                  />
                </InputGroup>
                {getFieldError("amount") && (
                  <FieldError>{getFieldError("amount")}</FieldError>
                )}
              </FieldContent>
            </Field>
          </div>

          <Field data-invalid={!!getFieldError("description")}>
            <FieldLabel htmlFor="pay-debt-description">Description</FieldLabel>
            <FieldContent>
              <Input
                id="pay-debt-description"
                type="text"
                placeholder="What is this payment for?"
                maxLength={MAX_DEBT_DESCRIPTION_LENGTH}
                value={values.description}
                onChange={(event) =>
                  handleFieldChange("description", event.target.value)
                }
                onBlur={() => markFieldTouched("description")}
                disabled={status !== "idle"}
                aria-invalid={!!getFieldError("description")}
              />
              <FieldDescription className="text-xs">
                {values.description.length} / {MAX_DEBT_DESCRIPTION_LENGTH}
              </FieldDescription>
              {getFieldError("description") && (
                <FieldError>{getFieldError("description")}</FieldError>
              )}
            </FieldContent>
          </Field>
        </FieldGroup>

        <div className="mt-auto flex gap-3 border-t pt-4">
          <Button
            type="button"
            size="lg"
            className="flex-1"
            onClick={handleSubmit}
            disabled={status !== "idle" || !isFormValid}
          >
            {status === "submitting" ? (
              <>
                <Loader2
                  className="size-4 animate-spin"
                  data-icon="inline-start"
                />
                Adding…
              </>
            ) : status === "success" ? (
              <>
                <CheckCircle2 className="size-4" data-icon="inline-start" />
                Success
              </>
            ) : (
              "Pay Debt"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
