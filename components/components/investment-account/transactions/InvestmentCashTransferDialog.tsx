"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useDispatch, useSelector } from "react-redux"
import { z } from "zod"

import { ConfirmationStep } from "@/components/components/investment-account/transactions/ConfirmationStep"
import {
  LinkedTransferStep,
  type LinkedTransferDirection,
} from "@/components/components/investment-account/transactions/LinkedTransferStep"
import { StepIndicator } from "@/components/components/investment-account/transactions/StepIndicator"
import { SuccessOverlay } from "@/components/components/investment-account/transactions/SuccessOverlay"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
  InputGroupText,
} from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import { apiDeposit, apiWithdraw } from "@/lib/investment-account/api"
import type {
  InvestmentApiErrorResponse,
  InvestmentApiSuccessResponse,
  InvestmentCashTransactionResponseContent,
  InvestmentTransactionDTO,
} from "@/lib/investment-account/types"
import { setCheckingBalance } from "@/lib/slices/checkingAccountSlice"
import {
  addInvestmentTransaction,
  setInvestmentBalance,
} from "@/lib/slices/investmentAccountSlice"
import type { AppDispatch, RootState } from "@/lib/store"

type Step = 1 | 2 | 3
type SubmissionStatus = "idle" | "submitting" | "success"
type TransferKind = "deposit" | "withdraw"

type InvestmentCashTransferDialogProps = {
  kind: TransferKind
  open: boolean
  onOpenChange: (open: boolean) => void
  token: string
  onSuccess?: () => void
}

const MAX_DESCRIPTION_LENGTH = 256

const cashTransferSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required.")
    .refine((value) => Number.isFinite(Number(value)), {
      message: "Amount must be a valid number.",
    })
    .refine((value) => Number(value) > 0, {
      message: "Amount must be greater than 0.",
    }),
  description: z
    .string()
    .max(
      MAX_DESCRIPTION_LENGTH,
      `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`
    ),
})

type CashTransferFormValues = z.infer<typeof cashTransferSchema>

const defaultValues: CashTransferFormValues = {
  amount: "",
  description: "",
}

function getWrappedContent<T>(data: unknown): T | null {
  if (!data || typeof data !== "object") {
    return null
  }

  const wrapped = data as InvestmentApiSuccessResponse<T>
  return wrapped.content ?? wrapped.data ?? null
}

function getErrorResponse(data: unknown): InvestmentApiErrorResponse {
  return data && typeof data === "object"
    ? (data as InvestmentApiErrorResponse)
    : {}
}

function normalizeCashTransferContent(
  content: unknown
): InvestmentCashTransactionResponseContent | null {
  if (!content || typeof content !== "object") {
    return null
  }

  const payload = content as Partial<
    InvestmentCashTransactionResponseContent & InvestmentTransactionDTO
  >
  const transaction =
    payload.transaction ??
    (typeof payload.transactionId === "number"
      ? ({
          transactionId: payload.transactionId,
          transactionType: payload.transactionType,
          ticker: payload.ticker,
          companyName: payload.companyName,
          quantity: payload.quantity,
          price: payload.price,
          amount: payload.amount,
          date: payload.date,
          description: payload.description,
        } as InvestmentTransactionDTO)
      : null)

  if (
    !transaction ||
    typeof payload.investmentAccountBalance !== "number" ||
    typeof payload.checkingAccountBalance !== "number"
  ) {
    return null
  }

  return {
    transaction,
    investmentAccountBalance: payload.investmentAccountBalance,
    checkingAccountBalance: payload.checkingAccountBalance,
  }
}

function mapBackendFieldErrors(fieldErrors?: Record<string, string>) {
  const nextErrors: Partial<Record<keyof CashTransferFormValues, string>> = {}

  Object.entries(fieldErrors ?? {}).forEach(([key, value]) => {
    const normalizedKey = key.toLowerCase()
    if (normalizedKey.includes("amount")) {
      nextErrors.amount = value
    }
    if (normalizedKey.includes("description")) {
      nextErrors.description = value
    }
  })

  return nextErrors
}

function getServerErrorMessage(status: number, data: InvestmentApiErrorResponse) {
  if (status === 404) {
    return data.message || "Investment/Checking account not found"
  }

  if (status === 500 || status === 503) {
    return data.message || "The service is temporarily unavailable. Please try again."
  }

  return data.message || "Unexpected error occurred. Please try again."
}

