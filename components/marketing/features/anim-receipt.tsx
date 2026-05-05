"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RiScanLine, RiRobot2Line } from "@remixicon/react";

const CALLOUTS = [
  { label: "Merchant", value: "Trader Joe's", delay: 1200 },
  { label: "Amount", value: "$43.28", delay: 1600 },
  { label: "Category", value: "Food", delay: 2000 },
  { label: "Date", value: "May 3, 2026", delay: 2400 },
];

interface Props { isActive: boolean }

export function AnimReceipt({ isActive }: Props) {
  const [scanPos, setScanPos] = useState(0);
  const [scanDone, setScanDone] = useState(false);
  const [visibleCallouts, setVisibleCallouts] = useState<number[]>([]);

  useEffect(() => {
    if (!isActive) return;

    const scanDuration = 1800;
    const start = performance.now();
    let rafId: number;

    const animate = (now: number) => {
      const p = Math.min((now - start) / scanDuration, 1);
      setScanPos(p);
      if (p < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        setScanDone(true);
      }
    };
    rafId = requestAnimationFrame(animate);

    const timers = CALLOUTS.map((c, i) =>
      setTimeout(() => setVisibleCallouts((prev) => [...prev, i]), c.delay)
    );

    return () => {
      cancelAnimationFrame(rafId);
      timers.forEach(clearTimeout);
    };
  }, [isActive]);

  return (
    <div className="relative flex items-start gap-3 p-2">
      <div className="relative w-32 shrink-0 rounded-md border border-border bg-muted/30 p-2 font-mono text-[8px] leading-relaxed text-muted-foreground overflow-hidden">
        <div>TRADER JOE&apos;S</div>
        <div className="mt-1 border-t border-border/50 pt-1">
          <div>Organic Milk   $3.99</div>
          <div>Almond Butter  $7.49</div>
          <div>Greek Yogurt   $4.29</div>
          <div>Sourdough      $5.99</div>
          <div>Blueberries    $4.99</div>
          <div className="mt-1 border-t border-border/50 pt-1 font-bold">
            TOTAL        $43.28
          </div>
        </div>

        {isActive && !scanDone && (
          <motion.div
            className="absolute inset-x-0 h-px pointer-events-none"
            style={{
              top: `${scanPos * 100}%`,
              background:
                "linear-gradient(90deg, transparent, var(--primary) 50%, transparent)",
              boxShadow: "0 0 6px 1px oklch(from var(--primary) l c h / 0.5)",
            }}
          />
        )}

        {scanDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-md"
          >
            <div className="flex flex-col items-center gap-1">
              <RiScanLine size={18} className="text-primary" />
              <span className="text-[8px] text-primary">Extracted</span>
            </div>
          </motion.div>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-1.5 pt-1">
        <AnimatePresence>
          {CALLOUTS.map((c, i) =>
            visibleCallouts.includes(i) ? (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                className="flex items-center justify-between rounded-md border border-border bg-card px-2 py-1.5"
              >
                <span className="text-[9px] text-muted-foreground">{c.label}</span>
                <span className="text-[9px] font-medium text-foreground">{c.value}</span>
              </motion.div>
            ) : null
          )}
        </AnimatePresence>

        {scanDone && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-1 flex items-center gap-1 rounded-md border border-primary/20 bg-primary/6 px-2 py-1"
          >
            <RiRobot2Line size={10} className="text-primary" />
            <span className="text-[9px] text-primary">Extracted via VLM</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
