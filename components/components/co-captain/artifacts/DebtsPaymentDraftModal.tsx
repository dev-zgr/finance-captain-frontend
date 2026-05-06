"use client"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { MAX_DEBT_DESCRIPTION_LENGTH } from "@/lib/debts-account/constants"

type PendingAction = "accept" | "reject" | null

export type DebtsPaymentDraftFormValues = {
  date: string
  amount: string
  description: string
}

export type DebtsPaymentDraftFieldErrors = Partial<Record<keyof DebtsPaymentDraftFormValues, string>>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  values: DebtsPaymentDraftFormValues
  fieldErrors: DebtsPaymentDraftFieldErrors
  globalError: string
  pendingAction: PendingAction
  disableAccept: boolean
  onChange: (key: keyof DebtsPaymentDraftFormValues, value: string) => void
  onAccept: () => void
  onReject: () => void
}

export function DebtsPaymentDraftModal({
  open,
  onOpenChange,
  values,
  fieldErrors,
  globalError,
  pendingAction,
  disableAccept,
  onChange,
  onAccept,
  onReject,
}: Props) {
  const isPending = pendingAction !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Review draft debt payment</DialogTitle>
          <DialogDescription>
            Review and edit the draft before accepting. Once accepted, the transaction is added to
            your debt account.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-4">
          {globalError ? (
            <div className="rounded-md border border-red-300 bg-red-100 px-4 py-2 text-sm text-red-800">
              {globalError}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <Field data-invalid={Boolean(fieldErrors.amount)}>
              <FieldLabel htmlFor="draft-payment-amount">Amount</FieldLabel>
              <FieldContent>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>$</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="draft-payment-amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={values.amount}
                    onChange={(event) => onChange("amount", event.target.value)}
                    aria-invalid={Boolean(fieldErrors.amount)}
                    disabled={isPending}
                  />
                </InputGroup>
                {fieldErrors.amount ? <FieldError>{fieldErrors.amount}</FieldError> : null}
              </FieldContent>
            </Field>

            <Field data-invalid={Boolean(fieldErrors.date)}>
              <FieldLabel htmlFor="draft-payment-date">Date</FieldLabel>
              <FieldContent>
                <DatePicker
                  value={values.date}
                  onChange={(date) => onChange("date", date)}
                  disabled={isPending}
                  placeholder="Pick a date"
                />
                {fieldErrors.date ? <FieldError>{fieldErrors.date}</FieldError> : null}
              </FieldContent>
            </Field>
          </div>

          <Field data-invalid={Boolean(fieldErrors.description)}>
            <FieldLabel htmlFor="draft-payment-description">Description</FieldLabel>
            <FieldContent>
              <Input
                id="draft-payment-description"
                type="text"
                placeholder="Describe this payment"
                maxLength={MAX_DEBT_DESCRIPTION_LENGTH}
                value={values.description}
                onChange={(event) => onChange("description", event.target.value)}
                aria-invalid={Boolean(fieldErrors.description)}
                disabled={isPending}
              />
              <FieldDescription className="text-xs">
                {values.description.length} / {MAX_DEBT_DESCRIPTION_LENGTH}
              </FieldDescription>
              {fieldErrors.description ? <FieldError>{fieldErrors.description}</FieldError> : null}
            </FieldContent>
          </Field>
        </FieldGroup>

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={onReject} disabled={isPending}>
            {pendingAction === "reject" ? <Spinner className="size-3.5" /> : null}
            Reject
          </Button>

          <Button onClick={onAccept} disabled={disableAccept}>
            {pendingAction === "accept" ? <Spinner className="size-3.5" /> : null}
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
