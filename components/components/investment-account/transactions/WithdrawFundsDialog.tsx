"use client"

import { InvestmentCashTransferDialog } from "@/components/components/investment-account/transactions/InvestmentCashTransferDialog"

type WithdrawFundsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: string
  onSuccess?: () => void
}

export function WithdrawFundsDialog(props: WithdrawFundsDialogProps) {
  return <InvestmentCashTransferDialog kind="withdraw" {...props} />
}
