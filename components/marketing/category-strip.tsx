"use client";

import { LogoCarousel, type MarqueeItem } from "@/components/ui/cult/logo-carousel";
import { CATEGORY_COLOR_VAR } from "@/lib/marketing/category-colors";
import {
  RiRestaurantLine,
  RiCarLine,
  RiLightbulbLine,
  RiHome4Line,
  RiHeartPulseLine,
  RiFilmLine,
  RiShoppingBagLine,
  RiExchangeLine,
  RiMoreLine,
  RiMoneyDollarCircleLine,
  RiLineChartLine,
  RiBuildingLine,
} from "@remixicon/react";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  FOOD: RiRestaurantLine,
  TRANSPORT: RiCarLine,
  UTILITIES: RiLightbulbLine,
  RENT: RiHome4Line,
  HEALTHCARE: RiHeartPulseLine,
  ENTERTAINMENT: RiFilmLine,
  SHOPPING: RiShoppingBagLine,
  TRANSFERS: RiExchangeLine,
  OTHER: RiMoreLine,
  SALARY: RiMoneyDollarCircleLine,
  INVESTMENT: RiLineChartLine,
  RENTAL: RiBuildingLine,
};

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: "Food",
  TRANSPORT: "Transport",
  UTILITIES: "Utilities",
  RENT: "Rent",
  HEALTHCARE: "Healthcare",
  ENTERTAINMENT: "Entertainment",
  SHOPPING: "Shopping",
  TRANSFERS: "Transfers",
  OTHER: "Other",
  SALARY: "Salary",
  INVESTMENT: "Investment",
  RENTAL: "Rental",
};

const ALL_CATEGORIES = [
  "FOOD", "TRANSPORT", "UTILITIES", "RENT", "HEALTHCARE",
  "ENTERTAINMENT", "SHOPPING", "TRANSFERS", "OTHER",
  "SALARY", "INVESTMENT", "RENTAL",
];

const items: MarqueeItem[] = ALL_CATEGORIES.map((key) => {
  const Icon = CATEGORY_ICONS[key];
  const colorVar = CATEGORY_COLOR_VAR[key];
  const cssVar = `var(--${colorVar})`;
  return {
    id: key,
    children: (
      <div
        className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shrink-0"
        style={{
          backgroundColor: `color-mix(in oklch, ${cssVar} 12%, transparent)`,
          color: cssVar,
          borderColor: `color-mix(in oklch, ${cssVar} 30%, transparent)`,
        }}
      >
        <Icon size={15} />
        {CATEGORY_LABELS[key]}
      </div>
    ),
  };
});

export function CategoryStrip() {
  return (
    <section className="py-12 border-y bg-card/30">
      <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-6">
        Every category. Automatically tracked.
      </p>
      <LogoCarousel items={items} speed={35} />
    </section>
  );
}

export default CategoryStrip;
