"use client";

import { motion, useReducedMotion } from "motion/react";
import { GridBeam } from "@/components/ui/cult/grid-beam";
import { TextureOverlay } from "@/components/ui/cult/texture-overlay";

export function HeroBackground() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <GridBeam
        className="absolute inset-0 z-0"
        rows={7}
        cols={9}
        active
        duration={14}
        strength={0.6}
        aria-hidden="true"
      />

      {/* Stripe-style large colour orbs */}
      <div className="absolute inset-0 z-[1]" aria-hidden="true">
        {/* Violet/purple — top-left */}
        <motion.div
          className="absolute rounded-full blur-[140px]"
          style={{
            width: "65%",
            height: "65%",
            top: "-20%",
            left: "-5%",
            background: "oklch(0.52 0.30 300 / 0.40)",
          }}
          animate={shouldReduceMotion ? {} : { scale: [1, 1.08, 1], opacity: [0.40, 0.52, 0.40] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Indigo/blue — top-right */}
        <motion.div
          className="absolute rounded-full blur-[120px]"
          style={{
            width: "55%",
            height: "55%",
            top: "-15%",
            right: "-10%",
            background: "oklch(0.50 0.26 250 / 0.35)",
          }}
          animate={shouldReduceMotion ? {} : { scale: [1, 1.06, 1], opacity: [0.35, 0.48, 0.35], x: [0, 16, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        {/* Cyan/teal — bottom-left */}
        <motion.div
          className="absolute rounded-full blur-[110px]"
          style={{
            width: "45%",
            height: "45%",
            bottom: "-5%",
            left: "-5%",
            background: "oklch(0.60 0.22 195 / 0.30)",
          }}
          animate={shouldReduceMotion ? {} : { scale: [1, 1.10, 1], opacity: [0.30, 0.42, 0.30], y: [0, -12, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
        {/* Magenta/pink — centre-right */}
        <motion.div
          className="absolute rounded-full blur-[100px]"
          style={{
            width: "38%",
            height: "38%",
            top: "35%",
            right: "10%",
            background: "oklch(0.58 0.28 340 / 0.25)",
          }}
          animate={shouldReduceMotion ? {} : { scale: [1, 1.07, 1], opacity: [0.25, 0.38, 0.25], x: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 6 }}
        />
        {/* Dark overlay to keep text readable */}
        <div className="absolute inset-0 bg-background/30" />
      </div>

      <TextureOverlay texture="noise" opacity={0.2} className="z-[2]" />
    </div>
  );
}

export default HeroBackground;
