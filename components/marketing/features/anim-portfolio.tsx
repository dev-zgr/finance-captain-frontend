"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RiSparklingLine } from "@remixicon/react";
import { AnimatedNumber } from "@/components/ui/cult/animated-number";

const TICKERS = [
  { symbol: "AAPL", change: 2.34, positive: true },
  { symbol: "NVDA", change: 5.87, positive: true },
  { symbol: "MSFT", change: -0.92, positive: false },
  { symbol: "GOOGL", change: 1.44, positive: true },
  { symbol: "AMZN", change: 3.11, positive: true },
];

const INSIGHT_DELAY = 2200;

interface Props { isActive: boolean }

export function AnimPortfolio({ isActive }: Props) {
  const [visibleTickers, setVisibleTickers] = useState<number[]>([]);
  const [showInsight, setShowInsight] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    const timers = TICKERS.map((_, i) =>
      setTimeout(() => setVisibleTickers((p) => [...p, i]), 200 + i * 220)
    );
    const t = setTimeout(() => setShowInsight(true), INSIGHT_DELAY);
    return () => { timers.forEach(clearTimeout); clearTimeout(t); };
  }, [isActive]);

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="flex flex-wrap gap-1.5">
        <AnimatePresence>
          {TICKERS.map((ticker, i) =>
            visibleTickers.includes(i) ? (
              <motion.div
                key={ticker.symbol}
                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${
                  ticker.positive
                    ? "bg-green-500/8 border-green-500/20 text-green-600"
                    : "bg-red-500/8 border-red-500/20 text-red-500"
                }`}
              >
                <span className="font-semibold">{ticker.symbol}</span>
                <span>
                  {ticker.positive ? "+" : ""}
                  <AnimatedNumber value={ticker.change} precision={2} />%
                </span>
              </motion.div>
            ) : null
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showInsight && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/6 via-ring/4 to-primary/6 p-3"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-primary to-ring">
                <RiSparklingLine size={10} className="text-primary-foreground" />
              </div>
              <span className="text-[10px] font-medium text-primary">Market Brief</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Your portfolio gained{" "}
              <span className="text-green-600 font-semibold">+$<AnimatedNumber value={342} /></span> today.
              NVDA led with the strongest performance across your holdings.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
