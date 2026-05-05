// Source: https://www.cult-ui.com/docs/components/hero-color-panels (CSS gradient adaptation — no WebGL)
"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface HeroColorPanelsProps {
  className?: string;
  children?: React.ReactNode;
}

export function HeroColorPanels({ className, children }: HeroColorPanelsProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(from var(--primary) l c h / 0.25), transparent 70%)",
          }}
          animate={
            shouldReduceMotion
              ? {}
              : {
                  scale: [1, 1.04, 1],
                  opacity: [0.6, 0.75, 0.6],
                }
          }
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 20% 60%, oklch(from var(--cat-investment) l c h / 0.30), transparent 70%)",
          }}
          animate={
            shouldReduceMotion
              ? {}
              : {
                  scale: [1, 1.06, 1],
                  opacity: [0.4, 0.55, 0.4],
                  x: [0, 12, 0],
                }
          }
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />

        <motion.div
          className="absolute inset-0 opacity-35"
          style={{
            background:
              "radial-gradient(ellipse 50% 55% at 80% 40%, oklch(from var(--cat-rent) l c h / 0.25), transparent 70%)",
          }}
          animate={
            shouldReduceMotion
              ? {}
              : {
                  scale: [1, 1.05, 1],
                  opacity: [0.35, 0.5, 0.35],
                  x: [0, -10, 0],
                }
          }
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
        />

        <div className="absolute inset-0 bg-background/40" />
      </div>

      {children}
    </div>
  );
}

export default HeroColorPanels;
