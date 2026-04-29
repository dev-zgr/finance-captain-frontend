"use client"

import type { Dispatch, SetStateAction } from "react"

import { GetDebtForm } from "@/components/components/debts-account/get-debt-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

type GetDebtDialogProps = {
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
  token: string
  onSuccess?: () => void
}

export function GetDebtDialog({
  open,
  onOpenChange,
  token,
  onSuccess,
}: GetDebtDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="h-auto w-[60%] !max-w-6xl sm:!max-w-6xl"
        style={{ transform: "translateY(-20px)" }}
      >
        <DialogHeader className="pb-2">
          <DialogTitle>Get Debt</DialogTitle>
          <DialogDescription>
            Borrow money — funds will be credited to your checking account.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <GetDebtForm
          open={open}
          token={token}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}
