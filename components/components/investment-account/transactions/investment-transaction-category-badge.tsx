import { ArrowDownFromLine, ArrowUpFromLine, ShoppingCart, HandCoins } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { InvestmentTransactionCategory } from "@/lib/investment-account/types"

type InvestmentTransactionCategoryBadgeProps = {
  category: InvestmentTransactionCategory
}

export function InvestmentTransactionCategoryBadge({
  category,
}: InvestmentTransactionCategoryBadgeProps) {
  if (category === "DEPOSIT") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10"
      >
        <ArrowDownFromLine data-icon="inline-start" />
        Deposit
      </Badge>
    )
  }

  if (category === "WITHDRAW") {
    return (
      <Badge
        variant="outline"
        className="border-orange-500/30 bg-orange-500/10 text-orange-700 hover:bg-orange-500/10"
      >
        <ArrowUpFromLine data-icon="inline-start" />
        Withdraw
      </Badge>
    )
  }

  if (category === "BUY") {
    return (
      <Badge
        variant="outline"
        className="border-lime-500/30 bg-lime-500/10 text-lime-700 hover:bg-lime-500/10"
      >
        <ShoppingCart data-icon="inline-start" />
        Buy
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className="border-red-500/30 bg-red-500/10 text-red-700 hover:bg-red-500/10"
    >
      <HandCoins data-icon="inline-start" />
      Sell
    </Badge>
  )
}
