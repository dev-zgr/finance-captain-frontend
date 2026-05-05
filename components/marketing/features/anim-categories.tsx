"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RiSparklingLine } from "@remixicon/react";
import { CATEGORY_COLOR_VAR } from "@/lib/marketing/category-colors";

const CHIPS = [
  { key: "FOOD", label: "Food" },
  { key: "TRANSPORT", label: "Transport" },
  { key: "UTILITIES", label: "Utilities" },
  { key: "RENT", label: "Rent" },
  { key: "HEALTHCARE", label: "Healthcare" },
  { key: "ENTERTAINMENT", label: "Entertainment" },
  { key: "SHOPPING", label: "Shopping" },
  { key: "TRANSFERS", label: "Transfers" },
  { key: "OTHER", label: "Other" },
];

const BEAT_HIGHLIGHT = 2400;
const BEAT_SPARKLE = 3000;

interface Props { isActive: boolean }

export function AnimCategories({ isActive }: Props) {
  const [highlighted, setHighlighted] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    const t1 = setTimeout(() => setHighlighted(true), BEAT_HIGHLIGHT);
    const t2 = setTimeout(() => setShowSparkle(true), BEAT_SPARKLE);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isActive]);

  return (
    <div className="relative flex flex-col gap-3 p-2">
      <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/40 p-3">
        <div className="text-[10px] text-muted-foreground font-mono">→ Starbucks $6.40</div>
        <div className="text-[10px] text-muted-foreground font-mono">→ Shell Gas $48.12</div>
        <div className="text-[10px] text-muted-foreground font-mono">→ Netflix $15.99</div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CHIPS.map((chip, i) => {
          const isFood = chip.key === "FOOD";
          const cssVar = `var(--${CATEGORY_COLOR_VAR[chip.key]})`;
          const dimmed = highlighted && !isFood;
          const boosted = highlighted && isFood;

          return (
            <motion.div
              key={chip.key}
              initial={{ opacity: 0, scale: 0.9, y: 6 }}
              animate={
                isActive
                  ? {
                      opacity: dimmed ? 0.3 : 1,
                      scale: boosted ? 1.06 : 1,
                      y: 0,
                    }
                  : { opacity: 0, scale: 0.9, y: 6 }
              }
              transition={{
                delay: isActive ? i * 0.07 : 0,
                type: "spring",
                stiffness: 260,
                damping: 20,
                opacity: { duration: 0.3 },
              }}
              className="relative flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium"
              style={{
                backgroundColor: `color-mix(in oklch, ${cssVar} 12%, transparent)`,
                color: cssVar,
                borderColor: `color-mix(in oklch, ${cssVar} 30%, transparent)`,
                boxShadow: boosted ? `0 0 10px color-mix(in oklch, ${cssVar} 35%, transparent)` : undefined,
              }}
            >
              {chip.label}
              <AnimatePresence>
                {boosted && showSparkle && (
                  <motion.span
                    key="sparkle"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                    className="absolute -right-1 -top-1"
                  >
                    <RiSparklingLine size={10} style={{ color: cssVar }} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
