import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { DebtsTransactionType } from "@/lib/debts-account/types"

type DebtsTransactionTypeBadgeProps = {
  transactionType: DebtsTransactionType
}

export function DebtsTransactionTypeBadge({
  transactionType,
}: DebtsTransactionTypeBadgeProps) {
  return transactionType === "PAYMENT" ? (
    <Badge
      variant="outline"
      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10"
    >
      Payment
      <ArrowUpRight data-icon="inline-end" />
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="border-red-500/30 bg-red-500/10 text-red-700 hover:bg-red-500/10"
    >
      Debt
      <ArrowDownRight data-icon="inline-end" />
    </Badge>
  )
}
