"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"
import { format, parseISO } from "date-fns"
import {
  ArrowLeft,
  ArrowDownToLine,
  CheckCircle2,
  Landmark,
  Loader2,
  Wallet,
  ArrowUpToLine,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ComboboxSelect } from "@/components/ui/combobox"
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
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { getAccountSummary } from "@/lib/checking-account/api"
import type { AccountSummary } from "@/lib/checking-account/types"
import {
  createDebtsTransaction,
  getDebtsAccountSummary,
} from "@/lib/debts-account/api"
import {
  DEBT_CATEGORIES_WITH_LABELS,
  DEBT_CATEGORY_DISPLAY_MAP,
  MAX_DEBT_DESCRIPTION_LENGTH,
  type DebtCategory,
} from "@/lib/debts-account/constants"
import type {
  DebtsAccountSummary,
  DebtsApiErrorResponse,
  GetDebtFormFieldErrors,
  GetDebtFormValues,
} from "@/lib/debts-account/types"
import {
  mapBackendDebtsFieldErrors,
  toBackendDate,
  validateGetDebtForm,
} from "@/lib/debts-account/validation"
import { cn } from "@/lib/utils"

type PageStatus = "idle" | "submitting" | "success"

type GetDebtFormProps = {
  open: boolean
  token: string
  onOpenChange: Dispatch<SetStateAction<boolean>>
  onSuccess?: () => void
}

const initialValues: GetDebtFormValues = {
  date: "",
  amount: "",
  category: "",
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

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3].map((step, index) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={cn(
              "size-2 rounded-full transition-colors",
              step <= currentStep ? "bg-primary" : "bg-muted"
            )}
          />
          {index < 2 && <div className="h-px w-6 bg-border" />}
        </div>
      ))}
    </div>
  )
}

