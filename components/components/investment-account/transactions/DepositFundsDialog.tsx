"use client"

import { InvestmentCashTransferDialog } from "@/components/components/investment-account/transactions/InvestmentCashTransferDialog"

type DepositFundsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: string
  onSuccess?: () => void
}

export function DepositFundsDialog(props: DepositFundsDialogProps) {
  return <InvestmentCashTransferDialog kind="deposit" {...props} />
}
