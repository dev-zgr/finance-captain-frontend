"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { RiDashboardLine, RiLoginBoxLine } from "@remixicon/react";

export function MarketingHeader() {
  const { isAuthenticated, isHydrated } = useSelector((s: RootState) => s.auth);
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const borderOpacity = useTransform(scrollY, [0, 8, 48], [0, 0.5, 1]);
  const blurStrength = useTransform(scrollY, [0, 32], [0, 12]);
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: -8 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
  };

  return (
    <motion.header
      className="sticky top-0 z-40 w-full bg-background/70"
      style={{
        borderBottomWidth: 1,
        borderBottomStyle: "solid",
        borderBottomColor: `oklch(from var(--border) l c h / var(--border-op, 0))`,
      }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ backdropFilter: useTransform(blurStrength, (v) => `blur(${v}px)`) }}
      />
      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border"
        style={{ opacity: borderOpacity }}
      />

      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <motion.div
          variants={shouldReduceMotion ? {} : containerVariants}
          initial={shouldReduceMotion ? false : "hidden"}
          animate="visible"
          className="flex items-center gap-6"
        >
          <motion.div variants={shouldReduceMotion ? {} : itemVariants}>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-ring text-sm font-bold text-primary-foreground shadow-sm">
                F
              </div>
              <span className="text-sm font-semibold text-foreground">Finance Captain</span>
            </Link>
          </motion.div>

        </motion.div>

        <motion.div
          variants={shouldReduceMotion ? {} : containerVariants}
          initial={shouldReduceMotion ? false : "hidden"}
          animate="visible"
        >
          <motion.div variants={shouldReduceMotion ? {} : itemVariants}>
            {!isHydrated || !isAuthenticated ? (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-ring px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:shadow-primary/30 hover:shadow-md active:scale-[0.98] transition-all duration-200"
              >
                <RiLoginBoxLine size={15} />
                Login
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-ring px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:shadow-primary/30 hover:shadow-md active:scale-[0.98] transition-all duration-200"
              >
                <RiDashboardLine size={15} />
                Dashboard
              </Link>
            )}
          </motion.div>
        </motion.div>
      </div>
    </motion.header>
  );
}

export default MarketingHeader;
