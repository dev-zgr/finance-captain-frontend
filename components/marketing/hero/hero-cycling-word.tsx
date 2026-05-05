"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const WORDS = ["Automated", "Analysed", "Forecasted", "Mastered"];
const INTERVAL_MS = 1900;

export function HeroCyclingWord() {
  const [index, setIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % WORDS.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [shouldReduceMotion]);

  const longestWord = WORDS.reduce((a, b) => (a.length > b.length ? a : b));

  return (
    <span className="relative inline-flex justify-center">
      <span className="invisible select-none" aria-hidden="true">
        {longestWord}
      </span>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={WORDS[index]}
          className="absolute inset-0 bg-gradient-to-r from-primary to-ring bg-clip-text text-transparent"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? {} : { opacity: 0, y: -24 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 24,
            duration: 0.35,
          }}
        >
          {WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default HeroCyclingWord;
