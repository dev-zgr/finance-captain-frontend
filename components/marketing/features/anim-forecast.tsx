"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

const ROWS = [
  { label: "Food & drink", color: "var(--cat-food)",          spent: 284, budget: 300 },
  { label: "Transport",    color: "var(--cat-transport)",     spent: 142, budget: 250 },
  { label: "Shopping",     color: "var(--cat-shopping)",      spent: 380, budget: 350 },
  { label: "Entertainment",color: "var(--cat-entertainment)", spent:  48, budget: 200 },
];

const TOTAL_SPENT  = ROWS.reduce((s, r) => s + r.spent, 0);
const TOTAL_BUDGET = ROWS.reduce((s, r) => s + r.budget, 0);

interface Props { isActive: boolean }

export function AnimForecast({ isActive }: Props) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showTotal, setShowTotal]       = useState(false);

  useEffect(() => {
    if (!isActive) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    ROWS.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCount(i + 1), 300 + i * 280));
    });
    timers.push(setTimeout(() => setShowTotal(true), 300 + ROWS.length * 280 + 200));
    return () => timers.forEach(clearTimeout);
  }, [isActive]);

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="flex flex-col gap-1.5">
        {ROWS.map((row, i) => {
          const pct     = Math.min(row.spent / row.budget, 1);
          const overBudget = row.spent > row.budget;
          const visible = i < visibleCount;
          return (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, x: -8 }}
              animate={visible ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="flex flex-col gap-0.5"
            >
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-foreground font-medium">{row.label}</span>
                <span
                  className="font-semibold"
                  style={{ color: overBudget ? "var(--destructive)" : "var(--muted-foreground)" }}
                >
                  ${row.spent}
                  <span className="font-normal text-muted-foreground/60"> / ${row.budget}</span>
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: overBudget ? "var(--destructive)" : row.color }}
                  initial={{ scaleX: 0 }}
                  animate={visible ? { scaleX: pct } : { scaleX: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {showTotal && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-1 flex items-center justify-between rounded-md border border-border bg-muted/30 px-2 py-1.5 text-[9px]"
        >
          <span className="text-muted-foreground font-medium uppercase tracking-wide">Total</span>
          <span className="font-semibold text-foreground">
            ${TOTAL_SPENT}
            <span className="font-normal text-muted-foreground/60"> / ${TOTAL_BUDGET}</span>
          </span>
        </motion.div>
      )}
    </div>
  );
}
