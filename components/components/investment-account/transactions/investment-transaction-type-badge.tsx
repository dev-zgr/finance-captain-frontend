import { ArrowLeftRight, CandlestickChart } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { InvestmentTransactionType } from "@/lib/investment-account/types"

type InvestmentTransactionTypeBadgeProps = {
  type: InvestmentTransactionType
}

export function InvestmentTransactionTypeBadge({
  type,
}: InvestmentTransactionTypeBadgeProps) {
  if (type === "TRANSFER") {
    return (
      <Badge
        variant="outline"
        className="border-purple-500/30 bg-purple-500/10 text-purple-700 hover:bg-purple-500/10"
      >
        <ArrowLeftRight data-icon="inline-start" />
        Transfer
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className="border-sky-500/30 bg-sky-500/10 text-sky-700 hover:bg-sky-500/10"
    >
      <CandlestickChart data-icon="inline-start" />
      Trade
    </Badge>
  )
}
