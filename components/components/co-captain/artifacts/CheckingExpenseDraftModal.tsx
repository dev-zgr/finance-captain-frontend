"use client"

import { EXPENSE_CATEGORIES_WITH_LABELS } from "@/lib/checking-account/constants"
import { CheckingDraftModalBase } from "./CheckingDraftModalBase"
import type { DraftFieldErrors, DraftFormValues } from "./checking-draft-shared"

type PendingAction = "accept" | "reject" | null

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  values: DraftFormValues
  fieldErrors: DraftFieldErrors
  globalError: string
  pendingAction: PendingAction
  disableAccept: boolean
  onChange: (key: keyof DraftFormValues, value: string) => void
  onAccept: () => void
  onReject: () => void
  onReset: () => void
}

export function CheckingExpenseDraftModal(props: Props) {
  return (
    <CheckingDraftModalBase
      {...props}
      title="Review draft expense"
      descriptionPlaceholder="What did you spend on?"
      categoryItems={EXPENSE_CATEGORIES_WITH_LABELS}
    />
  )
}
