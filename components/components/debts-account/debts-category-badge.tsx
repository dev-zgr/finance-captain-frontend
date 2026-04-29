import {
  Banknote,
  CircleHelp,
  Coins,
  CreditCard,
  Home,
  Users,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  DEBT_CATEGORY_DISPLAY_MAP,
  isDebtCategory,
} from "@/lib/debts-account/constants"
import type { DebtsTransactionType } from "@/lib/debts-account/types"

type DebtsCategoryBadgeProps = {
  category?: string | null
  transactionType: DebtsTransactionType
}

const CATEGORY_STYLES: Record<string, { icon: LucideIcon; className: string }> =
  {
    LOAN: {
      icon: Banknote,
      className: "border-amber-500/30 bg-amber-500/10 text-amber-700",
    },
    CREDIT_CARD_ADVANCE: {
      icon: CreditCard,
      className: "border-pink-500/30 bg-pink-500/10 text-pink-700",
    },
    MORTGAGE: {
      icon: Home,
      className: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700",
    },
    PERSONAL_BORROWING: {
      icon: Users,
      className: "border-purple-500/30 bg-purple-500/10 text-purple-700",
    },
    OTHER: {
      icon: CircleHelp,
      className: "border-zinc-500/30 bg-zinc-500/10 text-zinc-700",
    },
  }

function normalizeCategory(category: string | null | undefined): string {
  if (!category) {
    return "OTHER"
  }

  return category.trim().toUpperCase()
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getCategoryLabel(category: string | null | undefined): string {
  const normalized = normalizeCategory(category)

  if (isDebtCategory(normalized)) {
    return DEBT_CATEGORY_DISPLAY_MAP[normalized]
  }

  return toTitleCase(category ?? "Other")
}

export function DebtsCategoryBadge({
  category,
  transactionType,
}: DebtsCategoryBadgeProps) {
  if (transactionType === "PAYMENT") {
    return (
      <Badge
        variant="outline"
        className="border-zinc-500/30 bg-zinc-500/10 text-zinc-700"
      >
        <Coins data-icon="inline-start" />
        Payment
      </Badge>
    )
  }

  const normalized = normalizeCategory(category)
  const categoryVisuals = CATEGORY_STYLES[normalized] ?? CATEGORY_STYLES.OTHER
  const CategoryIcon = categoryVisuals.icon

  return (
    <Badge variant="outline" className={categoryVisuals.className}>
      <CategoryIcon data-icon="inline-start" />
      {getCategoryLabel(category)}
    </Badge>
  )
}
