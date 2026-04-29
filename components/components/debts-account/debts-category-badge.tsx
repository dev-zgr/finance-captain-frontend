import {
  CircleHelp,
  CreditCard,
  HandCoins,
  Home,
  Landmark,
  Receipt,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  DEBT_CATEGORY_DISPLAY_MAP,
  isDebtCategory,
} from "@/lib/debts-account/constants"

type DebtsCategoryBadgeProps = {
  category: string
}

const CATEGORY_STYLES: Record<string, { icon: LucideIcon; className: string }> =
  {
    LOAN: {
      icon: Landmark,
      className: "border-red-500/30 bg-red-500/10 text-red-700",
    },
    CREDIT_CARD_ADVANCE: {
      icon: CreditCard,
      className: "border-orange-500/30 bg-orange-500/10 text-orange-700",
    },
    MORTGAGE: {
      icon: Home,
      className: "border-sky-500/30 bg-sky-500/10 text-sky-700",
    },
    PERSONAL_BORROWING: {
      icon: HandCoins,
      className: "border-violet-500/30 bg-violet-500/10 text-violet-700",
    },
    OTHER: {
      icon: Receipt,
      className: "border-zinc-500/30 bg-zinc-500/10 text-zinc-700",
    },
  }

function normalizeCategory(category: string): string {
  return category.trim().toUpperCase()
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getCategoryLabel(category: string): string {
  const normalized = normalizeCategory(category)

  if (isDebtCategory(normalized)) {
    return DEBT_CATEGORY_DISPLAY_MAP[normalized]
  }

  return toTitleCase(category)
}

export function DebtsCategoryBadge({ category }: DebtsCategoryBadgeProps) {
  const normalized = normalizeCategory(category)
  const categoryVisuals = CATEGORY_STYLES[normalized] ?? {
    icon: CircleHelp,
    className: "border-zinc-500/30 bg-zinc-500/10 text-zinc-700",
  }
  const CategoryIcon = categoryVisuals.icon

  return (
    <Badge variant="outline" className={categoryVisuals.className}>
      <CategoryIcon data-icon="inline-start" />
      {getCategoryLabel(category)}
    </Badge>
  )
}
