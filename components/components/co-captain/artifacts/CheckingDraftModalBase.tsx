"use client"

import { Button } from "@/components/ui/button"
import { ComboboxSelect } from "@/components/ui/combobox"
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
import { MAX_DESCRIPTION_LENGTH } from "@/lib/checking-account/constants"
import type { DraftFieldErrors, DraftFormValues } from "./checking-draft-shared"

type PendingAction = "accept" | "reject" | null

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  values: DraftFormValues
  fieldErrors: DraftFieldErrors
  globalError: string
  categoryItems: Array<{ value: string; label: string }>
  descriptionPlaceholder: string
  pendingAction: PendingAction
  disableAccept: boolean
  onChange: (key: keyof DraftFormValues, value: string) => void
  onAccept: () => void
  onReject: () => void
  onReset: () => void
}

export function CheckingDraftModalBase({
  open,
  onOpenChange,
  title,
  values,
  fieldErrors,
  globalError,
  categoryItems,
  descriptionPlaceholder,
  pendingAction,
  disableAccept,
  onChange,
  onAccept,
  onReject,
  onReset,
}: Props) {
  const isPending = pendingAction !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Review and edit the draft before accepting. Once accepted, the transaction is added to
            your checking account.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-4">
          {globalError ? (
            <div className="rounded-md border border-red-300 bg-red-100 px-4 py-2 text-sm text-red-800">
              {globalError}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <Field data-invalid={Boolean(fieldErrors.date)}>
              <FieldLabel htmlFor="draft-date">Date</FieldLabel>
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

            <Field data-invalid={Boolean(fieldErrors.amount)}>
              <FieldLabel htmlFor="draft-amount">Amount</FieldLabel>
              <FieldContent>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>$</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="draft-amount"
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
          </div>

          <Field data-invalid={Boolean(fieldErrors.category)}>
            <FieldLabel htmlFor="draft-category">Category</FieldLabel>
            <FieldContent>
              <ComboboxSelect
                items={categoryItems}
                value={values.category}
                onValueChange={(value) => onChange("category", value)}
                placeholder="Select a category..."
                searchPlaceholder="Search categories..."
                disabled={isPending}
              />
              {fieldErrors.category ? <FieldError>{fieldErrors.category}</FieldError> : null}
            </FieldContent>
          </Field>

          <Field data-invalid={Boolean(fieldErrors.description)}>
            <FieldLabel htmlFor="draft-description">Description</FieldLabel>
            <FieldContent>
              <Input
                id="draft-description"
                type="text"
                placeholder={descriptionPlaceholder}
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
          <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
            <Button variant="ghost" onClick={onReset} disabled={isPending}>
              Reset to original
            </Button>
            <Button variant="ghost" onClick={onReject} disabled={isPending}>
              {pendingAction === "reject" ? <Spinner className="size-3.5" /> : null}
              Reject
            </Button>
          </div>

          <Button onClick={onAccept} disabled={disableAccept}>
            {pendingAction === "accept" ? <Spinner className="size-3.5" /> : null}
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
