"use client"

import { Button } from "@/components/ui/button"
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

type PendingAction = "accept" | "reject" | null

export type InvestmentWithdrawDraftFormValues = {
  amount: string
  description: string
}

export type InvestmentWithdrawDraftFieldErrors = Partial<Record<keyof InvestmentWithdrawDraftFormValues, string>>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  values: InvestmentWithdrawDraftFormValues
  fieldErrors: InvestmentWithdrawDraftFieldErrors
  globalError: string
  pendingAction: PendingAction
  disableAccept: boolean
  onChange: (key: keyof InvestmentWithdrawDraftFormValues, value: string) => void
  onAccept: () => void
  onReject: () => void
}

const MAX_DESCRIPTION_LENGTH = 256

export function InvestmentWithdrawDraftModal({
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
          <DialogTitle>Review draft withdrawal</DialogTitle>
          <DialogDescription>
            Confirm or edit before submitting. This transfer moves funds from investment to checking.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-4">
          {globalError ? (
            <div className="rounded-md border border-red-300 bg-red-100 px-4 py-2 text-sm text-red-800">
              {globalError}
            </div>
          ) : null}

          <Field data-invalid={Boolean(fieldErrors.amount)}>
            <FieldLabel htmlFor="draft-investment-withdraw-amount">Amount</FieldLabel>
            <FieldContent>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>$</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="draft-investment-withdraw-amount"
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

          <Field data-invalid={Boolean(fieldErrors.description)}>
            <FieldLabel htmlFor="draft-investment-withdraw-description">Description (optional)</FieldLabel>
            <FieldContent>
              <Input
                id="draft-investment-withdraw-description"
                type="text"
                placeholder="Add a short note"
                maxLength={MAX_DESCRIPTION_LENGTH}
                value={values.description}
                onChange={(event) => onChange("description", event.target.value)}
                aria-invalid={Boolean(fieldErrors.description)}
                disabled={isPending}
              />
              <FieldDescription className="text-xs">
                {values.description.length} / {MAX_DESCRIPTION_LENGTH}
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