export function GetDebtForm({
  open,
  token,
  onOpenChange,
  onSuccess,
}: GetDebtFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [status, setStatus] = useState<PageStatus>("idle")
  const [showFadeOut, setShowFadeOut] = useState(false)
  const [values, setValues] = useState<GetDebtFormValues>(initialValues)
  const [fieldErrors, setFieldErrors] = useState<GetDebtFormFieldErrors>({})
  const [touched, setTouched] = useState<Set<keyof GetDebtFormValues>>(
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
  const [summaryFetched, setSummaryFetched] = useState(false)
  const [summaryError, setSummaryError] = useState("")

  const resetState = useCallback(() => {
    setCurrentStep(1)
    setStatus("idle")
    setShowFadeOut(false)
    setValues(initialValues)
    setFieldErrors({})
    setTouched(new Set())
    setGlobalError("")
    setCheckingSummary(null)
    setDebtsSummary(null)
    setSummaryLoading(false)
    setSummaryFetched(false)
    setSummaryError("")
  }, [])

  useEffect(() => {
    if (!open) {
      resetState()
    }
  }, [open, resetState])

  useEffect(() => {
    console.log("[GetDebt][Step2] effect check", {
      currentStep,
      summaryFetched,
      summaryError,
      hasCheckingSummary: !!checkingSummary,
      hasDebtsSummary: !!debtsSummary,
      tokenPresent: !!token,
    })

    if (currentStep !== 2 || summaryFetched || summaryError) {
      return
    }

    let ignore = false

    async function fetchAccountSummaries() {
      console.log("[GetDebt][Step2] fetching account summaries", {
        checking: "GET /api/v1/checking/summary",
        debts: "GET /api/v1/debts/summary",
      })
      setSummaryLoading(true)
      setSummaryError("")

      try {
        const [checkingResponse, debtsResponse] = await Promise.all([
          getAccountSummary(token),
          getDebtsAccountSummary(token),
        ])
        if (ignore) {
          console.log("[GetDebt][Step2] fetch ignored after cleanup")
          return
        }

        console.log("[GetDebt][Step2] summary responses", {
          checkingStatus: checkingResponse.status,
          checkingData: checkingResponse.data,
          debtsStatus: debtsResponse.status,
          debtsData: debtsResponse.data,
        })

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

        console.log("[GetDebt][Step2] parsed summaries", {
          checkingSummary: parsedCheckingSummary,
          debtsSummary: parsedDebtsSummary,
        })

        if (!parsedCheckingSummary && !parsedDebtsSummary) {
          setSummaryError("Could not load account summaries. Please try again.")
          console.error("[GetDebt][Step2] non-200 summary response", {
            checkingStatus: checkingResponse.status,
            checkingData: checkingResponse.data,
            debtsStatus: debtsResponse.status,
            debtsData: debtsResponse.data,
          })
        }
      } catch (error) {
        if (!ignore) {
          setSummaryError("Could not load account summaries. Please try again.")
          console.error("[GetDebt][Step2] summary fetch failed", error)
        }
      } finally {
        if (!ignore) {
          setSummaryFetched(true)
          setSummaryLoading(false)
          console.log("[GetDebt][Step2] fetch finished")
        }
      }
    }

    fetchAccountSummaries()

    return () => {
      ignore = true
    }
  }, [
    checkingSummary,
    currentStep,
    debtsSummary,
    summaryFetched,
    summaryError,
    token,
  ])

  const amount = useMemo(() => Number(values.amount || 0), [values.amount])
  const categoryLabel = values.category
    ? (DEBT_CATEGORY_DISPLAY_MAP[values.category as DebtCategory] ??
      values.category)
    : ""
  const isDetailsContinueDisabled =
    !values.date || !values.amount || !values.category || status !== "idle"

  const markFieldTouched = (field: keyof GetDebtFormValues) => {
    setTouched((prev) => new Set([...prev, field]))
  }

  const getFieldError = (
    field: keyof GetDebtFormValues
  ): string | undefined => {
    if (fieldErrors[field]) {
      return fieldErrors[field]
    }

    if (
      touched.has(field) &&
      !values[field] &&
      (field === "date" || field === "amount" || field === "category")
    ) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
    }

    return undefined
  }

  const handleFieldChange = useCallback(
    (key: keyof GetDebtFormValues, value: string) => {
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
    },
    [fieldErrors]
  )

  const handleDetailsContinue = useCallback(() => {
    setGlobalError("")
    const validationErrors = validateGetDebtForm(values)
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      return
    }

    setFieldErrors({})
    setCurrentStep(2)
  }, [values])

  const handleCancel = useCallback(() => {
    resetState()
    onOpenChange(false)
  }, [onOpenChange, resetState])

  const handleSubmit = useCallback(async () => {
    setStatus("submitting")
    setGlobalError("")
    setFieldErrors({})

    const validationErrors = validateGetDebtForm(values)
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      setCurrentStep(1)
      setStatus("idle")
      return
    }

    try {
      const response = await createDebtsTransaction(token, {
        transactionType: "DEBT",
        amount: Number(values.amount),
        date: toBackendDate(values.date),
        category: values.category as DebtCategory,
        description: values.description.trim() || undefined,
      })

      if (response.status === 200) {
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
        setFieldErrors(mapBackendDebtsFieldErrors(data.fieldErrors))
        setGlobalError(data.message || "")
        setCurrentStep(1)
        setStatus("idle")
      } else if (response.status === 401) {
        setGlobalError("Your session has expired. Please log in again.")
        setCurrentStep(3)
        setStatus("idle")
      } else if (response.status === 500) {
        const data = getErrorResponse(response.data)
        setGlobalError(
          data.message || "Internal server error. Please try again."
        )
        setCurrentStep(3)
        setStatus("idle")
      } else {
        setGlobalError("Unexpected error occurred. Please try again.")
        setCurrentStep(3)
        setStatus("idle")
      }
    } catch {
      setGlobalError("Network error. Failed to create transaction.")
      setCurrentStep(3)
      setStatus("idle")
    }
  }, [onOpenChange, onSuccess, resetState, token, values])

  return (
    <div className="relative flex max-h-[calc(100vh-200px)] flex-col gap-4 overflow-y-auto px-2 pt-0 pb-1">
      {(status === "submitting" || status === "success") && (
        <div
          className={`absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-white transition-opacity duration-300 ${showFadeOut ? "opacity-0" : "opacity-100"}`}
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
              <p className="text-sm font-medium text-gray-700">Debt Added!</p>
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
        <StepIndicator currentStep={currentStep} />

        {globalError && (
          <div className="rounded-md border border-red-300 bg-red-100 px-4 py-2 text-sm text-red-800">
            {globalError}
          </div>
        )}

        {currentStep === 1 && (
          <FieldGroup className="gap-4">
            <div>
              <p className="text-sm font-medium">STEP 1 — Debt details</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!getFieldError("date")}>
                <FieldLabel htmlFor="debt-date">Date</FieldLabel>
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
                <FieldLabel htmlFor="debt-amount">Amount</FieldLabel>
                <FieldContent>
                  <InputGroup>
                    <InputGroupAddon>
                      <InputGroupText>$</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      id="debt-amount"
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

            <Field data-invalid={!!getFieldError("category")}>
              <FieldLabel htmlFor="debt-category">Category</FieldLabel>
              <FieldContent>
                <ComboboxSelect
                  items={DEBT_CATEGORIES_WITH_LABELS}
                  value={values.category}
                  onValueChange={(value) => {
                    handleFieldChange("category", value)
                    markFieldTouched("category")
                  }}
                  onBlur={() => markFieldTouched("category")}
                  placeholder="Select a category..."
                  searchPlaceholder="Search categories..."
                  disabled={status !== "idle"}
                />
                {getFieldError("category") && (
                  <FieldError>{getFieldError("category")}</FieldError>
                )}
              </FieldContent>
            </Field>

            <Field data-invalid={!!fieldErrors.description}>
              <FieldLabel htmlFor="debt-description">Description</FieldLabel>
              <FieldContent>
                <Input
                  id="debt-description"
                  type="text"
                  placeholder="What is this debt for?"
                  maxLength={MAX_DEBT_DESCRIPTION_LENGTH}
                  value={values.description}
                  onChange={(event) =>
                    handleFieldChange("description", event.target.value)
                  }
                  disabled={status !== "idle"}
                  aria-invalid={!!fieldErrors.description}
                />
                <FieldDescription className="text-xs">
                  {values.description.length} / {MAX_DEBT_DESCRIPTION_LENGTH}
                </FieldDescription>
                {fieldErrors.description && (
                  <FieldError>{fieldErrors.description}</FieldError>
                )}
              </FieldContent>
            </Field>

            <div className="flex justify-end pt-4">
              <Button
                type="button"
                onClick={handleDetailsContinue}
                disabled={isDetailsContinueDisabled}
              >
                Continue
              </Button>
            </div>
          </FieldGroup>
        )}

        {currentStep === 2 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium">STEP 2 — Linked Transfer</p>

            {summaryLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : summaryError ? (
              <div className="rounded-md border border-red-300 bg-red-100 px-4 py-2 text-sm text-red-800">
                {summaryError}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Item variant="outline">
                  <ItemMedia variant="icon" className="text-primary">
                    <Wallet className="size-5" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>Checking Account</ItemTitle>
                    <ItemDescription>
                      {checkingSummary
                        ? `Current balance: ${formatCurrency(checkingSummary.accountBalance)}`
                        : "Current balance unavailable."}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions className="text-green-700">
                    <ArrowDownToLine className="size-5" />
                  </ItemActions>
                </Item>

                <Item variant="outline">
                  <ItemMedia variant="icon" className="text-primary">
                    <Landmark className="size-5" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>Debts Account</ItemTitle>
                    <ItemDescription>
                      {debtsSummary
                        ? `Current liabilities: ${formatCurrency(debtsSummary.currentDebtsAccountBalance)}`
                        : "Current liabilities unavailable."}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions className="text-red-700">
                    <ArrowUpToLine className="size-5" />
                  </ItemActions>
                </Item>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              {formatCurrency(amount)} will be credited to your checking account
              as an <span className="font-medium text-foreground">INCOME</span>{" "}
              transaction with category{" "}
              <span className="font-medium text-foreground">TRANSFERS</span>.
            </p>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                disabled={status !== "idle"}
              >
                <ArrowLeft data-icon="inline-start" />
                Back
              </Button>
              <Button
                type="button"
                onClick={() => setCurrentStep(3)}
                disabled={status !== "idle"}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium">STEP 3 — Confirm</p>

            <Card>
              <CardContent className="flex flex-col gap-4 pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-2xl font-semibold text-foreground tabular-nums">
                    {formatCurrency(amount)}
                  </p>
                </div>

                <Separator />

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Date</span>
                    <span className="text-sm font-medium tabular-nums">
                      {values.date
                        ? format(parseISO(values.date), "MMM d, yyyy")
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Category
                    </span>
                    <Badge variant="outline">{categoryLabel}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground">
                      Description
                    </span>
                    <span className="truncate text-sm font-medium">
                      {values.description || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground">
                      Linked checking credit
                    </span>
                    <span className="text-sm font-medium tabular-nums">
                      + {formatCurrency(amount)} to checking · TRANSFERS
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={status !== "idle"}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={status !== "idle"}
              >
                Get Debt
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
