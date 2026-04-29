"use client"

import type { Dispatch, SetStateAction } from "react"

import { PayDebtForm } from "@/components/components/debts-account/pay-debt-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

type PayDebtDialogProps = {
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
  token: string
  onSuccess?: () => void
}

export function PayDebtDialog({
  open,
  onOpenChange,
  token,
  onSuccess,
}: PayDebtDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="h-auto w-[60%] !max-w-6xl sm:!max-w-6xl"
        style={{ transform: "translateY(-20px)" }}
      >
        <DialogHeader className="pb-2">
          <DialogTitle>Pay Debt</DialogTitle>
          <DialogDescription>
            Pay down your debts — amount will be deducted from your checking
            account.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <PayDebtForm
          open={open}
          token={token}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}