export function InvestmentCashTransferDialog({
  kind,
  open,
  onOpenChange,
  token,
  onSuccess,
}: InvestmentCashTransferDialogProps) {
  const dispatch = useDispatch<AppDispatch>()
  const checkingBalance = useSelector(
    (state: RootState) => state.checkingAccount.summary?.accountBalance ?? 0
  )
  const investmentBalance = useSelector(
    (state: RootState) => state.investmentAccount.summary?.accountBalance ?? 0
  )
  const [step, setStep] = useState<Step>(1)
  const [status, setStatus] = useState<SubmissionStatus>("idle")
  const [showFadeOut, setShowFadeOut] = useState(false)
  const [globalError, setGlobalError] = useState("")

  const form = useForm<CashTransferFormValues>({
    resolver: zodResolver(cashTransferSchema),
    defaultValues,
    mode: "onBlur",
  })
  const watchedAmount = useWatch({
    control: form.control,
    name: "amount",
  })
  const watchedDescription = useWatch({
    control: form.control,
    name: "description",
  })

  const amount = Number(watchedAmount || 0)
  const description = watchedDescription ?? ""
  const direction: LinkedTransferDirection =
    kind === "deposit" ? "CHECKING_TO_INVESTMENT" : "INVESTMENT_TO_CHECKING"
  const isDeposit = kind === "deposit"
  const title = isDeposit ? "Deposit Funds" : "Withdraw Funds"
  const descriptionText = isDeposit
    ? "Move cash from your checking account into your investment account."
    : "Move cash from your investment account back to your checking account."
  const confirmLabel = isDeposit ? "Confirm Deposit" : "Confirm Withdrawal"
  const successMessage = isDeposit
    ? "Deposit Successful!"
    : "Withdrawal Successful!"
  const balanceError = useMemo(() => {
    if (amount <= 0) {
      return ""
    }

    if (isDeposit && checkingBalance - amount < 0) {
      return "Insufficient checking account balance."
    }

    if (!isDeposit && investmentBalance - amount < 0) {
      return "Insufficient investment account balance."
    }

    return ""
  }, [amount, checkingBalance, investmentBalance, isDeposit])
  const isBusy = status !== "idle"
  const isStepOneReady =
    amount > 0 && description.length <= MAX_DESCRIPTION_LENGTH

  const resetState = useCallback(() => {
    setStep(1)
    setStatus("idle")
    setShowFadeOut(false)
    setGlobalError("")
    form.reset(defaultValues)
  }, [form])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (isBusy) {
        return
      }

      onOpenChange(nextOpen)
      if (!nextOpen) {
        resetState()
      }
    },
    [isBusy, onOpenChange, resetState]
  )

  const handleBack = useCallback(() => {
    setGlobalError("")
    setStep((currentStep) => (currentStep === 3 ? 2 : 1))
  }, [])

  const handleCancel = useCallback(() => {
    resetState()
    onOpenChange(false)
  }, [onOpenChange, resetState])

  const handleNext = useCallback(async () => {
    setGlobalError("")

    if (step === 1) {
      const isValid = await form.trigger(["amount", "description"], {
        shouldFocus: true,
      })
      if (isValid) {
        setStep(2)
      }
      return
    }

    if (step === 2 && !balanceError) {
      setStep(3)
    }
  }, [balanceError, form, step])

  const applyServerFieldErrors = useCallback(
    (fieldErrors?: Record<string, string>) => {
      const mappedErrors = mapBackendFieldErrors(fieldErrors)
      if (mappedErrors.amount) {
        form.setError("amount", { message: mappedErrors.amount })
      }
      if (mappedErrors.description) {
        form.setError("description", { message: mappedErrors.description })
      }

      if (mappedErrors.amount || mappedErrors.description) {
        setStep(1)
      }

      return mappedErrors
    },
    [form]
  )

  const handleConfirm = useCallback(async () => {
    const isValid = await form.trigger(["amount", "description"], {
      shouldFocus: true,
    })
    if (!isValid || balanceError) {
      if (balanceError) {
        setStep(2)
      }
      return
    }

    setStatus("submitting")
    setGlobalError("")

    const values = form.getValues()
    const payload = {
      amount: Number(values.amount),
      description: values.description?.trim() || null,
    }

    try {
      const response = isDeposit
        ? await apiDeposit(token, payload)
        : await apiWithdraw(token, payload)

      if (response.status === 200) {
        const wrappedContent =
          getWrappedContent<InvestmentCashTransactionResponseContent>(
            response.data
          )
        const content = normalizeCashTransferContent(
          wrappedContent ?? response.data
        )

        if (!content?.transaction) {
          setGlobalError("Transaction completed, but response data was incomplete.")
          setStatus("idle")
          return
        }

        dispatch(addInvestmentTransaction(content.transaction))
        dispatch(setInvestmentBalance(content.investmentAccountBalance))
        dispatch(setCheckingBalance(content.checkingAccountBalance))
        setStatus("success")
        setTimeout(() => {
          setShowFadeOut(true)
          setTimeout(() => {
            resetState()
            onOpenChange(false)
            onSuccess?.()
          }, 300)
        }, 2500)
        return
      }

      const errorData = getErrorResponse(response.data)
      if (response.status === 400) {
        const mappedErrors = applyServerFieldErrors(errorData.fieldErrors)
        setGlobalError(
          errorData.message ||
            (!mappedErrors.amount && !mappedErrors.description
              ? "Validation error. Please check the transfer details."
              : "")
        )
      } else if (response.status === 401) {
        setGlobalError("Your session expired. Please log in again.")
      } else {
        setGlobalError(getServerErrorMessage(response.status, errorData))
      }
      setStatus("idle")
    } catch {
      setGlobalError("Network error. Failed to submit transfer.")
      setStatus("idle")
    }
  }, [
    applyServerFieldErrors,
    balanceError,
    dispatch,
    form,
    isDeposit,
    onOpenChange,
    onSuccess,
    resetState,
    token,
  ])

  const handleAmountChange = (value: string) => {
    let sanitizedValue = value.replace(/[^\d.]/g, "")
    const parts = sanitizedValue.split(".")
    if (parts.length > 2) {
      sanitizedValue = parts[0] + "." + parts.slice(1).join("")
    }

    form.setValue("amount", sanitizedValue, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: !!form.formState.errors.amount,
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="h-auto w-[60%] !max-w-6xl sm:!max-w-6xl"
        style={{ transform: "translateY(-20px)" }}
      >
        <DialogHeader className="pb-2">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>
        <Separator />

        <div className="relative flex max-h-[calc(100vh-200px)] flex-col gap-4 overflow-y-auto px-2 pt-0 pb-1">
          {(status === "submitting" || status === "success") && (
            <SuccessOverlay
              status={status}
              showFadeOut={showFadeOut}
              successMessage={successMessage}
            />
          )}

          <div
            className={`flex flex-col gap-4 transition-opacity duration-300 ${(status === "submitting" || status === "success") && !showFadeOut ? "opacity-0" : "opacity-100"}`}
          >
            <StepIndicator currentStep={step} />

            {globalError ? (
              <div className="rounded-md border border-red-300 bg-red-100 px-4 py-2 text-sm text-red-800">
                {globalError}
              </div>
            ) : null}

            {step === 1 ? (
              <FieldGroup className="gap-4">
                <div>
                  <p className="text-sm font-medium">
                    STEP 1 — Amount & Description
                  </p>
                </div>

                <Field data-invalid={!!form.formState.errors.amount}>
                  <FieldLabel htmlFor={`${kind}-amount`}>Amount</FieldLabel>
                  <FieldContent>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>$</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id={`${kind}-amount`}
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        {...form.register("amount")}
                        value={watchedAmount ?? ""}
                        onChange={(event) =>
                          handleAmountChange(event.target.value)
                        }
                        onKeyPress={(event) => {
                          if (!/[0-9.]/.test(event.key)) {
                            event.preventDefault()
                          }
                        }}
                        disabled={isBusy}
                        aria-invalid={!!form.formState.errors.amount}
                      />
                    </InputGroup>
                    <FieldError>
                      {form.formState.errors.amount?.message}
                    </FieldError>
                  </FieldContent>
                </Field>

                <Field data-invalid={!!form.formState.errors.description}>
                  <FieldLabel htmlFor={`${kind}-description`}>
                    Description
                  </FieldLabel>
                  <FieldContent>
                    <InputGroup>
                      <InputGroupTextarea
                        id={`${kind}-description`}
                        rows={4}
                        maxLength={MAX_DESCRIPTION_LENGTH}
                        disabled={isBusy}
                        aria-invalid={!!form.formState.errors.description}
                        {...form.register("description")}
                      />
                    </InputGroup>
                    <FieldDescription className="text-xs">
                      {description.length} / {MAX_DESCRIPTION_LENGTH}
                    </FieldDescription>
                    <FieldError>
                      {form.formState.errors.description?.message}
                    </FieldError>
                  </FieldContent>
                </Field>

                <div className="flex justify-end pt-4">
                  <Button
                    type="button"
                    disabled={!isStepOneReady || isBusy}
                    onClick={handleNext}
                  >
                    Continue
                  </Button>
                </div>
              </FieldGroup>
            ) : null}

            {step === 2 ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm font-medium">STEP 2 — Linked Transfer</p>
                <LinkedTransferStep
                  direction={direction}
                  amount={amount}
                  checkingBalance={checkingBalance}
                  investmentBalance={investmentBalance}
                  errorMessage={balanceError}
                />
                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={isBusy}
                  >
                    <ArrowLeft data-icon="inline-start" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    disabled={isBusy || !!balanceError}
                    onClick={handleNext}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm font-medium">STEP 3 — Confirm</p>
                <ConfirmationStep
                  direction={direction}
                  amount={amount}
                  description={description}
                />
                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isBusy}
                  >
                    Cancel
                  </Button>
                  <Button type="button" disabled={isBusy} onClick={handleConfirm}>
                    {status === "submitting" ? (
                      <Loader2
                        className="animate-spin"
                        data-icon="inline-start"
                      />
                    ) : null}
                    {confirmLabel}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
