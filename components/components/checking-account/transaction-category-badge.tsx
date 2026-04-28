import {
  ArrowLeftRight,
  Building2,
  Car,
  CircleHelp,
  Clapperboard,
  DollarSign,
  HeartPulse,
  Home,
  Lightbulb,
  ShoppingBag,
  TrendingUp,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import {
  CATEGORY_DISPLAY_MAP,
  INCOME_CATEGORY_DISPLAY_MAP,
} from "@/lib/checking-account/constants";
import { Badge } from "@/components/ui/badge";

type TransactionCategoryBadgeProps = {
  category: string;
};

const CATEGORY_STYLES: Record<string, { icon: LucideIcon; className: string }> = {
  FOOD: { icon: UtensilsCrossed, className: "border-amber-500/30 bg-amber-500/10 text-amber-700" },
  TRANSPORT: { icon: Car, className: "border-sky-500/30 bg-sky-500/10 text-sky-700" },
  UTILITIES: { icon: Lightbulb, className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-700" },
  RENT: { icon: Home, className: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700" },
  HEALTHCARE: { icon: HeartPulse, className: "border-red-500/30 bg-red-500/10 text-red-700" },
  ENTERTAINMENT: { icon: Clapperboard, className: "border-purple-500/30 bg-purple-500/10 text-purple-700" },
  SHOPPING: { icon: ShoppingBag, className: "border-pink-500/30 bg-pink-500/10 text-pink-700" },
  TRANSFERS: { icon: ArrowLeftRight, className: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700" },
  SALARY: { icon: DollarSign, className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700" },
  INVESTMENT: { icon: TrendingUp, className: "border-lime-500/30 bg-lime-500/10 text-lime-700" },
  RENTAL: { icon: Building2, className: "border-teal-500/30 bg-teal-500/10 text-teal-700" },
  OTHER: { icon: CircleHelp, className: "border-zinc-500/30 bg-zinc-500/10 text-zinc-700" },
};

function normalizeCategory(category: string): string {
  return category.trim().toUpperCase();
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getCategoryLabel(category: string): string {
  const normalized = normalizeCategory(category);

  if (INCOME_CATEGORY_DISPLAY_MAP[normalized]) {
    return INCOME_CATEGORY_DISPLAY_MAP[normalized];
  }

  if (CATEGORY_DISPLAY_MAP[normalized]) {
    return CATEGORY_DISPLAY_MAP[normalized];
  }

  return toTitleCase(category);
}

export function TransactionCategoryBadge({ category }: TransactionCategoryBadgeProps) {
  const normalized = normalizeCategory(category);
  const categoryVisuals = CATEGORY_STYLES[normalized] ?? CATEGORY_STYLES.OTHER;
  const CategoryIcon = categoryVisuals.icon;

  return (
    <Badge variant="outline" className={categoryVisuals.className}>
      <CategoryIcon data-icon="inline-start" />
      {getCategoryLabel(category)}
    </Badge>
  );
}
